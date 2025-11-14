import app from "./app";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.DB_URL || "";

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado ao MongoDB em: ", MONGO_URI);

    app.listen(PORT, () => {
      console.log(`🚀 MediS - API inicializada em: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Erro ao iniciar a MediS - API:", error);
  }
})();
