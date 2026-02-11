import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { analisarImagem } from "../controllers/analise.controller";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

// Configuração multer com memoryStorage para análise em tempo real
const storage = multer.memoryStorage();

const uploadAnalise = multer({
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB
  },
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedMimes = new Set([
      "image/jpeg",
      "image/pjpeg",
      "image/png",
    ]);

    if (!allowedMimes.has(file.mimetype)) {
      cb(new Error("Tipo de arquivo inválido. Envie JPG ou PNG."));
      return;
    }

    cb(null, true);
  },
});

const uploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const uploadSingle = uploadAnalise.single("image");

  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "FILE_TOO_LARGE") {
        return res.status(413).json({
          error: true,
          messageError: "Arquivo muito grande. Máximo 15MB.",
        });
      }
      return res.status(400).json({
        error: true,
        messageError: err.message || "Erro ao fazer upload.",
      });
    } else if (err) {
      return res.status(400).json({
        error: true,
        messageError: err.message || "Erro ao fazer upload.",
      });
    }
    next();
  });
};

router.post("/", authenticateToken, uploadMiddleware, analisarImagem);

export default router;
