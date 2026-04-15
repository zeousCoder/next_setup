import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const now = new Date();

    const scheduledTime = new Date("2026-03-13T10:00:00");

    if (now < scheduledTime) {
      return NextResponse.json(
        {
          success: false,
          statusCode: 400,
          message: "Cron execution time has not been reached",
          data: {
            scheduledAt: scheduledTime.toISOString(),
            currentTime: now.toISOString(),
          },
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      statusCode: 200,
      message: "Cron executed successfully",
      data: {
        executedAt: now.toISOString(),
      },
    });
  } catch (error: unknown) {
    console.error("Cron Execution Error:", error);

    return NextResponse.json(
      {
        success: false,
        statusCode: 500,
        message:
          error instanceof Error ? error.message : "Cron execution failed",
        data: null,
      },
      { status: 500 },
    );
  }
}
