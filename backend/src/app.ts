import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger";

import routes from "./routes"; // <-- importando todas as rotas agrupadas

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "🚀 API de Monitoramento de Soja",
    docs: "/docs",
  });
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api", routes);

export default app;
