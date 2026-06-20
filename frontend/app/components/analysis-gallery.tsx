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
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 font-semibold text-foreground text-lg">
              <Sparkles size={18} className="text-primary" /> Análises paginadas
            </div>
            <p className="mt-2 text-muted text-xs uppercase tracking-[0.2em]">
              {pagination
                ? `${pagination.totalItems} registros encontrados`
                : "Nenhum registro encontrado"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-muted text-xs">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, (pagination?.page || 1) - 1))}
              disabled={!canGoPrevious || isLoading}
              className="inline-flex items-center gap-1 disabled:opacity-50 px-4 py-2 border border-border hover:border-primary rounded-full font-semibold text-foreground hover:text-primary transition-colors disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} /> Anterior
            </button>
            <span className="bg-background px-4 py-2 border border-border rounded-full font-medium text-xs">
              Página {pagination?.page || 1} de {pagination?.totalPages || 1}
            </span>
            <button
              type="button"
              onClick={() => onPageChange((pagination?.page || 1) + 1)}
              disabled={!canGoNext || isLoading}
              className="inline-flex items-center gap-1 disabled:opacity-50 px-4 py-2 border border-border hover:border-primary rounded-full font-semibold text-foreground hover:text-primary transition-colors disabled:cursor-not-allowed"
            >
              Próxima <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-16 text-muted text-sm">
            <div className="mr-3 border-primary border-b-2 rounded-full w-8 h-8 animate-spin"></div>
            Carregando análises...
          </div>
        ) : analyses.length === 0 ? (
          <div className="flex justify-center items-center py-16 text-muted text-sm">
            Nenhuma análise encontrada no período selecionado.
          </div>
        ) : (
          <div className="items-stretch gap-6 grid sm:grid-cols-2 lg:grid-cols-3">
            {analyses.map((analysis) => (
              <button
                key={`${analysis.imagem}-${analysis.criado_em || analysis.resumo}`}
                type="button"
                onClick={() => setSelectedAnalysis(analysis)}
                className="group bg-card-alt/80 hover:bg-card-alt hover:shadow-lg border border-border hover:border-primary/50 rounded-3xl h-full text-left transition-all duration-200 cursor-pointer"
              >
                <div className="flex flex-col gap-4 p-6 h-full">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="flex flex-wrap gap-2 font-medium text-[10px] text-muted uppercase tracking-[0.15em]">
                        <span className="bg-background px-3 py-1 rounded-full">
                          {analysis.cultura}
                        </span>
                        <span className="bg-background px-3 py-1 rounded-full">
                          {analysis.origem_analise === "manual" ? "Manual" : "Totem"}
                        </span>
                        <span className="bg-background px-3 py-1 rounded-full">
                          {analysis.totem?.nome || "Sem totem"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4 text-xs">
                        <span className="bg-primary/10 px-3 py-1 rounded-full font-medium text-primary">
                          Fase {analysis.fase_crescimento}
                        </span>
                        <span className="bg-primary/10 px-3 py-1 rounded-full font-medium text-primary">
                          Confiança {Math.round(analysis.confianca * 100)}%
                        </span>
                      </div>
                    </div>
                    <div className="bg-background/90 px-3 py-2 rounded-full font-semibold text-[10px] text-foreground uppercase tracking-[0.2em] shrink-0">
                      {getStatusLabel(analysis.analise_status)}
                    </div>
                  </div>

                  <p className="text-muted text-sm line-clamp-3 leading-relaxed">
                    {analysis.resumo || "Sem resumo disponível."}
                  </p>

                  <p className="text-muted text-xs line-clamp-2 leading-relaxed">
                    <span className="font-semibold text-foreground">Justificativa da confiança:</span>{" "}
                    {analysis.justificativa_confianca || "Sem justificativa disponível."}
                  </p>

                  {analysis.sinais_observados.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {analysis.sinais_observados.slice(0, 4).map((signal) => (
                        <span
                          key={signal}
                          className="bg-card px-2 py-1 border border-border rounded-full text-[10px] text-foreground whitespace-nowrap"
                        >
                          {signal}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-2 mt-auto pt-4 border-border/50 border-t text-muted text-xs">
                    <p>
                      {analysis.criado_em
                        ? new Date(analysis.criado_em).toLocaleString("pt-BR")
                        : "Data indisponível"}
                    </p>
                    <span className="font-semibold text-primary transition-transform group-hover:translate-x-1">
                      Ver imagem →
                    </span>
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
            className="bg-card shadow-2xl border border-border rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-between items-center gap-3 px-6 py-5 border-border border-b">
              <div>
                <p className="font-medium text-muted text-xs uppercase tracking-[0.25em]">
                  Pré-visualização da análise
                </p>
                <h3 className="mt-2 font-semibold text-foreground text-lg">
                  {selectedAnalysis.totem?.nome ||
                    (selectedAnalysis.origem_analise === "manual"
                      ? "Análise manual"
                      : "Análise do totem")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAnalysis(null)}
                className="px-4 py-2 border border-border hover:border-red-400 rounded-full font-semibold text-foreground hover:text-red-500 text-sm transition-colors"
              >
                Fechar
              </button>
            </div>

            <div className="gap-0 grid lg:grid-cols-[1.2fr_0.8fr] h-[calc(90vh-4.5rem)] overflow-hidden">
              <div className="flex justify-center items-center bg-black p-6">
                <img
                  src={buildImageUrl(selectedAnalysis.imagem)}
                  alt="Imagem da análise selecionada"
                  className="rounded-lg w-full max-h-full object-contain"
                />
              </div>

              <div className="space-y-6 bg-card-alt/30 p-6 overflow-auto">
                <div>
                  <p className="mb-3 font-medium text-muted text-xs uppercase tracking-[0.2em]">
                    Classificação
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-background px-3 py-2 border border-border rounded-full font-medium text-foreground text-xs">
                      {selectedAnalysis.cultura}
                    </span>
                    <span className="bg-background px-3 py-2 border border-border rounded-full font-medium text-foreground text-xs">
                      {selectedAnalysis.origem_analise === "manual" ? "Manual" : "Totem"}
                    </span>
                    <span className="bg-background px-3 py-2 border border-border rounded-full font-medium text-foreground text-xs">
                      {selectedAnalysis.analise_status}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="mb-3 font-medium text-muted text-xs uppercase tracking-[0.2em]">
                    Indicadores
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-primary/15 px-3 py-2 rounded-full font-medium text-primary text-xs">
                      Fase {selectedAnalysis.fase_crescimento}
                    </span>
                    <span className="bg-primary/15 px-3 py-2 rounded-full font-medium text-primary text-xs">
                      Confiança {Math.round(selectedAnalysis.confianca * 100)}%
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <p className="font-medium text-muted text-xs uppercase tracking-[0.2em]">
                    Informações
                  </p>
                  <div className="space-y-3 text-muted text-sm">
                    <p>
                      <span className="block mb-1 font-semibold text-foreground">Totem:</span>
                      {selectedAnalysis.totem?.nome || "Sem totem"}
                    </p>
                    <p>
                      <span className="block mb-1 font-semibold text-foreground">Data:</span>
                      {selectedAnalysis.criado_em
                        ? new Date(selectedAnalysis.criado_em).toLocaleString("pt-BR")
                        : "Data indisponível"}
                    </p>
                    <p>
                      <span className="block mb-1 font-semibold text-foreground">Resumo:</span>
                      {selectedAnalysis.resumo || "Sem resumo disponível."}
                    </p>
                    <p>
                      <span className="block mb-1 font-semibold text-foreground">Justificativa da confiança:</span>
                      {selectedAnalysis.justificativa_confianca || "Sem justificativa disponível."}
                    </p>
                  </div>
                </div>

                {selectedAnalysis.sinais_observados.length > 0 && (
                  <div className="pt-2 border-border/50 border-t">
                    <p className="mb-3 font-medium text-muted text-xs uppercase tracking-[0.2em]">
                      Sinais observados
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedAnalysis.sinais_observados.map((signal) => (
                        <span
                          key={signal}
                          className="bg-card-alt px-3 py-2 border border-border rounded-full font-medium text-foreground text-xs"
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
