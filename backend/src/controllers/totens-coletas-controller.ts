import { Request, Response } from "express";
import { Totem } from "../database/models/totens-model";
import { TotenColeta } from "../database/models/totens-coletas-model";
import { AnaliseImagem } from "../database/models/analises-imagens-model";
import { Usuario } from "../database/models/usuarios-model";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

const REPORT_TEMP_MIN = 18;
const REPORT_TEMP_MAX = 35;
const REPORT_HUM_MIN = 35;
const REPORT_HUM_MAX = 85;

type DateRange = {
  startDate: Date;
  endDate: Date;
  start: string;
  end: string;
};

const parseDateInput = (value?: string, endOfDay = false) => {
  if (!value) return null;

  const normalized = value.trim();
  if (!normalized) return null;

  if (normalized.includes("T")) {
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parts = normalized.split("-").map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) {
    return null;
  }

  const [year, month, day] = parts;
  return endOfDay
    ? new Date(year, month - 1, day, 23, 59, 59, 999)
    : new Date(year, month - 1, day, 0, 0, 0, 0);
};

type ReadingWithDate = {
  temperatura: number;
  umidade: number;
  imagem: string;
  totem_id: mongoose.Types.ObjectId;
  criado_em?: Date;
  alterado_em?: Date;
};

type AnalysisWithDate = {
  imagem: string;
  cultura?: string;
  origem_analise?: "manual" | "totem";
  prompt_versao?: string;
  totem_id?: mongoose.Types.ObjectId;
  usuario_id?: mongoose.Types.ObjectId;
  fase_crescimento?: string;
  confianca?: number;
  justificativa_confianca?: string;
  resumo?: string;
  sinais_observados?: string[];
  modelo?: string;
  analise_status?: "pendente" | "processando" | "concluida" | "erro";
  analise_erro?: string;
  criado_em?: Date;
  analise_finalizada_em?: Date;
};

type SerializedAnalysis = {
  imagem: string;
  totem: (typeof Totem.prototype) | null;
  cultura: string;
  origem_analise: "manual" | "totem";
  fase_crescimento: string;
  confianca: number;
  justificativa_confianca: string;
  resumo: string;
  sinais_observados: string[];
  modelo: string;
  prompt_versao: string;
  analise_status: "pendente" | "processando" | "concluida" | "erro";
  analise_erro: string | null;
  criado_em: Date | null;
  analise_finalizada_em: Date | null;
};

type UserScopeError = {
  error: true;
  status: number;
  message: string;
  totens: [];
};

type UserScopeSuccess = {
  error: false;
  status: number;
  message: string;
  usuario: typeof Usuario.prototype;
  totens: (typeof Totem.prototype)[];
};

type UserScope = UserScopeError | UserScopeSuccess;

const round2 = (value: number) => Math.round(value * 100) / 100;

const formatDateKey = (date: Date) => {
  const local = new Date(date);
  local.setHours(local.getHours() - 3);
  return local.toISOString().slice(0, 10);
};

const formatDateLabel = (dateKey: string) => {
  const date = new Date(`${dateKey}T00:00:00`);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
};

const buildDateRange = (start?: string, end?: string): DateRange => {
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  if (start) {
    const parsedStart = parseDateInput(start, false);
    if (parsedStart) {
      startDate = parsedStart;
    }
  }

  if (end) {
    const parsedEnd = parseDateInput(end, true);
    if (parsedEnd) {
      endDate = parsedEnd;
    }
  }

  if (!startDate && !endDate) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    startDate = sevenDaysAgo;

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    endDate = today;
  }

  if (!startDate && endDate) {
    startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);
  }

  if (!endDate && startDate) {
    endDate = new Date(startDate);
    endDate.setHours(23, 59, 59, 999);
  }

  return {
    startDate: startDate || new Date(),
    endDate: endDate || new Date(),
    start: (startDate || new Date()).toISOString().slice(0, 10),
    end: (endDate || new Date()).toISOString().slice(0, 10),
  };
};

