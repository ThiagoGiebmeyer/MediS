import express from "express";
import { login, cadastro } from "../controllers/usuario.controller";

const router = express.Router();

router.post("/login", login);
router.post("/cadastro", cadastro);

export default router;
