import { Request, Response } from "express";
import { TotenColeta } from "../database/models/totens_coletas.model";
import fs from "fs";
import path from "path";

// =========================
// CREATE
// =========================
export const createSensorReading = async (req: Request, res: Response) => {
  console.log("Recebendo leitura via Base64...", req.body);
  try {

    const { temperatura, umidade, totem_id, image } = req.body;

    if (!image) {
      return res.status(400).json({ error: true, message: "Imagem Base64 obrigatória." });
    }

    // // --- OPÇÃO A: Salvar como arquivo no disco (Recomendado) ---
    // // Decodifica o Base64 e salva na pasta uploads
    // const buffer = Buffer.from(image, 'base64');
    // const filename = `${totem_id}-${Date.now()}.jpg`;
    // const uploadPath = path.join(process.cwd(), 'uploads', filename);

    // // Garante que a pasta existe
    // if (!fs.existsSync(path.dirname(uploadPath))) fs.mkdirSync(path.dirname(uploadPath), { recursive: true });

    // fs.writeFileSync(uploadPath, buffer);
    // const caminhoSalvo = `/uploads/${filename}`;
    // -----------------------------------------------------------

    /* // --- OPÇÃO B: Salvar o Base64 direto no Banco (NÃO Recomendado) ---
    // Se você realmente quiser salvar a string gigante no MongoDB:
    const caminhoSalvo = image; 
    */

    const now = new Date();

    const payload = {
      temperatura,
      umidade,
      totem_id,
      imagem: image, // Salva o caminho ou o base64
      data_coleta: now.toISOString().split('T')[0],
      hora_coleta: now.toLocaleTimeString('pt-BR', { hour12: false }),
      estagio: "monitoramento"
    };

    const reading = await TotenColeta.create(payload);

    return res.status(201).json({ error: false, message: "Salvo com sucesso via Base64" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: true, message: "Erro interno" });
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


