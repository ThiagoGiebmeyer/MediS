import api from "../api";
import { ApiResponse, ReportOverview } from "@/types";

type ReportFilter = {
  start?: string;
  end?: string;
};

export async function getReportOverview(
  filters?: ReportFilter,
): Promise<ApiResponse<ReportOverview>> {
  const response = await api.get("totem/reading/report", { params: filters });
  return response.data;
}

export function exportReportPdf(
  report: ReportOverview,
  title = "Relatório MediS",
) {
  if (typeof window === "undefined") return;

  const printWindow = window.open("", "_blank", "width=1200,height=900");
  if (!printWindow) return;

  const styles = `
    <style>
      * { box-sizing: border-box; }
      body { font-family: Arial, sans-serif; margin: 0; padding: 24px; color: #0f172a; background: #fff; }
      h1, h2, h3, p { margin: 0 0 12px 0; }
      .muted { color: #475569; }
      .grid { display: grid; gap: 12px; }
      .grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .card { border: 1px solid #cbd5e1; border-radius: 16px; padding: 16px; }
      .pill { display: inline-block; padding: 4px 10px; border-radius: 999px; background: #e2e8f0; font-size: 12px; margin-right: 6px; margin-bottom: 6px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border-bottom: 1px solid #e2e8f0; padding: 10px 8px; text-align: left; font-size: 12px; vertical-align: top; }
      th { background: #f8fafc; }
      .section { margin-top: 20px; }
      .small { font-size: 12px; }
      @page { size: A4; margin: 16mm; }
    </style>
  `;

  const summaryItems = [
    ["Totens", String(report.summary.totalTotens)],
    ["Leituras", String(report.summary.totalReadings)],
    ["Análises", String(report.summary.totalAnalyses)],
    ["Média Temp.", `${report.summary.avgTemperature.toFixed(1)} °C`],
    ["Média Umid.", `${report.summary.avgHumidity.toFixed(1)} %`],
    ["Anomalias", String(report.summary.anomalyCount)],
  ]
    .map(([label, value]) => `<div class="card"><p class="muted small">${label}</p><h3>${value}</h3></div>`)
    .join("");

  const dailyRows = report.dailySeries
    .map(
      (item) => `
        <tr>
          <td>${item.label}</td>
          <td>${item.totalReadings}</td>
          <td>${item.avgTemperature.toFixed(1)} °C</td>
          <td>${item.avgHumidity.toFixed(1)} %</td>
          <td>${item.minTemperature.toFixed(1)} / ${item.maxTemperature.toFixed(1)}</td>
          <td>${item.minHumidity.toFixed(1)} / ${item.maxHumidity.toFixed(1)}</td>
        </tr>
      `,
    )
    .join("");

  const totemRows = report.totens
    .map(
      (item) => `
        <tr>
          <td>${item.totem.nome}</td>
          <td>${item.totalReadings}</td>
          <td>${item.avgTemperature.toFixed(1)} °C</td>
          <td>${item.avgHumidity.toFixed(1)} %</td>
          <td>${item.anomalyCount}</td>
        </tr>
      `,
    )
    .join("");

  const anomalyRows = report.anomalies
    .map(
      (item) => `
        <tr>
          <td>${item.totem?.nome || "Totem removido"}</td>
          <td>${item.temperatura.toFixed(1)} °C</td>
          <td>${item.umidade.toFixed(1)} %</td>
          <td>${item.criado_em ? new Date(item.criado_em).toLocaleString("pt-BR") : "-"}</td>
          <td>${item.reasons.join(", ")}</td>
        </tr>
      `,
    )
    .join("");

  const html = `
    <html>
      <head>
        <title>${title}</title>
        ${styles}
      </head>
      <body>
        <h1>${title}</h1>
        <p class="muted">Período: ${report.range.start} até ${report.range.end}</p>

        <div class="grid grid-3 section">${summaryItems}</div>

        <div class="section">
          <h2>Evolução diária</h2>
          <table>
            <thead>
              <tr>
                <th>Dia</th>
                <th>Leituras</th>
                <th>Temp. média</th>
                <th>Umid. média</th>
                <th>Temp. mín/máx</th>
                <th>Umid. mín/máx</th>
              </tr>
            </thead>
            <tbody>${dailyRows || `<tr><td colspan="6">Sem dados</td></tr>`}</tbody>
          </table>
        </div>

        <div class="section">
          <h2>Comparativo entre totens</h2>
          <table>
            <thead>
              <tr>
                <th>Totem</th>
                <th>Leituras</th>
                <th>Temp. média</th>
                <th>Umid. média</th>
                <th>Anomalias</th>
              </tr>
            </thead>
            <tbody>${totemRows || `<tr><td colspan="5">Sem dados</td></tr>`}</tbody>
          </table>
        </div>

        <div class="section">
          <h2>Anomalias</h2>
          <table>
            <thead>
              <tr>
                <th>Totem</th>
                <th>Temperatura</th>
                <th>Umidade</th>
                <th>Data</th>
                <th>Motivos</th>
              </tr>
            </thead>
            <tbody>${anomalyRows || `<tr><td colspan="5">Sem anomalias</td></tr>`}</tbody>
          </table>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
}

export function exportPrecipitationPdf(
  measurements: any[],
  title = "Relatório de Precipitação",
) {
  if (typeof window === "undefined") return;

  const printWindow = window.open("", "_blank", "width=1000,height=800");
  if (!printWindow) return;

  const styles = `
    <style>
      * { box-sizing: border-box; }
      body { font-family: Arial, sans-serif; margin: 0; padding: 24px; color: #0f172a; background: #fff; }
      h1, h2, p { margin: 0 0 12px 0; }
      .muted { color: #475569; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border-bottom: 1px solid #e2e8f0; padding: 8px 6px; text-align: left; font-size: 12px; }
      th { background: #f8fafc; }
      @page { size: A4; margin: 16mm; }
    </style>
  `;

  const rows = (measurements || [])
    .map((m) => {
      const date = m.criado_em ? new Date(m.criado_em).toLocaleString("pt-BR") : "-";
      const precip = (m.precipitacao ?? 0).toFixed(2);
      const img = m.imagem || "";
      return `<tr><td>${date}</td><td>${precip} mm</td><td>${img}</td></tr>`;
    })
    .join("");

  const html = `
    <html>
      <head>
        <title>${title}</title>
        ${styles}
      </head>
      <body>
        <h1>${title}</h1>
        <p class="muted">Exportado em: ${new Date().toLocaleString("pt-BR")}</p>
        <div style="margin-top:12px">
          <table>
            <thead>
              <tr>
                <th>Data / Hora</th>
                <th>Precipitação (mm)</th>
                <th>Imagem</th>
              </tr>
            </thead>
            <tbody>
              ${rows || `<tr><td colspan="3">Sem dados</td></tr>`}
            </tbody>
          </table>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
}