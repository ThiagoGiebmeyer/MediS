import { Router } from "express";
import { criarCam } from "../controllers/cam.controller";

const router = Router();

router.post("/", criarCam);

export default router;
