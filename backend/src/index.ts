import app from "./app";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const PORT = Number(process.env.PORT) || 3001; // Garante que é número
const MONGO_URI = process.env.DB_URL || "";

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado ao MongoDB em: ", MONGO_URI);

    // ADICIONE "0.0.0.0" AQUI 👇
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 MediS - API acessível externamente em: http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Inconsistência ao iniciar a MediS - API:", error);
  }
})();