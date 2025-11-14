import { Schema, model, Types } from "mongoose";

export interface ITotenColeta {
  temperatura: number;
  umidade: number;
  imagem: string;
  estagio?: string;
  data_coleta?: string;
  hora_coleta?: string;
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
    data_coleta: {
      type: String,
      required: true,
    },
    hora_coleta: {
      type: String,
      required: true,
    },
    totem_id: {
      type: Schema.Types.ObjectId,
      ref: "totens",
      required: true,
    },
  },
  {
    timestamps: { createdAt: "criado_em", updatedAt: "alterado_em" },
  }
);

export const TotenColeta = model<ITotenColeta>("totens_coletas", totenColetaSchema);
