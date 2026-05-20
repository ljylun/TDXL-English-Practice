"use client";

import React, { useMemo } from "react";
import { ExamHistoryRecord, StageRecord } from "@/components/timer/history-dialog";
import { Language, t, formatDate } from "@/lib/i18n";

interface ExamAnalyticsChartProps {
  historyRecords: ExamHistoryRecord[];
  language: Language;
}

interface BarData {
  id: number;
  date: string;
  shortDate: string;
  completionRate: number;
  status: "completed" | "abandoned" | "in_progress";
  totalStages: number;
  completedStages: number;
}

export const ExamAnalyticsChart = React.memo(function ExamAnalyticsChart({
  historyRecords,
  language,
}: ExamAnalyticsChartProps) {
  const barData = useMemo<BarData[]>(() => {
    if (historyRecords.length === 0) return [];

    // Take the 10 most recent exams
    const recent = historyRecords.slice(0, 10);

    return recent.map((record) => {
      let stages: StageRecord[] = [];
      try {
        stages = JSON.parse(record.stagesJson);
      } catch {
        // skip malformed
      }

      const completedStages = stages.filter((s) => s.status === "completed").length;
      const totalStages = stages.length;
      const completionRate = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

      const startDate = new Date(record.startedAt);
      const dateStr = formatDate(startDate, language);
      const shortDate = language === "zh"
        ? `${startDate.getMonth() + 1}/${startDate.getDate()}`
        : `${startDate.getMonth() + 1}/${startDate.getDate()}`;

      return {
        id: record.id,
        date: dateStr,
        shortDate,
        completionRate,
        status: record.status as "completed" | "abandoned" | "in_progress",
        totalStages,
        completedStages,
      };
    });
  }, [historyRecords, language]);

  // Analytics summary
  const analytics = useMemo(() => {
    if (historyRecords.length === 0) return null;

    // Exams per day (last 7 days)
    const now = new Date();
    const dayMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      dayMap[key] = 0;
    }
    historyRecords.forEach((r) => {
      const d = new Date(r.startedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (key in dayMap) {
        dayMap[key]++;
      }
    });

    // Average completion rate
    const completionRates: number[] = [];
    historyRecords.forEach((r) => {
      try {
        const stages: StageRecord[] = JSON.parse(r.stagesJson);
        const total = stages.length;
        const completed = stages.filter((s) => s.status === "completed").length;
        if (total > 0) completionRates.push(Math.round((completed / total) * 100));
      } catch { /* skip */ }
    });
    const avgCompletionRate = completionRates.length > 0
      ? Math.round(completionRates.reduce((a, b) => a + b, 0) / completionRates.length)
      : 0;

    // Most attempted stage
    const stageAttemptMap: Record<string, number> = {};
    historyRecords.forEach((r) => {
      try {
        const stages: StageRecord[] = JSON.parse(r.stagesJson);
        stages.forEach((s) => {
          if (s.status !== "not_reached") {
            stageAttemptMap[s.stageName] = (stageAttemptMap[s.stageName] || 0) + 1;
          }
        });
      } catch { /* skip */ }
    });
    let mostAttemptedStage = "";
    let maxAttempts = 0;
    Object.entries(stageAttemptMap).forEach(([name, count]) => {
      if (count > maxAttempts) {
        maxAttempts = count;
        mostAttemptedStage = name;
      }
    });

    // Total practice time
    const totalPracticeSeconds = historyRecords.reduce((acc, r) => {
      if (r.status === "completed") return acc + r.totalDurationSeconds;
      try {
        const stages: StageRecord[] = JSON.parse(r.stagesJson);
        return acc + stages.reduce((a, s) => a + s.elapsedSeconds, 0);
      } catch {
        return acc;
      }
    }, 0);

    return {
      examsPerDay: dayMap,
      avgCompletionRate,
      mostAttemptedStage,
      mostAttemptedCount: maxAttempts,
      totalPracticeMinutes: Math.round(totalPracticeSeconds / 60),
    };
  }, [historyRecords]);

  if (barData.length === 0) return null;

  const maxRate = 100; // Completion rate is always 0-100%

  return (
    <div className="space-y-4">
      {/* Chart Heading */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="size-4 text-accent-600 dark:text-accent-400" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="8" width="3" height="7" rx="1" fill="currentColor" opacity="0.6" />
            <rect x="5.5" y="4" width="3" height="11" rx="1" fill="currentColor" opacity="0.8" />
            <rect x="10" y="1" width="3" height="14" rx="1" fill="currentColor" />
          </svg>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            {t("history.examTrends", language)}
          </span>
        </div>
        {analytics && (
          <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400">
            <span>{t("history.avgRate", language)}: <strong className="text-emerald-600 dark:text-emerald-400">{analytics.avgCompletionRate}%</strong></span>
            <span>{t("history.totalPractice", language)}: <strong className="text-slate-700 dark:text-slate-200">{analytics.totalPracticeMinutes}{t("timer.minutes", language)}</strong></span>
          </div>
        )}
      </div>

      {/* Bar Chart */}
      <div className="relative w-full">
        <svg
          viewBox="0 0 320 120"
          className="w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={t("history.examTrends", language)}
        >
          {/* Background grid lines */}
          {[0, 25, 50, 75, 100].map((pct) => {
            const y = 90 - (pct / maxRate) * 80;
            return (
              <g key={pct}>
                <line
                  x1="20"
                  y1={y}
                  x2="310"
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-700"
                  strokeWidth="0.5"
                  strokeDasharray={pct === 0 ? "none" : "2 2"}
                />
                <text
                  x="16"
                  y={y + 3}
                  textAnchor="end"
                  className="fill-slate-400 dark:fill-slate-500"
                  fontSize="7"
                >
                  {pct}%
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {barData.map((bar, i) => {
            const barWidth = Math.max(8, Math.min(22, 260 / barData.length - 4));
            const gap = (280 - barWidth * barData.length) / (barData.length + 1);
            const x = 24 + gap * (i + 1) + barWidth * i;
            const barHeight = Math.max(2, (bar.completionRate / maxRate) * 80);
            const y = 90 - barHeight;

            const isCompleted = bar.status === "completed";
            const isAbandoned = bar.status === "abandoned";

            return (
              <g key={bar.id}>
                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={2}
                  className={
                    isCompleted
                      ? "fill-emerald-500 dark:fill-emerald-400"
                      : isAbandoned
                      ? "fill-amber-400 dark:fill-amber-500"
                      : "fill-slate-300 dark:fill-slate-600"
                  }
                  opacity={0.85}
                >
                  <animate
                    attributeName="height"
                    from="0"
                    to={String(barHeight)}
                    dur="0.5s"
                    fill="freeze"
                  />
                  <animate
                    attributeName="y"
                    from="90"
                    to={String(y)}
                    dur="0.5s"
                    fill="freeze"
                  />
                </rect>

                {/* Percentage label above bar */}
                <text
                  x={x + barWidth / 2}
                  y={y - 4}
                  textAnchor="middle"
                  className="fill-slate-600 dark:fill-slate-300"
                  fontSize="7"
                  fontWeight="600"
                >
                  {bar.completionRate}%
                </text>

                {/* Date label below */}
                <text
                  x={x + barWidth / 2}
                  y={105}
                  textAnchor="middle"
                  className="fill-slate-400 dark:fill-slate-500"
                  fontSize="6.5"
                >
                  {bar.shortDate}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-1 text-[10px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-sm bg-emerald-500 dark:bg-emerald-400" />
            {t("status.completed", language)}
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-sm bg-amber-400 dark:bg-amber-500" />
            {t("status.abandoned", language)}
          </span>
        </div>
      </div>

      {/* Most Attempted Stage */}
      {analytics && analytics.mostAttemptedStage && (
        <div className="text-[10px] text-slate-500 dark:text-slate-400 text-center">
          {t("history.mostAttempted", language)}: <strong className="text-accent-600 dark:text-accent-400">{analytics.mostAttemptedStage}</strong> ({analytics.mostAttemptedCount}{language === "zh" ? "次" : " times"})
        </div>
      )}
    </div>
  );
});
