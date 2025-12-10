import cors from "cors";
import express from "express";
import path from "path";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger";
import routes from "./routes";

const app = express();

// Middleware de Log Detalhado (Ajuda a debugar o ESP32)
app.use((req, res, next) => {
  console.log(`\n--- [${new Date().toISOString()}] NOVA REQUISIÇÃO ---`);
  console.log(`Method: ${req.method} | URL: ${req.url}`);
  console.log(`User-Agent: ${req.headers['user-agent']}`);
  console.log(`Content-Type: ${req.headers['content-type']}`);
  console.log(`Content-Length: ${req.headers['content-length']}`);
  next();
});

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["authorization", "content-type"],
  })
);

// Parsers globais (Nota: Eles ignoram multipart/form-data, quem trata isso é o Multer nas rotas)
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

app.options("*", cors());

// ✅ Suas rotas de API
app.use("/api", routes);
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
// ✅ Swagger
app.use("/", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default app;