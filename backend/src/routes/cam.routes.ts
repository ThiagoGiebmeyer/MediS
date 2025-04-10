import { Router } from "express";
import { criarCam } from "../controllers/cam.controller";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

router.use(authenticateToken);

router.post("/cadastro", criarCam);

export default router;
