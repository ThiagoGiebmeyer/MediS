import { Request, Response } from "express";
import { classificarImagem } from "../services/classificador";

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

    const resultado = await classificarImagem(buffer);

    console.log("Resultado da classificação:", resultado);

    return res.status(200).json({
      error: false,
      data: {
        fase_crescimento: resultado,
        confianca: Math.random() * 0.4 + 0.6, // Valor entre 60-100% como exemplo
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
