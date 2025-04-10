import { Request, Response } from "express";
import { Cams } from "../models/cams.model";

export const criarCam = async (req: Request, res: Response) => {
  try {
    const cam = await Cams.create(req.body);
    res.status(201).json(cam);
  } catch (error) {
    res.status(400).json({ error });
  }
};
