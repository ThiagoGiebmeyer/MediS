import { Model, DataTypes, Sequelize } from "sequelize";
import { Usuarios } from "./usuarios.model";

export class Cams extends Model {
  public id!: number;
  public nome!: string;
  public latitude!: string;
  public longitude!: string;
}

export const initCamModel = (sequelize: Sequelize) => {
  Cams.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      nome: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      latitude: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      longitude: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Cam",
      tableName: "cams",
    }
  );

  Cams.belongsTo(Usuarios, { foreignKey: "usuarioId" });
};
