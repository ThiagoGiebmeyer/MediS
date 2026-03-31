import { Schema, model } from "mongoose";

export interface IUsuario {
  nome: string;
  sobrenome: string;
  email: string;
  senha: string;
  criado_em?: Date;
  alterado_em?: Date;
}

const usuarioSchema = new Schema<IUsuario>(
  {
    nome: {
      type: String,
      required: true,
    },
    sobrenome: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    senha: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: { createdAt: "criado_em", updatedAt: "alterado_em" },
  }
);

export const Usuario = model<IUsuario>("usuarios", usuarioSchema);
