import { Request, Response } from "express";
import { classificarImagem } from "../services/classificador";

export const validarImagem = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "Nenhuma imagem enviada" });
      return;
    }

    const buffer = req.file.buffer;
    const estagio = await classificarImagem(buffer);

    res.status(200).json({ estagio });
  } catch (error) {
    console.error("Erro ao validar imagem:", error);
    res.status(500).json({ error: "Erro interno ao validar imagem" + error });
  }
};
