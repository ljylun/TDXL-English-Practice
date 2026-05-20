"use client";

import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { ExamStage } from "@/lib/exam-data";

interface CountdownOverlayProps {
  show: boolean;
  stage: ExamStage;
  countdownNumber: number;
  onCancel: () => void;
  onCountdownEnd: () => void;
  onPlayWarningBeep: () => void;
  onPlayEndBeep: () => void;
  soundEnabled: boolean;
}

export const CountdownOverlay = React.memo(function CountdownOverlay({
  show,
  stage,
  countdownNumber,
  onCancel,
  onCountdownEnd,
  onPlayWarningBeep,
  onPlayEndBeep,
  soundEnabled,
}: CountdownOverlayProps) {
  const prevNumberRef = useRef(countdownNumber);
  const isGoRef = useRef(false);
  const initialBeepRef = useRef(false);

  // Play beep on number change (3, 2, 1 -> warning beep; 0 -> end beep)
  useEffect(() => {
    if (!show) {
      initialBeepRef.current = false;
      return;
    }
    if (countdownNumber > 0 && !initialBeepRef.current) {
      // First appearance - play beep for the initial number (3)
      initialBeepRef.current = true;
      prevNumberRef.current = countdownNumber;
      if (soundEnabled) onPlayWarningBeep();
    } else if (countdownNumber !== prevNumberRef.current && countdownNumber > 0) {
      // Number changed (2, 1) - play warning beep
      prevNumberRef.current = countdownNumber;
      if (soundEnabled) onPlayWarningBeep();
    }
  }, [show, countdownNumber, soundEnabled, onPlayWarningBeep]);

  // Handle countdown reaching 0
  useEffect(() => {
    if (show && countdownNumber === 0 && !isGoRef.current) {
      isGoRef.current = true;
      if (soundEnabled) onPlayEndBeep();
      const timeout = setTimeout(() => {
        isGoRef.current = false;
        onCountdownEnd();
      }, 600);
      return () => clearTimeout(timeout);
    }
  }, [show, countdownNumber, onCountdownEnd, soundEnabled, onPlayEndBeep]);

  // Reset refs when shown again
  useEffect(() => {
    if (show) {
      isGoRef.current = false;
      initialBeepRef.current = false;
      prevNumberRef.current = countdownNumber;
    }
  }, [show, countdownNumber]);

  const isGo = countdownNumber === 0;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[95] flex items-center justify-center"
        >
          {/* Backdrop with gradient mesh stronger opacity */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/70 backdrop-blur-md"
            onClick={onCancel}
          />

          {/* Stronger gradient mesh blobs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
            <div
              className="absolute rounded-full"
              style={{
                width: 600,
                height: 600,
                top: "20%",
                left: "10%",
                background: "radial-gradient(circle, #10b981 0%, transparent 70%)",
                filter: "blur(80px)",
                opacity: 0.25,
                animation: "mesh-float 20s ease-in-out infinite",
              }}
            />
            <div
              className="absolute rounded-full"
              style={{
                width: 500,
                height: 500,
                top: "30%",
                right: "5%",
                background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)",
                filter: "blur(80px)",
                opacity: 0.2,
                animation: "mesh-float 25s ease-in-out infinite",
                animationDelay: "-7s",
              }}
            />
          </div>

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Stage icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 15, delay: 0.1 }}
              className="text-5xl sm:text-6xl mb-6"
            >
              {stage.icon}
            </motion.div>

            {/* Countdown number or GO */}
            <div className="relative">
              <AnimatePresence mode="wait">
                {!isGo ? (
                  <motion.div
                    key={`countdown-${countdownNumber}`}
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    transition={{ type: "spring", damping: 12, stiffness: 200 }}
                    className="countdown-number-glow"
                  >
                    <span className="text-9xl sm:text-[12rem] font-black countdown-gradient-text">
                      {countdownNumber}
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="go"
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    transition={{ type: "spring", damping: 10, stiffness: 150 }}
                  >
                    <span className="text-8xl sm:text-[10rem] font-black countdown-go-text">
                      GO!
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Expanding pulse ring on each number change */}
              <AnimatePresence>
                {!isGo && countdownNumber > 0 && (
                  <motion.div
                    key={`ring-${countdownNumber}`}
                    initial={{ scale: 0.8, opacity: 0.6 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <div className="size-32 sm:size-40 rounded-full border-4 border-emerald-400/50" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Second expanding ring with delay for layered effect */}
              <AnimatePresence>
                {!isGo && countdownNumber > 0 && (
                  <motion.div
                    key={`ring2-${countdownNumber}`}
                    initial={{ scale: 0.6, opacity: 0.4 }}
                    animate={{ scale: 3, opacity: 0 }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <div className="size-24 sm:size-32 rounded-full border-2 border-teal-400/30" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Stage name */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-6"
            >
              <p className="text-xl sm:text-2xl font-bold text-white/90">
                {stage.name} 即将开始
              </p>
              <p className="text-sm text-white/60 mt-1">
                {stage.duration}分钟 · {stage.nameEn}
              </p>
            </motion.div>
          </div>

          {/* Cancel button in bottom-right */}
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            onClick={onCancel}
            className="absolute bottom-8 right-8 flex items-center gap-2 px-6 py-2.5 rounded-xl glass-card border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition-all min-h-[44px] z-20"
          >
            <X className="size-4" />
            取消
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
