import { Totem } from "./totem";

export interface AnalysisItem {
  imagem: string;
  totem: Totem | null;
  cultura: string;
  origem_analise: "manual" | "totem";
  fase_crescimento: string;
  confianca: number;
  justificativa_confianca: string;
  resumo: string;
  sinais_observados: string[];
  modelo: string;
  prompt_versao: string;
  analise_status: "pendente" | "processando" | "concluida" | "erro";
  analise_erro: string | null;
  criado_em: string | null;
  analise_finalizada_em: string | null;
}

export interface AnalysisPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginatedAnalysesResponse {
  items: AnalysisItem[];
  pagination: AnalysisPagination;
}
