import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware";
import { login } from "../controllers/usuario.controller";

const router = express.Router();

router.post("/login", login);

router.get("/protegido", authenticateToken, (req, res) => {
  res.json({ message: "Você acessou uma rota protegida!" });
});

export default router;
