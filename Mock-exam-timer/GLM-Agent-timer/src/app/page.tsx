"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useExamTimer } from "@/hooks/use-exam-timer";
import { useDynamicFavicon } from "@/hooks/use-dynamic-favicon";
import { useTTS, setTTSVolume } from "@/hooks/use-tts";
import { EXAM_STAGES, ExamStage } from "@/lib/exam-data";
import { getTemplateById } from "@/lib/exam-templates";
import { formatTime, formatTimeWithLabel } from "@/lib/time-utils";
import { t, Language as LangType, formatTimeShort } from "@/lib/i18n";
import { MOTIVATIONAL_QUOTES, Quote } from "@/lib/quotes";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Clock,
  ChevronRight,
  Timer,
  AlertTriangle,
  Moon,
  Sun,
  Keyboard,
  Bell,
  BellOff,
  SkipForward,
  Maximize,
  Minimize,
  Settings2,
  History,
  Download,
  Eye,
  EyeOff,
  StickyNote,
  Languages,
  Droplet,
  Droplets,
} from "lucide-react";

// Extracted components
import { Confetti } from "@/components/timer/confetti";
import { ToastNotifications, ToastItem } from "@/components/timer/toast-notifications";
import { TimerRing } from "@/components/timer/timer-ring";
import { DesktopControls, MobileControls } from "@/components/timer/control-buttons";
import { HistoryDialog, ExamHistoryRecord, StageRecord } from "@/components/timer/history-dialog";
import { SettingsDialog } from "@/components/timer/settings-dialog";
import { ShareDialog } from "@/components/timer/share-dialog";
import { StageSidebar } from "@/components/timer/stage-sidebar";
import { TimelineBar } from "@/components/timer/timeline-bar";
import { Modals } from "@/components/timer/modals";
import { NotesPanel } from "@/components/timer/notes-panel";
import { StageTransitionOverlay } from "@/components/timer/stage-transition-overlay";
import { TimerParticleTrail } from "@/components/timer/timer-particle-trail";
import { OverallProgressBar } from "@/components/timer/overall-progress-bar";
import { BreakTimerOverlay } from "@/components/timer/break-timer-overlay";
import { AmbientSound } from "@/components/timer/ambient-sound";
import { CountdownOverlay } from "@/components/timer/countdown-overlay";
import { ResumeDialog, SavedExamState } from "@/components/timer/resume-dialog";

// Reusable AudioContext singleton
let audioCtx: AudioContext | null = null;

// Typewriter text component for stage name reveal
function TypewriterText({ text, }: { text: string; key: number; }) {
  return (
    <span className="typewriter-reveal">
      {text.split("").map((char, i) => (
        <span
          key={`${char}-${i}`}
          className="typewriter-char"
          style={{ animationDelay: `${i * 0.05}s` }}
        >
          {char}
        </span>
      ))}
    </span>
  );
}
function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx || audioCtx.state === "closed") {
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

// Volume level (0-100, persisted)
let _volumeLevel = 80;
if (typeof window !== "undefined") {
  const stored = localStorage.getItem("exam-timer-volume");
  if (stored !== null) _volumeLevel = Math.max(0, Math.min(100, Number(stored) || 80));
}
export function getVolumeLevel() { return _volumeLevel; }
export function setVolumeLevel(v: number) { _volumeLevel = Math.max(0, Math.min(100, v)); localStorage.setItem("exam-timer-volume", String(_volumeLevel)); }

function playBeep(variant: "warning" | "end" | "finish" | "water" = "warning") {
  const ctx = getAudioContext();
  if (!ctx) return;
  const vol = _volumeLevel / 100;
  try {
    if (variant === "finish") {
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        gain.gain.value = 0.2 * vol;
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.15);
      });
      return;
    }
    if (variant === "water") {
      // Gentle 440Hz single beep, shorter duration
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.value = 440;
      oscillator.type = "sine";
      gainNode.gain.value = 0.15 * vol;
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.3);
      return;
    }
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    if (variant === "end") {
      oscillator.frequency.value = 880;
      gainNode.gain.value = 0.3 * vol;
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.15);
      setTimeout(() => {
        const ctx2 = getAudioContext();
        if (!ctx2) return;
        const osc2 = ctx2.createOscillator();
        const gain2 = ctx2.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx2.destination);
        osc2.frequency.value = 1100;
        gain2.gain.value = 0.3 * vol;
        osc2.start(ctx2.currentTime);
        osc2.stop(ctx2.currentTime + 0.2);
      }, 200);
    } else {
      oscillator.frequency.value = 660;
      gainNode.gain.value = 0.2 * vol;
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.15);
    }
  } catch {
    // Audio error, ignore
  }
}

async function requestNotificationPermission() {
  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }
}

function sendNotification(title: string, body: string) {
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: "/logo.svg" });
  }
}