const calculateStats = (readings: ReadingWithDate[]) => {
  if (readings.length === 0) {
    return {
      totalReadings: 0,
      avgTemperature: 0,
      avgHumidity: 0,
      minTemperature: 0,
      maxTemperature: 0,
      minHumidity: 0,
      maxHumidity: 0,
    };
  }

  const temperatures = readings.map((reading) => reading.temperatura);
  const humidities = readings.map((reading) => reading.umidade);

  const totalReadings = readings.length;
  const avgTemperature = temperatures.reduce((sum, value) => sum + value, 0) / totalReadings;
  const avgHumidity = humidities.reduce((sum, value) => sum + value, 0) / totalReadings;

  return {
    totalReadings,
    avgTemperature: round2(avgTemperature),
    avgHumidity: round2(avgHumidity),
    minTemperature: round2(Math.min(...temperatures)),
    maxTemperature: round2(Math.max(...temperatures)),
    minHumidity: round2(Math.min(...humidities)),
    maxHumidity: round2(Math.max(...humidities)),
  };
};

const isAnomaly = (reading: ReadingWithDate) =>
  reading.temperatura < REPORT_TEMP_MIN ||
  reading.temperatura > REPORT_TEMP_MAX ||
  reading.umidade < REPORT_HUM_MIN ||
  reading.umidade > REPORT_HUM_MAX;

const getReasons = (reading: ReadingWithDate) => {
  const reasons: string[] = [];

  if (reading.temperatura < REPORT_TEMP_MIN) reasons.push("temperatura_baixa");
  if (reading.temperatura > REPORT_TEMP_MAX) reasons.push("temperatura_alta");
  if (reading.umidade < REPORT_HUM_MIN) reasons.push("umidade_baixa");
  if (reading.umidade > REPORT_HUM_MAX) reasons.push("umidade_alta");

  return reasons;
};

const getUserScope = async (userId: string): Promise<UserScope> => {
  const usuario = await Usuario.findById(userId);

  if (!usuario) {
    return {
      error: true,
      status: 404,
      message: "Usuário não encontrado",
      totens: [],
    };
  }

  const totens = await Totem.find({ usuario_id: userId });

  return {
    error: false,
    status: 200,
    message: "",
    usuario,
    totens,
  };
};

const buildAnalysisFilter = (
  scope: Awaited<ReturnType<typeof getUserScope>>,
  userId: string,
  range: DateRange,
) => {
  const totemIds = scope.totens.map((totem) => totem._id);

  return {
    criado_em: {
      $gte: range.startDate,
      $lte: range.endDate,
    },
    $or: [
      ...(totemIds.length > 0 ? [{ totem_id: { $in: totemIds } }] : []),
      { usuario_id: userId },
    ],
  };
};

const serializeAnalysis = (
  analysis: AnalysisWithDate,
  scope: Awaited<ReturnType<typeof getUserScope>>,
): SerializedAnalysis => {
  const relatedTotem = analysis.totem_id
    ? scope.totens.find((totem) => String(totem._id) === String(analysis.totem_id))
    : null;

  return {
    imagem: analysis.imagem,
    totem: relatedTotem || null,
    cultura: analysis.cultura || "soja",
    origem_analise: analysis.origem_analise || (analysis.usuario_id ? "manual" : "totem"),
    fase_crescimento: analysis.fase_crescimento || "desconhecido",
    confianca: analysis.confianca ?? 0,
    justificativa_confianca: analysis.justificativa_confianca || "",
    resumo: analysis.resumo || "",
    sinais_observados: analysis.sinais_observados || [],
    modelo: analysis.modelo || "",
    prompt_versao: analysis.prompt_versao || "",
    analise_status: analysis.analise_status || "pendente",
    analise_erro: analysis.analise_erro || null,
    criado_em: analysis.criado_em || null,
    analise_finalizada_em: analysis.analise_finalizada_em || null,
  };
};

