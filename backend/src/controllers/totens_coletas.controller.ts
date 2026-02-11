import { Request, Response } from "express";
import { Totem } from "../database/models/totens.model";
import { TotenColeta } from "../database/models/totens_coletas.model";
import { Usuario } from "../database/models/usuarios.model";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

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
      return res.status(400).json({ error: true, message: "Upload falhou." });
    }

    if (!totemId || temperatura === undefined || umidade === undefined) {
      await cleanupFile(req.file.path);
      return res.status(400).json({ error: true, message: "Campos obrigatórios faltando." });
    }

    if (!Number.isFinite(tempFloat) || !Number.isFinite(humFloat)) {
      await cleanupFile(req.file.path);
      return res.status(400).json({ error: true, message: "Temperatura ou umidade inválida." });
    }

    if (!mongoose.Types.ObjectId.isValid(totemId)) {
      await cleanupFile(req.file.path);
      return res.status(400).json({ error: true, message: "ID do Totem inválido." });
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

    console.log(`Leitura salva! ID: ${novaLeitura._id}`);

    return res.status(201).json({
      error: false,
      message: "Leitura registrada com sucesso",
      file: caminhoBanco
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
    return res.status(500).json({ error: true, message: "Erro interno." });
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

    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (start) {
      const parsedStart = new Date(start);
      if (Number.isNaN(parsedStart.getTime())) {
        return res.status(400).json({
          error: true,
          messageError: "Data inicial inválida.",
          data: []
        });
      }
      parsedStart.setHours(0, 0, 0, 0);
      startDate = parsedStart;
    }

    if (end) {
      const parsedEnd = new Date(end);
      if (Number.isNaN(parsedEnd.getTime())) {
        return res.status(400).json({
          error: true,
          messageError: "Data final inválida.",
          data: []
        });
      }
      parsedEnd.setHours(23, 59, 59, 999);
      endDate = parsedEnd;
    }

    if (!startDate && !endDate) {
      // Buscar coletas dos últimos 7 dias por padrão
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
      seteDiasAtras.setHours(0, 0, 0, 0);
      startDate = seteDiasAtras;
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
      createdAt: { $gte: today },
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


