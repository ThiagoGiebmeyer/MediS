"use client";

import { Paperclip, RefreshCcw } from "lucide-react";
import ExportButton from "@/app/components/export-button";
import React from "react";

type ReportsHeaderProps = {
  title?: string;
  subtitle?: string;
  rangeLabel: string;
  filterStart: string;
  filterEnd: string;
  onFilterStartChange: (v: string) => void;
  onFilterEndChange: (v: string) => void;
  onApplyFilter: () => void;
  onClearFilter: () => void;
  onQuickRange: (days: number) => void;
  onRefresh: () => void;
  onExport: () => void;
  exportDisabled?: boolean;
};

export default function ReportsHeader({
  title = "Resumo semanal, indicadores e anomalias",
  subtitle = "O período abaixo é compartilhado com o Dashboard. Alterar aqui atualiza as duas visões.",
  rangeLabel,
  filterStart,
  filterEnd,
  onFilterStartChange,
  onFilterEndChange,
  onApplyFilter,
  onClearFilter,
  onQuickRange,
  onRefresh,
  onExport,
  exportDisabled = false,
}: ReportsHeaderProps) {
  return (
    <section className="bg-card/80 shadow-lg p-6 border border-border rounded-3xl glow-panel">
      <div className="flex sm:flex-row flex-col sm:justify-between sm:items-end gap-6 mb-8">
        <div>
          <p className="text-muted text-xs uppercase font-medium tracking-[0.3em]">Relatórios</p>
          <h2 className="mt-3 font-bold text-foreground text-3xl">{title}</h2>
          <p className="mt-2 max-w-2xl text-muted text-sm leading-relaxed">{subtitle}</p>
        </div>

        <div className="flex flex-wrap gap-3 flex-shrink-0">
          <ExportButton onClick={onExport} disabled={exportDisabled} icon={<Paperclip size={16} />} label={"Exportar PDF"} />
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-2 px-4 py-2 border border-border hover:border-primary rounded-full font-semibold text-foreground hover:text-primary text-sm transition-colors cursor-pointer"
          >
            <RefreshCcw size={16} /> Atualizar
          </button>
        </div>
      </div>

      <div className="gap-4 grid md:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-muted text-xs uppercase tracking-[0.2em]">Data de início</label>
          <input type="date" value={filterStart} onChange={(e) => onFilterStartChange(e.target.value)} className="bg-background px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm font-medium" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-muted text-xs uppercase tracking-[0.2em]">Data de término</label>
          <input type="date" value={filterEnd} onChange={(e) => onFilterEndChange(e.target.value)} className="bg-background px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm font-medium" />
        </div>
        <div className="flex items-end gap-2">
          <button onClick={onApplyFilter} className="flex-1 bg-primary hover:bg-primary-dark px-4 py-3 rounded-full font-bold text-on-primary text-sm transition-colors cursor-pointer">Aplicar</button>
        </div>
        <div className="flex items-end">
          <button onClick={onClearFilter} className="w-full px-4 py-3 border border-border hover:border-primary rounded-full font-semibold text-foreground hover:text-primary text-sm transition-colors cursor-pointer">Limpar</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[7, 30, 90].map((days) => (
          <button key={days} onClick={() => onQuickRange(days)} className="px-4 py-2 border border-border hover:border-primary rounded-full font-semibold text-foreground hover:text-primary text-xs uppercase tracking-[0.1em] transition-colors cursor-pointer">
            Últimos {days} dias
          </button>
        ))}
      </div>
    </section>
  );
}
