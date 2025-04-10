import { Router } from "express";

import usuarioRoutes from "./usuario.routes";
import camRoutes from "./cam.routes";
import imagemRoutes from "./imagem.routes";
import camSensoresRoutes from "./camSensores.routes";

const router = Router();

router.use("/usuarios", usuarioRoutes);
router.use("/cams", camRoutes);
router.use("/imagens", imagemRoutes);
router.use("/sensores", camSensoresRoutes);

export default router;
