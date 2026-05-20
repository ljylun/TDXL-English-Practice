import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// GET /api/exam-history/export - Export exam history as CSV
export async function GET() {
  try {
    const records = await db.examHistory.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Build dynamic headers based on the maximum number of stages
    let maxStages = 0;
    const parsedRecords = records.map((record) => {
      let stages: {
        stageId: number;
        stageName: string;
        duration: number;
        status: string;
        elapsedSeconds: number;
      }[] = [];
      try {
        stages = JSON.parse(record.stagesJson);
      } catch {
        stages = [];
      }
      if (stages.length > maxStages) maxStages = stages.length;
      return { ...record, stages };
    });

    // Build CSV headers
    const headers = ["日期", "考试状态", "总时长(分钟)"];
    for (let i = 0; i < maxStages; i++) {
      headers.push(`阶段${i + 1}状态`, `阶段${i + 1}用时(秒)`);
    }

    // Build CSV rows
    const rows = parsedRecords.map((record) => {
      const dateStr = new Date(record.startedAt).toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
      const statusMap: Record<string, string> = {
        completed: "已完成",
        abandoned: "已放弃",
        in_progress: "进行中",
      };
      const status = statusMap[record.status] || record.status;
      const totalDurationMin = Math.round(record.totalDurationSeconds / 60);

      const row: string[] = [dateStr, status, String(totalDurationMin)];

      for (let i = 0; i < maxStages; i++) {
        const stage = record.stages[i];
        if (stage) {
          const stageStatusMap: Record<string, string> = {
            completed: "已完成",
            skipped: "已跳过",
            not_reached: "未参与",
          };
          row.push(
            stageStatusMap[stage.status] || stage.status,
            String(stage.elapsedSeconds)
          );
        } else {
          row.push("", "");
        }
      }

      return row;
    });

    // Escape CSV fields (handle commas, quotes, newlines)
    const escapeCsv = (value: string): string => {
      if (
        value.includes(",") ||
        value.includes('"') ||
        value.includes("\n")
      ) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvLines = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ];

    // Add BOM for Excel Chinese character support
    const bom = "\uFEFF";
    const csvContent = bom + csvLines.join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="exam-history-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error("Failed to export exam history:", error);
    return NextResponse.json(
      { error: "Failed to export exam history" },
      { status: 500 }
    );
  }
}
