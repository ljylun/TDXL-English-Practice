"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Settings2, CheckCircle2, Droplet } from "lucide-react";
import { EXAM_STAGES } from "@/lib/exam-data";
import { EXAM_TEMPLATES, getTemplateTotalDuration } from "@/lib/exam-templates";
import React from "react";
import { Language, t } from "@/lib/i18n";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customDurations: Record<string, string>;
  setCustomDurations: (durations: Record<string, string>) => void;
  handleApplySettings: () => void;
  handleLoadTemplate: (templateId: string) => void;
  currentTemplateId: string;
  practiceMode: boolean;
  setPracticeMode: (enabled: boolean) => void;
  breakDuration: number;
  setBreakDuration: (duration: number) => void;
  language: Language;
  waterReminderEnabled: boolean;
  setWaterReminderEnabled: (enabled: boolean) => void;
  waterReminderInterval: number;
  setWaterReminderInterval: (interval: number) => void;
  waterReminderCount: number;
}

export const SettingsDialog = React.memo(function SettingsDialog({
  open,
  onOpenChange,
  customDurations,
  setCustomDurations,
  handleApplySettings,
  handleLoadTemplate,
  currentTemplateId,
  practiceMode,
  setPracticeMode,
  breakDuration,
  setBreakDuration,
  language,
  waterReminderEnabled,
  setWaterReminderEnabled,
  waterReminderInterval,
  setWaterReminderInterval,
  waterReminderCount,
}: SettingsDialogProps) {
  const breakOptions = [
    { value: 0, label: t("settings.noBreak", language) },
    { value: 1, label: `1${t("timer.minutes", language)}` },
    { value: 2, label: `2${t("timer.minutes", language)}` },
    { value: 3, label: `3${t("timer.minutes", language)}` },
    { value: 5, label: `5${t("timer.minutes", language)}` },
  ];

  const waterIntervalOptions = [10, 15, 20, 25, 30];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="size-5 text-emerald-600" />
            {t("settings.title", language)}
          </DialogTitle>
        </DialogHeader>

        {/* Template Selector */}
        <div className="mb-4">
          <Label className="text-sm font-medium mb-2 block">{t("settings.template", language)}</Label>
          <div className="space-y-2">
            {EXAM_TEMPLATES.map((template) => {
              const totalDur = getTemplateTotalDuration(template);
              const isSelected = currentTemplateId === template.id;
              return (
                <button
                  key={template.id}
                  onClick={() => handleLoadTemplate(template.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left active:scale-[0.98] min-h-[44px] ${isSelected ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-emerald-500/30" : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                >
                  <span className="text-2xl">{template.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-slate-900 dark:text-white">{language === "en" ? template.nameEn : template.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{language === "en" ? template.name : template.nameEn}</div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{template.stages.length}{t("settings.stagesCount", language)} · {totalDur}{t("timer.minutes", language)}</div>
                  </div>
                  {isSelected && <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        <Separator className="my-3" />

        {/* Practice Mode Toggle */}
        <div className="mb-4">
          <Label className="text-sm font-medium mb-2 block">{t("settings.practiceMode", language)}</Label>
          <button
            onClick={() => setPracticeMode(!practiceMode)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left active:scale-[0.98] min-h-[44px] ${practiceMode ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30 ring-1 ring-amber-500/30" : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
          >
            <span className="text-2xl">🏃</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-slate-900 dark:text-white">{t("settings.practiceMode", language)}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{t("settings.practiceDesc", language)}</div>
            </div>
            <div className={`size-5 rounded-full border-2 flex items-center justify-center ${practiceMode ? "border-amber-500 bg-amber-500" : "border-slate-300 dark:border-slate-600"}`}>
              {practiceMode && <span className="text-white text-xs font-bold">✓</span>}
            </div>
          </button>
        </div>

        <Separator className="my-3" />

        {/* Break Duration Setting */}
        <div className="mb-4">
          <Label className="text-sm font-medium mb-2 block">{t("settings.breakTime", language)}</Label>
          <div className="grid grid-cols-5 gap-2">
            {breakOptions.map((option) => {
              const isSelected = breakDuration === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setBreakDuration(option.value)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all text-center active:scale-[0.97] min-h-[44px] ${
                    isSelected
                      ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 ring-1 ring-cyan-500/30"
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="text-base">{option.value === 0 ? "✕" : "☕"}</span>
                  <span className={`text-[11px] font-medium ${isSelected ? "text-cyan-700 dark:text-cyan-300" : "text-slate-600 dark:text-slate-400"}`}>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
            {t("settings.breakNote", language)}
          </p>
        </div>

        <Separator className="my-3" />

        {/* Water Reminder Settings */}
        <div className="mb-4">
          <Label className="text-sm font-medium mb-2 block">{t("water.settings.title", language)}</Label>
          {/* Toggle */}
          <button
            onClick={() => setWaterReminderEnabled(!waterReminderEnabled)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left active:scale-[0.98] min-h-[44px] ${waterReminderEnabled ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 ring-1 ring-cyan-500/30" : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
          >
            <span className="text-2xl">💧</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-slate-900 dark:text-white">{t("water.settings.toggle", language)}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{waterReminderEnabled ? t("water.settings.interval", language) : ""}</div>
            </div>
            <div className={`size-5 rounded-full border-2 flex items-center justify-center ${waterReminderEnabled ? "border-cyan-500 bg-cyan-500" : "border-slate-300 dark:border-slate-600"}`}>
              {waterReminderEnabled && <span className="text-white text-xs font-bold">✓</span>}
            </div>
          </button>
          {/* Interval selector */}
          {waterReminderEnabled && (
            <div className="grid grid-cols-5 gap-2 mt-2">
              {waterIntervalOptions.map((mins) => {
                const isSelected = waterReminderInterval === mins;
                return (
                  <button
                    key={mins}
                    onClick={() => setWaterReminderInterval(mins)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all text-center active:scale-[0.97] min-h-[44px] ${
                      isSelected
                        ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 ring-1 ring-cyan-500/30"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="text-base"><Droplet className={`size-4 ${isSelected ? "text-cyan-500" : "text-slate-400"}`} /></span>
                    <span className={`text-[11px] font-medium ${isSelected ? "text-cyan-700 dark:text-cyan-300" : "text-slate-600 dark:text-slate-400"}`}>
                      {mins}{t("timer.minutes", language)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {/* Session count */}
          {waterReminderEnabled && waterReminderCount > 0 && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1">
              <Droplet className="size-3 text-cyan-500" />
              {t("water.settings.count", language)}: {waterReminderCount}{t("water.settings.times", language)}
            </p>
          )}
        </div>

        <Separator className="my-3" />

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          {t("settings.customDuration", language)}
        </p>
        <div className="space-y-3">
          {EXAM_STAGES.map((stage, i) => (
            <div key={`stage-${currentTemplateId}-${i}`} className="flex items-center gap-3 min-h-[44px]">
              <span className="text-lg w-7 text-center">{stage.icon}</span>
              <div className="flex-1 min-w-0">
                <Label htmlFor={`duration-${i}`} className="text-sm font-medium truncate block">
                  {language === "en" ? stage.nameEn : stage.name}
                </Label>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">{language === "en" ? stage.name : stage.nameEn} · {t("settings.defaultLabel", language)} {stage.duration}{t("timer.minutes", language)}</span>
              </div>
              <Input
                id={`duration-${i}`}
                type="number"
                min={1}
                max={120}
                placeholder={String(stage.duration)}
                value={customDurations[`stage-${i}`] || ""}
                onChange={(e) => setCustomDurations(prev => ({ ...prev, [`stage-${i}`]: e.target.value }))}
                className="w-20 text-center"
                disabled={practiceMode}
              />
            </div>
          ))}
        </div>
        <DialogFooter className="flex-row gap-2 sm:gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={() => { setCustomDurations({}); onOpenChange(false); }}>{t("history.cancel", language)}</Button>
          <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={handleApplySettings} disabled={practiceMode}>{t("settings.apply", language)}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
