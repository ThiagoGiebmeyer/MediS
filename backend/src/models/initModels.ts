import { Sequelize } from "sequelize";
import { initUsuarioModel } from "./usuarios.model";
import { initCamModel } from "./cams.model";
import { initCamSensoresModel } from "./camSensores.model";
import { initImagemModel } from "./imagens.model";

export const initModels = (sequelize: Sequelize) => {
  initUsuarioModel(sequelize);
  initCamModel(sequelize);
  initCamSensoresModel(sequelize);
  initImagemModel(sequelize);
};
