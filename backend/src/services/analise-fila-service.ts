import fs from "fs";
import path from "path";
import { AnaliseImagem } from "../database/models/analises-imagens-model";
import { classificarImagemPorArquivo } from "./gemini-service";

const POLL_MS = Number(process.env.AI_QUEUE_POLL_MS || 1500);
const CONCURRENCY = Number(process.env.AI_QUEUE_CONCURRENCY || 1);
const MAX_RETRIES = Number(process.env.AI_MAX_RETRIES || 3);
const RETRY_BASE_MS = Number(process.env.AI_RETRY_BASE_MS || 10000);

let intervalRef: NodeJS.Timeout | null = null;
let inFlight = 0;

const getAbsImagePath = (relativePath: string) => {
  const normalized = relativePath.startsWith("uploads/")
    ? relativePath
    : path.join("uploads", relativePath);

  return path.resolve(process.cwd(), normalized);
};

const calcularBackoff = (tentativas: number) => RETRY_BASE_MS * tentativas;

const finalizarComErro = async (coletaId: string, tentativas: number, erro: string) => {
  if (tentativas >= MAX_RETRIES) {
    await AnaliseImagem.findByIdAndUpdate(coletaId, {
      $set: {
        analise_status: "erro",
        analise_erro: erro,
        analise_finalizada_em: new Date(),
        analise_proxima_tentativa_em: null,
      },
    });
    return;
  }

  const delay = calcularBackoff(tentativas);
  const proximaTentativa = new Date(Date.now() + delay);

  await AnaliseImagem.findByIdAndUpdate(coletaId, {
    $set: {
      analise_status: "pendente",
      analise_erro: erro,
      analise_proxima_tentativa_em: proximaTentativa,
    },
  });
};

const claimJob = async () => {
  const now = new Date();

  return AnaliseImagem.findOneAndUpdate(
    {
      analise_status: "pendente",
      $or: [
        { analise_proxima_tentativa_em: { $exists: false } },
        { analise_proxima_tentativa_em: null },
        { analise_proxima_tentativa_em: { $lte: now } },
      ],
    },
    {
      $set: {
        analise_status: "processando",
        analise_iniciada_em: now,
        analise_erro: undefined,
      },
      $inc: { analise_tentativas: 1 },
    },
    {
      new: true,
      sort: { criado_em: 1 },
    }
  );
};

const processarJob = async () => {
  if (inFlight >= CONCURRENCY) {
    return;
  }

  const job = await claimJob();
  if (!job) {
    return;
  }

  inFlight += 1;

  try {
    const imgPath = getAbsImagePath(job.imagem);

    if (!fs.existsSync(imgPath)) {
      throw new Error("Imagem não encontrada para análise");
    }

    const resultado = await classificarImagemPorArquivo(imgPath);

    await AnaliseImagem.findByIdAndUpdate(job._id, {
      $set: {
        analise_status: "concluida",
        cultura: resultado.cultura,
        origem_analise: "totem",
        prompt_versao: resultado.prompt_versao,
        fase_crescimento: resultado.fase_crescimento,
        confianca: resultado.confianca,
        justificativa_confianca: resultado.justificativa_confianca,
        resumo: resultado.resumo,
        sinais_observados: resultado.sinais_observados,
        modelo: resultado.modelo,
        resposta_bruta: resultado.resposta_bruta,
        analise_erro: undefined,
        analise_finalizada_em: new Date(),
        analise_proxima_tentativa_em: null,
      },
    });

    console.log(`[AI-QUEUE] Análise ${job._id} concluída: ${resultado.fase_crescimento}`);
  } catch (error: any) {
    const message = error?.message || "Falha ao processar análise";
    const tentativas = Number(job.analise_tentativas || 1);

    await finalizarComErro(String(job._id), tentativas, message);
    console.error(`[AI-QUEUE] Erro na análise ${job._id}: ${message}`);
  } finally {
    inFlight -= 1;
  }
};

const tick = async () => {
  if (inFlight >= CONCURRENCY) {
    return;
  }

  const slotsDisponiveis = CONCURRENCY - inFlight;

  for (let i = 0; i < slotsDisponiveis; i += 1) {
    void processarJob();
  }
};

export const startAnaliseFilaWorker = () => {
  if (intervalRef) {
    return;
  }

  console.log(
    `[AI-QUEUE] Worker iniciado (poll=${POLL_MS}ms, concorrencia=${CONCURRENCY}, maxRetries=${MAX_RETRIES})`
  );

  intervalRef = setInterval(() => {
    void tick();
  }, POLL_MS);
};

export const stopAnaliseFilaWorker = () => {
  if (!intervalRef) {
    return;
  }

  clearInterval(intervalRef);
  intervalRef = null;
};
