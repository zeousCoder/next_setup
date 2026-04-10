import "server-only";
import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { apiResponse } from "@/lib/api/apiResponse";
import { HttpStatusKey } from "@/constants/httpStatus";

type RouteHandler<T = unknown> = (req: NextRequest) => Promise<T>;

interface ApiHandlerOptions {
  successStatus?: HttpStatusKey;
  successMessage?: string;
}

type KnownErrorLike = {
  code?: string;
  name?: string;
  message?: string;
  status?: number;
};

const DB_ERROR_MAP: Record<string, HttpStatusKey> = {
  ER_BAD_DB_ERROR: "SERVICE_UNAVAILABLE",
  ECONNREFUSED: "SERVICE_UNAVAILABLE",
  PROTOCOL_CONNECTION_LOST: "SERVICE_UNAVAILABLE",
  ER_ACCESS_DENIED_ERROR: "UNAUTHORIZED",
  ER_BAD_FIELD_ERROR: "BAD_REQUEST",
  ER_PARSE_ERROR: "BAD_REQUEST",
  ETIMEDOUT: "GATEWAY_TIMEOUT",
  ESOCKETTIMEDOUT: "GATEWAY_TIMEOUT",
};

export class ApiError extends Error {
  status: HttpStatusKey;
  details?: unknown;

  constructor(status: HttpStatusKey, message?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function mapHttpStatusToKey(status?: number): HttpStatusKey | undefined {
  if (!status) return undefined;
  if (status === 400) return "BAD_REQUEST";
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 502) return "BAD_GATEWAY";
  if (status === 503) return "SERVICE_UNAVAILABLE";
  if (status === 504) return "GATEWAY_TIMEOUT";
  if (status >= 500) return "INTERNAL_SERVER_ERROR";
  return undefined;
}

function mapError(error: unknown): {
  status: HttpStatusKey;
  message?: string;
  details?: unknown;
} {
  if (error instanceof ApiError) {
    return {
      status: error.status,
      message: error.message,
      details: error.details,
    };
  }

  if (error instanceof ZodError) {
    return {
      status: "BAD_REQUEST",
      message: "Invalid request data",
      details: error.flatten().fieldErrors,
    };
  }

  const known = error as KnownErrorLike;

  if (known?.code && DB_ERROR_MAP[known.code]) {
    return {
      status: DB_ERROR_MAP[known.code],
      message: known.message,
    };
  }

  if (known?.name === "AbortError") {
    return {
      status: "GATEWAY_TIMEOUT",
      message: known.message || "Request was aborted",
    };
  }

  const mappedFromStatus = mapHttpStatusToKey(known?.status);
  if (mappedFromStatus) {
    return {
      status: mappedFromStatus,
      message: known.message,
    };
  }

  return {
    status: "INTERNAL_SERVER_ERROR",
    message: error instanceof Error ? error.message : "Unexpected server error",
  };
}

export function withApiHandler<T>(
  handler: RouteHandler<T>,
  options: ApiHandlerOptions = {},
) {
  const { successStatus = "SUCCESS", successMessage } = options;

  return async (req: NextRequest) => {
    try {
      const result = await handler(req);
      return apiResponse(successStatus, result, successMessage);
    } catch (error: unknown) {
      console.error("API Error:", error);
      const mapped = mapError(error);
      return apiResponse(mapped.status, mapped.details ?? null, mapped.message);
    }
  };
}
