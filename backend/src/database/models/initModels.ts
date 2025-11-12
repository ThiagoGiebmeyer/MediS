// Modelos Mongoose são inicializados automaticamente ao importar
// Apenas importamos os modelos para garantir que estão registrados
import { Usuario } from "./usuarios.model";
import { Toten } from "./totens.model";
import { TotenColeta } from "./totens_coletas.model";

export const initModels = () => {
  // Os modelos já estão registrados via Schema/model()
  console.log("✅ Modelos Mongoose inicializados");
};

export { Usuario, Toten, TotenColeta };
