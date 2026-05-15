"use client";

import {
  AlertCircle,
  BarChart2,
  Map as MapIcon,
  Paperclip,
  RefreshCcw,
  Sparkles,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { exportReportPdf } from "@/services";
import ReportsHeader from "@/app/components/reports-header";
import { ReportOverview } from "@/types";

type ReportsPanelProps = {
  reportData: ReportOverview | null;
  isLoadingReports: boolean;
  filterStart: string;
  filterEnd: string;
  rangeLabel: string;
  onFilterStartChange: (value: string) => void;
  onFilterEndChange: (value: string) => void;
  onApplyFilter: () => void;
  onClearFilter: () => void;
  onQuickRange: (days: number) => void;
  onRefresh: () => void;
};

export default function ReportsPanel({
  reportData,
  isLoadingReports,
  filterStart,
  filterEnd,
  rangeLabel,
  onFilterStartChange,
  onFilterEndChange,
  onApplyFilter,
  onClearFilter,
  onQuickRange,
  onRefresh,
}: ReportsPanelProps) {
  const handleExport = () => {
    if (!reportData) return;
    exportReportPdf(reportData, `Relatório MediS - ${rangeLabel}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <ReportsHeader
        rangeLabel={rangeLabel}
        filterStart={filterStart}
        filterEnd={filterEnd}
        onFilterStartChange={onFilterStartChange}
        onFilterEndChange={onFilterEndChange}
        onApplyFilter={onApplyFilter}
        onClearFilter={onClearFilter}
        onQuickRange={onQuickRange}
        onRefresh={onRefresh}
        onExport={handleExport}
        exportDisabled={!reportData}
      />

      {isLoadingReports ? (
        <div className="flex justify-center items-center bg-card/80 shadow-lg p-10 border border-border rounded-3xl glow-panel">
          <div className="border-primary-dark border-b-2 rounded-full w-12 h-12 animate-spin" />
        </div>
      ) : reportData ? (
        <>
          <section className="gap-4 grid sm:grid-cols-2 2xl:grid-cols-6 xl:grid-cols-3">
            {[
              { label: "Totens", value: reportData.summary.totalTotens },
              { label: "Leituras", value: reportData.summary.totalReadings },
              { label: "Análises", value: reportData.summary.totalAnalyses },
              { label: "Temp. média", value: `${reportData.summary.avgTemperature.toFixed(1)} °C` },
              { label: "Umid. média", value: `${reportData.summary.avgHumidity.toFixed(1)} %` },
              { label: "Anomalias", value: reportData.summary.anomalyCount },
            ].map((item) => (
              <div key={item.label} className="bg-card/80 shadow-lg p-5 border border-border rounded-3xl glow-panel">
                <p className="text-muted text-sm">{item.label}</p>
                <p className="mt-3 font-semibold text-foreground text-3xl">{item.value}</p>
              </div>
            ))}
          </section>

          <section className="gap-6 grid xl:grid-cols-2">
            <div className="bg-card/80 shadow-lg p-5 border border-border rounded-3xl glow-panel">
              <div className="flex items-center gap-2 mb-4 font-semibold text-foreground text-sm">
                <BarChart2 size={16} className="text-primary" /> Evolução diária
              </div>
              {reportData.dailySeries.length === 0 ? (
                <div className="flex justify-center items-center h-70 text-muted text-sm">
                  Sem dados no período selecionado.
                </div>
              ) : (
                <div className="h-70">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={reportData.dailySeries}
                      margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="avgTemperature" stroke="#FACC15" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="avgHumidity" stroke="#13cde6" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-card/80 shadow-lg p-5 border border-border rounded-3xl glow-panel">
              <div className="flex items-center gap-2 mb-4 font-semibold text-foreground text-sm">
                <Sparkles size={16} className="text-primary" /> Indicadores-chave
              </div>
              <div className="gap-3 grid sm:grid-cols-2">
                <div className="bg-card-alt p-4 rounded-2xl">
                  <p className="text-muted text-xs uppercase">Temp. mínima</p>
                  <p className="mt-2 font-semibold text-foreground text-2xl">{reportData.summary.minTemperature.toFixed(1)} °C</p>
                </div>
                <div className="bg-card-alt p-4 rounded-2xl">
                  <p className="text-muted text-xs uppercase">Temp. máxima</p>
                  <p className="mt-2 font-semibold text-foreground text-2xl">{reportData.summary.maxTemperature.toFixed(1)} °C</p>
                </div>
                <div className="bg-card-alt p-4 rounded-2xl">
                  <p className="text-muted text-xs uppercase">Umid. mínima</p>
                  <p className="mt-2 font-semibold text-foreground text-2xl">{reportData.summary.minHumidity.toFixed(1)} %</p>
                </div>
                <div className="bg-card-alt p-4 rounded-2xl">
                  <p className="text-muted text-xs uppercase">Umid. máxima</p>
                  <p className="mt-2 font-semibold text-foreground text-2xl">{reportData.summary.maxHumidity.toFixed(1)} %</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-card/80 shadow-lg p-5 border border-border rounded-3xl overflow-hidden glow-panel">
            <div className="flex items-center gap-2 mb-4 font-semibold text-foreground text-sm">
              <MapIcon size={16} className="text-primary" /> Comparativo entre totens
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-border border-b text-muted text-left uppercase">
                    <th className="py-3 pr-4">Totem</th>
                    <th className="py-3 pr-4">Leituras</th>
                    <th className="py-3 pr-4">Temp. média</th>
                    <th className="py-3 pr-4">Umid. média</th>
                    <th className="py-3 pr-4">Anomalias</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.totens.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-muted text-center">Sem dados</td>
                    </tr>
                  ) : (
                    reportData.totens.map((item) => (
                      <tr key={item.totem._id} className="border-border border-b last:border-b-0">
                        <td className="py-3 pr-4 font-medium text-foreground">{item.totem.nome}</td>
                        <td className="py-3 pr-4">{item.totalReadings}</td>
                        <td className="py-3 pr-4">{item.avgTemperature.toFixed(1)} °C</td>
                        <td className="py-3 pr-4">{item.avgHumidity.toFixed(1)} %</td>
                        <td className="py-3 pr-4">{item.anomalyCount}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-card/80 shadow-lg p-5 border border-border rounded-3xl overflow-hidden glow-panel">
            <div className="flex items-center gap-2 mb-4 font-semibold text-foreground text-sm">
              <AlertCircle size={16} className="text-primary" /> Anomalias
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-border border-b text-muted text-left uppercase">
                    <th className="py-3 pr-4">Totem</th>
                    <th className="py-3 pr-4">Temperatura</th>
                    <th className="py-3 pr-4">Umidade</th>
                    <th className="py-3 pr-4">Data</th>
                    <th className="py-3 pr-4">Motivos</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.anomalies.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-muted text-center">Nenhuma anomalia no período.</td>
                    </tr>
                  ) : (
                    reportData.anomalies.slice(0, 10).map((item, index) => (
                      <tr key={`${item.imagem}-${index}`} className="border-border border-b last:border-b-0">
                        <td className="py-3 pr-4 font-medium text-foreground">{item.totem?.nome || "Totem removido"}</td>
                        <td className="py-3 pr-4">{item.temperatura.toFixed(1)} °C</td>
                        <td className="py-3 pr-4">{item.umidade.toFixed(1)} %</td>
                        <td className="py-3 pr-4">{item.criado_em ? new Date(item.criado_em).toLocaleString("pt-BR") : "-"}</td>
                        <td className="py-3 pr-4">{item.reasons.join(", ")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <div className="bg-card/80 shadow-lg p-10 border border-border rounded-3xl text-center glow-panel">
          <p className="font-semibold text-foreground text-lg">Nenhum relatório disponível</p>
          <p className="mt-2 text-muted text-sm">Aplique um período válido para carregar os dados.</p>
        </div>
      )}

    </div>
  );
}
