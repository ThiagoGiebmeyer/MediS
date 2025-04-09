import { DataTypes } from "sequelize";
import sequelize from "../config/database";
import Usuario from "./usuario.model";

const Cam = sequelize.define(
  "Cam",
  {
    ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Usuario,
        key: "ID",
      },
    },
  },
  {
    tableName: "CAM",
    timestamps: true,
    createdAt: "criadoEm",
    updatedAt: "alteradoEm",
  }
);

Cam.belongsTo(Usuario, { foreignKey: "usuarioId" });

export default Cam;
