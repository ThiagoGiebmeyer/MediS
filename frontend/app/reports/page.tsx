"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Filter, RefreshCcw } from "lucide-react";
import toast from "react-hot-toast";

import ReportsPanel from "@/app/components/reports-panel";
import { getReportOverview, exportReportPdf } from "@/services";
import { ReportOverview } from "@/types";

const getDefaultRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
};

export default function ReportsPage() {
  const defaultRange = useMemo(() => getDefaultRange(), []);
  const [filterStart, setFilterStart] = useState(defaultRange.start);
  const [filterEnd, setFilterEnd] = useState(defaultRange.end);
  const [appliedStart, setAppliedStart] = useState(defaultRange.start);
  const [appliedEnd, setAppliedEnd] = useState(defaultRange.end);
  const [reportData, setReportData] = useState<ReportOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const rangeLabel = `${appliedStart} → ${appliedEnd}`;

  const loadReport = async (start?: string, end?: string) => {
    setIsLoading(true);
    try {
      const response = await getReportOverview({ start, end });
      if (response.error) {
        toast.error(response.messageError || "Não foi possível carregar o relatório.");
        setReportData(null);
        return;
      }

      setReportData(response.data || null);
    } catch {
      toast.error("Falha ao carregar o relatório.");
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport(appliedStart, appliedEnd);
  }, []);

  const handleApply = () => {
    setAppliedStart(filterStart);
    setAppliedEnd(filterEnd);
    loadReport(filterStart, filterEnd);
  };

  const handleClear = () => {
    const range = getDefaultRange();
    setFilterStart(range.start);
    setFilterEnd(range.end);
    setAppliedStart(range.start);
    setAppliedEnd(range.end);
    loadReport(range.start, range.end);
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
    loadReport(range.start, range.end);
  };

  const handleRefresh = () => loadReport(appliedStart, appliedEnd);

  const handleExport = () => {
    if (!reportData) return;
    exportReportPdf(reportData, `Relatório MediS - ${rangeLabel}`);
  };

  return (
    <div className="bg-background min-h-screen text-foreground">
      <div className="px-4 sm:px-6 lg:px-8 py-6 w-full min-h-screen">
    


        <div className="mt-6">
          <ReportsPanel
            reportData={reportData}
            isLoadingReports={isLoading}
            filterStart={filterStart}
            filterEnd={filterEnd}
            rangeLabel={rangeLabel}
            onFilterStartChange={setFilterStart}
            onFilterEndChange={setFilterEnd}
            onApplyFilter={handleApply}
            onClearFilter={handleClear}
            onQuickRange={handleQuickRange}
            onRefresh={handleRefresh}
          />
        </div>
      </div>
    </div>
  );
}