const buildReportData = async (userId: string, start?: string, end?: string) => {
  const scope = await getUserScope(userId);

  if (scope.error) {
    return scope;
  }

  const range = buildDateRange(start, end);

  const totemIds = scope.totens.map((totem) => totem._id);

  const readings = await TotenColeta.find({
    ...(totemIds.length > 0 ? { totem_id: { $in: totemIds } } : { totem_id: { $in: [] } }),
    criado_em: {
      $gte: range.startDate,
      $lte: range.endDate,
    },
  }).sort({ criado_em: 1 });

  const typedReadings = readings as unknown as ReadingWithDate[];
  const summaryStats = calculateStats(typedReadings);
  const anomalyReadings = typedReadings.filter((reading) => isAnomaly(reading));

  const analysisFilter = buildAnalysisFilter(scope, userId, range);
  const totalAnalyses = await AnaliseImagem.countDocuments(analysisFilter);

  const dailyMap = new Map<
    string,
    {
      date: string;
      label: string;
      totalReadings: number;
      temperatures: number[];
      humidities: number[];
    }
  >();

  for (const reading of typedReadings) {
    const readingDate = reading.criado_em ? formatDateKey(reading.criado_em) : range.start;
    const current = dailyMap.get(readingDate) || {
      date: readingDate,
      label: formatDateLabel(readingDate),
      totalReadings: 0,
      temperatures: [],
      humidities: [],
    };

    current.totalReadings += 1;
    current.temperatures.push(reading.temperatura);
    current.humidities.push(reading.umidade);
    dailyMap.set(readingDate, current);
  }

  const dailySeries = Array.from(dailyMap.values()).map((day) => ({
    date: day.date,
    label: day.label,
    totalReadings: day.totalReadings,
    avgTemperature: round2(day.temperatures.reduce((sum, value) => sum + value, 0) / day.temperatures.length),
    minTemperature: round2(Math.min(...day.temperatures)),
    maxTemperature: round2(Math.max(...day.temperatures)),
    avgHumidity: round2(day.humidities.reduce((sum, value) => sum + value, 0) / day.humidities.length),
    minHumidity: round2(Math.min(...day.humidities)),
    maxHumidity: round2(Math.max(...day.humidities)),
  }));

  const totensReport = scope.totens.map((totem) => {
    const readingsForTotem = typedReadings.filter(
      (reading) => String(reading.totem_id) === String(totem._id)
    );

    const stats = calculateStats(readingsForTotem);
    const totAnomalies = readingsForTotem.filter((reading) => isAnomaly(reading));
    const lastReading = readingsForTotem.length > 0 ? readingsForTotem[readingsForTotem.length - 1] : null;

    return {
      totem,
      totalReadings: stats.totalReadings,
      avgTemperature: stats.avgTemperature,
      minTemperature: stats.minTemperature,
      maxTemperature: stats.maxTemperature,
      avgHumidity: stats.avgHumidity,
      minHumidity: stats.minHumidity,
      maxHumidity: stats.maxHumidity,
      anomalyCount: totAnomalies.length,
      lastReading: lastReading
        ? {
            temperatura: lastReading.temperatura,
            umidade: lastReading.umidade,
            criado_em: lastReading.criado_em || null,
            imagem: lastReading.imagem,
          }
        : null,
    };
  });

  return {
    error: false,
    status: 200,
    message: "",
    data: {
      range,
      summary: {
        totalTotens: scope.totens.length,
        totalReadings: summaryStats.totalReadings,
        totalAnalyses,
        avgTemperature: summaryStats.avgTemperature,
        avgHumidity: summaryStats.avgHumidity,
        minTemperature: summaryStats.minTemperature,
        maxTemperature: summaryStats.maxTemperature,
        minHumidity: summaryStats.minHumidity,
        maxHumidity: summaryStats.maxHumidity,
        anomalyCount: anomalyReadings.length,
      },
      dailySeries: dailySeries.sort((a, b) => a.date.localeCompare(b.date)),
      totens: totensReport.sort((a, b) => b.totalReadings - a.totalReadings),
      anomalies: anomalyReadings.map((reading) => {
        const relatedTotem = scope.totens.find(
          (totem) => String(totem._id) === String(reading.totem_id)
        );

        return {
          totem: relatedTotem || null,
          temperatura: reading.temperatura,
          umidade: reading.umidade,
          criado_em: reading.criado_em || null,
          imagem: reading.imagem,
          reasons: getReasons(reading),
        };
      }),
    },
  };
};

export const getAnalisesPaginadas = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        error: true,
        messageError: "Usuário não autenticado",
        data: null,
      });
    }

    const scope = await getUserScope(userId);

    if (scope.error) {
      return res.status(scope.status || 500).json({
        error: true,
        messageError: scope.message || "Falha ao montar escopo.",
        data: null,
      });
    }

    const { start, end, page = "1", limit = "12" } = req.query as {
      start?: string;
      end?: string;
      page?: string;
      limit?: string;
    };

    const range = buildDateRange(start, end);
    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 12));
    const skip = (pageNumber - 1) * pageSize;

    const analysisFilter = buildAnalysisFilter(scope, userId, range);
    const totalItems = await AnaliseImagem.countDocuments(analysisFilter);
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    const analyses = (await AnaliseImagem.find(analysisFilter)
      .sort({ criado_em: -1 })
      .skip(skip)
      .limit(pageSize)) as unknown as AnalysisWithDate[];

    return res.json({
      error: false,
      messageError: "",
      data: {
        items: analyses.map((analysis) => serializeAnalysis(analysis, scope)),
        pagination: {
          page: pageNumber,
          limit: pageSize,
          totalItems,
          totalPages,
          hasNext: pageNumber < totalPages,
          hasPrevious: pageNumber > 1,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      messageError: "Inconsistência ao carregar análises.",
      data: null,
    });
  }
};

