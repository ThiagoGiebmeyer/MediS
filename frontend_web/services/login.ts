import api from "./api";

export async function login(email: string, password: string) {
  const response = await api.post("user/login", {
    email,
    senha: password
  });
  return response.data;
}
