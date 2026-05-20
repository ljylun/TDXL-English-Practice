"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle } from "lucide-react";
import React from "react";

export interface ToastItem {
  id: number;
  message: string;
  type: "stage" | "warning" | "complete";
}

interface ToastNotificationsProps {
  toasts: ToastItem[];
}

export const ToastNotifications = React.memo(function ToastNotifications({ toasts }: ToastNotificationsProps) {
  return (
    <div className="fixed top-16 right-4 z-[55] flex flex-col gap-2 max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg backdrop-blur-md border ${
              toast.type === "complete"
                ? "bg-emerald-50/90 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                : toast.type === "warning"
                ? "bg-amber-50/90 dark:bg-amber-950/90 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200"
                : "bg-slate-50/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            }`}
          >
            {toast.type === "complete" ? (
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : toast.type === "warning" ? (
              <AlertCircle className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
            ) : (
              <AlertCircle className="size-4 text-teal-600 dark:text-teal-400 shrink-0" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});
