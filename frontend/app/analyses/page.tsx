"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, Filter, RefreshCcw, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

import AnaliseImagemModal from "@/app/components/analise-imagem-modal";
import AnalysisGallery from "@/app/components/analysis-gallery";
import { getAnalysesPage } from "@/services/analise";
import {
  AnalysisItem,
  AnalysisPagination,
  PaginatedAnalysesResponse,
} from "@/types";

const PAGE_SIZE = 6;

const getDefaultRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
};

export default function AnalysesPage() {
  const defaultRange = useMemo(() => getDefaultRange(), []);
  const [filterStart, setFilterStart] = useState(defaultRange.start);
  const [filterEnd, setFilterEnd] = useState(defaultRange.end);
  const [appliedStart, setAppliedStart] = useState(defaultRange.start);
  const [appliedEnd, setAppliedEnd] = useState(defaultRange.end);
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [pagination, setPagination] = useState<AnalysisPagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadAnalyses = async (
    page = 1,
    start = appliedStart,
    end = appliedEnd,
  ) => {
    setIsLoading(true);
    try {
      const response = await getAnalysesPage({
        start,
        end,
        page,
        limit: PAGE_SIZE,
      });
      if (response.error) {
        toast.error(
          response.messageError || "Não foi possível carregar as análises.",
        );
        setAnalyses([]);
        setPagination(null);
        return;
      }

      const data = response.data as PaginatedAnalysesResponse | undefined;
      setAnalyses(data?.items || []);
      setPagination(data?.pagination || null);
    } catch {
      toast.error("Falha ao carregar análises.");
      setAnalyses([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyses();
  }, []);

  const handleApply = () => {
    setAppliedStart(filterStart);
    setAppliedEnd(filterEnd);
    loadAnalyses(1, filterStart, filterEnd);
  };

  const handleClear = () => {
    const range = getDefaultRange();
    setFilterStart(range.start);
    setFilterEnd(range.end);
    setAppliedStart(range.start);
    setAppliedEnd(range.end);
    loadAnalyses(1, range.start, range.end);
  };

  const handleQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    const range = {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
    };

    setFilterStart(range.start);
    setFilterEnd(range.end);
    setAppliedStart(range.start);
    setAppliedEnd(range.end);
    loadAnalyses(1, range.start, range.end);
  };

  return (
    <div className="bg-background min-h-screen text-foreground">
      <div className="px-4 sm:px-6 lg:px-8 py-6 w-full min-h-screen">
        <section className="bg-card/80 shadow-lg p-6 border border-border rounded-3xl glow-panel">
          <div className="flex lg:flex-row flex-col lg:justify-between lg:items-end gap-6">
            <div className="max-w-3xl">
              <p className="text-[10px] text-muted uppercase tracking-[0.35em]">
                Análises
              </p>
              <h1 className="mt-3 font-semibold text-foreground text-3xl sm:text-4xl">
                Tela de análises de IA
              </h1>
            
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 bg-linear-to-r from-purple-600 hover:from-purple-700 to-pink-600 hover:to-pink-700 px-4 py-2 rounded-full font-semibold text-on-primary text-sm transition-colors cursor-pointer"
                title="Análise com IA"
              >
                <Sparkles size={16} /> MediS IA
              </button>
              <button
                type="button"
                onClick={() => loadAnalyses(pagination?.page || 1)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-border hover:border-primary rounded-full font-semibold text-foreground hover:text-primary text-sm transition-colors"
              >
                <RefreshCcw size={16} /> Atualizar
              </button>
            </div>
          </div>

          <div className="gap-4 grid md:grid-cols-3 mt-8">
            <div className="bg-card/80 p-5 border border-border rounded-3xl">
              <p className="text-muted text-xs uppercase tracking-[0.2em]">
                Período
              </p>
              <p className="mt-3 font-semibold text-foreground text-sm">
                {appliedStart} → {appliedEnd}
              </p>
            </div>
            <div className="bg-card/80 p-5 border border-border rounded-3xl">
              <p className="text-muted text-xs uppercase tracking-[0.2em]">
                Página atual
              </p>
              <p className="mt-3 font-semibold text-foreground text-sm">
                {pagination?.page || 1} de {pagination?.totalPages || 1}
              </p>
            </div>
            <div className="bg-card/80 p-5 border border-border rounded-3xl">
              <p className="text-muted text-xs uppercase tracking-[0.2em]">
                Itens exibidos
              </p>
              <p className="mt-3 font-semibold text-foreground text-sm">
                {analyses.length}
              </p>
            </div>
          </div>
        </section>

        <section className="bg-card/80 shadow-lg mt-6 p-6 border border-border rounded-3xl glow-panel">
          <div className="flex flex-wrap gap-3 mb-6">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => handleQuickRange(days)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-border hover:border-primary rounded-full font-semibold text-foreground hover:text-primary text-xs uppercase tracking-[0.1em] transition-colors"
              >
                <Filter size={14} /> Últimos {days} dias
              </button>
            ))}
          </div>

          <div className="gap-4 grid md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-2">
              <label className="text-muted text-xs uppercase tracking-[0.2em]">
                Data de início
              </label>
              <input
                type="date"
                value={filterStart}
                onChange={(event) => setFilterStart(event.target.value)}
                className="bg-background px-4 py-3 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-muted text-xs uppercase tracking-[0.2em]">
                Data de término
              </label>
              <input
                type="date"
                value={filterEnd}
                onChange={(event) => setFilterEnd(event.target.value)}
                className="bg-background px-4 py-3 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleApply}
                className="bg-primary hover:bg-primary-dark px-4 py-3 rounded-full w-full font-semibold text-on-primary text-sm transition-colors"
              >
                Aplicar filtro
              </button>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-3 border border-border hover:border-primary rounded-full w-full font-semibold text-foreground hover:text-primary text-sm transition-colors"
              >
                Limpar
              </button>
            </div>
          </div>
        </section>

        <div className="mt-6">
          <AnalysisGallery
            analyses={analyses}
            pagination={pagination}
            isLoading={isLoading}
            onPageChange={(page) => loadAnalyses(page)}
          />
        </div>
      </div>

      <AnaliseImagemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAnalysisComplete={() => loadAnalyses(pagination?.page || 1)}
      />
    </div>
  );
}
