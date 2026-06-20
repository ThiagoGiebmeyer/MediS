import api from "../api";
import { ApiResponse } from "@/types";
import { NewTotemDTO, Totem } from "@/types/totem";

export async function getTotems(): Promise<ApiResponse<Totem[]>> {
  const response = await api.get<ApiResponse<Totem[]>>("totem/");
  return response.data;
}

export async function getTotemById(totemId: string): Promise<ApiResponse<Totem[]>> {
  const response = await api.get<ApiResponse<Totem[]>>(`totem/${totemId}`);
  return response.data;
}

export async function postNewTotem(params: NewTotemDTO): Promise<Totem[]> {
  const response = await api.post<ApiResponse<Totem[]>>("totem/", params);

  return response.data.data;
}

export async function updateTotem(
  totemId: string,
  params: Partial<NewTotemDTO>,
): Promise<Totem[]> {
  const response = await api.patch<ApiResponse<Totem[]>>(`totem/${totemId}`, params);

  return response.data.data;
}

export async function deleteTotem(totemId: string): Promise<Totem[]> {
  const response = await api.delete<ApiResponse<Totem[]>>(`totem/${totemId}`);

  return response.data.data;
}
