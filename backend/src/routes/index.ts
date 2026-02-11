import { Router } from "express";

import userRoutes from "./usuario.routes";
import totemRoutes from "./totens.routes";
import totemReadingRoutes from "./totens_coletas.routes";
import analiseRoutes from "./analise.routes";

const router = Router();

router.use("/user", userRoutes);
router.use("/totem", totemRoutes);
router.use("/totem/reading", totemReadingRoutes);
router.use("/analise", analiseRoutes);

export default router;