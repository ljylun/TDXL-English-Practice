"use client";

import React from "react";
import { AlertCircle, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { EXAM_STAGES } from "@/lib/exam-data";
import { getTemplateById } from "@/lib/exam-templates";
import { t, Language } from "@/lib/i18n";

interface SavedExamState {
  currentStageIndex: number;
  remainingSeconds: number;
  status: "running" | "paused";
  startedAt: number;
  completedStages: number[];
  practiceMode: boolean;
  practiceElapsedSeconds: number;
  templateId: string;
  timestamp: number;
}

interface ResumeDialogProps {
  open: boolean;
  savedState: SavedExamState | null;
  onResume: (state: SavedExamState) => void;
  onDiscard: () => void;
  language: Language;
}

function formatSavedTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getTimeSince(timestamp: number, language: Language): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return language === "en" ? "just now" : "刚刚";
  if (diffMin < 60) return language === "en" ? `${diffMin} min ago` : `${diffMin}分钟前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return language === "en" ? `${diffHour} hr ago` : `${diffHour}小时前`;
  const diffDay = Math.floor(diffHour / 24);
  return language === "en" ? `${diffDay} day${diffDay > 1 ? "s" : ""} ago` : `${diffDay}天前`;
}

function getStageName(savedState: SavedExamState, language: Language): { name: string; icon: string; duration: number } {
  const template = getTemplateById(savedState.templateId);
  if (template && savedState.currentStageIndex < template.stages.length) {
    const stage = template.stages[savedState.currentStageIndex];
    return { name: language === "en" ? stage.nameEn : stage.name, icon: stage.icon, duration: stage.duration };
  }
  if (savedState.currentStageIndex < EXAM_STAGES.length) {
    const stage = EXAM_STAGES[savedState.currentStageIndex];
    return { name: language === "en" ? stage.nameEn : stage.name, icon: stage.icon, duration: stage.duration };
  }
  return { name: language === "en" ? `Stage ${savedState.currentStageIndex + 1}` : `第${savedState.currentStageIndex + 1}阶段`, icon: "📋", duration: 0 };
}

export const ResumeDialog = React.memo(function ResumeDialog({
  open,
  savedState,
  onResume,
  onDiscard,
  language,
}: ResumeDialogProps) {
  if (!savedState) return null;

  const stageInfo = getStageName(savedState, language);
  const remaining = savedState.remainingSeconds;
  const timeSince = getTimeSince(savedState.timestamp, language);

  const now = Date.now();
  const elapsedSinceSave = Math.floor((now - savedState.timestamp) / 1000);
  const adjustedRemaining = savedState.status === "running"
    ? Math.max(0, savedState.remainingSeconds - elapsedSinceSave)
    : savedState.remainingSeconds;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onDiscard(); }}>
      <DialogContent className="resume-dialog-glass rounded-2xl max-w-md w-[90%] p-0 overflow-hidden border-emerald-200/30 dark:border-emerald-800/30">
        <DialogHeader className="sr-only">
          <DialogTitle>{t("resume.title", language)}</DialogTitle>
          <DialogDescription>{t("resume.subtitle", language)}</DialogDescription>
        </DialogHeader>
        
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-center mb-4">
            <div className="resume-info-icon size-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200/40 dark:shadow-amber-900/30">
              <AlertCircle className="size-7 text-white" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-slate-800 dark:text-white text-center mb-1">
            {t("resume.title", language)}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-5">
            {savedState.status === "paused"
              ? t("resume.subtitlePaused", language)
              : t("resume.subtitle", language)}
          </p>

          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 mb-6 space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">{t("resume.currentStage", language)}</span>
              <span className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <span>{stageInfo.icon}</span>
                <span>{stageInfo.name}</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">{t("resume.remainingTime", language)}</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400 timer-digits">
                {adjustedRemaining <= 0 && savedState.status === "running"
                  ? t("resume.overtime", language)
                  : formatSavedTime(adjustedRemaining)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">{t("resume.savedAt", language)}</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">{timeSince}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">{t("resume.examStatus", language)}</span>
              <span className={`font-medium ${savedState.status === "paused" ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                {savedState.status === "paused" ? t("status.paused", language) : t("status.running", language)}
              </span>
            </div>
            {savedState.practiceMode && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">{t("resume.practiceMode", language)}</span>
                <span className="font-medium text-amber-600 dark:text-amber-400">{t("resume.enabled", language)}</span>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500 text-center mb-5">
            {savedState.status === "paused"
              ? t("resume.pausedNotice", language)
              : adjustedRemaining > 0
                ? t("resume.runningNotice", language)
                : t("resume.overtimeNotice", language)}
          </p>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => onResume(savedState)}
              className="w-full h-12 text-base font-semibold gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-200/40 dark:shadow-emerald-900/30 active:scale-[0.98] transition-all"
            >
              <Play className="size-4" />
              {t("resume.resumeBtn", language)}
            </Button>
            <Button
              variant="outline"
              onClick={onDiscard}
              className="w-full h-10 text-sm font-medium gap-2 rounded-xl border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 hover:border-red-300 dark:hover:border-red-700 transition-all"
            >
              <Trash2 className="size-3.5" />
              {t("resume.discardBtn", language)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

export type { SavedExamState };
