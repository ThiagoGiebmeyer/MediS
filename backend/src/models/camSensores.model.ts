import { DataTypes } from "sequelize";
import sequelize from "../config/database";
import Cam from "./cam.model";

const CamSensores = sequelize.define(
  "CamSensores",
  {
    ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    DHT11_temperatura: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    DHT11_umidade: {
      type: DataTypes.FLOAT,
      allowNull: false,
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
    tableName: "CAM_SENSORES",
    timestamps: true,
    createdAt: "criadoEm",
    updatedAt: "alteradoEm",
  }
);

CamSensores.belongsTo(Cam, { foreignKey: "camId" });

export default CamSensores;
