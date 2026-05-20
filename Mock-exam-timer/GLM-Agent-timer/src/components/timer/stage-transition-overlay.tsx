"use client";

import { motion, AnimatePresence } from "framer-motion";
import React from "react";
import { ExamStage } from "@/lib/exam-data";
import { Language, t } from "@/lib/i18n";

interface StageTransitionOverlayProps {
  show: boolean;
  stage: ExamStage | null;
  language: Language;
}

export const StageTransitionOverlay = React.memo(function StageTransitionOverlay({
  show,
  stage,
  language,
}: StageTransitionOverlayProps) {
  if (!stage) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[90] flex items-center justify-center pointer-events-none"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/80 via-teal-600/70 to-emerald-700/80" />
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-10 flex flex-col items-center text-center"
          >
            <motion.span
              className="text-7xl sm:text-8xl mb-4"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 12, delay: 0.1 }}
            >
              {stage.icon}
            </motion.span>
            <motion.h2
              className="text-2xl sm:text-3xl font-bold text-white mb-1"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {t("transition.stage", language)}{stage.id}{t("transition.stageSuffix", language)}
            </motion.h2>
            <motion.p
              className="text-lg sm:text-xl text-white/90 font-medium"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {language === "en" ? stage.nameEn : stage.name}
            </motion.p>
            <motion.p
              className="text-sm text-white/70 mt-1"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {stage.duration}{t("timer.minutes", language)} · {language === "en" ? stage.name : stage.nameEn}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
