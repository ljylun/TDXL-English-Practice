"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { History, BarChart3, Trash2, ChevronDown, Download } from "lucide-react";
import React, { useMemo, useCallback } from "react";
import { t, Language, formatDateTime } from "@/lib/i18n";
import { ExamAnalyticsChart } from "@/components/timer/exam-analytics-chart";

export interface StageRecord {
  stageId: number;
  stageName: string;
  duration: number;
  status: "completed" | "skipped" | "not_reached";
  elapsedSeconds: number;
}

export interface ExamHistoryRecord {
  id: number;
  startedAt: string;
  finishedAt: string | null;
  status: string;
  totalDurationSeconds: number;
  stagesJson: string;
  createdAt: string;
}

interface HistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  historyRecords: ExamHistoryRecord[];
  expandedHistoryId: number | null;
  setExpandedHistoryId: (id: number | null) => void;
  deleteConfirmId: number | null;
  setDeleteConfirmId: (id: number | null) => void;
  handleDeleteHistory: (id: number) => void;
  language: Language;
  addToast: (message: string, type: 'stage' | 'warning' | 'complete') => void;
}

export const HistoryDialog = React.memo(function HistoryDialog({
  open,
  onOpenChange,
  historyRecords,
  expandedHistoryId,
  setExpandedHistoryId,
  deleteConfirmId,
  setDeleteConfirmId,
  handleDeleteHistory,
  language,
  addToast,
}: HistoryDialogProps) {
  // Exam statistics computation
  const examStats = useMemo(() => {
    if (historyRecords.length === 0) return null;

    const total = historyRecords.length;
    const completed = historyRecords.filter((r) => r.status === "completed").length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const completedRecords = historyRecords.filter((r) => r.status === "completed");
    const avgTotalTime = completedRecords.length > 0
      ? Math.round(completedRecords.reduce((acc, r) => acc + r.totalDurationSeconds, 0) / completedRecords.length)
      : 0;

    const stageCompletionMap: Record<string, { completed: number; total: number }> = {};
    historyRecords.forEach((record) => {
      try {
        const stages: StageRecord[] = JSON.parse(record.stagesJson);
        stages.forEach((stage) => {
          if (!stageCompletionMap[stage.stageName]) {
            stageCompletionMap[stage.stageName] = { completed: 0, total: 0 };
          }
          stageCompletionMap[stage.stageName].total++;
          if (stage.status === "completed") {
            stageCompletionMap[stage.stageName].completed++;
          }
        });
      } catch {
        // skip malformed records
      }
    });

    let bestStage = "";
    let bestRate = 0;
    Object.entries(stageCompletionMap).forEach(([name, data]) => {
      const rate = data.total > 0 ? data.completed / data.total : 0;
      if (rate > bestRate) {
        bestRate = rate;
        bestStage = name;
      }
    });

    return {
      total,
      completed,
      completionRate,
      avgTotalTime,
      bestStage,
      bestRate: Math.round(bestRate * 100),
      stageCompletionMap,
    };
  }, [historyRecords]);

  // Export CSV handler
  const handleExportCsv = useCallback(async () => {
    try {
      const res = await fetch("/api/exam-history/export?XTransformPort=3000");
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `exam-history-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addToast(t("history.exportSuccess", language), "complete");
      }
    } catch {
      // Gracefully fail
    }
  }, [language, addToast]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="size-5 text-emerald-600" />
            {t("history.title", language)}
            {historyRecords.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="ml-auto h-7 text-xs gap-1.5 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                onClick={handleExportCsv}
              >
                <Download className="size-3" />
                {t("history.exportCsv", language)}
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto min-h-0 -mx-6 px-6">
          {historyRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="size-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <History className="size-8 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t("history.empty", language)}</p>
            </div>
          ) : (
            <div className="space-y-3 pb-2">
              {/* Analytics Chart - Exam Trends */}
              <ExamAnalyticsChart historyRecords={historyRecords} language={language} />

              {/* Statistics Summary */}
              {examStats && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 glass-card">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="size-4 text-emerald-600" />
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{t("history.stats", language)}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">{examStats.total}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{t("history.totalCount", language)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{examStats.completionRate}%</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{t("history.completionRate", language)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">{Math.floor(examStats.avgTotalTime / 60)}:{(examStats.avgTotalTime % 60).toString().padStart(2, "0")}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{t("history.avgDuration", language)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-teal-600 dark:text-teal-400 truncate text-sm" title={examStats.bestStage}>{examStats.bestStage || "—"}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{t("history.bestStage", language)}</div>
                    </div>
                  </div>
                  {/* Stage Completion Bar Chart */}
                  {Object.keys(examStats.stageCompletionMap).length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">{t("history.stageRate", language)}</div>
                      {Object.entries(examStats.stageCompletionMap).map(([name, data]) => {
                        const rate = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
                        return (
                          <div key={name} className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-600 dark:text-slate-300 w-16 truncate text-right shrink-0" title={name}>{name}</span>
                            <div className="flex-1 h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${rate >= 80 ? 'bg-emerald-500' : rate >= 50 ? 'bg-teal-500' : rate >= 30 ? 'bg-amber-400' : 'bg-red-400'}`}
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 w-8 shrink-0">{rate}%</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* History Records List */}
              <div className="space-y-2">
                {historyRecords.map((record) => {
                  const stages: StageRecord[] = (() => {
                    try { return JSON.parse(record.stagesJson); } catch { return []; }
                  })();
                  const isExpanded = expandedHistoryId === record.id;
                  const startedDate = new Date(record.startedAt);
                  const dateStr = formatDateTime(startedDate, language);
                  const durationMin = Math.round(record.totalDurationSeconds / 60);

                  return (
                    <div key={record.id} className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <div className="flex items-center">
                        <button
                          className="flex-1 p-3 flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors min-h-[44px]"
                          onClick={() => setExpandedHistoryId(isExpanded ? null : record.id)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-slate-900 dark:text-white">{dateStr}</span>
                              <Badge variant={record.status === "completed" ? "default" : record.status === "abandoned" ? "secondary" : "outline"} className={
                                record.status === "completed"
                                  ? "bg-emerald-600 text-white text-[10px] px-1.5 py-0"
                                  : record.status === "abandoned"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 text-[10px] px-1.5 py-0"
                                  : "text-[10px] px-1.5 py-0"
                              }>
                                {record.status === "completed" ? t("status.completed", language) : record.status === "abandoned" ? t("status.abandoned", language) : t("status.inProgress", language)}
                              </Badge>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {t("history.durationMin", language)} {durationMin} {t("timer.minutes", language)} · {stages.filter(s => s.status === "completed").length}/{stages.length} {t("history.stagesCompleted", language)}
                            </div>
                          </div>
                          <ChevronDown className={`size-4 text-slate-400 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </button>
                        {/* Delete button */}
                        {deleteConfirmId === record.id ? (
                          <div className="flex items-center gap-1 pr-3 shrink-0">
                            <Button size="sm" variant="destructive" className="h-7 text-xs px-2" onClick={() => handleDeleteHistory(record.id)}>{t("history.delete", language)}</Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setDeleteConfirmId(null)}>{t("history.cancel", language)}</Button>
                          </div>
                        ) : (
                          <Button size="icon" variant="ghost" className="size-8 mr-1 text-slate-400 hover:text-red-500 shrink-0" onClick={() => setDeleteConfirmId(record.id)} aria-label={t("history.delete", language)}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                      {isExpanded && stages.length > 0 && (
                        <div className="border-t border-slate-100 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-800/30">
                          <div className="space-y-1.5">
                            {stages.map((stage) => (
                              <div key={stage.stageId} className="flex items-center gap-2 text-xs">
                                <span className={`size-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${
                                  stage.status === "completed"
                                    ? "bg-emerald-500 text-white"
                                    : stage.status === "skipped"
                                    ? "bg-amber-400 dark:bg-amber-500 text-white"
                                    : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                                }`}>
                                  {stage.status === "completed" ? "✓" : stage.status === "skipped" ? "⏭" : "—"}
                                </span>
                                <span className={`flex-1 ${
                                  stage.status === "completed"
                                    ? "text-emerald-700 dark:text-emerald-400 font-medium"
                                    : stage.status === "skipped"
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-slate-400 dark:text-slate-500"
                                }`}>
                                  {stage.stageName}
                                </span>
                                <span className="text-slate-400 dark:text-slate-500 shrink-0">
                                  {stage.status === "completed"
                                    ? `${stage.duration}${t("timer.minutes", language)}`
                                    : stage.status === "skipped"
                                    ? `${Math.floor(stage.elapsedSeconds / 60)}:${(stage.elapsedSeconds % 60).toString().padStart(2, "0")}/${stage.duration}${t("timer.minutes", language)}`
                                    : `${stage.duration}${t("timer.minutes", language)}`
                                  }
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});
