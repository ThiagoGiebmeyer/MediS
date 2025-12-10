import api from "../api";

export async function getDashboardData() {
  const response = await api.get("totem/reading/", {});
  return response.data.data;
}
