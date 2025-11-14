import { Router } from "express";
import { getDashboardData } from "../controllers/dashboard.controller";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

router.use(authenticateToken);

router.get("/", getDashboardData);

export default router;
