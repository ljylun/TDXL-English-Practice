"use client";

import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, SkipForward, Share2 } from "lucide-react";
import React from "react";
import { Language, t } from "@/lib/i18n";

type AccentColor = "emerald" | "amber" | "rose" | "violet" | "cyan";

interface ControlButtonsProps {
  timerStatus: string;
  isFinished: boolean;
  handleMainButton: () => void;
  handleSkipStage: () => void;
  handleResetClick: () => void;
  handleOpenShareDialog: () => void;
  getMainButtonVariant: () => "default" | "secondary" | "destructive";
  getMainButtonLabel: () => string;
  getMainButtonIcon: () => React.ReactNode;
  language: Language;
  accentColor?: AccentColor;
}

export const DesktopControls = React.memo(function DesktopControls({
  timerStatus,
  isFinished,
  handleMainButton,
  handleSkipStage,
  handleResetClick,
  handleOpenShareDialog,
  getMainButtonVariant,
  getMainButtonLabel,
  getMainButtonIcon,
  language,
  accentColor = "emerald",
}: ControlButtonsProps) {
  const variant = getMainButtonVariant();

  return (
    <div className="hidden sm:flex flex-row gap-3">
      <Button size="lg" variant={variant} onClick={handleMainButton} className={`flex-1 h-14 text-lg font-semibold gap-2 rounded-xl shadow-lg transition-all active:scale-[0.98] btn-ripple btn-gradient-shadow ${variant === "default" ? "bg-gradient-to-r from-accent-from to-accent-to hover:opacity-90 text-white" : variant === "destructive" ? "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700" : ""}`}>
        {getMainButtonIcon()}{getMainButtonLabel()}
      </Button>
      {(timerStatus === "running" || timerStatus === "paused") && (
        <div className="relative skip-btn-dashed">
          <div className="dash-border">
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              <rect x="0" y="0" width="100%" height="100%" rx="12" ry="12" fill="none" stroke="#d97706" strokeWidth="2" className="dark:[stroke:#b45309]" />
            </svg>
          </div>
          <Button size="lg" variant="outline" onClick={handleSkipStage} className="h-14 gap-2 rounded-xl border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 relative z-10 min-w-[140px]">
            <SkipForward className="size-4" />{t("control.skipStage", language)}
          </Button>
        </div>
      )}
      <Button size="lg" variant="outline" onClick={handleResetClick} className="h-14 gap-2 rounded-xl btn-ripple">
        <RotateCcw className="size-4" />{t("control.reset", language)}
      </Button>
      {isFinished && (
        <Button size="lg" variant="outline" onClick={handleOpenShareDialog} className="h-14 gap-2 rounded-xl border-accent-300 dark:border-accent-700 text-accent-700 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-950/30">
          <Share2 className="size-4" />{t("control.shareResults", language)}
        </Button>
      )}
    </div>
  );
});

export const MobileControls = React.memo(function MobileControls({
  timerStatus,
  isFinished,
  handleMainButton,
  handleSkipStage,
  handleResetClick,
  handleOpenShareDialog,
  getMainButtonVariant,
  getMainButtonLabel,
  getMainButtonIcon,
  language,
  accentColor = "emerald",
}: ControlButtonsProps) {
  const variant = getMainButtonVariant();

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t p-3 safe-area-bottom">
      <div className="flex gap-2">
        <Button size="lg" variant={variant} onClick={handleMainButton} className={`flex-1 h-12 text-base font-semibold gap-1.5 rounded-xl mobile-haptic ${variant === "default" ? "bg-gradient-to-r from-accent-from to-accent-to text-white" : variant === "destructive" ? "bg-gradient-to-r from-red-500 to-rose-600" : ""}`}>
          {getMainButtonIcon()}{getMainButtonLabel()}
        </Button>
        {(timerStatus === "running" || timerStatus === "paused") && (
          <Button size="lg" variant="outline" onClick={handleSkipStage} className="h-12 gap-1 rounded-xl border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 px-3 mobile-haptic min-w-[44px]">
            <SkipForward className="size-4" />
          </Button>
        )}
        <Button size="lg" variant="outline" onClick={handleResetClick} className="h-12 rounded-xl px-3 mobile-haptic min-w-[44px]">
          <RotateCcw className="size-4" />
        </Button>
        {isFinished && (
          <Button size="lg" variant="outline" onClick={handleOpenShareDialog} className="h-12 rounded-xl px-3 mobile-haptic min-w-[44px] border-accent-300 dark:border-accent-700 text-accent-700 dark:text-accent-400">
            <Share2 className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
});

export type { ControlButtonsProps };
