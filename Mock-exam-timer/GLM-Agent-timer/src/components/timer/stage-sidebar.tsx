"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Clock, ChevronRight } from "lucide-react";
import { EXAM_STAGES } from "@/lib/exam-data";
import { formatTime } from "@/lib/time-utils";
import React, { useState } from "react";
import { Language, t } from "@/lib/i18n";

interface StageSidebarProps {
  timerStatus: string;
  currentStageIndex: number;
  remainingSeconds: number;
  isStageCompleted: (index: number) => boolean;
  isStageSkipped: (index: number) => boolean;
  isFinished: boolean;
  isWarning: boolean;
  isUrgent: boolean;
  stageProgress: number;
  currentTotalDuration: number;
  ttsEnabled: boolean;
  soundEnabled: boolean;
  celebratingStageIndex: number | null;
  handleStageClick: (index: number) => void;
  language: Language;
}

export const StageSidebar = React.memo(function StageSidebar({
  timerStatus,
  currentStageIndex,
  remainingSeconds,
  isStageCompleted,
  isStageSkipped,
  isFinished,
  isWarning,
  isUrgent,
  stageProgress,
  currentTotalDuration,
  ttsEnabled,
  soundEnabled,
  celebratingStageIndex,
  handleStageClick,
  language,
}: StageSidebarProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const prevStageIndexRef = React.useRef(currentStageIndex);
  const [stageTransitionKey, setStageTransitionKey] = React.useState(0);

  // Track stage changes for transition animation
  React.useEffect(() => {
    if (currentStageIndex !== prevStageIndexRef.current) {
      setStageTransitionKey((k) => k + 1);
    }
    prevStageIndexRef.current = currentStageIndex;
  }, [currentStageIndex]);

  return (
    <div className="lg:col-span-1">
      <Card className="sticky top-[140px] card-inner-glow glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="size-4 text-emerald-600" />{t("sidebar.title", language)}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-0 relative">
            {/* Step connector lines */}
            {EXAM_STAGES.map((stage, i) => {
              if (i === EXAM_STAGES.length - 1) return null;
              const isPast = i < currentStageIndex;
              const isCurrent = i === currentStageIndex;
              const isCompleted = isStageCompleted(i);
              let connectorClass = "step-connector-upcoming";
              if (isPast && isCompleted) {
                connectorClass = "step-connector-completed";
              } else if (isCurrent) {
                connectorClass = "step-connector-current";
              }
              return (
                <div
                  key={`connector-${stage.id}`}
                  className={`absolute left-[13px] step-connector-line-segment ${connectorClass}`}
                  style={{
                    top: `${i * 56 + 28}px`,
                    height: "28px",
                    width: "2px",
                  }}
                />
              );
            })}

            {EXAM_STAGES.map((stage, i) => {
              const isCurrent = i === currentStageIndex;
              const isPast = i < currentStageIndex;
              const isCompleted = isStageCompleted(i);
              const isSkipped = isStageSkipped(i);
              let stageProgressPct = 0;
              if (isCurrent && timerStatus !== "idle") {
                stageProgressPct = stageProgress;
              } else if (isCompleted) {
                stageProgressPct = 100;
              } else if (isSkipped) {
                stageProgressPct = 30;
              }
              const dotR = 7;
              const dotC = 2 * Math.PI * dotR;
              const dotOffset = dotC * (1 - stageProgressPct / 100);

              const displayName = language === "en" ? stage.nameEn : stage.name;
              const showActiveTransition = isCurrent && stageTransitionKey > 0;

              return (
                <div key={`sidebar-${stage.id}`} className="relative" style={{ minHeight: "56px" }}>
                  <button
                    onClick={() => { if (timerStatus === "idle" || timerStatus === "finished") handleStageClick(i); }}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={`w-full flex items-center gap-2.5 p-2 sm:p-2.5 rounded-lg transition-all text-left active:scale-[0.98] min-h-[44px] sidebar-item-highlight ${celebratingStageIndex === i ? "stage-complete-flash" : ""} ${isCurrent ? `active sidebar-active-gradient ring-1 ring-emerald-500/30 ${timerStatus === "paused" ? "breathing-border" : ""} ${showActiveTransition ? "sidebar-stage-transition" : ""}` : isPast ? "opacity-60 hover:opacity-80" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"} ${timerStatus !== "idle" && timerStatus !== "finished" ? "cursor-default" : "cursor-pointer"}`}
                  >
                    <div className="relative shrink-0">
                      <div className={`size-6 sm:size-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-colors ${isCurrent ? "bg-emerald-500 text-white shadow-md shadow-emerald-200 dark:shadow-emerald-900/40" : isCompleted ? "bg-emerald-500 text-white" : isSkipped ? "bg-amber-400 dark:bg-amber-500 text-white" : isPast ? "bg-slate-300 dark:bg-slate-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
                        {isCompleted ? "✓" : isSkipped ? "⏭" : isPast ? "—" : i + 1}
                      </div>
                      {(isCurrent && timerStatus !== "idle") || isPast ? (
                        <svg className="absolute -top-0.5 -right-0.5 size-3.5" viewBox="0 0 16 16" aria-hidden="true">
                          <circle cx="8" cy="8" r={dotR} fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-200 dark:text-slate-700" strokeDasharray={dotC} strokeDashoffset="0" />
                          <circle cx="8" cy="8" r={dotR} fill="none" stroke="currentColor" strokeWidth="2" className={`sidebar-progress-ring ${isCompleted ? "text-emerald-500" : isSkipped ? "text-amber-400" : isCurrent ? "text-emerald-500" : "text-slate-400"}`} strokeDasharray={dotC} strokeDashoffset={dotOffset} transform="rotate(-90 8 8)" strokeLinecap="round" />
                        </svg>
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs sm:text-sm font-medium truncate ${isCurrent ? "text-emerald-700 dark:text-emerald-400 tracking-wider" : isSkipped ? "text-amber-600 dark:text-amber-400" : isPast ? "text-slate-400 dark:text-slate-500" : "text-slate-700 dark:text-slate-300"} ${isPast && !isSkipped ? "line-through" : ""}`}>
                        {displayName}
                        {isCurrent && timerStatus === "running" && (
                          <span className="sidebar-active-dot" />
                        )}
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 truncate">{stage.duration}{t("timer.minutes", language)} · {language === "en" ? stage.name : stage.nameEn}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      {isCurrent && timerStatus !== "idle" && !isFinished ? (
                        <div className={`text-xs sm:text-sm font-mono font-bold timer-digits ${isWarning ? "text-red-600 dark:text-red-400" : isUrgent ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>{formatTime(remainingSeconds)}</div>
                      ) : isCompleted ? (
                        <span className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-medium">{t("status.completed", language)}</span>
                      ) : isSkipped ? (
                        <span className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 font-medium">{t("status.skipped", language)}</span>
                      ) : isPast ? (
                        <span className="text-[10px] sm:text-xs text-slate-400">—</span>
                      ) : (
                        <span className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">{stage.duration}{t("timer.minutes", language)}</span>
                      )}
                    </div>
                    {isCurrent && <ChevronRight className="size-3 sm:size-4 text-emerald-500 shrink-0" />}
                  </button>

                  {/* Tooltip with stage details on hover */}
                  {hoveredIndex === i && (
                    <div className="absolute left-0 top-full z-30 pointer-events-none mt-1">
                      <div className="sidebar-tooltip-card">
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                          {stage.icon} {displayName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                          <div>{t("sidebar.durationLabel", language)}: {stage.duration}{t("timer.minutes", language)}</div>
                          <div>{t("sidebar.englishName", language)}: {stage.nameEn}</div>
                          {stage.tips && <div className="italic">💡 {stage.tips}</div>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <Separator className="my-3" />
          <div className="space-y-2 text-xs text-slate-500 dark:text-slate-300">
            <div className="flex justify-between"><span>{t("sidebar.totalStages", language)}</span><span className="font-medium text-slate-700 dark:text-slate-200">{EXAM_STAGES.length}{t("sidebar.stageCount", language)}</span></div>
            <div className="flex justify-between"><span>{t("sidebar.totalDuration", language)}</span><span className="font-medium text-slate-700 dark:text-slate-200">{currentTotalDuration}{t("timer.minutes", language)}</span></div>
            <div className="flex justify-between"><span>{t("sidebar.voice", language)}</span><span className={`font-medium ${ttsEnabled ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>{ttsEnabled ? t("sidebar.on", language) : t("sidebar.off", language)}</span></div>
            <div className="flex justify-between"><span>{t("sidebar.sound", language)}</span><span className={`font-medium ${soundEnabled ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>{soundEnabled ? t("sidebar.on", language) : t("sidebar.off", language)}</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
