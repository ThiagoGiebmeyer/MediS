import { Schema, model, Types } from "mongoose";

export interface IAnaliseImagem {
  imagem: string;
  cultura?: string;
  origem_analise?: "manual" | "totem";
  prompt_versao?: string;
  totem_coleta_id?: Types.ObjectId;
  totem_id?: Types.ObjectId;
  fase_crescimento?: string;
  confianca?: number;
  resumo?: string;
  sinais_observados?: string[];
  modelo?: string;
  resposta_bruta?: string;
  analise_status?: "pendente" | "processando" | "concluida" | "erro";
  analise_erro?: string;
  analise_tentativas?: number;
  analise_iniciada_em?: Date;
  analise_finalizada_em?: Date;
  analise_proxima_tentativa_em?: Date | null;
  usuario_id?: Types.ObjectId;
  criado_em?: Date;
  alterado_em?: Date;
}

const analiseImagemSchema = new Schema<IAnaliseImagem>(
  {
    imagem: {
      type: String,
      required: true,
    },
    cultura: {
      type: String,
      required: false,
      default: "soja",
      index: true,
    },
    origem_analise: {
      type: String,
      enum: ["manual", "totem"],
      required: false,
      index: true,
    },
    prompt_versao: {
      type: String,
      required: false,
    },
    totem_coleta_id: {
      type: Schema.Types.ObjectId,
      ref: "totens_coletas",
      required: false,
      index: true,
    },
    totem_id: {
      type: Schema.Types.ObjectId,
      ref: "totens",
      required: false,
      index: true,
    },
    fase_crescimento: {
      type: String,
      required: false,
      default: "desconhecido",
    },
    confianca: {
      type: Number,
      required: false,
    },
    resumo: {
      type: String,
      required: false,
    },
    sinais_observados: {
      type: [String],
      default: [],
    },
    modelo: {
      type: String,
      required: false,
    },
    resposta_bruta: {
      type: String,
      required: false,
    },
    analise_status: {
      type: String,
      enum: ["pendente", "processando", "concluida", "erro"],
      default: "pendente",
      index: true,
    },
    analise_erro: {
      type: String,
      required: false,
    },
    analise_tentativas: {
      type: Number,
      default: 0,
    },
    analise_iniciada_em: {
      type: Date,
      required: false,
    },
    analise_finalizada_em: {
      type: Date,
      required: false,
    },
    analise_proxima_tentativa_em: {
      type: Date,
      required: false,
      default: null,
      index: true,
    },
    usuario_id: {
      type: Schema.Types.ObjectId,
      ref: "usuarios",
      required: false,
    },
  },
  {
    timestamps: { createdAt: "criado_em", updatedAt: "alterado_em" },
  }
);

analiseImagemSchema.index({ analise_status: 1, criado_em: 1 });
analiseImagemSchema.index({ totem_coleta_id: 1, analise_status: 1 });

export const AnaliseImagem = model<IAnaliseImagem>("analises_imagens", analiseImagemSchema);
