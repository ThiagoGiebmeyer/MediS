import { Router } from "express";
import { criarLeituraSensor } from "../controllers/camSensores.controller";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

router.use(authenticateToken);

router.post("/", criarLeituraSensor);

export default router;
