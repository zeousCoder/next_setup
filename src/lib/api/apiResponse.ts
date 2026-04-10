import "server-only";
import { NextResponse } from "next/server";
import { HTTP_STATUS_RESPONSE, HttpStatusKey } from "@/constants/httpStatus";

export function apiResponse<T>(
  status: HttpStatusKey,
  data?: T,
  customMessage?: string,
): NextResponse {
  const statusInfo = HTTP_STATUS_RESPONSE[status];

  return NextResponse.json(
    {
      success: statusInfo.code < 400,
      statusCode: statusInfo.code,
      message: customMessage || statusInfo.message,
      description: statusInfo.description,
      data: data ?? null, 
      timestamp: new Date().toISOString(),
    },
    { status: statusInfo.code },
  );
}