export const createSensorReading = async (req: Request, res: Response) => {
  console.log("--> Controller: Iniciando processamento...");
  let finalPath: string | null = null;

  try {
    const { temperatura, umidade, totem_id } = req.body;
    const totemId = String(totem_id || "").trim();
    const tempFloat = Number(temperatura);
    const humFloat = Number(umidade);

    const cleanupFile = async (filePath?: string | null) => {
      if (!filePath) return;
      try {
        await fs.promises.unlink(filePath);
      } catch (cleanupError) {
        console.warn("Falha ao limpar arquivo:", cleanupError);
      }
    };

    // 1. Validações Iniciais
    if (!req.file) {
      return res.status(400).json({ error: true, message: "Upload da imagem falhou." });
    }

    if (!totemId || temperatura === undefined || umidade === undefined) {
      await cleanupFile(req.file.path);
      return res.status(400).json({ error: true, message: "Campos obrigatorios ausentes (totem_id, temperatura ou umidade)." });
    }

    if (!Number.isFinite(tempFloat) || !Number.isFinite(humFloat)) {
      await cleanupFile(req.file.path);
      return res.status(400).json({ error: true, message: "Temperatura ou umidade em formato invalido." });
    }

    if (!mongoose.Types.ObjectId.isValid(totemId)) {
      await cleanupFile(req.file.path);
      return res.status(400).json({ error: true, message: "ID do totem invalido." });
    }

    // 2. Lógica de Renomear o Arquivo
    // Pega o caminho antigo (temp_123.jpg)
    const oldPath = req.file.path;
    const pastaUploads = path.dirname(oldPath);
    const ext = path.extname(req.file.originalname || req.file.filename).toLowerCase();

    // Sanitiza o ID e cria o Timestamp
    const safeId = totemId.replace(/[^a-zA-Z0-9]/g, "") || "totem";

    // Data Formatada (YYYYMMDD_HHmmss)
    const now = new Date();
    // Ajuste simples para fuso horário local (Brasil -3) se necessário, ou use UTC
    now.setHours(now.getHours() - 3);
    const timeString = now.toISOString().replace(/[-:T]/g, "").slice(0, 14);

    // Novo Nome: ID_DATA.jpg
    const novoNomeArquivo = `${safeId}_${timeString}${ext}`;
    const newPath = path.join(pastaUploads, novoNomeArquivo);

    // Executa a renomeação no disco
    await fs.promises.rename(oldPath, newPath);
    finalPath = newPath;

    console.log(`Arquivo renomeado de ${req.file.filename} para ${novoNomeArquivo}`);

    // 3. Caminho para salvar no Banco (Relativo para acesso web)
    const caminhoBanco = `uploads/${novoNomeArquivo}`;

    // 4. Conversão e Salvamento no DB
    const novaLeitura = await TotenColeta.create({
      totem_id: totemId,
      temperatura: tempFloat,
      umidade: humFloat,
      imagem: caminhoBanco,
    });

    const novaAnalise = await AnaliseImagem.create({
      totem_coleta_id: novaLeitura._id,
      totem_id: totemId,
      imagem: caminhoBanco,
      cultura: "soja",
      origem_analise: "totem",
      fase_crescimento: "desconhecido",
      justificativa_confianca: "",
      analise_status: "pendente",
      analise_tentativas: 0,
    });

    console.log(`Leitura salva! ID: ${novaLeitura._id}`);

    return res.status(201).json({
      error: false,
      message: "Leitura do totem registrada com sucesso",
      file: caminhoBanco,
      data: {
        reading_id: novaLeitura._id,
        analise_id: novaAnalise._id,
        analise_status: novaAnalise.analise_status,
      },
    });

  } catch (error) {
    console.error("Erro interno:", error);
    // Tenta limpar arquivo temporário se existir erro
    await (async () => {
      if (finalPath && fs.existsSync(finalPath)) {
        try { await fs.promises.unlink(finalPath); } catch (e) { }
        return;
      }
      if (req.file && fs.existsSync(req.file.path)) {
        try { await fs.promises.unlink(req.file.path); } catch (e) { }
      }
    })();
    return res.status(500).json({ error: true, message: "Erro interno ao registrar leitura do totem." });
  }
};

