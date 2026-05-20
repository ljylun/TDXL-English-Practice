"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Trophy } from "lucide-react";
import React, { useMemo } from "react";
import { ExamStage } from "@/lib/exam-data";
import { Language, t } from "@/lib/i18n";

type AccentColor = "emerald" | "amber" | "rose" | "violet" | "cyan";

const ACCENT_SVG_COLORS: Record<AccentColor, { start: string; mid: string; end: string; inner: string; secondHand: string }> = {
  emerald: { start: "#10b981", mid: "#34d399", end: "#059669", inner: "#10b981", secondHand: "#10b981" },
  amber: { start: "#f59e0b", mid: "#fbbf24", end: "#d97706", inner: "#f59e0b", secondHand: "#f59e0b" },
  rose: { start: "#f43f5e", mid: "#fb7185", end: "#e11d48", inner: "#f43f5e", secondHand: "#f43f5e" },
  violet: { start: "#8b5cf6", mid: "#a78bfa", end: "#7c3aed", inner: "#8b5cf6", secondHand: "#8b5cf6" },
  cyan: { start: "#06b6d4", mid: "#22d3ee", end: "#0891b2", inner: "#06b6d4", secondHand: "#06b6d4" },
};

interface TimerRingProps {
  stageProgress: number;
  isFinished: boolean;
  isWarning: boolean;
  isUrgent: boolean;
  isDark: boolean;
  isRunning: boolean;
  remainingSeconds: number;
  timeDisplay: { minutes: string; seconds: string };
  currentStage: ExamStage;
  stageElapsedMinutesDisplay: number;
  stageElapsedSecDisplay: number;
  showRingBurst: boolean;
  focusMode: boolean;
  timerStatus: string;
  practiceMode?: boolean;
  practiceElapsedSeconds?: number;
  language: Language;
  accentColor?: AccentColor;
}

