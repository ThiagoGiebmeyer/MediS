// src/routes/usuario.routes.ts
import { Router } from "express";
import { login, register } from "../controllers/usuarios.controller";

const router = Router();

router.post("/login", login);
router.post("/register", register);

export default router;