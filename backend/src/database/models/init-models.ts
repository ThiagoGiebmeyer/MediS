// Modelos Mongoose são inicializados automaticamente ao importar
// Apenas importamos os modelos para garantir que estão registrados
import { Usuario } from "./usuarios-model";
import { Totem } from "./totens-model";
import { TotenColeta } from "./totens-coletas-model";
import { AnaliseImagem } from "./analises-imagens-model";

export { Usuario, Totem, TotenColeta, AnaliseImagem };
