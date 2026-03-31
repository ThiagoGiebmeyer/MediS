import api from "../api";
import { ApiResponse, DashboardDataItem } from "@/types";

type DashboardFilter = {
  start?: string;
  end?: string;
};

export async function getDashboardData(
  filters?: DashboardFilter
): Promise<ApiResponse<DashboardDataItem[]>> {
  const response = await api.get("totem/reading/", { params: filters });
  return response.data;
}
