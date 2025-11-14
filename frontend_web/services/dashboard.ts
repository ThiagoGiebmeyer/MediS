import api from "./api";

export async function getDashboardData(token: string) {
  const response = await api.get("dashboard/", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data.data;
}
