"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Coffee, SkipForward, Plus } from "lucide-react";
import React, { useEffect, useState, useCallback } from "react";
import { Language, t } from "@/lib/i18n";

interface BreakTimerOverlayProps {
  show: boolean;
  breakDuration: number;
  onSkipBreak: () => void;
  onExtendBreak: () => void;
  soundEnabled: boolean;
  language: Language;
}

function playChime() {
  try {
    const ctx = new AudioContext();
    const notes = [659, 784, 988];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.25 + 0.5);
      osc.start(ctx.currentTime + i * 0.25);
      osc.stop(ctx.currentTime + i * 0.25 + 0.5);
    });
  } catch {
    // Audio error, ignore
  }
}

export const BreakTimerOverlay = React.memo(function BreakTimerOverlay({
  show,
  breakDuration,
  onSkipBreak,
  onExtendBreak,
  soundEnabled,
  language,
}: BreakTimerOverlayProps) {
  const [breakRemaining, setBreakRemaining] = useState(breakDuration * 60);
  const [extendedMinutes, setExtendedMinutes] = useState(0);

  const totalBreakSeconds = (breakDuration + extendedMinutes) * 60;
  const breakProgress = totalBreakSeconds > 0
    ? ((totalBreakSeconds - breakRemaining) / totalBreakSeconds) * 100
    : 0;

  const breakMinutes = Math.floor(breakRemaining / 60);
  const breakSeconds = breakRemaining % 60;

  useEffect(() => {
    if (show) {
      setTimeout(() => {
        setBreakRemaining(breakDuration * 60);
        setExtendedMinutes(0);
      }, 0);
    }
  }, [show, breakDuration]);

  useEffect(() => {
    if (!show || breakRemaining <= 0) return;

    const interval = setInterval(() => {
      setBreakRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [show, breakRemaining]);

  useEffect(() => {
    if (show && breakRemaining === 0) {
      if (soundEnabled) playChime();
      const timeout = setTimeout(() => {
        onSkipBreak();
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [show, breakRemaining, onSkipBreak, soundEnabled]);

  const handleExtend = useCallback(() => {
    setExtendedMinutes((prev) => prev + 1);
    setBreakRemaining((prev) => prev + 60);
  }, []);

  const RING_SIZE = 240;
  const RING_CENTER = RING_SIZE / 2;
  const RING_RADIUS = 90;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

  const progressOffset = RING_CIRCUMFERENCE * (1 - breakProgress / 100);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[80] flex items-center justify-center"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onSkipBreak}
          />

          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10 glass-card rounded-2xl p-6 sm:p-8 max-w-sm w-[90%] shadow-2xl border border-cyan-200/40 dark:border-cyan-700/30"
            style={{
              background: "rgba(255, 255, 255, 0.85)",
            }}
          >
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at center, rgba(6, 182, 212, 0.08) 0%, transparent 70%)",
              }}
              aria-hidden="true"
            />

            <div className="relative">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center size-12 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 shadow-lg shadow-cyan-200/50 dark:shadow-cyan-900/30 mb-3">
                  <Coffee className="size-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                  {t("break.title", language)}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t("break.subtitle", language)}
                </p>
              </div>

              <div className="flex items-center justify-center mb-6">
                <div className="relative w-[180px] h-[180px]">
                  <svg
                    className="absolute inset-0"
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
                  >
                    <defs>
                      <linearGradient id="gradient-teal" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="50%" stopColor="#14b8a6" />
                        <stop offset="100%" stopColor="#0891b2" />
                      </linearGradient>
                      <filter id="break-ring-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    <circle
                      cx={RING_CENTER}
                      cy={RING_CENTER}
                      r={RING_RADIUS}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      className="text-cyan-100 dark:text-cyan-900/40"
                    />

                    <circle
                      cx={RING_CENTER}
                      cy={RING_CENTER}
                      r={RING_RADIUS}
                      fill="none"
                      stroke="url(#gradient-teal)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${RING_CIRCUMFERENCE}`}
                      strokeDashoffset={`${progressOffset}`}
                      transform={`rotate(-90 ${RING_CENTER} ${RING_CENTER})`}
                      filter="url(#break-ring-glow)"
                      style={{ transition: "stroke-dashoffset 1s linear" }}
                    />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-4xl sm:text-5xl font-mono font-bold tracking-wider text-cyan-700 dark:text-cyan-300 timer-digits">
                      {String(breakMinutes).padStart(2, "0")}
                      <span className="colon-pulse">:</span>
                      {String(breakSeconds).padStart(2, "0")}
                    </div>
                    <div className="text-xs text-cyan-500/70 dark:text-cyan-400/60 mt-1">
                      {t("break.remaining", language)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={onSkipBreak}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-medium shadow-lg shadow-cyan-200/40 dark:shadow-cyan-900/30 hover:from-cyan-600 hover:to-teal-600 active:scale-[0.98] transition-all min-h-[44px]"
                >
                  <SkipForward className="size-4" />
                  {t("break.skip", language)}
                </button>
                <button
                  onClick={handleExtend}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-cyan-300 dark:border-cyan-700 text-cyan-700 dark:text-cyan-300 font-medium hover:bg-cyan-50 dark:hover:bg-cyan-950/30 active:scale-[0.98] transition-all min-h-[44px]"
                >
                  <Plus className="size-4" />
                  {t("break.extend", language)}
                </button>
              </div>

              {extendedMinutes > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mt-3 text-xs text-cyan-500 dark:text-cyan-400"
                >
                  {t("break.extended", language)} {extendedMinutes} {t("break.minutesUnit", language)}
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
