import { Totem } from "./totem";

export interface ReportDateRange {
  start: string;
  end: string;
}

export interface ReportSummary {
  totalTotens: number;
  totalReadings: number;
  totalAnalyses: number;
  avgTemperature: number;
  avgHumidity: number;
  minTemperature: number;
  maxTemperature: number;
  minHumidity: number;
  maxHumidity: number;
  anomalyCount: number;
}

export interface ReportDailySeriesItem {
  date: string;
  label: string;
  totalReadings: number;
  avgTemperature: number;
  minTemperature: number;
  maxTemperature: number;
  avgHumidity: number;
  minHumidity: number;
  maxHumidity: number;
}

export interface ReportTotemItem {
  totem: Totem;
  totalReadings: number;
  avgTemperature: number;
  minTemperature: number;
  maxTemperature: number;
  avgHumidity: number;
  minHumidity: number;
  maxHumidity: number;
  anomalyCount: number;
  lastReading: {
    temperatura: number;
    umidade: number;
    criado_em: string | null;
    imagem: string;
  } | null;
}

export interface ReportAnomalyItem {
  totem: Totem | null;
  temperatura: number;
  umidade: number;
  criado_em: string | null;
  imagem: string;
  reasons: string[];
}

export interface ReportOverview {
  range: ReportDateRange;
  summary: ReportSummary;
  dailySeries: ReportDailySeriesItem[];
  totens: ReportTotemItem[];
  anomalies: ReportAnomalyItem[];
}