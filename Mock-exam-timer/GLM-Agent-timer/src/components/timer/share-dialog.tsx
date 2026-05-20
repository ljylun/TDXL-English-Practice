"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Share2, Copy, FileText } from "lucide-react";
import React from "react";
import { Language, t } from "@/lib/i18n";

interface ShareDialogProps {
  show: boolean;
  setShow: (show: boolean) => void;
  shareText: string;
  handleCopyShare: () => void;
  handleDownloadShare: () => void;
  language: Language;
}

export const ShareDialog = React.memo(function ShareDialog({
  show,
  setShow,
  shareText,
  handleCopyShare,
  handleDownloadShare,
  language,
}: ShareDialogProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShow(false)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 card-inner-glow" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-2"><Share2 className="size-5 text-emerald-600" />{t("share.title", language)}</h2>
            <pre className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-lg p-4 whitespace-pre-wrap max-h-[40vh] overflow-y-auto font-mono leading-relaxed">{shareText}</pre>
            <div className="flex gap-3 mt-4">
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={handleCopyShare}>
                <Copy className="size-4" />{t("share.copyText", language)}
              </Button>
              <Button variant="outline" className="flex-1 gap-2" onClick={handleDownloadShare}>
                <FileText className="size-4" />{t("share.downloadReport", language)}
              </Button>
            </div>
            <Button variant="outline" className="w-full mt-2" onClick={() => setShow(false)}>{t("modal.close", language)}</Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