// =========================
// READ ALL
// =========================
export const getAllReadings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id; // recebido do middleware de auth

    if (!userId) {
      return res.status(401).json({
        error: true,
        messageError: "Usuário não autenticado",
        data: []
      });
    }

    // Buscar usuário
    const usuario = await Usuario.findById(userId);

    if (!usuario) {
      return res.status(404).json({
        error: true,
        messageError: "Usuário não encontrado",
        data: []
      });
    }

    // Buscar totens vinculados ao usuário
    const totens = await Totem.find(
      { usuario_id: userId },
    );

    if (totens.length === 0) {
      return res.json({
        error: false,
        messageError: "",
        data: {
          totens: [],
          temperaturas: [],
          umidades: []
        }
      });
    }

    const totenIds = totens.map(t => t._id);

    const { start, end } = req.query as { start?: string; end?: string };

    const startDate = parseDateInput(start, false);
    const endDate = parseDateInput(end, true);

    if (start && !startDate) {
      return res.status(400).json({
        error: true,
        messageError: "Data inicial inválida.",
        data: []
      });
    }

    if (end && !endDate) {
      return res.status(400).json({
        error: true,
        messageError: "Data final inválida.",
        data: []
      });
    }

    if (!startDate && !endDate) {
      // Buscar coletas dos últimos 7 dias por padrão
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
      seteDiasAtras.setHours(0, 0, 0, 0);
      // Se nenhum filtro for enviado, usa os últimos 7 dias.
      // O endDate é mantido como o momento atual para não cortar leituras do dia.
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      const dateFilter: { $gte?: Date; $lte?: Date } = {
        $gte: seteDiasAtras,
        $lte: today,
      };

      const coletas = await TotenColeta.find({
        totem_id: { $in: totenIds },
        criado_em: dateFilter,
      }).sort({ criado_em: -1 });

      const result = totens.map(totem => ({
        totem,
        coletas: coletas.filter(c => String(c.totem_id) === String(totem._id))
      }));

      return res.json({
        error: false,
        messageError: "",
        data: result
      });
    }

    const dateFilter: { $gte?: Date; $lte?: Date } = {};
    if (startDate) dateFilter.$gte = startDate;
    if (endDate) dateFilter.$lte = endDate;

    const coletas = await TotenColeta.find({
      totem_id: { $in: totenIds },
      ...(Object.keys(dateFilter).length ? { criado_em: dateFilter } : {})
    }).sort({ criado_em: -1 });

    // Monta o array no formato solicitado
    const result = totens.map(totem => ({
      totem,
      coletas: coletas.filter(c => String(c.totem_id) === String(totem._id))
    }));

    return res.json({
      error: false,
      messageError: "",
      data: result
    });

  } catch (error) {
    console.error("❌ Inconsistência no dashboard:", error);
    return res.status(500).json({
      error: true,
      messageError: "Inconsistência ao carregar dados do dashboard: " + error,
      data: []
    });
  }
};

// =========================
// LAST READING
// =========================
export const getLastReading = async (req: Request, res: Response) => {
  try {
    const last = await TotenColeta.findOne().sort({ createdAt: -1 });

    return res.json({
      error: false,
      messageError: "",
      data: last ? [last] : []
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      messageError: "Inconsistência ao buscar última leitura.",
      data: []
    });
  }
};

// =========================
// STATS (para os cards)
// =========================
export const getReadingStats = async (req: Request, res: Response) => {
  try {
    const total = await TotenColeta.countDocuments();

    // totens que coletaram hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCollections = await TotenColeta.countDocuments({
      criado_em: { $gte: today },
    });

    return res.json({
      error: false,
      messageError: "",
      data: {
        totalColetas: total,
        coletasHoje: todayCollections
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      messageError: "Inconsistência ao buscar estatísticas.",
      data: []
    });
  }
};

// =========================
// REPORT OVERVIEW
// =========================
export const getReportOverview = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        error: true,
        messageError: "Usuário não autenticado",
        data: [],
      });
    }

    const { start, end } = req.query as { start?: string; end?: string };
    const report = await buildReportData(userId, start, end);

    if (report.error) {
      return res.status(report.status || 500).json({
        error: true,
        messageError: report.message || "Falha ao montar relatório.",
        data: [],
      });
    }

    return res.json({
      error: false,
      messageError: "",
      data: report.data,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      messageError: "Inconsistência ao montar relatório.",
      data: [],
    });
  }
};


