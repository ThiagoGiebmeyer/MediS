import { Request, Response } from "express";
import { classificarImagem } from "../services/classificador";

export const validarImagem = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { file } = req.body;

    if (!file) {
      res.status(400).json({ error: "Imagem em base64 não fornecida" });
      return;
    }

    const base64Data = file.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const estagio = await classificarImagem(buffer);

    res.status(200).json({ estagio });
  } catch (error) {
    console.error("Erro ao validar imagem:", error);
    res.status(500).json({ error: "Erro interno ao validar imagem: " + error });
  }
};
