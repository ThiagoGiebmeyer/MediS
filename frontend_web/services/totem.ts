import api from "./api";
import { ApiResponse, NewTotemDTO, Totem } from "@/types";

export async function postNewTotem(
  params: NewTotemDTO
): Promise<Totem[]> {
  const response = await api.post<ApiResponse<Totem[]>>("totem/", params);

  return response.data.data;
}
