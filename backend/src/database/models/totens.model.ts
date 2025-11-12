import { Schema, model, Types } from "mongoose";

export interface IToten {
  nome: string;
  latitude?: string;
  longitude?: string;
  usuario_id: Types.ObjectId;
  criado_em?: Date;
  alterado_em?: Date;
}

const totenSchema = new Schema<IToten>(
  {
    nome: {
      type: String,
      required: true,
    },
    latitude: {
      type: String,
      required: false,
    },
    longitude: {
      type: String,
      required: false,
    },
    usuario_id: {
      type: Schema.Types.ObjectId,
      ref: "usuarios",
      required: true,
    },
  },
  {
    timestamps: { createdAt: "criado_em", updatedAt: "alterado_em" },
    collection: "totens",
  }
);

export const Toten = model<IToten>("totens", totenSchema);
