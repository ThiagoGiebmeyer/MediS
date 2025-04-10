import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

export const createSequelizeInstance = () => {
  return new Sequelize(
    process.env.DB_NAME as string,
    process.env.DB_USER as string,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect: "postgres",
      logging: false,
    }
  );
};
