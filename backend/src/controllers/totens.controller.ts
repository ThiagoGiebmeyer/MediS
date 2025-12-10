import { Request, Response } from "express";
import { Totem } from "../database/models/totens.model";

export const createTotem = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    const newTotem = {
      ...req.body,
      usuario_id: userId || ''
    }
    console.log("Creating totem with data:", newTotem);
    const totem = await Totem.create(newTotem);
    res.status(201).json({
      error: false,
      messageError: "",
      data: [totem]
    });
  } catch (error) {
    res.status(400).json({
      error: true,
      messageError: (error instanceof Error ? error.message : "Inconsistência ao criar totem."),
      data: []
    });
  }
};

export const getConfig = async (req: Request, res: Response) => {
  try {
    const totemId = req.params?.totemId
    if (!totemId) {
      return res.status(404).json({
        error: true,
        messageError: "Totem não encontrado",
        data: []
      });
    }

    const config = Totem.findById(totemId);
    return res.status(404).json({
      error: false,
      messageError: "",
      data: [config]
    });
  } catch (error) {
    res.status(400).json({
      error: true,
      messageError: (error instanceof Error ? error.message : "Inconsistência ao buscar configuração do totem."),
      data: []
    });
  }
};
