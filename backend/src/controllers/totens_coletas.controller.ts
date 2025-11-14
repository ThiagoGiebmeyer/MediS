import { Request, Response } from "express";
import { TotenColeta } from "../database/models/totens_coletas.model";

// =========================
// CREATE
// =========================
export const createSensorReading = async (req: Request, res: Response) => {
  try {
    const reading = await TotenColeta.create(req.body);
    return res.status(201).json({
      error: false,
      messageError: "",
      data: [reading]
    });
  } catch (error) {
    return res.status(400).json({
      error: true,
      messageError: error instanceof Error ? error.message : "Erro ao criar leitura.",
      data: []
    });
  }
};

// =========================
// READ ALL
// =========================
export const getAllReadings = async (req: Request, res: Response) => {
  try {
    const readings = await TotenColeta.find().sort({ createdAt: 1 });

    return res.json({
      error: false,
      messageError: "",
      data: readings
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      messageError: "Erro ao buscar leituras.",
      data: []
    });
  }
};

// =========================
// LAST READING
// =========================
export const getLastReading = async (req: Request, res: Response) => {
  try {
    const last = await TotenColeta.findOne().sort({ createdAt: -1 });

    return res.json({
      error: false,
      messageError: "",
      data: last ? [last] : []
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      messageError: "Erro ao buscar última leitura.",
      data: []
    });
  }
};

// =========================
// STATS (para os cards)
// =========================
export const getReadingStats = async (req: Request, res: Response) => {
  try {
    const total = await TotenColeta.countDocuments();

    // totens que coletaram hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCollections = await TotenColeta.countDocuments({
      createdAt: { $gte: today },
    });

    return res.json({
      error: false,
      messageError: "",
      data: {
        totalColetas: total,
        coletasHoje: todayCollections
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      messageError: "Erro ao buscar estatísticas.",
      data: []
    });
  }
};


