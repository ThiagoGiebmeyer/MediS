import { Request, Response } from "express";
import Cam from "../models/cam.model";

export const criarCam = async (req: Request, res: Response) => {
  try {
    const cam = await Cam.create(req.body);
    res.status(201).json(cam);
  } catch (error) {
    res.status(400).json({ error });
  }
};
