"use client";

import { useState } from "react";

import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

import { AnalysisItem, AnalysisPagination } from "@/types";

const buildImageUrl = (imagePath: string) => {
  const cleanPath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;
  const ip = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1";
  const port = process.env.NEXT_PUBLIC_API_PORT || 3001;
  return `${ip}:${port}/${cleanPath}`;
};

const getStatusLabel = (status: AnalysisItem["analise_status"]) => {
  switch (status) {
    case "concluida":
      return "Concluída";
    case "processando":
      return "Processando";
    case "erro":
      return "Erro";
    default:
      return "Pendente";
  }
};

type AnalysisGalleryProps = {
  analyses: AnalysisItem[];
  pagination: AnalysisPagination | null;
  isLoading: boolean;
  onPageChange: (page: number) => void;
};

export default function AnalysisGallery({
  analyses,
  pagination,
  isLoading,
  onPageChange,
}: AnalysisGalleryProps) {
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisItem | null>(null);

  const canGoPrevious = Boolean(pagination?.hasPrevious);
  const canGoNext = Boolean(pagination?.hasNext);

  return (
    <>
      <section className="bg-card/80 shadow-lg p-6 border border-border rounded-3xl overflow-hidden glow-panel">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
              <Sparkles size={16} className="text-primary" /> Análises paginadas
            </div>
            <p className="mt-1 text-muted text-xs uppercase tracking-[0.2em]">
              {pagination
                ? `${pagination.totalItems} registros encontrados`
                : "Nenhum registro encontrado"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-muted text-xs">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, (pagination?.page || 1) - 1))}
              disabled={!canGoPrevious || isLoading}
              className="inline-flex items-center gap-1 disabled:opacity-50 px-3 py-2 border border-border hover:border-primary rounded-full font-semibold text-foreground hover:text-primary transition-colors disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} /> Anterior
            </button>
            <span className="bg-background px-3 py-2 border border-border rounded-full">
              Página {pagination?.page || 1} de {pagination?.totalPages || 1}
            </span>
            <button
              type="button"
              onClick={() => onPageChange((pagination?.page || 1) + 1)}
              disabled={!canGoNext || isLoading}
              className="inline-flex items-center gap-1 disabled:opacity-50 px-3 py-2 border border-border hover:border-primary rounded-full font-semibold text-foreground hover:text-primary transition-colors disabled:cursor-not-allowed"
            >
              Próxima <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-14 text-muted text-sm">
            Carregando análises...
          </div>
        ) : analyses.length === 0 ? (
          <div className="flex justify-center items-center py-14 text-muted text-sm">
            Nenhuma análise encontrada no período selecionado.
          </div>
        ) : (
          <div className="items-stretch gap-5 grid md:grid-cols-2 xl:grid-cols-3">
            {analyses.map((analysis) => (
              <button
                key={`${analysis.imagem}-${analysis.criado_em || analysis.resumo}`}
                type="button"
                onClick={() => setSelectedAnalysis(analysis)}
                className="group bg-card-alt/80 hover:bg-card-alt border border-border hover:border-primary/50 rounded-3xl h-full text-left transition-colors cursor-pointer"
              >
                <div className="flex flex-col gap-4 p-5 h-full">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="flex flex-wrap gap-2 text-[11px] text-muted uppercase tracking-[0.15em]">
                        <span className="bg-background px-2 py-1 rounded-full">
                          {analysis.cultura}
                        </span>
                        <span className="bg-background px-2 py-1 rounded-full">
                          {analysis.origem_analise === "manual" ? "Manual" : "Totem"}
                        </span>
                        <span className="bg-background px-2 py-1 rounded-full">
                          {analysis.totem?.nome || "Sem totem"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4 text-xs">
                        <span className="bg-primary/10 px-2 py-1 rounded-full text-primary">
                          Fase {analysis.fase_crescimento}
                        </span>
                        <span className="bg-primary/10 px-2 py-1 rounded-full text-primary">
                          Confiança {Math.round(analysis.confianca * 100)}%
                        </span>
                      </div>
                    </div>
                    <div className="bg-background/90 px-3 py-1 rounded-full font-semibold text-[11px] text-foreground uppercase tracking-[0.2em]">
                      {getStatusLabel(analysis.analise_status)}
                    </div>
                  </div>

                  <p className="text-muted text-sm leading-6">
                    {analysis.resumo || "Sem resumo disponível."}
                  </p>

                  {analysis.sinais_observados.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {analysis.sinais_observados.slice(0, 4).map((signal) => (
                        <span
                          key={signal}
                          className="bg-card px-2 py-1 border border-border rounded-full text-[11px] text-foreground"
                        >
                          {signal}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-2 mt-auto pt-1 text-muted text-xs">
                    <p>
                      {analysis.criado_em
                        ? new Date(analysis.criado_em).toLocaleString("pt-BR")
                        : "Data indisponível"}
                    </p>
                    <span className="font-semibold text-primary">Ver imagem</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedAnalysis && (
        <div
          className="z-50 fixed inset-0 flex justify-center items-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setSelectedAnalysis(null)}
        >
          <div
            className="bg-card shadow-2xl border border-border rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-between items-center gap-3 px-5 py-4 border-border border-b">
              <div>
                <p className="text-muted text-xs uppercase tracking-[0.25em]">
                  Pré-visualização
                </p>
                <h3 className="mt-1 font-semibold text-foreground text-lg">
                  {selectedAnalysis.totem?.nome ||
                    (selectedAnalysis.origem_analise === "manual"
                      ? "Análise manual"
                      : "Análise do totem")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAnalysis(null)}
                className="px-3 py-2 border border-border hover:border-primary rounded-full font-semibold text-foreground hover:text-primary text-sm transition-colors"
              >
                Fechar
              </button>
            </div>

            <div className="gap-0 grid lg:grid-cols-[1.2fr_0.8fr]">
              <div className="flex justify-center items-center bg-black p-4">
                <img
                  src={buildImageUrl(selectedAnalysis.imagem)}
                  alt="Imagem da análise selecionada"
                  className="w-full max-h-[70vh] object-contain"
                />
              </div>

              <div className="p-5 max-h-[70vh] overflow-auto">
                <div className="flex flex-wrap gap-2 text-[11px] text-muted uppercase tracking-[0.15em]">
                  <span className="bg-background px-2 py-1 rounded-full">
                    {selectedAnalysis.cultura}
                  </span>
                  <span className="bg-background px-2 py-1 rounded-full">
                    {selectedAnalysis.origem_analise === "manual" ? "Manual" : "Totem"}
                  </span>
                  <span className="bg-background px-2 py-1 rounded-full">
                    {selectedAnalysis.analise_status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mt-4 text-xs">
                  <span className="bg-primary/10 px-2 py-1 rounded-full text-primary">
                    Fase {selectedAnalysis.fase_crescimento}
                  </span>
                  <span className="bg-primary/10 px-2 py-1 rounded-full text-primary">
                    Confiança {Math.round(selectedAnalysis.confianca * 100)}%
                  </span>
                </div>

                <div className="space-y-3 mt-4 text-muted text-sm">
                  <p>
                    <span className="font-semibold text-foreground">Totem:</span>{" "}
                    {selectedAnalysis.totem?.nome || "Sem totem"}
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Data:</span>{" "}
                    {selectedAnalysis.criado_em
                      ? new Date(selectedAnalysis.criado_em).toLocaleString("pt-BR")
                      : "Data indisponível"}
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Resumo:</span>{" "}
                    {selectedAnalysis.resumo || "Sem resumo disponível."}
                  </p>
                </div>

                {selectedAnalysis.sinais_observados.length > 0 && (
                  <div className="mt-4">
                    <p className="text-muted text-xs uppercase tracking-[0.2em]">
                      Sinais observados
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedAnalysis.sinais_observados.map((signal) => (
                        <span
                          key={signal}
                          className="bg-card-alt px-2 py-1 border border-border rounded-full text-[11px] text-foreground"
                        >
                          {signal}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
