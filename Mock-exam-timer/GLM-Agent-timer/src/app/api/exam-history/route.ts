import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/exam-history - Returns all exam history records, most recent first
export async function GET() {
  try {
    const records = await db.examHistory.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(records);
  } catch (error) {
    console.error("Failed to fetch exam history:", error);
    return NextResponse.json(
      { error: "Failed to fetch exam history" },
      { status: 500 }
    );
  }
}

// POST /api/exam-history - Creates a new exam history record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { startedAt, status, totalDurationSeconds, stagesJson } = body;

    const record = await db.examHistory.create({
      data: {
        startedAt: new Date(startedAt),
        status: status || "in_progress",
        totalDurationSeconds: totalDurationSeconds || 0,
        stagesJson: stagesJson || "[]",
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Failed to create exam history:", error);
    return NextResponse.json(
      { error: "Failed to create exam history" },
      { status: 500 }
    );
  }
}

// PATCH /api/exam-history - Updates an existing record
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, finishedAt, stagesJson } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (status !== undefined) data.status = status;
    if (finishedAt !== undefined) data.finishedAt = finishedAt ? new Date(finishedAt) : null;
    if (stagesJson !== undefined) data.stagesJson = stagesJson;

    const record = await db.examHistory.update({
      where: { id: Number(id) },
      data,
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error("Failed to update exam history:", error);
    return NextResponse.json(
      { error: "Failed to update exam history" },
      { status: 500 }
    );
  }
}

// DELETE /api/exam-history - Deletes a record by id
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    await db.examHistory.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete exam history:", error);
    return NextResponse.json(
      { error: "Failed to delete exam history" },
      { status: 500 }
    );
  }
}
