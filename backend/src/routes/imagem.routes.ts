import { Router } from "express";
import { validarImagem } from "../controllers/imagem.controller";
import upload from "../config/multer";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

router.use(authenticateToken);

router.post("/validar", upload.single("file"), validarImagem);

export default router;
