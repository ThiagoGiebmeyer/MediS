import app from "./app";
import sequelize from "./config/database";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.DB_URL || "";

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado ao MongoDB");

    await sequelize.sync({ alter: true });
    console.log("✅ Sequelize sincronizado com sucesso.");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("❌ Erro ao iniciar a aplicação:", error);
  }
})();
