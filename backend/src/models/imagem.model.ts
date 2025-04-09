import { DataTypes } from "sequelize";
import sequelize from "../config/database";
import Cam from "./cam.model";

const Imagem = sequelize.define(
  "Imagem",
  {
    ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    imagem: {
      type: DataTypes.STRING,
      allowNull: false, // pode ser base64 ou URL
    },
    estagio: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    camId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Cam,
        key: "ID",
      },
    },
  },
  {
    tableName: "IMAGENS",
    timestamps: true,
    createdAt: "criadoEm",
    updatedAt: "alteradoEm",
  }
);

Imagem.belongsTo(Cam, { foreignKey: "camId" });

export default Imagem;
