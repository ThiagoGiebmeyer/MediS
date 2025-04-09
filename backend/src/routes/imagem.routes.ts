import { Router } from "express";
import { validarImagem } from "../controllers/imagem.controller";
import upload from "../config/multer";

const router = Router();

router.post("/validar", upload.single("file"), validarImagem);

export default router;