// PWA BeforeInstallPromptEvent type
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Home() {
  const timer = useExamTimer();
  const tts = useTTS();
  useDynamicFavicon(timer.status, timer.remainingSeconds);

  // --- State ---
  const [ttsEnabled, setTtsEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("exam-timer-tts");
      if (stored !== null) return stored === "true";
    }
    return true;
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("exam-timer-sound");
      if (stored !== null) return stored === "true";
    }
    return true;
  });
  const [showStageSelect, setShowStageSelect] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const confettiShownRef = useRef(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [showGreenFlash, setShowGreenFlash] = useState(false);
  const prevStageIndexRef = useRef(0);
  const prevStageNaturalEndRef = useRef(false);

  // Exam history tracking
  const [currentExamId, setCurrentExamId] = useState<number | null>(null);
  const [historyRecords, setHistoryRecords] = useState<ExamHistoryRecord[]>([]);
  const [expandedHistoryId, setExpandedHistoryId] = useState<number | null>(null);
  const examStagesRef = useRef<StageRecord[]>([]);

  // Custom stage durations
  const [customDurations, setCustomDurations] = useState<Record<string, string>>({});

  // PWA install prompt
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastIdRef = useRef(0);

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Focus mode state
  const [focusMode, setFocusMode] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("exam-timer-focus-mode");
      if (stored !== null) return stored === "true";
    }
    return false;
  });

  // Current exam template
  const [currentTemplateId, setCurrentTemplateId] = useState<string>("tdxl-en");

  // Share dialog state
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareText, setShareText] = useState("");

  // Stage celebration state
  const [celebratingStageIndex, setCelebratingStageIndex] = useState<number | null>(null);

  // Practice mode state
  const [practiceMode, setPracticeMode] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("exam-timer-practice-mode");
      if (stored !== null) return stored === "true";
    }
    return false;
  });
  const [practiceElapsedSeconds, setPracticeElapsedSeconds] = useState(0);
  const practiceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Volume state
  const [volumeLevel, setVolumeLevelState] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("exam-timer-volume");
      if (stored !== null) return Math.max(0, Math.min(100, Number(stored) || 80));
    }
    return 80;
  });
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // Notes panel state
  const [showNotes, setShowNotes] = useState(false);

  // Stage transition overlay state
  const [showStageTransition, setShowStageTransition] = useState(false);
  const [transitionStage, setTransitionStage] = useState<ExamStage | null>(null);

  // Break timer state
  const [showBreakTimer, setShowBreakTimer] = useState(false);
  const [breakDuration, setBreakDuration] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("exam-timer-break-duration");
      if (stored !== null) return Number(stored) || 2;
    }
    return 2;
  });

  // Countdown-to-start state
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState(3);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Resume state
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [savedExamState, setSavedExamState] = useState<SavedExamState | null>(null);

  // Motivational quote state
  const [currentQuote, setCurrentQuote] = useState<Quote>(() => MOTIVATIONAL_QUOTES[0]);
  const quoteIndexRef = useRef(0);

  // Water reminder state
  const [waterReminderEnabled, setWaterReminderEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("exam-timer-water-reminder");
      if (stored !== null) return stored === "true";
    }
    return true;
  });
  const [waterReminderInterval, setWaterReminderInterval] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("exam-timer-water-interval");
      if (stored !== null) return Number(stored) || 20;
    }
    return 20;
  });
  const [waterReminderCount, setWaterReminderCount] = useState(0);
  const lastWaterReminderAt = useRef<number>(0);
  const waterReminderStartRef = useRef<number>(0); // timestamp when exam started
  const [showWaterDrop, setShowWaterDrop] = useState(false);
  const [showStretchBreak, setShowStretchBreak] = useState(false);
  const [stretchBreakSeconds, setStretchBreakSeconds] = useState(5);
  const stretchBreakIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Language state
  const [language, setLanguage] = useState<LangType>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("exam-timer-language");
      if (stored === "en" || stored === "zh") return stored;
    }
    return "zh";
  });

  // Dark mode
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("exam-timer-dark-mode");
      if (stored !== null) return stored === "true";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  // Accent color
  const [accentColor, setAccentColor] = useState<"emerald" | "amber" | "rose" | "violet" | "cyan">(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("exam-timer-accent-color");
      if (stored === "emerald" || stored === "amber" || stored === "rose" || stored === "violet" || stored === "cyan") return stored;
    }
    return "emerald";
  });
  const [showAccentPicker, setShowAccentPicker] = useState(false);

  // --- 3D Tilt handler for timer card ---
  const timerCardRef = useRef<HTMLDivElement>(null);
  const handleTimerCardMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = timerCardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const maxTilt = 3; // degrees
    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }, []);
  const handleTimerCardMouseLeave = useCallback(() => {
    const card = timerCardRef.current;
    if (!card) return;
    card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
  }, []);

  // --- Computed values ---
  const showRingBurstNow = timer.stageProgress >= 99.5 && timer.stageProgress < 100.5 && timer.status === "running" && !practiceMode;

  const timeDisplay = formatTimeWithLabel(practiceMode && timer.status !== "idle" ? practiceElapsedSeconds : timer.remainingSeconds);
  const currentStage = timer.currentStage;

  const isWarning = !practiceMode && timer.remainingSeconds <= 10 && timer.remainingSeconds > 0 && timer.status === "running";
  const isUrgent = !practiceMode && timer.remainingSeconds <= 30 && timer.remainingSeconds > 0 && timer.status === "running";
  const isFinished = timer.status === "finished";

  const stageElapsedSeconds = practiceMode ? practiceElapsedSeconds : (currentStage.duration * 60 - timer.remainingSeconds);
  const stageElapsedMinutesDisplay = Math.floor(stageElapsedSeconds / 60);
  const stageElapsedSecDisplay = stageElapsedSeconds % 60;

  const currentTotalDuration = EXAM_STAGES.reduce((acc, s) => acc + s.duration, 0);

  // --- Exam History API helpers ---
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/exam-history");
      if (res.ok) {
        const data = await res.json();
        setHistoryRecords(data);
      }
    } catch {
      // Gracefully fail
    }
  }, []);

  const createExamRecord = useCallback(async () => {
    try {
      const totalDuration = EXAM_STAGES.reduce((acc, s) => acc + s.duration * 60, 0);
      const initialStages: StageRecord[] = EXAM_STAGES.map((s) => ({
        stageId: s.id,
        stageName: s.name,
        duration: s.duration,
        status: "not_reached" as const,
        elapsedSeconds: 0,
      }));
      examStagesRef.current = initialStages;
      const res = await fetch("/api/exam-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startedAt: new Date().toISOString(),
          status: "in_progress",
          totalDurationSeconds: totalDuration,
          stagesJson: JSON.stringify(initialStages),
        }),
      });
      if (res.ok) {
        const record = await res.json();
        setCurrentExamId(record.id);
      }
    } catch {
      // Gracefully fail
    }
  }, []);

  const updateExamRecord = useCallback(async (updates: {
    status?: string;
    finishedAt?: string | null;
    stagesJson?: string;
  }) => {
    if (!currentExamId) return;
    try {
      await fetch("/api/exam-history", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentExamId, ...updates }),
      });
    } catch {
      // Gracefully fail
    }
  }, [currentExamId]);

  const buildCurrentStagesJson = useCallback(() => {
    const stages: StageRecord[] = EXAM_STAGES.map((s, i) => {
      let stageStatus: "completed" | "skipped" | "not_reached" = "not_reached";
      let elapsed = 0;
      if (i < timer.currentStageIndex) {
        if (timer.isStageCompleted(i)) {
          stageStatus = "completed";
          elapsed = s.duration * 60;
        } else {
          stageStatus = "skipped";
          const existing = examStagesRef.current[i];
          elapsed = existing?.elapsedSeconds ?? 0;
        }
      } else if (i === timer.currentStageIndex && timer.status !== "idle") {
        const stageElapsed = s.duration * 60 - timer.remainingSeconds;
        elapsed = stageElapsed;
        if (timer.status === "finished") {
          stageStatus = "completed";
        }
      }
      return { stageId: s.id, stageName: s.name, duration: s.duration, status: stageStatus, elapsedSeconds: elapsed };
    });
    return JSON.stringify(stages);
  }, [timer]);

  // --- Effects ---

  // Fetch history on mount + cleanup orphaned in_progress records
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/exam-history", { signal: controller.signal })
      .then(res => res.ok ? res.json() : [])
      .then((data: ExamHistoryRecord[]) => {
        setHistoryRecords(data);
        // Auto-abandon orphaned in_progress records (from previous sessions)
        data.filter((r: ExamHistoryRecord) => r.status === "in_progress").forEach((r: ExamHistoryRecord) => {
          fetch("/api/exam-history", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: r.id, status: "abandoned", finishedAt: new Date().toISOString() }),
          }).catch(() => {});
        });
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  // Mark exam as abandoned when page is closed/unloaded
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentExamId && (timer.status === "running" || timer.status === "paused")) {
        // Use synchronous XHR to ensure the request is sent before page unload
        try {
          const xhr = new XMLHttpRequest();
          xhr.open("PATCH", "/api/exam-history", false); // false = synchronous
          xhr.setRequestHeader("Content-Type", "application/json");
          xhr.send(JSON.stringify({ id: currentExamId, status: "abandoned", finishedAt: new Date().toISOString() }));
        } catch {
          // Synchronous XHR may fail in some contexts, gracefully degrade
        }
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [currentExamId, timer.status]);

  // Dark mode toggle with persistence
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("exam-timer-dark-mode", String(isDark));
  }, [isDark]);

  // Accent color persistence + apply data attribute
  useEffect(() => {
    document.documentElement.setAttribute("data-accent", accentColor);
    localStorage.setItem("exam-timer-accent-color", accentColor);
  }, [accentColor]);

  // Persist language
  useEffect(() => { localStorage.setItem("exam-timer-language", language); }, [language]);

  // Persist settings
  useEffect(() => { localStorage.setItem("exam-timer-tts", String(ttsEnabled)); }, [ttsEnabled]);
  useEffect(() => { localStorage.setItem("exam-timer-sound", String(soundEnabled)); }, [soundEnabled]);
  useEffect(() => { localStorage.setItem("exam-timer-focus-mode", String(focusMode)); }, [focusMode]);
  useEffect(() => { localStorage.setItem("exam-timer-practice-mode", String(practiceMode)); }, [practiceMode]);
  useEffect(() => { localStorage.setItem("exam-timer-break-duration", String(breakDuration)); }, [breakDuration]);

  // Persist water reminder settings
  useEffect(() => { localStorage.setItem("exam-timer-water-reminder", String(waterReminderEnabled)); }, [waterReminderEnabled]);
  useEffect(() => { localStorage.setItem("exam-timer-water-interval", String(waterReminderInterval)); }, [waterReminderInterval]);

  // Volume change handler
  const handleVolumeChange = useCallback((v: number) => {
    setVolumeLevelState(v);
    setVolumeLevel(v); // update module-level variable for playBeep
    setTTSVolume(v / 100); // update TTS volume (0-1 range)
  }, []);

  // Persist volume
  useEffect(() => { localStorage.setItem("exam-timer-volume", String(volumeLevel)); }, [volumeLevel]);

  // Focus mode toggle
  const toggleFocusMode = useCallback(() => { setFocusMode((prev) => !prev); }, []);

  // Language toggle
  const toggleLanguage = useCallback(() => { setLanguage((prev) => prev === "zh" ? "en" : "zh"); }, []);

  // Load exam template
  const handleLoadTemplate = useCallback((templateId: string) => {
    const template = getTemplateById(templateId);
    if (!template) return;
    setCurrentTemplateId(templateId);
    timer.loadStages(template.stages);
    setCustomDurations({});
    setShowSettings(false);
  }, [timer]);

  // Request notification permission on first start
  useEffect(() => {
    if (timer.status === "running") requestNotificationPermission();
  }, [timer.status]);

  // Toast notification helper
  const addToast = useCallback((message: string, type: 'stage' | 'warning' | 'complete' = 'stage') => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => { setToasts((prev) => prev.filter((t) => t.id !== id)); }, 3000);
  }, []);

  // Register TTS callbacks
  useEffect(() => {
    timer.setOnStageEnd((message: string) => {
      if (ttsEnabled) tts.speak(message);
      if (soundEnabled) playBeep("end");
      sendNotification(t("notification.stageChange", language), message);
      addToast(message, "stage");
    });
    timer.setOnWarning((message: string) => {
      if (!practiceMode) {
        if (ttsEnabled) tts.speak(message);
        if (soundEnabled) playBeep("warning");
        sendNotification(t("notification.timeWarning", language), message);
        addToast(message, "warning");
      }
    });
  }, [timer.setOnStageEnd, timer.setOnWarning, ttsEnabled, tts, soundEnabled, addToast, practiceMode]);

  // Show confetti on exam finish
  useEffect(() => {
    if (timer.status === "finished" && !confettiShownRef.current) {
      confettiShownRef.current = true;
      setTimeout(() => {
        setShowGreenFlash(true);
        setTimeout(() => setShowGreenFlash(false), 800);
      }, 0);
      if (currentExamId) {
        const stagesJson = buildCurrentStagesJson();
        updateExamRecord({ status: "completed", finishedAt: new Date().toISOString(), stagesJson });
        setTimeout(() => { setCurrentExamId(null); fetchHistory(); }, 0);
      }
      const showTimer = setTimeout(() => {
        setShowConfetti(true);
        if (soundEnabled) playBeep("finish");
        if (ttsEnabled) tts.speak("恭喜你，考试结束！");
        sendNotification(t("notification.examEnd", language), t("notification.examEndBody", language));
        addToast(t("notification.congrats", language), "complete");
      }, 100);
      const hideTimer = setTimeout(() => setShowConfetti(false), 6500);
      return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
    } else if (timer.status !== "finished") {
      confettiShownRef.current = false;
    }
  }, [timer.status, soundEnabled, ttsEnabled, tts, currentExamId, updateExamRecord, buildCurrentStagesJson, fetchHistory, addToast]);

  // Track stage changes for transition animation + break timer
  useEffect(() => {
    const prevIndex = prevStageIndexRef.current;
    if (timer.currentStageIndex !== prevIndex && timer.status !== "idle") {
      // Check if it was a natural completion
      const wasNatural = timer.isStageCompleted(prevIndex);
      prevStageNaturalEndRef.current = wasNatural;

      // Break timer: only for natural completions, not finished, not practice mode, break duration > 0
      if (wasNatural && timer.status !== "finished" && !practiceMode && breakDuration > 0) {
        // Pause the exam timer and show break overlay
        setTimeout(() => {
          timer.pause();
          setShowBreakTimer(true);
        }, 0);
      }

      // Stage transition overlay (only for natural completions, not skips)
      if (wasNatural && timer.status !== "finished") {
        const newStage = EXAM_STAGES[timer.currentStageIndex];
        if (newStage) {
          // Defer setState to avoid cascading renders
          setTimeout(() => {
            setTransitionStage(newStage);
            setShowStageTransition(true);
            setTimeout(() => setShowStageTransition(false), 1500);
          }, 0);
        }
      }
    }
    prevStageIndexRef.current = timer.currentStageIndex;
  }, [timer.currentStageIndex, timer.isStageCompleted, timer.status, practiceMode, breakDuration]);

  // Stage completion celebration
  useEffect(() => {
    const prevIndex = prevStageIndexRef.current;
    if (timer.currentStageIndex !== prevIndex && timer.isStageCompleted(prevIndex) && timer.status !== "idle") {
      setCelebratingStageIndex(prevIndex);
      setTimeout(() => setCelebratingStageIndex(null), 600);
    }
  }, [timer.currentStageIndex, timer.isStageCompleted, timer.status]);

  // Update page title
  useEffect(() => {
    if (focusMode && timer.status !== "idle") {
      document.title = `🎯 ${t("header.focusMode", language)} - ${formatTime(timer.remainingSeconds)} | ${t("footer.systemName", language)}`;
    } else if (practiceMode && timer.status !== "idle") {
      document.title = `🏃 ${formatTime(practiceElapsedSeconds)} | ${t("footer.systemName", language)}`;
    } else if (timer.status === "running" || timer.status === "paused") {
      document.title = `${formatTime(timer.remainingSeconds)} - ${language === "en" ? timer.currentStage.nameEn : timer.currentStage.name} | ${t("footer.systemName", language)}`;
    } else if (timer.status === "finished") {
      document.title = `🎉 ${t("status.finished", language)} | ${t("footer.systemName", language)}`;
    } else {
      document.title = t("footer.systemName", language);
    }
  }, [timer.remainingSeconds, timer.status, timer.currentStage, focusMode, practiceMode, practiceElapsedSeconds, language]);

  // Practice mode: count up timer
  useEffect(() => {
    if (practiceMode && timer.status === "running") {
      practiceIntervalRef.current = setInterval(() => {
        setPracticeElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (practiceIntervalRef.current) {
        clearInterval(practiceIntervalRef.current);
        practiceIntervalRef.current = null;
      }
    }
    return () => {
      if (practiceIntervalRef.current) clearInterval(practiceIntervalRef.current);
    };
  }, [practiceMode, timer.status]);

  // Water reminder: track elapsed time during exam running and trigger reminder
  const triggerWaterReminder = useCallback(() => {
    // Toast notification
    addToast(language === "zh" ? "💧 记得喝水，休息一下眼睛" : "💧 Remember to drink water and rest your eyes", "stage");
    // Sound
    if (soundEnabled) playBeep("water");
    // TTS
    if (ttsEnabled) tts.speak(language === "zh" ? "记得喝水，休息一下眼睛" : "Remember to drink water and rest your eyes");
    // Browser notification
    sendNotification(
      language === "zh" ? "💧 喝水提醒" : "💧 Water Break",
      language === "zh" ? "记得喝水，休息一下眼睛" : "Remember to drink water and rest your eyes"
    );
    // Increment count
    setWaterReminderCount(prev => prev + 1);
    // Show water drop animation
    setShowWaterDrop(true);
    setTimeout(() => setShowWaterDrop(false), 1500);
    // Record last reminder time
    lastWaterReminderAt.current = Date.now();
  }, [language, soundEnabled, ttsEnabled, addToast, tts]);

  // Start tracking water reminder when exam starts running
  useEffect(() => {
    if (timer.status === "running" && waterReminderEnabled) {
      if (waterReminderStartRef.current === 0) {
        waterReminderStartRef.current = Date.now();
        lastWaterReminderAt.current = Date.now();
      }
    } else if (timer.status === "idle" || timer.status === "finished") {
      waterReminderStartRef.current = 0;
      lastWaterReminderAt.current = 0;
    }
  }, [timer.status, waterReminderEnabled]);

  // Water reminder interval check
  useEffect(() => {
    if (timer.status !== "running" || !waterReminderEnabled || practiceMode) return;
    // Don't show if in warning/urgent state (≤30 seconds remaining)
    if (timer.remainingSeconds <= 30) return;

    const intervalMs = waterReminderInterval * 60 * 1000;
    const now = Date.now();
    const elapsed = now - lastWaterReminderAt.current;

    if (lastWaterReminderAt.current > 0 && elapsed >= intervalMs) {
      triggerWaterReminder();
    }
  }, [timer.status, timer.remainingSeconds, waterReminderEnabled, waterReminderInterval, practiceMode, triggerWaterReminder]);

  // Stretch break countdown
  useEffect(() => {
    if (!showStretchBreak) return;
    setStretchBreakSeconds(5);
    stretchBreakIntervalRef.current = setInterval(() => {
      setStretchBreakSeconds(prev => {
        if (prev <= 1) {
          if (stretchBreakIntervalRef.current) {
            clearInterval(stretchBreakIntervalRef.current);
            stretchBreakIntervalRef.current = null;
          }
          setShowStretchBreak(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (stretchBreakIntervalRef.current) {
        clearInterval(stretchBreakIntervalRef.current);
        stretchBreakIntervalRef.current = null;
      }
    };
  }, [showStretchBreak]);

  // Show stretch break after water drop animation ends
  useEffect(() => {
    if (showWaterDrop) {
      const timer = setTimeout(() => setShowStretchBreak(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [showWaterDrop]);

  // Reset water count when exam resets or finishes
  useEffect(() => {
    if (timer.status === "idle" || timer.status === "finished") {
      setWaterReminderCount(0);
    }
  }, [timer.status]);

  // Reset practice elapsed when stage changes
  useEffect(() => {
    if (practiceMode) {
      // Defer setState to avoid cascading renders
      setTimeout(() => setPracticeElapsedSeconds(0), 0);
    }
  }, [practiceMode, timer.currentStageIndex]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Header scroll shadow
  useEffect(() => {
    const handleScroll = () => setHeaderScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Motivational quote cycling - change every 60 seconds during exam
  useEffect(() => {
    if (timer.status !== "running") return;

    // Set initial quote
    const startIdx = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    quoteIndexRef.current = startIdx;
    setCurrentQuote(MOTIVATIONAL_QUOTES[startIdx]);

    const interval = setInterval(() => {
      quoteIndexRef.current = (quoteIndexRef.current + 1) % MOTIVATIONAL_QUOTES.length;
      setCurrentQuote(MOTIVATIONAL_QUOTES[quoteIndexRef.current]);
    }, 60000);

    return () => clearInterval(interval);
  }, [timer.status]);

  // --- Handlers ---

  // Auto-save exam state to localStorage every 5 seconds
  useEffect(() => {
    if (timer.status !== "running" && timer.status !== "paused") return;
    const interval = setInterval(() => {
      try {
        // Collect completed stage indices
        const completedIndices: number[] = [];
        for (let i = 0; i < EXAM_STAGES.length; i++) {
          if (timer.isStageCompleted(i)) completedIndices.push(i);
        }
        const state: SavedExamState = {
          currentStageIndex: timer.currentStageIndex,
          remainingSeconds: timer.remainingSeconds,
          status: timer.status as "running" | "paused",
          startedAt: Date.now(),
          completedStages: completedIndices,
          practiceMode,
          practiceElapsedSeconds,
          templateId: currentTemplateId,
          timestamp: Date.now(),
        };
        localStorage.setItem("exam-timer-saved-state", JSON.stringify(state));
      } catch {
        // localStorage error, ignore
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [timer.status, timer.currentStageIndex, timer.remainingSeconds, practiceMode, practiceElapsedSeconds, currentTemplateId, timer]);

  // Clear saved state when exam completes, resets, or is abandoned
  useEffect(() => {
    if (timer.status === "idle" || timer.status === "finished") {
      try { localStorage.removeItem("exam-timer-saved-state"); } catch { /* ignore */ }
    }
  }, [timer.status]);

  // On mount, check for saved exam state
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("exam-timer-saved-state");
      if (!stored) return;
      const parsed = JSON.parse(stored) as SavedExamState;
      if (parsed && (parsed.status === "running" || parsed.status === "paused")) {
        setSavedExamState(parsed);
        setShowResumeDialog(true);
      } else {
        localStorage.removeItem("exam-timer-saved-state");
      }
    } catch {
      localStorage.removeItem("exam-timer-saved-state");
    }
  }, []);

  // Resume exam from saved state
  const handleResumeExam = useCallback((state: SavedExamState) => {
    setShowResumeDialog(false);

    // If the template is different, load the correct template first
    if (state.templateId && state.templateId !== currentTemplateId) {
      const template = getTemplateById(state.templateId);
      if (template) {
        setCurrentTemplateId(state.templateId);
        timer.loadStages(template.stages);
      }
    }

    // Calculate time drift since save
    const now = Date.now();
    const elapsedSinceSave = Math.floor((now - state.timestamp) / 1000);
    let adjustedRemaining = state.remainingSeconds;
    let adjustedStageIndex = state.currentStageIndex;
    let adjustedCompletedStages = [...state.completedStages];

    // Only adjust for drift if the exam was running (not paused)
    if (state.status === "running" && elapsedSinceSave > 0) {
      let timeToConsume = elapsedSinceSave;
      let currentRemaining = state.remainingSeconds;
      let stageIdx = state.currentStageIndex;

      // Consume remaining time of current stage
      if (timeToConsume >= currentRemaining) {
        timeToConsume -= currentRemaining;
        // Mark current stage as completed
        if (!adjustedCompletedStages.includes(stageIdx)) {
          adjustedCompletedStages.push(stageIdx);
        }
        stageIdx++;

        // Continue consuming stage durations until we run out of time or stages
        while (timeToConsume > 0 && stageIdx < EXAM_STAGES.length) {
          const stageDuration = EXAM_STAGES[stageIdx].duration * 60;
          if (timeToConsume >= stageDuration) {
            timeToConsume -= stageDuration;
            if (!adjustedCompletedStages.includes(stageIdx)) {
              adjustedCompletedStages.push(stageIdx);
            }
            stageIdx++;
          } else {
            adjustedRemaining = stageDuration - timeToConsume;
            timeToConsume = 0;
          }
        }

        adjustedStageIndex = stageIdx;
      } else {
        adjustedRemaining = currentRemaining - timeToConsume;
      }
    }

    if (adjustedStageIndex >= EXAM_STAGES.length) {
      // Exam finished while offline
      timer.start();
      return;
    }

    // Use restoreState() to properly set all timer state at once
    const resumeStatus = (state.status === "paused") ? "paused" : "running";
    timer.restoreState({
      currentStageIndex: adjustedStageIndex,
      remainingSeconds: adjustedRemaining,
      completedStages: adjustedCompletedStages,
      status: resumeStatus,
    });

    // Set practice mode if needed
    if (state.practiceMode && !practiceMode) {
      setPracticeMode(true);
    }
    setPracticeElapsedSeconds(state.practiceElapsedSeconds || 0);

    // Clear saved state after successful resume
    try { localStorage.removeItem("exam-timer-saved-state"); } catch { /* ignore */ }

    // Create exam record for history if needed
    if (!state.practiceMode) createExamRecord();
  }, [timer, practiceMode, currentTemplateId, createExamRecord]);

  // Discard saved exam state
  const handleDiscardSavedState = useCallback(() => {
    setShowResumeDialog(false);
    setSavedExamState(null);
    try { localStorage.removeItem("exam-timer-saved-state"); } catch { /* ignore */ }
  }, []);

  // Countdown-to-start handlers
  // Note: beep sounds are handled by the CountdownOverlay component via callbacks
  const startCountdown = useCallback(() => {
    setShowCountdown(true);
    setCountdownNumber(3);

    countdownIntervalRef.current = setInterval(() => {
      setCountdownNumber((prev) => {
        if (prev <= 1) {
          // Countdown reached 0
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleCountdownEnd = useCallback(() => {
    setShowCountdown(false);
    setCountdownNumber(3);
    // Actually start the exam
    timer.start();
    if (!practiceMode) createExamRecord();
    if (practiceMode) setPracticeElapsedSeconds(0);
  }, [timer, createExamRecord, practiceMode]);

  const handleCountdownCancel = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setShowCountdown(false);
    setCountdownNumber(3);
  }, []);

  const handleMainButton = useCallback(() => {
    if (timer.status === "idle" || timer.status === "finished") {
      // Start countdown-to-start animation instead of directly starting
      startCountdown();
    } else if (timer.status === "running") {
      timer.pause();
    } else if (timer.status === "paused") {
      timer.start();
    }
  }, [timer, startCountdown]);

  const handleReset = useCallback(() => {
    if (currentExamId && (timer.status === "running" || timer.status === "paused")) {
      const stagesJson = buildCurrentStagesJson();
      updateExamRecord({ status: "abandoned", finishedAt: new Date().toISOString(), stagesJson });
      setCurrentExamId(null);
    }
    timer.reset();
    tts.stop();
    setPracticeElapsedSeconds(0);
    setShowResetConfirm(false);
    fetchHistory();
    // Clear saved state on reset
    try { localStorage.removeItem("exam-timer-saved-state"); } catch { /* ignore */ }
  }, [timer, tts, currentExamId, timer.status, updateExamRecord, buildCurrentStagesJson, fetchHistory]);

  const handleResetClick = useCallback(() => {
    if (timer.status === "running" || timer.status === "paused") {
      setShowResetConfirm(true);
    } else {
      handleReset();
    }
  }, [timer.status, handleReset]);

  const handleStageClick = useCallback((index: number) => {
    timer.jumpToStage(index);
    setShowStageSelect(false);
    if (practiceMode) setPracticeElapsedSeconds(0);
  }, [timer, practiceMode]);

  const handleSkipStage = useCallback(() => {
    if (timer.status !== "running" && timer.status !== "paused") return;
    const skippedIndex = timer.currentStageIndex;
    const stageElapsed = EXAM_STAGES[skippedIndex].duration * 60 - timer.remainingSeconds;
    if (examStagesRef.current[skippedIndex]) {
      examStagesRef.current[skippedIndex] = {
        ...examStagesRef.current[skippedIndex],
        status: "skipped",
        elapsedSeconds: stageElapsed,
      };
    }
    timer.skipStage();
    if (practiceMode) setPracticeElapsedSeconds(0);
    if (currentExamId) {
      setTimeout(() => {
        const stagesJson = buildCurrentStagesJson();
        updateExamRecord({ stagesJson });
      }, 100);
    }
  }, [timer, currentExamId, buildCurrentStagesJson, updateExamRecord, practiceMode]);

  const handleApplySettings = useCallback(() => {
    const newDurations: number[] = [];
    EXAM_STAGES.forEach((stage, i) => {
      const key = `stage-${i}`;
      const val = customDurations[key];
      if (val && !isNaN(Number(val)) && Number(val) > 0) {
        newDurations.push(Number(val));
      } else {
        newDurations.push(stage.duration);
      }
    });
    timer.updateDurations(newDurations);
    setShowSettings(false);
  }, [customDurations, timer]);

  // Break timer: skip break and resume exam
  const handleSkipBreak = useCallback(() => {
    setShowBreakTimer(false);
    timer.start();
  }, [timer]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.code) {
        case "Space":
          e.preventDefault();
          handleMainButton();
          break;
        case "KeyR":
          if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); handleResetClick(); }
          break;
        case "KeyT":
          if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); setTtsEnabled((prev) => !prev); }
          break;
        case "KeyS":
          if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); setSoundEnabled((prev) => !prev); }
          break;
        case "KeyD":
          if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); setIsDark((prev) => !prev); }
          break;
        case "KeyF":
          if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); toggleFullscreen(); }
          break;
        case "KeyN":
          if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); if (timer.status === "running" || timer.status === "paused") handleSkipStage(); }
          break;
        case "KeyM":
          if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); toggleFocusMode(); }
          break;
        case "KeyC":
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            const accentCycle: ("emerald" | "amber" | "rose" | "violet" | "cyan")[] = ["emerald", "amber", "rose", "violet", "cyan"];
            const curIdx = accentCycle.indexOf(accentColor);
            setAccentColor(accentCycle[(curIdx + 1) % accentCycle.length]);
          }
          break;
        case "KeyP":
          if (!e.ctrlKey && !e.metaKey && !focusMode) { e.preventDefault(); setShowNotes((prev) => !prev); }
          break;
        case "KeyL":
          if (!e.ctrlKey && !e.metaKey && practiceMode && timer.status === "running") {
            e.preventDefault();
            // Dispatch custom event for notes panel
            window.dispatchEvent(new CustomEvent("add-lap", { detail: practiceElapsedSeconds }));
            addToast(`⏱ 圈标记: ${Math.floor(practiceElapsedSeconds / 60)}:${(practiceElapsedSeconds % 60).toString().padStart(2, "0")}`, "stage");
          }
          break;
        case "KeyW":
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            // Manual water reminder trigger (for testing)
            if (timer.status === "running" && waterReminderEnabled) {
              triggerWaterReminder();
            }
          }
          break;
        case "Escape":
          setShowStageSelect(false);
          setShowShortcuts(false);
          setShowResetConfirm(false);
          setShowNotes(false);
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleMainButton, handleResetClick, toggleFullscreen, handleSkipStage, toggleFocusMode, practiceMode, timer.status, practiceElapsedSeconds, addToast, focusMode, accentColor, waterReminderEnabled, triggerWaterReminder]);

  // Service worker registration
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // PWA install prompt
  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e as BeforeInstallPromptEvent); setShowInstallBanner(true); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallApp = useCallback(async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setShowInstallBanner(false);
    setInstallPrompt(null);
  }, [installPrompt]);

  const handleDeleteHistory = useCallback(async (id: number) => {
    try {
      const res = await fetch("/api/exam-history", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (res.ok) { setHistoryRecords((prev) => prev.filter((r) => r.id !== id)); setDeleteConfirmId(null); }
    } catch { /* Gracefully fail */ }
  }, []);

  // Share text generation
  const generateShareText = useCallback(() => {
    const template = getTemplateById(currentTemplateId);
    const templateName = template?.name || "自定义考试";
    const now = new Date();
    const dateStr = now.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
    const totalElapsed = timer.totalElapsedSeconds;
    const totalMin = Math.floor(totalElapsed / 60);
    const totalSec = totalElapsed % 60;
    let text = `📊 智能考试倒计时 - 考试报告\n\n考试类型: ${templateName}\n日期: ${dateStr}\n总用时: ${totalMin}:${totalSec.toString().padStart(2, "0")}\n\n阶段详情:\n`;
    EXAM_STAGES.forEach((stage, i) => {
      const isCompleted = timer.isStageCompleted(i);
      const isSkipped = timer.isStageSkipped(i);
      const isCurrent = i === timer.currentStageIndex && timer.status !== "idle";
      let stageTime = "0"; let statusIcon = "—"; let statusText = "未参与";
      if (isCompleted) { stageTime = `${stage.duration}/${stage.duration}`; statusIcon = "✓"; statusText = "已完成"; }
      else if (isSkipped) { const skipElapsed = timer.stageElapsedMap.get(i) || 0; stageTime = `${Math.floor(skipElapsed / 60)}`; statusIcon = "⏭"; statusText = "已跳过"; }
      else if (isCurrent) { const curElapsed = timer.stageElapsedMap.get(i) || (stage.duration * 60 - timer.remainingSeconds); stageTime = `${Math.floor(curElapsed / 60)}`; statusIcon = "▶"; statusText = timer.status === "finished" ? "已完成" : "进行中"; }
      text += `${statusIcon} ${stage.name} ${stageTime}/${stage.duration}分钟 (${statusText})\n`;
    });
    const completedCount = EXAM_STAGES.filter((_, i) => timer.isStageCompleted(i)).length;
    const totalStages = EXAM_STAGES.length;
    const completionRate = totalStages > 0 ? Math.round((completedCount / totalStages) * 100) : 0;
    text += `\n完成率: ${completedCount}/${totalStages} (${completionRate}%)`;
    if (waterReminderCount > 0) {
      text += `\n💧 喝水提醒: ${waterReminderCount}次`;
    }
    return text;
  }, [currentTemplateId, timer, waterReminderCount]);

  const handleOpenShareDialog = useCallback(() => {
    setShareText(generateShareText());
    setShowShareDialog(true);
  }, [generateShareText]);

  const handleCopyShare = useCallback(async () => {
    const text = generateShareText();
    try { await navigator.clipboard.writeText(text); addToast("已复制到剪贴板", "complete"); }
    catch { const textarea = document.createElement("textarea"); textarea.value = text; document.body.appendChild(textarea); textarea.select(); document.execCommand("copy"); document.body.removeChild(textarea); addToast("已复制到剪贴板", "complete"); }
  }, [generateShareText, addToast]);

  const handleDownloadShare = useCallback(() => {
    const text = generateShareText();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `考试报告_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    addToast("已下载报告文件", "complete");
  }, [generateShareText, addToast]);

  // --- Button helpers ---
  const getMainButtonLabel = () => {
    switch (timer.status) {
      case "idle": return practiceMode ? t("control.startPractice", language) : t("control.startExam", language);
      case "running": return t("control.pause", language);
      case "paused": return t("control.continue", language);
      case "finished": return t("control.restart", language);
    }
  };

  const getMainButtonIcon = () => {
    switch (timer.status) {
      case "idle": return <Play className="size-5" />;
      case "running": return <Pause className="size-5" />;
      case "paused": return <Play className="size-5" />;
      case "finished": return <RotateCcw className="size-5" />;
    }
  };

  const getMainButtonVariant = (): "default" | "secondary" | "destructive" => {
    switch (timer.status) {
      case "idle": return "default";
      case "running": return "destructive";
      case "paused": return "default";
      case "finished": return "default";
    }
  };

  // --- Render ---

  return (
    <TooltipProvider delayDuration={300}>
      <div className={`min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300 ${isDark ? "dark-starfield" : ""}`}>
        {/* Green Flash Overlay */}
        {showGreenFlash && <div className="fixed inset-0 z-[99] pointer-events-none bg-accent-400/30 green-flash-overlay" />}

        {/* Confetti */}
        <AnimatePresence>{showConfetti && <Confetti />}</AnimatePresence>

        {/* Urgent/Warning Pulse Background */}
        {(isWarning || isUrgent) && <div className={`fixed inset-0 z-0 pointer-events-none ${isWarning ? "bg-red-500" : "bg-amber-500"} urgent-pulse-bg`} />}

        {/* Animated Gradient Mesh Background */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="gradient-mesh-blob gradient-mesh-blob-1" />
          <div className="gradient-mesh-blob gradient-mesh-blob-2" />
          <div className="gradient-mesh-blob gradient-mesh-blob-3" />
        </div>

        {/* Stage Transition Overlay */}
        <StageTransitionOverlay show={showStageTransition} stage={transitionStage} language={language} />

        {/* Countdown-to-Start Overlay */}
        <CountdownOverlay
          show={showCountdown}
          stage={currentStage}
          countdownNumber={countdownNumber}
          onCancel={handleCountdownCancel}
          onCountdownEnd={handleCountdownEnd}
          onPlayWarningBeep={() => { if (soundEnabled) playBeep("warning"); }}
          onPlayEndBeep={() => { if (soundEnabled) playBeep("end"); }}
          soundEnabled={soundEnabled}
        />

        {/* Resume Dialog */}
        <ResumeDialog
          open={showResumeDialog}
          savedState={savedExamState}
          onResume={handleResumeExam}
          onDiscard={handleDiscardSavedState}
          language={language}
        />

        {/* Break Timer Overlay */}
        <BreakTimerOverlay
          show={showBreakTimer}
          breakDuration={breakDuration}
          onSkipBreak={handleSkipBreak}
          onExtendBreak={() => {}}
          soundEnabled={soundEnabled}
          language={language}
        />

        {/* PWA Install Banner */}
        <AnimatePresence>
          {showInstallBanner && (
            <motion.div initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -80, opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-accent-from to-accent-to text-white shadow-lg">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3"><Download className="size-5 shrink-0" /><div><p className="text-sm font-medium">{t("pwa.install", language)}</p><p className="text-xs opacity-80">{t("pwa.installDesc", language)}</p></div></div>
                <div className="flex items-center gap-2"><Button size="sm" variant="outline" onClick={handleInstallApp} className="bg-white/20 border-white/40 text-white hover:bg-white/30">{t("pwa.installBtn", language)}</Button><Button size="icon" variant="ghost" onClick={() => setShowInstallBanner(false)} className="text-white/80 hover:text-white hover:bg-white/10 size-8">✕</Button></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast Notifications */}
        <ToastNotifications toasts={toasts} />

        {/* Header */}
        <header className={`border-b backdrop-blur-md sticky top-0 z-50 transition-shadow duration-300 header-shimmer-border ${timer.status === "running" ? "header-running-gradient" : "bg-white/80 dark:bg-slate-900/80"} ${headerScrolled ? "header-scrolled" : ""}`}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-gradient-to-br from-accent-from to-accent-to flex items-center justify-center shadow-md shadow-accent-200 dark:shadow-accent-900/40">
                <Timer className="size-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {focusMode ? t("header.focusMode", language) : practiceMode ? t("header.practiceMode", language) : t("header.title", language)}
                  {timer.status === "running" && (
                    <span className="inline-flex items-center gap-1">
                      <span className="size-2 rounded-full bg-accent-500 animate-pulse shadow-sm shadow-accent-400" />
                      <span className="text-[10px] font-normal text-accent-600 dark:text-accent-400 hidden sm:inline">LIVE</span>
                    </span>
                  )}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {focusMode ? t("header.focusSubtitle", language) : practiceMode ? t("header.practiceSubtitle", language) : t("header.subtitle", language)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
              {/* Practice mode badge */}
              {practiceMode && <Badge className="practice-mode-badge text-white text-[10px] px-2">{t("badge.practice", language)}</Badge>}

              <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => { if (!focusMode) setShowNotes((prev) => !prev); }} className={`size-9 ${showNotes ? "text-accent-600 dark:text-accent-400" : "text-slate-400"} ${focusMode ? "opacity-40 cursor-not-allowed" : ""}`} aria-label={t("tooltip.notes", language)}><StickyNote className="size-4" /></Button></TooltipTrigger><TooltipContent className="tooltip-animate"><p>{t("tooltip.notes", language)}</p></TooltipContent></Tooltip>

              <AmbientSound timerStatus={timer.status} language={language} />

              {/* Water Reminder Toggle */}
              <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => setWaterReminderEnabled(prev => !prev)} className={`size-9 relative ${waterReminderEnabled ? "text-cyan-500 dark:text-cyan-400" : "text-slate-400"}`} aria-label={waterReminderEnabled ? t("tooltip.waterReminderOff", language) : t("tooltip.waterReminder", language).replace("{interval}", String(waterReminderInterval))}>{waterReminderEnabled ? <Droplets className="size-4" /> : <Droplet className="size-4" />}{waterReminderCount > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] rounded-full bg-cyan-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5">{waterReminderCount}</span>}</Button></TooltipTrigger><TooltipContent className="tooltip-animate"><p>{waterReminderEnabled ? t("tooltip.waterReminder", language).replace("{interval}", String(waterReminderInterval)) : t("tooltip.waterReminderOff", language)}</p></TooltipContent></Tooltip>

              <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={toggleFocusMode} className={`size-9 ${focusMode ? "text-accent-600 dark:text-accent-400" : "text-slate-400"}`} aria-label={t("tooltip.focusMode", language)}>{focusMode ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</Button></TooltipTrigger><TooltipContent className="tooltip-animate"><p>{t("tooltip.focusMode", language)}</p></TooltipContent></Tooltip>

              <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => setTtsEnabled(!ttsEnabled)} className={`size-9 ${ttsEnabled ? "text-accent-600 dark:text-accent-400" : "text-slate-400"}`} aria-label={ttsEnabled ? t("tooltip.ttsOff", language) : t("tooltip.ttsOn", language)}>{ttsEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}</Button></TooltipTrigger><TooltipContent className="tooltip-animate"><p>{ttsEnabled ? t("tooltip.ttsOn", language) : t("tooltip.ttsOff", language)}</p></TooltipContent></Tooltip>

              <div className="relative">
                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => setShowVolumeSlider(!showVolumeSlider)} className={`size-9 ${soundEnabled ? "text-accent-600 dark:text-accent-400" : "text-slate-400"}`} aria-label={soundEnabled ? t("tooltip.soundOff", language) : t("tooltip.soundOn", language)}>{soundEnabled ? <Bell className="size-4" /> : <BellOff className="size-4" />}</Button></TooltipTrigger><TooltipContent className="tooltip-animate"><p>{soundEnabled ? t("tooltip.soundOn", language) : t("tooltip.soundOff", language)}</p></TooltipContent></Tooltip>
                <AnimatePresence>
                  {showVolumeSlider && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full right-0 mt-2 z-[70] glass-card rounded-xl p-3 shadow-xl border border-white/20 dark:border-white/10"
                      onBlur={() => setShowVolumeSlider(false)}
                    >
                      <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-2 text-center">{t("tooltip.volume", language)} {volumeLevel}%</div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={volumeLevel}
                        onChange={(e) => handleVolumeChange(Number(e.target.value))}
                        className="w-24 h-1.5 appearance-none bg-slate-200 dark:bg-slate-700 rounded-full cursor-pointer accent-accent-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-500 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex items-center justify-between mt-2 gap-1">
                        <Button size="icon" variant="ghost" className="size-6 text-slate-400 hover:text-accent-600" onClick={() => { setSoundEnabled(true); setShowVolumeSlider(false); }} aria-label="开启提示音">
                          <Bell className="size-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="size-6 text-slate-400 hover:text-red-500" onClick={() => { setSoundEnabled(false); setShowVolumeSlider(false); }} aria-label="关闭提示音">
                          <BellOff className="size-3" />
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => setIsDark(!isDark)} className="size-9" aria-label={isDark ? t("tooltip.theme", language) : t("tooltip.theme", language)}>{isDark ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4" />}</Button></TooltipTrigger><TooltipContent className="tooltip-animate"><p>{t("tooltip.theme", language)}</p></TooltipContent></Tooltip>

              {/* Accent Color Picker */}
              <div className="relative">
                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => setShowAccentPicker(!showAccentPicker)} className="size-9" aria-label={language === "zh" ? "主题色" : "Accent Color"}>
                  <span className={`size-4 rounded-full bg-accent-500 ring-2 ring-accent-200 dark:ring-accent-800 inline-block transition-colors duration-300`} />
                </Button></TooltipTrigger><TooltipContent className="tooltip-animate"><p>{language === "zh" ? "主题色 (C)" : "Accent Color (C)"}</p></TooltipContent></Tooltip>
                <AnimatePresence>
                  {showAccentPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full right-0 mt-2 z-[70] glass-card rounded-xl p-2 shadow-xl border border-white/20 dark:border-white/10 min-w-[140px]"
                    >
                      {([
                        { id: "emerald" as const, nameZh: "翡翠", nameEn: "Emerald", color: "#10b981" },
                        { id: "amber" as const, nameZh: "琥珀", nameEn: "Amber", color: "#f59e0b" },
                        { id: "rose" as const, nameZh: "玫瑰", nameEn: "Rose", color: "#f43f5e" },
                        { id: "violet" as const, nameZh: "紫罗兰", nameEn: "Violet", color: "#8b5cf6" },
                        { id: "cyan" as const, nameZh: "青色", nameEn: "Cyan", color: "#06b6d4" },
                      ]).map((option) => (
                        <button
                          key={option.id}
                          onClick={() => { setAccentColor(option.id); setShowAccentPicker(false); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all hover:bg-slate-100 dark:hover:bg-slate-800 ${accentColor === option.id ? "bg-accent-50 dark:bg-accent-50/10" : ""}`}
                        >
                          <span className="size-4 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-white dark:ring-offset-slate-900 transition-all" style={{ backgroundColor: option.color, ringColor: accentColor === option.id ? option.color : "transparent" }} />
                          <span className={`text-xs font-medium ${accentColor === option.id ? "text-accent-600 dark:text-accent-400" : "text-slate-700 dark:text-slate-300"}`}>
                            {language === "zh" ? option.nameZh : option.nameEn}
                          </span>
                          {accentColor === option.id && (
                            <span className="ml-auto text-accent-500 text-xs">✓</span>
                          )}
                        </button>
                      ))}
                      <div className="text-[9px] text-slate-400 text-center mt-1 pt-1 border-t border-slate-100 dark:border-slate-800">{language === "zh" ? "按 C 切换" : "Press C to cycle"}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => { if (timer.status === "idle" || timer.status === "finished") setShowStageSelect(!showStageSelect); }} className={`size-9 ${timer.status !== "idle" && timer.status !== "finished" ? "opacity-40 cursor-not-allowed" : ""}`} aria-label={t("tooltip.selectStage", language)}><Clock className="size-4" /></Button></TooltipTrigger><TooltipContent className="tooltip-animate"><p>{timer.status !== "idle" && timer.status !== "finished" ? t("tooltip.inExam", language) : t("tooltip.selectStage", language)}</p></TooltipContent></Tooltip>

              <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => { if (timer.status === "idle" || timer.status === "finished") setShowSettings(true); }} className={`size-9 ${timer.status !== "idle" && timer.status !== "finished" ? "opacity-40 cursor-not-allowed" : ""}`} aria-label={t("tooltip.config", language)}><Settings2 className="size-4" /></Button></TooltipTrigger><TooltipContent className="tooltip-animate"><p>{t("tooltip.config", language)}</p></TooltipContent></Tooltip>

              <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={toggleFullscreen} className="size-9" aria-label={t("tooltip.fullscreen", language)}>{isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}</Button></TooltipTrigger><TooltipContent className="tooltip-animate"><p>{t("tooltip.fullscreen", language)}</p></TooltipContent></Tooltip>

              <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => setShowShortcuts(!showShortcuts)} className="size-9" aria-label={t("tooltip.shortcuts", language)}><Keyboard className="size-4" /></Button></TooltipTrigger><TooltipContent className="tooltip-animate"><p>{t("tooltip.shortcuts", language)}</p></TooltipContent></Tooltip>

              <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => { setShowHistory(true); fetchHistory(); }} className="size-9" aria-label={t("tooltip.history", language)}><History className="size-4" /></Button></TooltipTrigger><TooltipContent className="tooltip-animate"><p>{t("tooltip.history", language)}</p></TooltipContent></Tooltip>

              {/* Language Toggle */}
              <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={toggleLanguage} className="size-9 text-slate-400 hover:text-accent-600 dark:hover:text-accent-400" aria-label={t("tooltip.language", language)}><Languages className="size-4" /></Button></TooltipTrigger><TooltipContent className="tooltip-animate"><p>{language === "zh" ? "EN" : "中文"}</p></TooltipContent></Tooltip>
            </div>
          </div>
        </header>

        {/* Overall Progress Bar - hidden in focus mode */}
        {!focusMode && (
        <OverallProgressBar
          overallProgress={timer.overallProgress}
          currentStageIndex={timer.currentStageIndex}
          remainingSeconds={timer.remainingSeconds}
          currentTotalDuration={currentTotalDuration}
          isWarning={isWarning}
          isUrgent={isUrgent}
          isFinished={isFinished}
          currentStageName={language === "en" ? currentStage.nameEn : currentStage.name}
          language={language}
        />
        )}

        {/* Modals (Stage Select, Reset Confirm, Keyboard Shortcuts) */}
        <Modals
          showStageSelect={showStageSelect}
          setShowStageSelect={setShowStageSelect}
          showResetConfirm={showResetConfirm}
          setShowResetConfirm={setShowResetConfirm}
          showShortcuts={showShortcuts}
          setShowShortcuts={setShowShortcuts}
          handleStageClick={handleStageClick}
          handleReset={handleReset}
          currentStageIndex={timer.currentStageIndex}
          timerStatus={timer.status}
          practiceMode={practiceMode}
          language={language}
        />

        {/* Settings Dialog */}
        <SettingsDialog
          open={showSettings}
          onOpenChange={setShowSettings}
          customDurations={customDurations}
          setCustomDurations={setCustomDurations}
          handleApplySettings={handleApplySettings}
          handleLoadTemplate={handleLoadTemplate}
          currentTemplateId={currentTemplateId}
          practiceMode={practiceMode}
          setPracticeMode={setPracticeMode}
          breakDuration={breakDuration}
          setBreakDuration={setBreakDuration}
          language={language}
          waterReminderEnabled={waterReminderEnabled}
          setWaterReminderEnabled={setWaterReminderEnabled}
          waterReminderInterval={waterReminderInterval}
          setWaterReminderInterval={setWaterReminderInterval}
          waterReminderCount={waterReminderCount}
        />

        {/* History Dialog */}
        <HistoryDialog
          open={showHistory}
          onOpenChange={setShowHistory}
          historyRecords={historyRecords}
          expandedHistoryId={expandedHistoryId}
          setExpandedHistoryId={setExpandedHistoryId}
          deleteConfirmId={deleteConfirmId}
          setDeleteConfirmId={setDeleteConfirmId}
          handleDeleteHistory={handleDeleteHistory}
          language={language}
          addToast={addToast}
        />

        {/* Share Dialog */}
        <ShareDialog
          show={showShareDialog}
          setShow={setShowShareDialog}
          shareText={shareText}
          handleCopyShare={handleCopyShare}
          handleDownloadShare={handleDownloadShare}
          language={language}
        />

        {/* Notes Panel */}
        {!focusMode && <NotesPanel show={showNotes} setShow={setShowNotes} examId={currentExamId} />}

        {/* Main Content */}
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Timer & Controls */}
            <div className={`${focusMode ? "lg:col-span-3" : "lg:col-span-2"} space-y-6`}>
              {/* Current Stage Card - with 3D tilt, layered shadow, border glow */}
              <div
                ref={timerCardRef}
                className="card-3d-tilt timer-card-entrance"
                onMouseMove={handleTimerCardMouseMove}
                onMouseLeave={handleTimerCardMouseLeave}
              >
              <Card className={`overflow-hidden border-2 transition-all duration-500 card-inner-glow glass-card ${timer.status === "running" ? "glass-card-running" : ""} card-layered-shadow relative ${isFinished ? "border-accent-500 border-glow-running" : isWarning ? "border-red-500 border-glow-warning" : isUrgent ? "border-amber-400 border-glow-urgent" : timer.status === "running" ? "border-accent-500 border-glow-running" : timer.status === "paused" ? "border-teal-400 border-glow-paused" : "border-slate-200 dark:border-slate-700"}`}>
                {focusMode && <div className="focus-ambient-gradient" aria-hidden="true" />}
                {/* Water Drop Animation */}
                {showWaterDrop && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 water-drop-anim" aria-hidden="true">
                    <Droplet className="size-8 text-cyan-400 fill-cyan-400/40" />
                  </div>
                )}
                {/* Stretch Break Mini-Overlay */}
                {showStretchBreak && (
                  <button
                    onClick={() => setShowStretchBreak(false)}
                    className="absolute bottom-4 right-4 z-20 stretch-break-overlay glass-card rounded-xl px-3 py-2 flex items-center gap-2 text-sm font-medium text-cyan-600 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 cursor-pointer hover:bg-cyan-50 dark:hover:bg-cyan-950/30 transition-colors"
                    aria-label="Dismiss stretch break"
                  >
                    <span>🧘</span>
                    <span>{t("water.stretchBreak", language)} {stretchBreakSeconds}{t("water.stretchSeconds", language)}</span>
                  </button>
                )}
                {/* Stage header bar */}
                <div className={`px-4 sm:px-6 py-3 flex items-center justify-between transition-colors duration-500 ${isFinished ? "bg-gradient-to-r from-accent-50 to-accent-100 dark:from-accent-950/30 dark:to-accent-950/20" : isWarning ? "bg-red-50 dark:bg-red-950/30" : isUrgent ? "bg-amber-50 dark:bg-amber-950/30" : timer.status === "running" ? "bg-accent-50 dark:bg-accent-950/30" : "bg-slate-50 dark:bg-slate-800/50"}`}>
                  <div className="flex items-center gap-3">
                    <AnimatePresence mode="wait">
                      <motion.span key={currentStage.id} initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 180 }} transition={{ type: "spring", damping: 15 }} className="text-2xl">
                        {isFinished ? "🏆" : currentStage.icon}
                      </motion.span>
                    </AnimatePresence>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {isFinished ? t("timer.completed", language) : (
                            <>{t("stage.ordinal", language)}<span className="stage-ordinal-number">{currentStage.id}</span>{t("stage.ordinalSuffix", language)}</>
                          )}
                        </span>
                        <Badge variant={timer.status === "running" ? "default" : timer.status === "paused" ? "secondary" : isFinished ? "default" : "outline"} className={timer.status === "running" || isFinished ? "bg-accent-600" : practiceMode && timer.status === "running" ? "bg-amber-500" : ""}>
                          {timer.status === "idle" ? t("status.notStarted", language) : timer.status === "running" ? (practiceMode ? t("status.practicing", language) : t("status.inProgress", language)) : timer.status === "paused" ? t("status.paused", language) : t("status.finished", language)}
                        </Badge>
                        {isWarning && <Badge variant="destructive" className="animate-pulse"><AlertTriangle className="size-3 mr-1" />{t("status.endingSoon", language)}</Badge>}
                        {practiceMode && timer.status === "running" && <Badge className="practice-mode-badge text-white text-[10px]">{t("badge.practice", language)}</Badge>}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                        {isFinished ? t("timer.congrats", language) : (
                          <TypewriterText key={currentStage.id} text={`${language === "en" ? currentStage.nameEn : currentStage.name} · ${language === "en" ? currentStage.name : currentStage.nameEn}`} />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-slate-500 dark:text-slate-400">{practiceMode ? t("timer.suggestedDuration", language) : t("timer.stageDuration", language)}</div>
                    <div className="font-semibold text-slate-700 dark:text-slate-300">{currentStage.duration}{t("timer.minutes", language)}</div>
                  </div>
                </div>

                {/* Timer Ring */}
                <div className="relative">
                  <TimerRing
                    stageProgress={timer.stageProgress}
                    isFinished={isFinished}
                    isWarning={isWarning}
                    isUrgent={isUrgent}
                    isDark={isDark}
                    isRunning={timer.status === "running"}
                    remainingSeconds={timer.remainingSeconds}
                    timeDisplay={timeDisplay}
                    currentStage={currentStage}
                    stageElapsedMinutesDisplay={stageElapsedMinutesDisplay}
                    stageElapsedSecDisplay={stageElapsedSecDisplay}
                    showRingBurst={showRingBurstNow}
                    focusMode={focusMode}
                    timerStatus={timer.status}
                    practiceMode={practiceMode}
                    practiceElapsedSeconds={practiceElapsedSeconds}
                    language={language}
                    accentColor={accentColor}
                  />
                  {/* Particle trail overlay */}
                  <TimerParticleTrail
                    isRunning={timer.status === "running" && !practiceMode}
                    stageProgress={timer.stageProgress}
                    isUrgent={isUrgent}
                    isWarning={isWarning}
                  />
                </div>

                {/* Estimated Completion Time */}
                {!practiceMode && (timer.status === "running" || timer.status === "paused") && !isFinished && (
                  <div className="px-4 sm:px-6 pb-1">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                      <Clock className="size-3" />
                      <span>
                        {t("timer.estimatedCompletion", language)}: {(() => {
                          const remainingTotalSeconds = EXAM_STAGES.slice(timer.currentStageIndex).reduce((acc, s, i) => acc + (i === 0 ? timer.remainingSeconds : s.duration * 60), 0);
                          const estimatedEnd = new Date(Date.now() + remainingTotalSeconds * 1000);
                          return formatTimeShort(estimatedEnd, language);
                        })()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Stage progress bar */}
                <div className="px-4 sm:px-6 pb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500 dark:text-slate-300">{t("timer.stageProgress", language)}</span>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{isFinished ? "100" : Math.round(timer.stageProgress)}%</span>
                  </div>
                  <Progress value={isFinished ? 100 : timer.stageProgress} className={`h-1.5 ${isFinished ? "[&>div]:bg-accent-500" : isWarning ? "[&>div]:bg-red-500" : isUrgent ? "[&>div]:bg-amber-500" : "[&>div]:bg-accent-500"}`} />
                </div>

                {/* Tips */}
                <div className="px-4 sm:px-6 pb-4 pt-2">
                  <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                    <span>{isFinished ? "🎉" : "💡"}</span>
                    <span>{isFinished ? t("tips.congrats", language) : (language === "en" && currentStage.tipsEn ? currentStage.tipsEn : currentStage.tips)}</span>
                  </div>
                  {/* Motivational Quote - only during exam running */}
                  {timer.status === "running" && (
                    <div className="mt-2 flex items-start gap-1.5 text-xs italic text-slate-400 dark:text-slate-500 px-1 min-h-[2rem]">
                      <span className="shrink-0 mt-px">✨</span>
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={currentQuote.text}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.5, ease: "easeInOut" }}
                          className="inline"
                        >
                          &ldquo;{currentQuote.text}&rdquo;{currentQuote.author ? ` — ${currentQuote.author}` : ""}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </Card>
              </div>

              {/* Control Buttons - Desktop */}
              <DesktopControls
                timerStatus={timer.status}
                isFinished={isFinished}
                handleMainButton={handleMainButton}
                handleSkipStage={handleSkipStage}
                handleResetClick={handleResetClick}
                handleOpenShareDialog={handleOpenShareDialog}
                getMainButtonVariant={getMainButtonVariant}
                getMainButtonLabel={getMainButtonLabel}
                getMainButtonIcon={getMainButtonIcon}
                language={language}
                accentColor={accentColor}
              />

              {/* Next Stage Preview */}
              {timer.status !== "idle" && timer.status !== "finished" && timer.currentStageIndex < EXAM_STAGES.length - 1 && (
                <Card className="border-dashed border-2 border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/30 card-hover-lift card-inner-glow glass-card">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">{t("sidebar.nextStage", language)}</div>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-lg">{EXAM_STAGES[timer.currentStageIndex + 1].icon}</span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{language === "en" ? EXAM_STAGES[timer.currentStageIndex + 1].nameEn : EXAM_STAGES[timer.currentStageIndex + 1].name}</div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500">{EXAM_STAGES[timer.currentStageIndex + 1].duration}{t("timer.minutes", language)} · {language === "en" ? EXAM_STAGES[timer.currentStageIndex + 1].name : EXAM_STAGES[timer.currentStageIndex + 1].nameEn}</div>
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-slate-300 dark:text-slate-600 shrink-0" />
                  </CardContent>
                </Card>
              )}

              {/* Quick Stats */}
              {!focusMode && (
              <div className="grid grid-cols-1 min-[360px]:grid-cols-3 gap-3">
                <Card className="p-3 sm:p-4 card-hover-lift card-inner-glow glass-card stats-card-gradient-border card-entrance-fade-up" style={{ animationDelay: "0ms" }}>
                  <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-300 mb-1">{t("timer.currentProgress", language)}</div>
                  <div className="text-xl sm:text-2xl font-bold text-accent-600 dark:text-accent-400">{isFinished ? EXAM_STAGES.length : timer.currentStageIndex + 1}/{EXAM_STAGES.length}</div>
                </Card>
                <Card className="p-3 sm:p-4 card-hover-lift card-inner-glow glass-card stats-card-gradient-border card-entrance-fade-up" style={{ animationDelay: "100ms" }}>
                  <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-300 mb-1">{t("timer.usedTime", language)}</div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white timer-digits number-flash">
                    {isFinished ? formatTime(currentTotalDuration * 60) : formatTime(practiceMode ? practiceElapsedSeconds : timer.totalElapsedSeconds)}
                  </div>
                </Card>
                <Card className="p-3 sm:p-4 card-hover-lift card-inner-glow glass-card stats-card-gradient-border card-entrance-fade-up" style={{ animationDelay: "200ms" }}>
                  <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-300 mb-1">{practiceMode ? t("timer.practiceElapsed", language) : t("timer.remainingTotal", language)}</div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white timer-digits number-flash">
                    {practiceMode ? formatTime(practiceElapsedSeconds) : isFinished ? "00:00" : formatTime(EXAM_STAGES.slice(timer.currentStageIndex).reduce((acc, s, i) => acc + (i === 0 ? timer.remainingSeconds : s.duration * 60), 0))}
                  </div>
                </Card>
              </div>
              )}

              {/* Timeline Visualization */}
              {!focusMode && (
                <div className="timeline-entrance-slide">
                <TimelineBar
                  EXAM_STAGES={EXAM_STAGES}
                  timerStatus={timer.status}
                  currentStageIndex={timer.currentStageIndex}
                  remainingSeconds={timer.remainingSeconds}
                  currentTotalDuration={currentTotalDuration}
                  isStageCompleted={timer.isStageCompleted}
                  isStageSkipped={timer.isStageSkipped}
                  currentStage={currentStage}
                  isFinished={isFinished}
                  language={language}
                />
                </div>
              )}
            </div>

            {/* Right: Stage Overview */}
            {!focusMode && (
              <StageSidebar
                timerStatus={timer.status}
                currentStageIndex={timer.currentStageIndex}
                remainingSeconds={timer.remainingSeconds}
                isStageCompleted={timer.isStageCompleted}
                isStageSkipped={timer.isStageSkipped}
                isFinished={isFinished}
                isWarning={isWarning}
                isUrgent={isUrgent}
                stageProgress={timer.stageProgress}
                currentTotalDuration={currentTotalDuration}
                ttsEnabled={ttsEnabled}
                soundEnabled={soundEnabled}
                celebratingStageIndex={celebratingStageIndex}
                handleStageClick={handleStageClick}
                language={language}
              />
            )}
          </div>
        </main>

        {/* Mobile Bottom Sticky Control Bar */}
        <MobileControls
          timerStatus={timer.status}
          isFinished={isFinished}
          handleMainButton={handleMainButton}
          handleSkipStage={handleSkipStage}
          handleResetClick={handleResetClick}
          handleOpenShareDialog={handleOpenShareDialog}
          getMainButtonVariant={getMainButtonVariant}
          getMainButtonLabel={getMainButtonLabel}
          getMainButtonIcon={getMainButtonIcon}
          language={language}
          accentColor={accentColor}
        />

        {/* Footer */}
        <footer className="mt-auto border-t bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm pb-16 sm:pb-0 footer-enhanced-shimmer">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 dark:text-slate-500">
              <div className="flex items-center gap-2">
                <Timer className="size-3.5" />
                <span>{t("footer.systemName", language)}</span>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span className="text-slate-500 dark:text-slate-400 font-medium">{getTemplateById(currentTemplateId) ? (language === "en" ? getTemplateById(currentTemplateId)?.nameEn : getTemplateById(currentTemplateId)?.name) : t("footer.customExam", language)}</span>
                {practiceMode && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <Badge className="practice-mode-badge text-white text-[9px] px-1.5 py-0">{t("footer.practiceMode", language)}</Badge>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {(timer.status === "running" || timer.status === "paused") && (
                  <>
                    <span className="text-accent-600 dark:text-accent-400 font-medium timer-digits">
                      {timer.status === "running" && <span className="footer-running-dot" />}
                      {t("footer.sessionUsed", language)} {formatTime(practiceMode ? practiceElapsedSeconds : timer.totalElapsedSeconds)}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                  </>
                )}
                <span className="footer-shortcut-key hover:text-accent-600 dark:hover:text-accent-400 transition-colors cursor-default">{t("footer.startPause", language)}</span>
                <span>·</span>
                <span className="footer-shortcut-key hover:text-accent-600 dark:hover:text-accent-400 transition-colors cursor-default">{t("footer.skip", language)}</span>
                <span>·</span>
                <span className="footer-shortcut-key hover:text-accent-600 dark:hover:text-accent-400 transition-colors cursor-default">{t("footer.focus", language)}</span>
                <span>·</span>
                <span className="footer-shortcut-key hover:text-accent-600 dark:hover:text-accent-400 transition-colors cursor-default">{t("footer.notes", language)}</span>
                <span>·</span>
                <span className="footer-shortcut-key hover:text-accent-600 dark:hover:text-accent-400 transition-colors cursor-default">{t("footer.fullscreen", language)}</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}
