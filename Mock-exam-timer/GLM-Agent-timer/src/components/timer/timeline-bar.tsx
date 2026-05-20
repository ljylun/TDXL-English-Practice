"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { EXAM_STAGES, ExamStage } from "@/lib/exam-data";
import React from "react";
import { Language, t } from "@/lib/i18n";

interface TimelineBarProps {
  EXAM_STAGES: ExamStage[];
  timerStatus: string;
  currentStageIndex: number;
  remainingSeconds: number;
  currentTotalDuration: number;
  isStageCompleted: (index: number) => boolean;
  isStageSkipped: (index: number) => boolean;
  currentStage: ExamStage;
  isFinished: boolean;
  language: Language;
}

export const TimelineBar = React.memo(function TimelineBar({
  timerStatus,
  currentStageIndex,
  remainingSeconds,
  currentTotalDuration,
  isStageCompleted,
  isStageSkipped,
  currentStage,
  isFinished,
  language,
}: TimelineBarProps) {
  return (
    <Card className="overflow-hidden card-inner-glow glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="size-4 text-emerald-600" />{t("timeline.title", language)}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <div className="overflow-x-auto -mx-2 px-2">
          {/* Timeline bar */}
          <div className="flex min-w-[500px]">
            {EXAM_STAGES.map((stage, i) => {
              const widthPercent = (stage.duration / currentTotalDuration) * 100;
              const isCurrent = i === currentStageIndex && timerStatus !== "finished" && timerStatus !== "idle";
              const isPast = i < currentStageIndex || (timerStatus === "finished");
              const isCompleted = isStageCompleted(i) || timerStatus === "finished";
              const isSkipped = isStageSkipped(i);
              const displayName = language === "en" ? stage.nameEn : stage.name;

              let bgColor: string;
              let textColor: string;
              let statusIcon: string;

              if (isCurrent) {
                bgColor = "bg-emerald-500";
                textColor = "text-white";
                statusIcon = stage.icon;
              } else if (isCompleted && isPast) {
                bgColor = "bg-emerald-500/80";
                textColor = "text-white";
                statusIcon = "✓";
              } else if (isSkipped) {
                bgColor = "bg-amber-400/80";
                textColor = "text-white";
                statusIcon = "⏭";
              } else if (isPast) {
                bgColor = "bg-slate-300 dark:bg-slate-600";
                textColor = "text-slate-500 dark:text-slate-400";
                statusIcon = "—";
              } else {
                bgColor = "bg-slate-100 dark:bg-slate-800";
                textColor = "text-slate-400 dark:text-slate-500";
                statusIcon = String(stage.id);
              }

              return (
                <div
                  key={stage.id}
                  style={{ width: `${widthPercent}%` }}
                  className={`relative flex flex-col items-center justify-center py-3 ${bgColor} ${isCurrent ? "ring-2 ring-emerald-400 ring-offset-1 dark:ring-offset-slate-900" : ""} transition-all duration-500 ${isCurrent ? "animate-pulse" : ""} ${i > 0 ? "border-l border-white/30 dark:border-slate-900/30" : ""} first:rounded-l-lg last:rounded-r-lg`}
                >
                  <span className={`text-xs sm:text-sm font-bold ${textColor}`}>{statusIcon}</span>
                  <span className={`text-[9px] sm:text-[10px] font-medium ${textColor} truncate max-w-full px-0.5 text-center leading-tight`}>{displayName}</span>
                  <span className={`text-[8px] sm:text-[9px] ${textColor} opacity-75`}>{stage.duration}{t("timeline.minShort", language)}</span>
                </div>
              );
            })}
          </div>

          {/* Progress indicator (caret) */}
          {timerStatus !== "idle" && (
            <div className="relative min-w-[500px]" style={{ height: "12px" }}>
              {(() => {
                const currentStageProgress = currentStage.duration * 60 > 0
                  ? (currentStage.duration * 60 - remainingSeconds) / (currentStage.duration * 60)
                  : 0;
                const prevStagesPercent = EXAM_STAGES.slice(0, currentStageIndex).reduce((acc, s) => acc + (s.duration / currentTotalDuration) * 100, 0);
                const currentStagePercent = (currentStage.duration / currentTotalDuration) * 100;
                const caretPosition = isFinished
                  ? 100
                  : prevStagesPercent + currentStagePercent * currentStageProgress;
                return (
                  <div
                    className="absolute -top-0.5 transition-all duration-1000 ease-linear"
                    style={{ left: `${Math.min(caretPosition, 99)}%`, transform: "translateX(-50%)" }}
                  >
                    <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[7px] border-l-transparent border-r-transparent border-t-emerald-500 dark:border-t-emerald-400" />
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
