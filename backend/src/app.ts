import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger";

import usuarioRoutes from "./routes/usuario.routes";
import camRoutes from "./routes/cam.routes";
import imagemRoutes from "./routes/imagem.routes";
import camSensoresRoutes from "./routes/camSensores.routes";
import authRoutes from "./routes/authRoutes";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "🚀 API de Monitoramento de Soja",
    docs: "/docs",
  });
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authRoutes);

app.use("/usuarios", usuarioRoutes);
app.use("/cams", camRoutes);
app.use("/imagens", imagemRoutes);
app.use("/sensores", camSensoresRoutes);

export default app;
