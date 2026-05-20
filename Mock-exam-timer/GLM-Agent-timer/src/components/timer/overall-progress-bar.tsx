"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { EXAM_STAGES } from "@/lib/exam-data";
import { formatTime } from "@/lib/time-utils";
import React, { useEffect, useRef, useState } from "react";
import { Language, t, formatTimeShort } from "@/lib/i18n";

interface OverallProgressBarProps {
  overallProgress: number;
  currentStageIndex: number;
  remainingSeconds: number;
  currentTotalDuration: number;
  isWarning: boolean;
  isUrgent: boolean;
  isFinished: boolean;
  currentStageName: string;
  getRemainingTimeForStage?: (stageIndex: number) => string;
  practiceMode?: boolean;
  practiceElapsedSeconds?: number;
  language: Language;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  createdAt: number;
}

export const OverallProgressBar = React.memo(function OverallProgressBar({
  overallProgress,
  currentStageIndex,
  remainingSeconds,
  currentTotalDuration,
  isWarning,
  isUrgent,
  isFinished,
  currentStageName,
  getRemainingTimeForStage,
  practiceMode,
  practiceElapsedSeconds,
  language,
}: OverallProgressBarProps) {
  const [hoveredStageIndex, setHoveredStageIndex] = useState<number | null>(null);
  const [showRichTooltip, setShowRichTooltip] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [pulseMilestone, setPulseMilestone] = useState<number | null>(null);
  const prevProgressRef = useRef(overallProgress);
  const particleIdRef = useRef(0);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const totalRemainingSeconds = remainingSeconds + EXAM_STAGES.slice(currentStageIndex + 1).reduce((acc, s) => acc + s.duration * 60, 0);
  const estimatedCompletion = new Date(Date.now() + totalRemainingSeconds * 1000);
  const completionTimeStr = formatTimeShort(estimatedCompletion, language);
  const currentStageDuration = EXAM_STAGES[currentStageIndex]?.duration ?? 0;
  const currentStageProgressPercent = currentStageDuration > 0
    ? Math.round(((currentStageDuration * 60 - remainingSeconds) / (currentStageDuration * 60)) * 100)
    : 0;

  useEffect(() => {
    if (overallProgress > prevProgressRef.current && !isFinished) {
      const bar = progressBarRef.current;
      if (bar) {
        const barWidth = bar.offsetWidth;
        const edgeX = (overallProgress / 100) * barWidth;
        const newParticles: Particle[] = [];
        for (let i = 0; i < 3; i++) {
          newParticles.push({
            id: ++particleIdRef.current,
            x: edgeX + (Math.random() - 0.5) * 6,
            y: 2 + Math.random() * 4,
            size: 2 + Math.random() * 2,
            createdAt: Date.now(),
          });
        }
        setParticles((prev) => [...prev.slice(-8), ...newParticles]);
      }
    }
    prevProgressRef.current = overallProgress;
  }, [overallProgress, isFinished]);

  useEffect(() => {
    if (particles.length === 0) return;
    const timer = setInterval(() => {
      const now = Date.now();
      setParticles((prev) => prev.filter((p) => now - p.createdAt < 1200));
    }, 200);
    return () => clearInterval(timer);
  }, [particles.length]);

  useEffect(() => {
    const prev = prevProgressRef.current;
    EXAM_STAGES.forEach((stage, i) => {
      if (i === 0) return;
      const prevTotal = EXAM_STAGES.slice(0, i).reduce((acc, s) => acc + s.duration, 0);
      const milestonePercent = (prevTotal / currentTotalDuration) * 100;
      if (prev < milestonePercent && overallProgress >= milestonePercent) {
        setPulseMilestone(i);
        setTimeout(() => setPulseMilestone(null), 800);
      }
    });
  }, [overallProgress, currentTotalDuration]);

  const remainingBadgeTime = formatTime(totalRemainingSeconds);

  return (
    <div className="bg-white/50 dark:bg-slate-900/50 border-b">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{t("progress.overall", language)}</span>
          <div className="flex items-center gap-2">
            {!isFinished && (currentStageIndex > 0 || remainingSeconds < currentTotalDuration * 60) && (
              <span className={`progress-remaining-badge ${isWarning ? "!text-red-600 !border-red-300 !bg-red-50 dark:!text-red-400 dark:!border-red-800 dark:!bg-red-950/30" : isUrgent ? "!text-amber-600 !border-amber-300 !bg-amber-50 dark:!text-amber-400 dark:!border-amber-800 dark:!bg-amber-950/30" : ""}`}>
                {t("progress.remaining", language)} {remainingBadgeTime}
              </span>
            )}
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{Math.round(overallProgress)}% · {t("progress.totalMinutes", language)} {currentTotalDuration} {t("timer.minutes", language)}</span>
          </div>
        </div>
        <div className="relative group"
          ref={progressBarRef}
          onMouseEnter={() => setShowRichTooltip(true)}
          onMouseLeave={() => { setShowRichTooltip(false); setHoveredStageIndex(null); }}
        >
          <Progress value={overallProgress} className="h-2.5" />
          <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-linear ${isWarning ? "progress-shimmer-warning" : isUrgent ? "progress-shimmer-urgent" : "progress-shimmer"}`}
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          {!isFinished && overallProgress > 0 && (
            <div
              className={`absolute top-0 h-full pointer-events-none progress-glow-edge ${isWarning ? "warning" : isUrgent ? "urgent" : ""}`}
              style={{ left: `calc(${overallProgress}% - 4px)`, width: '8px' }}
            />
          )}
          {!isFinished && particles.length > 0 && (
            <div className="absolute inset-0 pointer-events-none overflow-visible">
              {particles.map((p) => (
                <div
                  key={p.id}
                  className={`progress-particle ${isWarning ? "warning" : isUrgent ? "urgent" : ""}`}
                  style={{
                    left: `${p.x}px`,
                    top: `${p.y}px`,
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                  }}
                />
              ))}
            </div>
          )}
          <div className="absolute inset-0 flex pointer-events-none">
            {EXAM_STAGES.map((stage, i) => {
              const prevTotal = EXAM_STAGES.slice(0, i).reduce((acc, s) => acc + s.duration, 0);
              const percentage = (prevTotal / currentTotalDuration) * 100;
              if (i === 0) return null;
              return (
                <div key={stage.id} className={`absolute top-1/2 ${pulseMilestone === i ? "milestone-pulse" : ""}`} style={{ left: `${percentage}%`, transform: "translate(-50%, -50%) rotate(45deg)" }}>
                  <div className={`size-1.5 ${i <= currentStageIndex ? "bg-emerald-500 dark:bg-emerald-400" : "bg-slate-300 dark:bg-slate-600"}`} />
                </div>
              );
            })}
          </div>
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 text-[10px] px-2 py-0.5 rounded whitespace-nowrap">
              {currentStageName}
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-800 dark:border-t-slate-200" />
            </div>
          </div>

          <AnimatePresence>
            {showRichTooltip && !isFinished && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute -top-[140px] left-1/2 -translate-x-1/2 z-30 pointer-events-none"
              >
                <div className="glass-card rounded-xl p-3 shadow-xl min-w-[200px] border border-white/20 dark:border-white/10">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">{t("progress.details", language)}</div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">{t("progress.currentStage", language)}</span>
                      <span className="text-slate-700 dark:text-slate-200 font-medium">{currentStageName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">{t("progress.stageProgress", language)}</span>
                      <span className="text-slate-700 dark:text-slate-200 font-medium">{currentStageProgressPercent}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">{t("progress.stageRemaining", language)}</span>
                      <span className="text-slate-700 dark:text-slate-200 font-medium">{formatTime(remainingSeconds)}</span>
                    </div>
                    <div className="border-t border-slate-200/50 dark:border-slate-700/50 pt-1.5" />
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">{t("progress.totalRemaining", language)}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatTime(totalRemainingSeconds)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">{t("progress.estimatedEnd", language)}</span>
                      <span className="text-slate-700 dark:text-slate-200 font-medium">{completionTimeStr}</span>
                    </div>
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-white/70 dark:border-slate-800/70" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex mt-1">
          {EXAM_STAGES.map((stage, i) => {
            const widthPercent = (stage.duration / currentTotalDuration) * 100;
            const isCurrent = i === currentStageIndex;
            const isPast = i < currentStageIndex;
            const displayName = language === "en" ? stage.nameEn : stage.name;
            return (
              <div
                key={stage.id}
                style={{ width: `${widthPercent}%` }}
                className="relative"
                onMouseEnter={() => setHoveredStageIndex(i)}
                onMouseLeave={() => setHoveredStageIndex(null)}
              >
                <div className={`text-center text-[10px] sm:text-xs truncate px-0.5 transition-colors ${isCurrent ? `font-bold text-emerald-600 dark:text-emerald-400 tracking-wider` : isPast ? "text-slate-400 dark:text-slate-600 line-through" : "text-slate-400 dark:text-slate-500"}`}>
                  {displayName}
                </div>
                {hoveredStageIndex === i && !isFinished && getRemainingTimeForStage && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                    <div className="bg-slate-700 dark:bg-slate-300 text-white dark:text-slate-800 text-[9px] px-2 py-0.5 rounded whitespace-nowrap shadow-lg">
                      {i < currentStageIndex ? t("progress.ended", language) : i === currentStageIndex ? `${t("progress.remaining", language)} ${formatTime(remainingSeconds)}` : `${t("progress.remaining", language)} ${stage.duration}${t("timer.minutes", language)}`}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
