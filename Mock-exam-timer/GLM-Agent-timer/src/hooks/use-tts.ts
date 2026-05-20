"use client";

import { useCallback, useRef } from "react";

// Volume level getter - set from page.tsx
let _ttsVolume = 1.0;
export function setTTSVolume(v: number) { _ttsVolume = Math.max(0, Math.min(1, v)); }

export function useTTS() {
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const getSynth = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }
    return synthRef.current;
  }, []);

  const speak = useCallback(
    (text: string, lang: string = "zh-CN") => {
      const synth = getSynth();
      if (!synth) {
        console.warn("SpeechSynthesis not supported");
        return;
      }

      // Cancel any ongoing speech
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = _ttsVolume;

      // Try to find a Chinese voice
      const voices = synth.getVoices();
      const chineseVoice = voices.find(
        (v) => v.lang.startsWith("zh") || v.lang.startsWith("cmn")
      );
      if (chineseVoice) {
        utterance.voice = chineseVoice;
      }

      synth.speak(utterance);
    },
    [getSynth]
  );

  const stop = useCallback(() => {
    const synth = getSynth();
    if (synth) {
      synth.cancel();
    }
  }, [getSynth]);

  return { speak, stop };
}
