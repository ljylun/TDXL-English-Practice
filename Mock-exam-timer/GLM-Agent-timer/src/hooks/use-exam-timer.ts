"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  EXAM_STAGES,
  ExamStage,
  ExamStatus,
  getNextStageMessage,
  getWarningMessage,
  updateExamStages,
} from "@/lib/exam-data";

interface ExamTimerState {
  currentStageIndex: number;
  remainingSeconds: number;
  status: ExamStatus;
  hasWarnedCurrentStage: boolean;
  /** Track which stages were actually completed vs skipped */
  completedStages: Set<number>;
  /** Timestamp when the current run segment started (for Date.now delta calibration) */
  runSegmentStart: number | null;
  /** Remaining seconds at the start of current run segment (for drift correction) */
  remainingAtSegmentStart: number;
  /** Cumulative elapsed seconds while the timer was running (excludes paused time) */
  totalElapsedSeconds: number;
  /** Per-stage elapsed seconds tracking (for accurate skipped stage time) */
  stageElapsedMap: Map<number, number>;
}

export function useExamTimer() {
  const [state, setState] = useState<ExamTimerState>({
    currentStageIndex: 0,
    remainingSeconds: EXAM_STAGES[0].duration * 60,
    status: "idle",
    hasWarnedCurrentStage: false,
    completedStages: new Set(),
    runSegmentStart: null,
    remainingAtSegmentStart: EXAM_STAGES[0].duration * 60,
    totalElapsedSeconds: 0,
    stageElapsedMap: new Map(),
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onStageEndRef = useRef<((message: string) => void) | null>(null);
  const onWarningRef = useRef<((message: string) => void) | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    setState((prev) => {
      // Track per-stage elapsed and total elapsed
      const newStageElapsedMap = new Map(prev.stageElapsedMap);
      const currentStageElapsed = (newStageElapsedMap.get(prev.currentStageIndex) || 0) + 1;
      newStageElapsedMap.set(prev.currentStageIndex, currentStageElapsed);
      const newTotalElapsed = prev.totalElapsedSeconds + 1;

      if (prev.remainingSeconds <= 1) {
        // Stage ended naturally - mark as completed
        const newCompleted = new Set(prev.completedStages);
        newCompleted.add(prev.currentStageIndex);

        const message = getNextStageMessage(
          EXAM_STAGES[prev.currentStageIndex].id
        );
        setTimeout(() => {
          onStageEndRef.current?.(message);
        }, 0);

        if (prev.currentStageIndex >= EXAM_STAGES.length - 1) {
          clearTimer();
          return {
            ...prev,
            remainingSeconds: 0,
            status: "finished",
            completedStages: newCompleted,
            totalElapsedSeconds: newTotalElapsed,
            stageElapsedMap: newStageElapsedMap,
          };
        }

        // Move to next stage
        const nextIndex = prev.currentStageIndex + 1;
        const nextDuration = EXAM_STAGES[nextIndex].duration * 60;
        return {
          ...prev,
          currentStageIndex: nextIndex,
          remainingSeconds: nextDuration,
          hasWarnedCurrentStage: false,
          completedStages: newCompleted,
          runSegmentStart: Date.now(),
          remainingAtSegmentStart: nextDuration,
          totalElapsedSeconds: newTotalElapsed,
          stageElapsedMap: newStageElapsedMap,
        };
      }

      const newRemaining = prev.remainingSeconds - 1;

      // Check for 10-second warning
      if (newRemaining === 10 && !prev.hasWarnedCurrentStage) {
        const warningMsg = getWarningMessage(
          EXAM_STAGES[prev.currentStageIndex].id
        );
        setTimeout(() => {
          onWarningRef.current?.(warningMsg);
        }, 0);
        return {
          ...prev,
          remainingSeconds: newRemaining,
          hasWarnedCurrentStage: true,
          totalElapsedSeconds: newTotalElapsed,
          stageElapsedMap: newStageElapsedMap,
        };
      }

      return {
        ...prev,
        remainingSeconds: newRemaining,
        totalElapsedSeconds: newTotalElapsed,
        stageElapsedMap: newStageElapsedMap,
      };
    });
  }, [clearTimer]);

  // Calibrate timer when page becomes visible again (fixes drift from background throttling)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && state.status === "running" && state.runSegmentStart) {
        const now = Date.now();
        const elapsedSinceStart = Math.floor((now - state.runSegmentStart) / 1000);
        const expectedRemaining = Math.max(0, state.remainingAtSegmentStart - elapsedSinceStart);

        if (expectedRemaining !== state.remainingSeconds) {
          // Drift detected - correct it
          if (expectedRemaining <= 0) {
            // Stage should have ended while in background
            // Trigger tick to let it handle the transition
            tick();
          } else {
            setState((prev) => ({
              ...prev,
              remainingSeconds: expectedRemaining,
            }));
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [state.status, state.runSegmentStart, state.remainingAtSegmentStart, state.remainingSeconds, tick]);

  const start = useCallback(() => {
    if (state.status === "idle" || state.status === "finished") {
      const now = Date.now();
      const initialDuration = EXAM_STAGES[0].duration * 60;
      const newElapsedMap = new Map<number, number>();
      newElapsedMap.set(0, 0);
      setState({
        currentStageIndex: 0,
        remainingSeconds: initialDuration,
        status: "running",
        hasWarnedCurrentStage: false,
        completedStages: new Set(),
        runSegmentStart: now,
        remainingAtSegmentStart: initialDuration,
        totalElapsedSeconds: 0,
        stageElapsedMap: newElapsedMap,
      });
    } else if (state.status === "paused") {
      const now = Date.now();
      setState((prev) => ({
        ...prev,
        status: "running",
        runSegmentStart: now,
        remainingAtSegmentStart: prev.remainingSeconds,
      }));
    }
  }, [state.status]);

  const pause = useCallback(() => {
    if (state.status === "running") {
      clearTimer();
      setState((prev) => ({
        ...prev,
        status: "paused",
        runSegmentStart: null,
      }));
    }
  }, [state.status, clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    const initialDuration = EXAM_STAGES[0].duration * 60;
    setState({
      currentStageIndex: 0,
      remainingSeconds: initialDuration,
      status: "idle",
      hasWarnedCurrentStage: false,
      completedStages: new Set(),
      runSegmentStart: null,
      remainingAtSegmentStart: initialDuration,
      totalElapsedSeconds: 0,
      stageElapsedMap: new Map(),
    });
  }, [clearTimer]);

  const jumpToStage = useCallback((stageIndex: number) => {
    clearTimer();
    const stageDuration = EXAM_STAGES[stageIndex].duration * 60;
    setState({
      currentStageIndex: stageIndex,
      remainingSeconds: stageDuration,
      status: "idle",
      hasWarnedCurrentStage: false,
      completedStages: new Set(),
      runSegmentStart: null,
      remainingAtSegmentStart: stageDuration,
      totalElapsedSeconds: 0,
      stageElapsedMap: new Map(),
    });
  }, [clearTimer]);

  const skipStage = useCallback(() => {
    if (state.status !== "running" && state.status !== "paused") return;

    const message = getNextStageMessage(
      EXAM_STAGES[state.currentStageIndex].id
    );
    setTimeout(() => {
      onStageEndRef.current?.(message);
    }, 0);

    if (state.currentStageIndex >= EXAM_STAGES.length - 1) {
      clearTimer();
      setState((prev) => ({
        ...prev,
        remainingSeconds: 0,
        status: "finished",
      }));
    } else {
      const nextIndex = state.currentStageIndex + 1;
      const nextDuration = EXAM_STAGES[nextIndex].duration * 60;
      const wasRunning = state.status === "running";
      const now = wasRunning ? Date.now() : 0;
      clearTimer();
      setState((prev) => {
        // Initialize next stage elapsed to 0
        const newMap = new Map(prev.stageElapsedMap);
        newMap.set(nextIndex, 0);
        return {
          ...prev,
          currentStageIndex: nextIndex,
          remainingSeconds: nextDuration,
          hasWarnedCurrentStage: false,
          status: wasRunning ? "running" : "paused",
          runSegmentStart: wasRunning ? now : null,
          remainingAtSegmentStart: nextDuration,
          stageElapsedMap: newMap,
        };
      });
    }
  }, [state, clearTimer]);

  // Update stage durations (for custom time configuration)
  const updateDurations = useCallback((durations: number[]) => {
    clearTimer();
    // Mutate the EXAM_STAGES durations
    durations.forEach((dur, i) => {
      if (i < EXAM_STAGES.length && dur > 0) {
        EXAM_STAGES[i].duration = dur;
      }
    });
    const initialDuration = EXAM_STAGES[0].duration * 60;
    setState({
      currentStageIndex: 0,
      remainingSeconds: initialDuration,
      status: "idle",
      hasWarnedCurrentStage: false,
      completedStages: new Set(),
      runSegmentStart: null,
      remainingAtSegmentStart: initialDuration,
      totalElapsedSeconds: 0,
      stageElapsedMap: new Map(),
    });
  }, [clearTimer]);

  // Load a completely new set of stages (for exam templates)
  const loadStages = useCallback((newStages: ExamStage[]) => {
    clearTimer();
    updateExamStages(newStages);
    const initialDuration = EXAM_STAGES[0].duration * 60;
    setState({
      currentStageIndex: 0,
      remainingSeconds: initialDuration,
      status: "idle",
      hasWarnedCurrentStage: false,
      completedStages: new Set(),
      runSegmentStart: null,
      remainingAtSegmentStart: initialDuration,
      totalElapsedSeconds: 0,
      stageElapsedMap: new Map(),
    });
  }, [clearTimer]);

  // Restore exam state (for resume / auto-save recovery)
  const restoreState = useCallback((params: {
    currentStageIndex: number;
    remainingSeconds: number;
    completedStages: number[];
    status: "running" | "paused";
    totalElapsedSeconds?: number;
  }) => {
    clearTimer();
    const now = Date.now();
    const newCompleted = new Set(params.completedStages);
    const hasWarned = params.remainingSeconds <= 10;
    // Build stageElapsedMap from completed/skipped stages
    const newElapsedMap = new Map<number, number>();
    params.completedStages.forEach((idx) => {
      if (idx < EXAM_STAGES.length) {
        newElapsedMap.set(idx, EXAM_STAGES[idx].duration * 60);
      }
    });
    // For skipped stages (before current), estimate elapsed as full duration minus remaining
    for (let i = 0; i < params.currentStageIndex; i++) {
      if (!newCompleted.has(i) && !newElapsedMap.has(i)) {
        newElapsedMap.set(i, 0); // Unknown elapsed for skipped stages during restore
      }
    }
    // Current stage
    newElapsedMap.set(params.currentStageIndex, 0);
    setState({
      currentStageIndex: params.currentStageIndex,
      remainingSeconds: params.remainingSeconds,
      status: params.status,
      hasWarnedCurrentStage: hasWarned,
      completedStages: newCompleted,
      runSegmentStart: params.status === "running" ? now : null,
      remainingAtSegmentStart: params.remainingSeconds,
      totalElapsedSeconds: params.totalElapsedSeconds || 0,
      stageElapsedMap: newElapsedMap,
    });
  }, [clearTimer]);

  // Timer effect
  useEffect(() => {
    if (state.status === "running") {
      intervalRef.current = setInterval(tick, 1000);
    }
    return () => {
      clearTimer();
    };
  }, [state.status, tick, clearTimer]);

  const setOnStageEnd = useCallback(
    (callback: (message: string) => void) => {
      onStageEndRef.current = callback;
    },
    []
  );

  const setOnWarning = useCallback(
    (callback: (message: string) => void) => {
      onWarningRef.current = callback;
    },
    []
  );

  const currentStage = EXAM_STAGES[state.currentStageIndex];

  // For stage progress, use the countdown-based calculation
  const stageElapsedCalc = currentStage.duration * 60 - state.remainingSeconds;
  const totalElapsedFromStages = EXAM_STAGES.slice(0, state.currentStageIndex)
    .reduce((acc, s) => acc + s.duration * 60, 0) + stageElapsedCalc;
  const totalDurationSeconds = EXAM_STAGES.reduce(
    (acc, s) => acc + s.duration * 60,
    0
  );
  const overallProgress = totalDurationSeconds > 0 ? (totalElapsedFromStages / totalDurationSeconds) * 100 : 0;
  const stageProgress = currentStage.duration * 60 > 0
    ? ((currentStage.duration * 60 - state.remainingSeconds) / (currentStage.duration * 60)) * 100
    : 0;

  const isStageCompleted = useCallback(
    (index: number) => state.completedStages.has(index),
    [state.completedStages]
  );

  const isStageSkipped = useCallback(
    (index: number) => index < state.currentStageIndex && !state.completedStages.has(index),
    [state.currentStageIndex, state.completedStages]
  );

  return {
    currentStage,
    currentStageIndex: state.currentStageIndex,
    remainingSeconds: state.remainingSeconds,
    status: state.status,
    start,
    pause,
    reset,
    jumpToStage,
    skipStage,
    updateDurations,
    loadStages,
    restoreState,
    setOnStageEnd,
    setOnWarning,
    overallProgress,
    stageProgress,
    isStageCompleted,
    isStageSkipped,
    stageCount: EXAM_STAGES.length,
    totalElapsedSeconds: state.totalElapsedSeconds,
    stageElapsedMap: state.stageElapsedMap,
  };
}
