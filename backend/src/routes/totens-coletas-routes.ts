import { Router, Request, Response, NextFunction } from "express";
import multer from "multer"; // Necessário apenas para checar o tipo do erro

// ✅ Importe a configuração que criamos
import { upload } from "../config/multer";

import {
  createSensorReading,
  getAllReadings,
  getLastReading,
  getReadingStats
} from "../controllers/totens-coletas-controller";

const router = Router();

// --- MIDDLEWARE WRAPPER (Para tratamento de erros customizado) ---
// Mantemos isso aqui para interceptar erros como "File too large" e retornar JSON
const uploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Usa a instância 'upload' importada do config
  const uploadSingle = upload.single("image");

  uploadSingle(req, res, (err: any) => {
    if (err) {
      console.error("❌ ERRO NO UPLOAD:", err);

      if (err instanceof multer.MulterError) {
        // Erros do Multer (ex: arquivo muito grande)
        return res.status(400).json({ error: true, message: `Erro no upload da imagem: ${err.message}` });
      } else if (err) {
        // Erros genéricos ou do fileFilter
        return res.status(400).json({ error: true, message: `Falha de validacao do arquivo: ${err.message}` });
      }
    }
    // Sucesso, segue para o controller
    next();
  });
};

// --- ROTAS ---
router.post("/", uploadMiddleware, createSensorReading);

router.get("/", getAllReadings);
router.get("/last", getLastReading);
router.get("/stats", getReadingStats);

export default router;