import dotenv from "dotenv";

// Carregar .env PRIMEIRO antes de qualquer outra coisa
dotenv.config();

import app from "./app";
import mongoose from "mongoose";
import { startAnaliseFilaWorker, stopAnaliseFilaWorker } from "./services/analise-fila-service";

const PORT = Number(process.env.PORT) || 3001; // Garante que é número
const MONGO_URI = process.env.DB_URL || "";

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado ao MongoDB em: ", MONGO_URI);

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 MediS - API acessível externamente em: http://0.0.0.0:${PORT}`);
      startAnaliseFilaWorker();
    });
  } catch (error) {
    console.error("❌ Inconsistência ao iniciar a MediS - API:", error);
  }
})();

process.on("SIGINT", () => {
  stopAnaliseFilaWorker();
  process.exit(0);
});

process.on("SIGTERM", () => {
  stopAnaliseFilaWorker();
  process.exit(0);
});