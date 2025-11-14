import { Request, Response } from "express";
import { Totem } from "../database/models/totens.model";

export const createTotem = async (req: Request, res: Response) => {
  try {
    const totem = await Totem.create(req.body);
    res.status(201).json({
      error: false,
      messageError: "",
      data: [totem]
    });
  } catch (error) {
    res.status(400).json({
      error: true,
      messageError: (error instanceof Error ? error.message : "Erro ao criar totem."),
      data: []
    });
  }
};
