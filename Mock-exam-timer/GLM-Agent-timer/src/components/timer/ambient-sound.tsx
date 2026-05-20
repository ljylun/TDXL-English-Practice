"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Headphones } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Language, t } from "@/lib/i18n";

export type NoiseType = "white" | "pink" | "brown" | "coffee";

interface NoiseOption {
  id: NoiseType;
  emoji: string;
  labelKey: string;
  descKey: string;
  color: string;
}

const NOISE_OPTIONS: NoiseOption[] = [
  { id: "white", emoji: "🌊", labelKey: "ambient.white", descKey: "ambient.whiteDesc", color: "bg-sky-400" },
  { id: "pink", emoji: "🌧️", labelKey: "ambient.pink", descKey: "ambient.pinkDesc", color: "bg-pink-400" },
  { id: "brown", emoji: "🌲", labelKey: "ambient.brown", descKey: "ambient.brownDesc", color: "bg-amber-700" },
  { id: "coffee", emoji: "☕", labelKey: "ambient.coffee", descKey: "ambient.coffeeDesc", color: "bg-orange-400" },
];

interface AmbientSoundProps {
  timerStatus: "idle" | "running" | "paused" | "finished";
  language: Language;
}

let ambientCtx: AudioContext | null = null;
let sourceNode: AudioBufferSourceNode | null = null;
let gainNode: GainNode | null = null;
let lfoGainNode: GainNode | null = null;
let lfoOscNode: OscillatorNode | null = null;

function getAmbientContext(): AudioContext | null {
  try {
    if (!ambientCtx || ambientCtx.state === "closed") {
      ambientCtx = new AudioContext();
    }
    if (ambientCtx.state === "suspended") {
      ambientCtx.resume();
    }
    return ambientCtx;
  } catch {
    return null;
  }
}

function createNoiseBuffer(ctx: AudioContext, type: NoiseType, duration: number = 4): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const buffer = ctx.createBuffer(2, length, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);

    if (type === "white") {
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    } else if (type === "pink") {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    } else if (type === "brown") {
      let lastOut = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + (0.02 * white)) / 1.02;
        data[i] = lastOut * 3.5;
      }
    } else if (type === "coffee") {
      let lastOut = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + (0.02 * white)) / 1.02;
        const modFreq1 = 0.3 + (channel * 0.05);
        const modFreq2 = 0.7 + (channel * 0.03);
        const modulation = 0.6 + 0.2 * Math.sin(2 * Math.PI * modFreq1 * i / sampleRate)
          + 0.15 * Math.sin(2 * Math.PI * modFreq2 * i / sampleRate);
        const chatter = 0.1 * Math.sin(2 * Math.PI * 3.2 * i / sampleRate)
          * Math.sin(2 * Math.PI * 0.5 * i / sampleRate);
        data[i] = (lastOut * modulation + chatter * 0.02) * 3.5;
      }
    }
  }

  return buffer;
}

function startAmbientNoise(type: NoiseType, volume: number): boolean {
  const ctx = getAmbientContext();
  if (!ctx) return false;

  stopAmbientNoise();

  try {
    const buffer = createNoiseBuffer(ctx, type, 4);
    sourceNode = ctx.createBufferSource();
    sourceNode.buffer = buffer;
    sourceNode.loop = true;

    gainNode = ctx.createGain();
    gainNode.gain.value = volume / 100 * 0.5;

    sourceNode.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (type === "coffee") {
      lfoGainNode = ctx.createGain();
      lfoGainNode.gain.value = 0;
      lfoOscNode = ctx.createOscillator();
      lfoOscNode.frequency.value = 0.2;
      lfoOscNode.connect(lfoGainNode);
      lfoGainNode.connect(gainNode.gain);
      lfoOscNode.start();
    }

    sourceNode.start();
    return true;
  } catch {
    return false;
  }
}

