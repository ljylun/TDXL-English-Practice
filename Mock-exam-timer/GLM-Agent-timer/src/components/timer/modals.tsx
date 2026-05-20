"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, Keyboard } from "lucide-react";
import { EXAM_STAGES } from "@/lib/exam-data";
import React from "react";
import { Language, t } from "@/lib/i18n";

interface ModalsProps {
  showStageSelect: boolean;
  setShowStageSelect: (show: boolean) => void;
  showResetConfirm: boolean;
  setShowResetConfirm: (show: boolean) => void;
  showShortcuts: boolean;
  setShowShortcuts: (show: boolean) => void;
  handleStageClick: (index: number) => void;
  handleReset: () => void;
  currentStageIndex: number;
  timerStatus: string;
  practiceMode: boolean;
  language: Language;
}

export const Modals = React.memo(function Modals({
  showStageSelect,
  setShowStageSelect,
  showResetConfirm,
  setShowResetConfirm,
  showShortcuts,
  setShowShortcuts,
  handleStageClick,
  handleReset,
  currentStageIndex,
  timerStatus,
  practiceMode,
  language,
}: ModalsProps) {
  const shortcuts = [
    { key: "Space", desc: t("shortcut.startPause", language) },
    { key: "N", desc: t("shortcut.skipStage", language) },
    { key: "R", desc: t("shortcut.reset", language) },
    { key: "T", desc: t("shortcut.tts", language) },
    { key: "S", desc: t("shortcut.sound", language) },
    { key: "D", desc: t("shortcut.darkMode", language) },
    { key: "M", desc: t("shortcut.focus", language) },
    { key: "P", desc: t("shortcut.notes", language) },
    { key: "L", desc: t("shortcut.lap", language) },
    { key: "F", desc: t("shortcut.fullscreen", language) },
    { key: "W", desc: t("shortcut.water", language) },
    { key: "Esc", desc: t("shortcut.closeModal", language) },
  ];

  return (
    <>
      {/* Stage Selection Modal */}
      <AnimatePresence>
        {showStageSelect && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowStageSelect(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto border border-slate-200 dark:border-slate-700 card-inner-glow" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-2"><Clock className="size-5 text-emerald-600" />{t("modal.selectStage", language)}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{t("modal.selectStageDesc", language)}</p>
              <div className="space-y-2">
                {EXAM_STAGES.map((stage, i) => (
                  <button key={stage.id} onClick={() => handleStageClick(i)} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] min-h-[44px] ${i === currentStageIndex ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-emerald-500/30" : "border-slate-200 dark:border-slate-700"}`}>
                    <span className="text-2xl">{stage.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-slate-900 dark:text-white">{t("modal.stageN", language)}{stage.id}{t("modal.stageSuffix", language)} · {language === "en" ? stage.nameEn : stage.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{language === "en" ? stage.name : stage.nameEn}</div>
                    </div>
                    <Badge variant="secondary" className="shrink-0">{stage.duration}{t("timer.minutes", language)}</Badge>
                  </button>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={() => setShowStageSelect(false)}>{t("modal.close", language)}</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowResetConfirm(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700 card-inner-glow" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-2 text-slate-900 dark:text-white flex items-center gap-2"><AlertTriangle className="size-5 text-amber-500" />{t("modal.resetConfirm", language)}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{t("modal.resetMessage", language)}</p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowResetConfirm(false)}>{t("history.cancel", language)}</Button>
                <Button variant="destructive" className="flex-1" onClick={handleReset}>{t("modal.confirmReset", language)}</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowShortcuts(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700 card-inner-glow" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-2"><Keyboard className="size-5 text-emerald-600" />{t("modal.shortcuts", language)}</h2>
              <div className="space-y-3">
                {shortcuts.map((shortcut) => (
                  <div key={shortcut.key} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">{shortcut.desc}</span>
                    <kbd className="inline-flex h-6 items-center rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 font-mono text-xs font-medium text-slate-600 dark:text-slate-300">{shortcut.key}</kbd>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={() => setShowShortcuts(false)}>{t("modal.close", language)}</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});
