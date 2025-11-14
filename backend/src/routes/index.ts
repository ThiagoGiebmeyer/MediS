import { Router } from "express";

import userRoutes from "./usuario.routes";
import totemRoutes from "./totens.routes";
import sensorReadingRoutes from "./totens_coletas.routes";
import dashboardRoutes from "./dashboard.routes";

const router = Router();

router.use("/user", userRoutes);
router.use("/totem", totemRoutes);
router.use("/totem/reading", sensorReadingRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
