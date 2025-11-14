import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger";
import cors from "cors";
import routes from "./routes";

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["authorization", "content-type"],
  })
);

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

app.options("*", cors());

// ✅ Suas rotas de API devem vir ANTES do Swagger
app.use("/api", routes);

// ✅ Swagger deve ficar por último
app.use("/", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default app;
