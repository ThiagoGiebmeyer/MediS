import api from "./api";

export async function register(email: string, password: string, nome: string, sobrenome: string) {
  const response = await api.post("user/register", {
    email,
    senha: password,
    nome,
    sobrenome
  });
  return response.data;
}
