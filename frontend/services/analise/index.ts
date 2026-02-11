import api from "@/services/api";

interface AnaliseResponse {
  error: boolean;
  data?: {
    fase_crescimento: string;
    confianca: number;
    timestamp: string;
  };
  messageError?: string;
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
