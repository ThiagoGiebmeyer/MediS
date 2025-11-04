import app from "./app";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { createDatabaseIfNotExists } from "./utils/createDatabase";
import { createSequelizeInstance } from "./config/database";
import { initModels } from "./models/initModels";

dotenv.config();

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.DB_URL || "";

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado ao MongoDB");

    await createDatabaseIfNotExists();

    const sequelize = createSequelizeInstance();

    initModels(sequelize);

    await sequelize.sync({ alter: true });
    console.log("✅ Sequelize sincronizado");

    app.listen(PORT, () => {
      console.log(`🚀 MediS - API inicializada em: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Erro ao iniciar a MediS - API:", error);
  }
})();
