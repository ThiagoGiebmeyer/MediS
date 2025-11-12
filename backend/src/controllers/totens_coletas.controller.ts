import { Request, Response } from "express";
import { TotenColeta } from "../database/models/totens_coletas.model";

export const createSensorReading = async (req: Request, res: Response) => {
  try {
    const reading = await TotenColeta.create(req.body);
    res.status(201).json({
      error: false,
      messageError: "",
      data: [reading]
    });
  } catch (error) {
    res.status(400).json({
      error: true,
      messageError: (error instanceof Error ? error.message : "Erro ao criar leitura do sensor."),
      data: []
    });
  }
};
