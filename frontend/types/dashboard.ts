import { Totem } from "./totem";

export interface Measurement {
  temperatura: number;
  umidade: number;
  criado_em: string;
}

export interface DashboardDataItem {
  totem: Totem;
  coletas: Measurement[];
}