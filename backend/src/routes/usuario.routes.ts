// src/routes/usuario.routes.ts
import { Router } from "express";
import { forgotPassword, getProfile, login, register } from "../controllers/usuarios.controller";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

router.post("/login", login);
router.post("/register", register);
router.post("/forgot-password", forgotPassword);
router.get("/me", authenticateToken, getProfile);

export default router;