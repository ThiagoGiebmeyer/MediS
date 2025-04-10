import { Model, DataTypes, Sequelize } from "sequelize";
import { Cams } from "./cams.model";

export class CamSensores extends Model {
  public id!: number;
  public temperatura!: number;
  public umidade!: number;
  public camId!: number;
}

export const initCamSensoresModel = (sequelize: Sequelize) => {
  CamSensores.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      temperatura: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      umidade: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      camId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: "CAMS_SENSORES",
    }
  );

  CamSensores.belongsTo(Cams, { foreignKey: "camId" });
};
