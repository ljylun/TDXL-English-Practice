"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { StickyNote, X, Trash2 } from "lucide-react";
import React, { useState, useEffect, useCallback, useRef } from "react";

interface NotesPanelProps {
  show: boolean;
  setShow: (show: boolean) => void;
  examId: number | null;
}

const MAX_CHARS = 5000;

export const NotesPanel = React.memo(function NotesPanel({
  show,
  setShow,
  examId,
}: NotesPanelProps) {
  const [notes, setNotes] = useState("");
  const [laps, setLaps] = useState<Array<{ time: number; label: string }>>([]);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Storage key based on exam ID
  const storageKey = `exam-notes-${examId ?? "draft"}`;
  const lapsKey = `exam-laps-${examId ?? "draft"}`;

  // Load notes from localStorage on mount or examId change
  // Use ref to track the latest storageKey for deferred loading
  const prevStorageKeyRef = useRef(storageKey);
  useEffect(() => {
    if (prevStorageKeyRef.current === storageKey && notes !== "") return;
    prevStorageKeyRef.current = storageKey;
    // Defer setState to avoid cascading renders
    setTimeout(() => {
      try {
        const saved = localStorage.getItem(storageKey);
        setNotes(saved || "");
      } catch {
        setNotes("");
      }
      try {
        const savedLaps = localStorage.getItem(lapsKey);
        setLaps(savedLaps ? JSON.parse(savedLaps) : []);
      } catch {
        setLaps([]);
      }
    }, 0);
  }, [storageKey, lapsKey, notes]);

  // Debounced auto-save
  const saveNotes = useCallback((text: string) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, text);
      } catch {
        // storage full, ignore
      }
    }, 2000);
  }, [storageKey]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= MAX_CHARS) {
      setNotes(val);
      saveNotes(val);
    }
  }, [saveNotes]);

  const handleClear = useCallback(() => {
    setNotes("");
    setLaps([]);
    try {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(lapsKey);
    } catch {
      // ignore
    }
  }, [storageKey, lapsKey]);

  // Add a lap marker
  const addLap = useCallback((lapTime: number) => {
    const minutes = Math.floor(lapTime / 60);
    const seconds = lapTime % 60;
    const lap = { time: lapTime, label: `⏱ ${minutes}:${seconds.toString().padStart(2, "0")}` };
    setLaps(prev => {
      const newLaps = [...prev, lap];
      try {
        localStorage.setItem(lapsKey, JSON.stringify(newLaps));
      } catch {
        // ignore
      }
      return newLaps;
    });
  }, [lapsKey]);

  // Expose addLap for parent component
  // We use a ref-based approach since we can't use forwardRef with React.memo easily
  // Instead, we'll use a global event
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      addLap(e.detail as number);
    };
    window.addEventListener("add-lap" as string, handler as EventListener);
    return () => window.removeEventListener("add-lap" as string, handler as EventListener);
  }, [addLap]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      try {
        localStorage.setItem(storageKey, notes);
      } catch {
        // ignore
      }
    };
  }, [storageKey, notes]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed right-0 top-0 bottom-0 z-[50] w-full sm:w-96 bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-700 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <StickyNote className="size-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">考试笔记</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShow(false)} className="size-8" aria-label="关闭笔记">
              <X className="size-4" />
            </Button>
          </div>

          {/* Lap markers */}
          {laps.length > 0 && (
            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 max-h-32 overflow-y-auto">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 font-medium">练习圈标记</div>
              <div className="flex flex-wrap gap-1.5">
                {laps.map((lap, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                    {lap.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Textarea */}
          <div className="flex-1 p-4 flex flex-col min-h-0">
            <textarea
              ref={textareaRef}
              value={notes}
              onChange={handleChange}
              placeholder="在此记录考试笔记、要点、时间节点..."
              className="flex-1 w-full resize-none text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent border-0 focus:outline-none focus:ring-0 leading-relaxed"
              aria-label="考试笔记"
            />
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 dark:text-slate-500">{notes.length}/{MAX_CHARS}</span>
            <Button variant="ghost" size="sm" onClick={handleClear} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 h-7 text-xs gap-1">
              <Trash2 className="size-3" />清除
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
