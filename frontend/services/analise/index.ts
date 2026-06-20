import api from "@/services/api";
import { ApiResponse, PaginatedAnalysesResponse } from "@/types";

interface AnaliseResponse {
  error: boolean;
  data?: {
    fase_crescimento: string;
    confianca: number;
    justificativa_confianca: string;
    timestamp: string;
  };
  messageError?: string;
}

type AnalysesFilter = {
  start?: string;
  end?: string;
  page?: number;
  limit?: number;
};

export async function getAnalysesPage(
  filters?: AnalysesFilter,
): Promise<ApiResponse<PaginatedAnalysesResponse>> {
  const response = await api.get("totem/reading/analises", {
    params: filters,
  });

  return response.data;
}

export const analisarImagem = async (
  file: File
): Promise<AnaliseResponse> => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      return {
        error: true,
        messageError: "Você precisa estar autenticado.",
      };
    }

    const formData = new FormData();
    formData.append("image", file);

    const response = await api.post(
      "analise",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("Resposta da análise:", response.data);

    return response.data;
  } catch (err: any) {
    console.error("Erro ao analisar imagem:", err);
    console.error("Status:", err.response?.status);
    console.error("Dados do erro:", err.response?.data);
    return {
      error: true,
      messageError:
        err.response?.data?.messageError ||
        "Inconsistência ao analisar imagem.",
    };
  }
};