function stopAmbientNoise() {
  try {
    if (sourceNode) {
      sourceNode.stop();
      sourceNode.disconnect();
      sourceNode = null;
    }
    if (lfoOscNode) {
      lfoOscNode.stop();
      lfoOscNode.disconnect();
      lfoOscNode = null;
    }
    if (lfoGainNode) {
      lfoGainNode.disconnect();
      lfoGainNode = null;
    }
    if (gainNode) {
      gainNode.disconnect();
      gainNode = null;
    }
  } catch {
    sourceNode = null;
    gainNode = null;
    lfoGainNode = null;
    lfoOscNode = null;
  }
}

function setAmbientVolume(volume: number) {
  if (gainNode) {
    gainNode.gain.value = volume / 100 * 0.5;
  }
}

export function AmbientSound({ timerStatus, language }: AmbientSoundProps) {
  const [showPanel, setShowPanel] = useState(false);
  const [activeNoise, setActiveNoise] = useState<NoiseType | null>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("exam-timer-ambient-sound");
      if (stored && NOISE_OPTIONS.some((o) => o.id === stored)) {
        return stored as NoiseType;
      }
    }
    return null;
  });
  const [volume, setVolume] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("exam-timer-ambient-volume");
      if (stored !== null) return Math.max(0, Math.min(100, Number(stored) || 50));
    }
    return 50;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeNoise) {
      localStorage.setItem("exam-timer-ambient-sound", activeNoise);
    }
  }, [activeNoise]);

  useEffect(() => {
    localStorage.setItem("exam-timer-ambient-volume", String(volume));
  }, [volume]);

  useEffect(() => {
    if (!activeNoise) return;

    if (timerStatus === "paused") {
      if (gainNode) {
        gainNode.gain.setTargetAtTime(0, gainNode.context.currentTime, 0.3);
      }
    } else if (timerStatus === "running" && isPlaying) {
      if (gainNode) {
        gainNode.gain.setTargetAtTime(volume / 100 * 0.5, gainNode.context.currentTime, 0.3);
      }
    } else if (timerStatus === "idle" || timerStatus === "finished") {
      stopAmbientNoise();
      setTimeout(() => setIsPlaying(false), 0);
    }
  }, [timerStatus, activeNoise, volume, isPlaying]);

  useEffect(() => {
    return () => {
      stopAmbientNoise();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowPanel(false);
      }
    };
    if (showPanel) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPanel]);

  const toggleNoise = useCallback((type: NoiseType) => {
    if (activeNoise === type && isPlaying) {
      stopAmbientNoise();
      setIsPlaying(false);
      setActiveNoise(null);
    } else {
      setActiveNoise(type);
      const success = startAmbientNoise(type, volume);
      setIsPlaying(success);
      if (!success) setActiveNoise(null);
    }
  }, [activeNoise, isPlaying, volume]);

  const handleVolumeChange = useCallback((v: number) => {
    setVolume(v);
    setAmbientVolume(v);
  }, []);

  const togglePanel = useCallback(() => {
    setShowPanel((prev) => !prev);
  }, []);

  return (
    <div className="relative" ref={panelRef}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePanel}
            className={`size-9 ${isPlaying ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}
            aria-label={t("ambient.title", language)}
          >
            <Headphones className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="tooltip-animate">
          <p>{t("ambient.title", language)}</p>
        </TooltipContent>
      </Tooltip>

      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 z-[70] glass-card rounded-xl p-3 shadow-xl border border-white/20 dark:border-white/10 w-56"
          >
            <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-2 text-center">
              {t("ambient.title", language)}
            </div>

            <div className="space-y-1 mb-3">
              {NOISE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => toggleNoise(option.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-left ${
                    activeNoise === option.id && isPlaying
                      ? "bg-emerald-50 dark:bg-emerald-900/30 ring-1 ring-emerald-300 dark:ring-emerald-700"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <span className="text-base">{option.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {t(option.labelKey, language)}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">
                      {t(option.descKey, language)}
                    </div>
                  </div>
                  <div
                    className={`size-2 rounded-full ${option.color} ${
                      activeNoise === option.id && isPlaying
                        ? "animate-pulse shadow-sm"
                        : "opacity-30"
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-2">
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1.5 text-center">
                {t("ambient.volumeLabel", language)} {volume}%
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-full h-1.5 appearance-none bg-slate-200 dark:bg-slate-700 rounded-full cursor-pointer accent-emerald-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
