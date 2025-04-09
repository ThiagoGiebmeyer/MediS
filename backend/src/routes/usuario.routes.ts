import { Router } from "express";
import { criarUsuario } from "../controllers/usuario.controller";

const router = Router();

router.post("/", criarUsuario);

export default router;
