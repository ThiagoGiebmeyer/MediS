import { Request, Response } from "express";
import { classificarImagem } from "../services/gemini-service";
import { salvarBufferEmUploads } from "../services/imagem-storage-service";
import { AnaliseImagem } from "../database/models/analises-imagens-model";

export const analisarImagem = async (req: Request, res: Response) => {
  try {
    console.log("Arquivo recebido:", req.file ? "Sim" : "Não");
    console.log("Detalhes do arquivo:", {
      fieldname: req.file?.fieldname,
      originalname: req.file?.originalname,
      encoding: req.file?.encoding,
      mimetype: req.file?.mimetype,
      size: req.file?.size,
      bufferLength: req.file?.buffer?.length,
    });

    if (!req.file) {
      return res.status(400).json({
        error: true,
        messageError: "Nenhuma imagem foi enviada.",
      });
    }

    const buffer = req.file.buffer;

    if (!buffer || buffer.length === 0) {
      return res.status(400).json({
        error: true,
        messageError: "Buffer da imagem está vazio.",
      });
    }

    console.log("Iniciando classificação com buffer de", buffer.length, "bytes");

    const resultado = await classificarImagem(buffer, req.file.mimetype);

    const imagemPersistida = await salvarBufferEmUploads({
      buffer,
      originalname: req.file.originalname,
      prefixo: "manual",
    });

    await AnaliseImagem.create({
      imagem: imagemPersistida.caminhoRelativo,
      cultura: resultado.cultura,
      origem_analise: "manual",
      prompt_versao: resultado.prompt_versao,
      fase_crescimento: resultado.fase_crescimento,
      analise_status: "concluida",
      analise_tentativas: 1,
      analise_finalizada_em: new Date(),
      analise_erro: undefined,
      confianca: resultado.confianca,
      justificativa_confianca: resultado.justificativa_confianca,
      resumo: resultado.resumo,
      sinais_observados: resultado.sinais_observados,
      modelo: resultado.modelo,
      resposta_bruta: resultado.resposta_bruta,
      usuario_id: (req as any).user?.id,
    });

    console.log("Resultado da classificação:", resultado.fase_crescimento);

    return res.status(200).json({
      error: false,
      data: {
        cultura: resultado.cultura,
        fase_crescimento: resultado.fase_crescimento,
        confianca: resultado.confianca,
        justificativa_confianca: resultado.justificativa_confianca,
        resumo: resultado.resumo,
        sinais_observados: resultado.sinais_observados,
        modelo: resultado.modelo,
        prompt_versao: resultado.prompt_versao,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error("Erro ao analisar imagem:", err);
    console.error("Stack trace:", err.stack);
    return res.status(500).json({
      error: true,
      messageError: err.message || "Inconsistência ao analisar imagem.",
    });
  }
};
