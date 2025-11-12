import { Schema, model, Types } from "mongoose";

export interface ITotenColeta {
  temperatura: number;
  umidade: number;
  imagem: string;
  estagio?: string;
  totem_id: Types.ObjectId;
  criado_em?: Date;
  alterado_em?: Date;
}

const totenColetaSchema = new Schema<ITotenColeta>(
  {
    temperatura: {
      type: Number,
      required: true,
    },
    umidade: {
      type: Number,
      required: true,
    },
    imagem: {
      type: String,
      required: true,
    },
    estagio: {
      type: String,
      required: false,
    },
    totem_id: {
      type: Schema.Types.ObjectId,
      ref: "totens",
      required: true,
    },
  },
  {
    timestamps: { createdAt: "criado_em", updatedAt: "alterado_em" },
    collection: "totens_coletas",
  }
);

export const TotenColeta = model<ITotenColeta>("totens_coletas", totenColetaSchema);
