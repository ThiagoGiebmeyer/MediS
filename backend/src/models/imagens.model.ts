import { Model, DataTypes, Sequelize } from "sequelize";
import { Cams } from "./cams.model";

export class Imagens extends Model {
  public id!: number;
  public imagem!: string;
  public estagio!: string;
  public camId!: number;
}

export const initImagemModel = (sequelize: Sequelize) => {
  Imagens.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: "ID",
      },
      imagem: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      estagio: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      camId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: Cams,
          key: "id",
        },
      },
    },
    {
      sequelize,
      modelName: "Imagem",
      tableName: "IMAGENS",
      timestamps: true,
      createdAt: "criadoEm",
      updatedAt: "alteradoEm",
    }
  );

  Imagens.belongsTo(Cams, { foreignKey: "camId" });
};
