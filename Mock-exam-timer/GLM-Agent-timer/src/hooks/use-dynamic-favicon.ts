"use client";

import { useEffect, useRef } from "react";
import type { ExamStatus } from "@/lib/exam-data";

type FaviconState = "idle" | "running" | "urgent" | "warning" | "finished";

function generateFaviconSVG(state: FaviconState): string {
  let fill: string;
  let inner: string;

  switch (state) {
    case "running":
      fill = "#10b981"; // emerald-500
      inner = `<circle cx="16" cy="16" r="8" fill="#fff" opacity="0.9"/>`;
      break;
    case "urgent":
      fill = "#f59e0b"; // amber-500
      inner = `<circle cx="16" cy="16" r="8" fill="#fff" opacity="0.9"/>`;
      break;
    case "warning":
      fill = "#ef4444"; // red-500
      inner = `<circle cx="16" cy="16" r="8" fill="#fff" opacity="0.9"/>`;
      break;
    case "finished":
      fill = "#10b981"; // emerald-500
      inner = `<path d="M11 17l-4-4 1.4-1.4L11 14.2l7.6-7.6L20 8l-9 9z" fill="#fff"/>`;
      break;
    default:
      // idle - timer icon
      fill = "#64748b"; // slate-500
      inner = `<circle cx="16" cy="17" r="7" fill="none" stroke="#fff" stroke-width="2"/><line x1="16" y1="13" x2="16" y2="17" stroke="#fff" stroke-width="2" stroke-linecap="round"/><line x1="16" y1="10" x2="16" y2="11" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`;
      break;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="${fill}"/>${inner}</svg>`;
}

function getStateFromTimer(status: ExamStatus, remainingSeconds: number): FaviconState {
  if (status === "finished") return "finished";
  if (status === "idle" || status === "paused") return "idle";
  // status === "running"
  if (remainingSeconds <= 10) return "warning";
  if (remainingSeconds <= 30) return "urgent";
  return "running";
}

export function useDynamicFavicon(status: ExamStatus, remainingSeconds: number) {
  const linkRef = useRef<HTMLLinkElement | null>(null);
  const prevStateRef = useRef<FaviconState>("idle");

  useEffect(() => {
    const state = getStateFromTimer(status, remainingSeconds);

    // Only update if state changed (avoid unnecessary DOM updates every second)
    if (state === prevStateRef.current) return;
    prevStateRef.current = state;

    // Create or reuse the favicon link element
    if (!linkRef.current) {
      let existing = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
      if (existing) {
        linkRef.current = existing;
      } else {
        const link = document.createElement("link");
        link.rel = "icon";
        link.type = "image/svg+xml";
        document.head.appendChild(link);
        linkRef.current = link;
      }
    }

    const svg = generateFaviconSVG(state);
    linkRef.current.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }, [status, remainingSeconds]);

  // Cleanup: revert to default on unmount
  useEffect(() => {
    return () => {
      if (linkRef.current) {
        // Revert to a default favicon
        const svg = generateFaviconSVG("idle");
        linkRef.current.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
      }
    };
  }, []);
}