export const TimerRing = React.memo(function TimerRing({
  stageProgress,
  isFinished,
  isWarning,
  isUrgent,
  isDark,
  isRunning,
  remainingSeconds,
  timeDisplay,
  currentStage,
  stageElapsedMinutesDisplay,
  stageElapsedSecDisplay,
  showRingBurst,
  focusMode,
  timerStatus,
  practiceMode,
  practiceElapsedSeconds,
  language,
  accentColor = "emerald",
}: TimerRingProps) {
  const RING_SIZE = 320;
  const RING_CENTER = RING_SIZE / 2;
  const RING_RADIUS = 120;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
  const INNER_GLOW_RADIUS = RING_RADIUS - 16;

  const accentSvg = ACCENT_SVG_COLORS[accentColor];

  const tickMarks = useMemo(() =>
    Array.from({ length: 60 }, (_, i) => {
      const angle = (i / 60) * 360 - 90;
      const rad = (angle * Math.PI) / 180;
      const isMajor = i % 5 === 0;
      const innerR = RING_RADIUS + 8;
      const outerR = RING_RADIUS + (isMajor ? 20 : 14);
      return {
        x1: Math.round((RING_CENTER + innerR * Math.cos(rad)) * 10000) / 10000,
        y1: Math.round((RING_CENTER + innerR * Math.sin(rad)) * 10000) / 10000,
        x2: Math.round((RING_CENTER + outerR * Math.cos(rad)) * 10000) / 10000,
        y2: Math.round((RING_CENTER + outerR * Math.sin(rad)) * 10000) / 10000,
        isMajor,
      };
    }),
  [RING_CENTER, RING_RADIUS]);

  const secondHandAngle = useMemo(() => {
    const totalSeconds = currentStage.duration * 60;
    const elapsed = totalSeconds - remainingSeconds;
    const secondFraction = (elapsed % 60) / 60;
    return secondFraction * 360 - 90;
  }, [remainingSeconds, currentStage.duration]);

  const isPracticeOverTime = practiceMode && practiceElapsedSeconds !== undefined
    ? practiceElapsedSeconds > currentStage.duration * 60
    : false;

  const effectiveProgress = practiceMode && practiceElapsedSeconds !== undefined
    ? Math.min((practiceElapsedSeconds / (currentStage.duration * 60)) * 100, 100)
    : isFinished ? 100 : stageProgress;

  const isPaused = timerStatus === "paused";

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6">
      <div className="flex items-center justify-center">
        <div className={`relative w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] ${isPaused ? "timer-ring-breathing" : isWarning ? "ring-heartbeat" : ""}`}>
          {showRingBurst && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] rounded-full border-4 border-accent-400/50 ring-burst" />
            </div>
          )}

          {isPaused && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[200px] h-[200px] sm:w-[260px] sm:h-[260px] rounded-full ring-frozen-crystal" />
            </div>
          )}

          <svg className="absolute inset-0" width="100%" height="100%" viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
            <defs>
              <filter id="ring-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="ring-glow-dark" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="10" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="inner-glow-soft" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="second-hand-glow" x="-200%" y="-200%" width="500%" height="500%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="gradient-accent" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={accentSvg.start} />
                <stop offset="50%" stopColor={accentSvg.mid} />
                <stop offset="100%" stopColor={accentSvg.end} />
              </linearGradient>
              <linearGradient id="gradient-amber" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
              <linearGradient id="gradient-red" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="50%" stopColor="#f87171" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
              <linearGradient id="gradient-practice-overtime" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#fb923c" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
              <linearGradient id="shimmer-sweep" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                <stop offset="40%" stopColor="rgba(255,255,255,0.15)" />
                <stop offset="60%" stopColor="rgba(255,255,255,0.15)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
            </defs>

            {tickMarks.map((tick, i) => (
              <line
                key={i}
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                stroke="currentColor"
                strokeWidth={tick.isMajor ? 1.5 : 0.75}
                className={tick.isMajor ? "text-slate-300 dark:text-slate-600" : "text-slate-200 dark:text-slate-700"}
              />
            ))}

            {isRunning && !isFinished && (
              <circle
                cx={RING_CENTER}
                cy={RING_CENTER}
                r={INNER_GLOW_RADIUS}
                fill="none"
                stroke={accentSvg.inner}
                strokeWidth="1.5"
                className="ring-pulsating-glow"
                filter="url(#inner-glow-soft)"
              />
            )}

            <circle
              cx={RING_CENTER}
              cy={RING_CENTER}
              r={RING_RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-slate-100 dark:text-slate-800"
              style={{
                transformOrigin: `${RING_CENTER}px ${RING_CENTER}px`,
                animation: isRunning ? "ring-rotate 60s linear infinite" : "none",
              }}
            />

            {isRunning && (
              <circle
                cx={RING_CENTER}
                cy={RING_CENTER}
                r={RING_RADIUS - 8}
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                strokeDasharray="4 8"
                className="text-slate-200 dark:text-slate-700"
                style={{
                  transformOrigin: `${RING_CENTER}px ${RING_CENTER}px`,
                  animation: "ring-rotate 30s linear infinite reverse",
                }}
              />
            )}

            <circle
              cx={RING_CENTER}
              cy={RING_CENTER}
              r={RING_RADIUS}
              fill="none"
              strokeWidth="5"
              strokeLinecap="round"
              stroke={
                isPracticeOverTime
                  ? "url(#gradient-practice-overtime)"
                  : isFinished
                  ? "url(#gradient-accent)"
                  : isWarning
                  ? "url(#gradient-red)"
                  : isUrgent
                  ? "url(#gradient-amber)"
                  : "url(#gradient-accent)"
              }
              strokeDasharray={`${RING_CIRCUMFERENCE}`}
              strokeDashoffset={`${RING_CIRCUMFERENCE * (1 - effectiveProgress / 100)}`}
              transform={`rotate(-90 ${RING_CENTER} ${RING_CENTER})`}
              filter={isDark ? "url(#ring-glow-dark)" : "url(#ring-glow)"}
              className={isRunning && !isWarning ? "ring-shimmer-sweep" : ""}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />

            {isPaused && !isFinished && (
              <circle
                cx={RING_CENTER}
                cy={RING_CENTER}
                r={RING_RADIUS}
                fill="none"
                strokeWidth="5"
                strokeLinecap="round"
                stroke="rgba(56, 189, 248, 0.2)"
                strokeDasharray={`${RING_CIRCUMFERENCE}`}
                strokeDashoffset={`${RING_CIRCUMFERENCE * (1 - effectiveProgress / 100)}`}
                transform={`rotate(-90 ${RING_CENTER} ${RING_CENTER})`}
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            )}

            {isRunning && !isFinished && !practiceMode && (
              <g
                style={{
                  transformOrigin: `${RING_CENTER}px ${RING_CENTER}px`,
                  transform: `rotate(${secondHandAngle + 90}deg)`,
                  transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                <circle
                  cx={RING_CENTER}
                  cy={RING_CENTER - RING_RADIUS}
                  r="4"
                  fill={isWarning ? "#ef4444" : isUrgent ? "#f59e0b" : accentSvg.secondHand}
                  filter="url(#second-hand-glow)"
                />
                <circle
                  cx={RING_CENTER}
                  cy={RING_CENTER - RING_RADIUS + 6}
                  r="2"
                  fill={isWarning ? "#ef4444" : isUrgent ? "#f59e0b" : accentSvg.secondHand}
                  opacity="0.4"
                />
              </g>
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div key={`${currentStage.id}-${timerStatus}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="stage-flip-enter">
                <div className={`text-5xl sm:text-7xl font-mono font-bold tracking-wider transition-colors duration-300 timer-digits ${isFinished ? "text-accent-600 dark:text-accent-400" : isWarning ? "text-color-cycle timer-glow-warning" : isUrgent ? "text-color-cycle-urgent timer-glow-urgent" : isPracticeOverTime ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-white text-gradient-timer"}`}>
                  {isFinished ? (
                    <>
                      <span className="timer-digit-container"><span className="timer-digit-slide">0</span></span>
                      <span className="timer-digit-container"><span className="timer-digit-slide">0</span></span>
                      <span className={isRunning ? "colon-pulse" : ""}>:</span>
                      <span className="timer-digit-container"><span className="timer-digit-slide">0</span></span>
                      <span className="timer-digit-container"><span className="timer-digit-slide">0</span></span>
                    </>
                  ) : (
                    <>
                      {timeDisplay.minutes.split("").map((digit, i) => (
                        <span key={`m-${digit}-${i}`} className="timer-digit-container">
                          <span className="timer-digit-slide slide-up">{digit}</span>
                        </span>
                      ))}
                      <span className={isRunning ? "colon-pulse" : ""}>:</span>
                      {timeDisplay.seconds.split("").map((digit, i) => (
                        <span key={`s-${digit}-${i}`} className="timer-digit-container">
                          <span className="timer-digit-slide slide-up">{digit}</span>
                        </span>
                      ))}
                    </>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
            {/* Idle state pulsing prompt */}
            {timerStatus === "idle" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.4, 0.9, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="text-center mt-1"
              >
                <div className="text-xs text-accent-600/80 dark:text-accent-400/80 font-medium tracking-wide">
                  {t("timer.idlePrompt", language)}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  {t("timer.idlePromptEn", language)}
                </div>
              </motion.div>
            )}
            {timerStatus !== "idle" && (
            <div className="text-sm text-slate-500 dark:text-slate-300 mt-2">
              {isFinished ? t("timer.completed", language) : practiceMode ? t("timer.elapsed", language) : t("timer.remaining", language)}
            </div>
            )}
            {timerStatus !== "idle" && !isFinished && (
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                {t("timer.elapsedLabel", language)} {stageElapsedMinutesDisplay}:{stageElapsedSecDisplay.toString().padStart(2, "0")} / {currentStage.duration}{t("timer.minutes", language)}
                {isPracticeOverTime && ` ${t("timer.overtime", language)}`}
              </div>
            )}
            {isFinished && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }} className="flex items-center gap-1 mt-2 text-accent-600 dark:text-accent-400">
                <Trophy className="size-4" />
                <span className="text-xs font-medium">{t("timer.allStagesCompleted", language)}</span>
              </motion.div>
            )}
            {focusMode && timerStatus !== "idle" && !isFinished && (
              <div className="text-xs text-accent-500 dark:text-accent-400 mt-1 font-medium">{t("timer.focusIndicator", language)}</div>
            )}
            {practiceMode && timerStatus !== "idle" && !isFinished && (
              <div className="text-xs text-amber-500 dark:text-amber-400 mt-1 font-medium">{t("timer.practiceIndicator", language)}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
