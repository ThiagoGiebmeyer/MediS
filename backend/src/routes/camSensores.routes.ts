import { Router } from "express";
import { criarLeituraSensor } from "../controllers/camSensores.controller";

const router = Router();

router.post("/", criarLeituraSensor);

export default router;
