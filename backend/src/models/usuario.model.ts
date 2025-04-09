import { DataTypes } from "sequelize";
import sequelize from "../config/database";

const Usuario = sequelize.define(
  "Usuario",
  {
    ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    login: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    senha: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sobrenome: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "USUARIOS",
    timestamps: true,
    createdAt: "criadoEm",
    updatedAt: "alteradoEm",
  }
);

export default Usuario;
