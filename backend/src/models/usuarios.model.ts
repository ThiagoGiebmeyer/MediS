import { Model, DataTypes, Sequelize } from "sequelize";

export class Usuarios extends Model {
  public id!: number;
  public nome!: string;
  public sobrenome!: string;
  public email!: string;
  public senha!: string;
}

export const initUsuarioModel = (sequelize: Sequelize) => {
  Usuarios.init(
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
      sobrenome: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      senha: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: "USUARIOS",
    }
  );
};
