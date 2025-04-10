import { Request, Response } from "express";
import { CamSensores } from "../models/camSensores.model";

export const criarLeituraSensor = async (req: Request, res: Response) => {
  try {
    const leitura = await CamSensores.create(req.body);
    res.status(201).json(leitura);
  } catch (error) {
    res.status(400).json({ error });
  }
};
