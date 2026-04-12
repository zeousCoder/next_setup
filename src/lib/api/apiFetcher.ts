import {
  HTTP_STATUS_CODE,
  HTTP_STATUS_RESPONSE,
  HttpStatusKey,
} from "@/constants/httpStatus";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const SERVER_TOKEN = process.env.SERVER_TOKEN;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not set");
}

// Keep token optional globally; some endpoints may be public.
const isServer = typeof window === "undefined";
let hasWarnedMissingServerToken = false;

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiFetcherOptions<TBody = unknown> {
  method?: HttpMethod;
  body?: TBody;
  headers?: HeadersInit;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
  token?: string;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  description?: string;
  data: T | null;
  timestamp?: string;
}

function isApiResponseShape<T>(value: unknown): value is ApiResponse<T> {
  if (!value || typeof value !== "object") return false;

  return (
    "success" in value &&
    "statusCode" in value &&
    "message" in value &&
    "data" in value
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected fetch error";
}

function parseJsonSafely(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function isRetryableStatus(status: number): boolean {
  return [408, 429, 500, 502, 503, 504].includes(status);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Maps numeric HTTP status codes to HttpStatusKey
 */
function mapStatusCodeToKey(status: number): HttpStatusKey {
  const entry = Object.entries(HTTP_STATUS_CODE).find(
    ([, code]) => code === status,
  );

  if (entry) {
    return entry[0] as HttpStatusKey;
  }

  if (status >= 500) return "INTERNAL_SERVER_ERROR";
  if (status === 404) return "NOT_FOUND";
  if (status === 403) return "FORBIDDEN";
  if (status === 401) return "UNAUTHORIZED";
  if (status === 400) return "BAD_REQUEST";

  return "SUCCESS";
}

export async function apiFetcher<TResponse, TBody = unknown>(
  endpoint: string,
  options: ApiFetcherOptions<TBody> = {},
): Promise<ApiResponse<TResponse>> {
  const {
    method = "GET",
    body,
    headers = {},
    cache = "no-store",
    next,
    token,
    timeoutMs = 15000,
    retries = 0,
    retryDelayMs = 500,
  } = options;

  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;
  const url = `${API_URL}${normalizedEndpoint}`;

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has("Accept")) {
    requestHeaders.set("Accept", "application/json");
  }

  const authToken = token ?? (isServer ? SERVER_TOKEN : undefined);

  if (isServer && !authToken && !hasWarnedMissingServerToken) {
    hasWarnedMissingServerToken = true;
    console.warn(
      "[apiFetcher] SERVER_TOKEN is not set. Protected upstream calls may fail.",
    );
  }

  if (authToken && !requestHeaders.has("Authorization")) {
    requestHeaders.set("Authorization", `Bearer ${authToken}`);
  }

  if (
    !isFormData &&
    body !== undefined &&
    !requestHeaders.has("Content-Type")
  ) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const config: RequestInit & { next?: NextFetchRequestConfig } = {
    method,
    headers: requestHeaders,
    cache,
    next,
    body:
      body !== undefined
        ? isFormData
          ? (body as FormData)
          : JSON.stringify(body)
        : undefined,
  };

  let attempt = 0;
  const maxAttempts = Math.max(0, retries) + 1;

  while (attempt < maxAttempts) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, { ...config, signal: controller.signal });
      clearTimeout(timeout);

      let data: unknown = null;
      const contentType = res.headers.get("content-type") || "";
      const isEmptyResponse = res.status === 204 || res.status === 205;

      if (!isEmptyResponse) {
        const rawText = await res.text();
        if (rawText.length > 0) {
          data = contentType.includes("application/json")
            ? (parseJsonSafely(rawText) ?? rawText)
            : rawText;
        }
      }

      // If upstream already follows standardized format
      if (isApiResponseShape<TResponse>(data)) {
        return data;
      }

      const statusKey = mapStatusCodeToKey(res.status);
      const statusInfo = HTTP_STATUS_RESPONSE[statusKey];

      // Handle HTTP errors
      if (!res.ok) {
        const shouldRetry =
          attempt < maxAttempts - 1 &&
          method === "GET" &&
          isRetryableStatus(res.status);

        if (shouldRetry) {
          attempt += 1;
          await delay(retryDelayMs * attempt);
          continue;
        }

        const isHtmlError =
          typeof data === "string" &&
          (data.trimStart().startsWith("<!DOCTYPE html") ||
            data.trimStart().startsWith("<html"));

        return {
          success: false,
          statusCode: statusInfo.code,
          message:
            typeof data === "object" && data && "message" in data
              ? String(
                  (data as { message?: unknown }).message ?? statusInfo.message,
                )
              : isHtmlError
                ? `Upstream returned HTML error page (${res.status})`
                : statusInfo.message,
          description: statusInfo.description,
          data: null,
          timestamp: new Date().toISOString(),
        };
      }

      // Success response
      return {
        success: true,
        statusCode: statusInfo.code,
        message: statusInfo.message,
        description: statusInfo.description,
        data: (data ?? null) as TResponse | null,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      clearTimeout(timeout);

      const isAbortError =
        error instanceof DOMException && error.name === "AbortError";

      const shouldRetry = attempt < maxAttempts - 1 && method === "GET";
      if (shouldRetry) {
        attempt += 1;
        await delay(retryDelayMs * attempt);
        continue;
      }

      const statusKey: HttpStatusKey = isAbortError
        ? "GATEWAY_TIMEOUT"
        : "INTERNAL_SERVER_ERROR";

      const statusInfo = HTTP_STATUS_RESPONSE[statusKey];

      return {
        success: false,
        statusCode: statusInfo.code,
        message: isAbortError
          ? `Request timed out after ${timeoutMs}ms`
          : getErrorMessage(error),
        description: statusInfo.description,
        data: null,
        timestamp: new Date().toISOString(),
      };
    }
  }

  const fallbackStatus = HTTP_STATUS_RESPONSE.INTERNAL_SERVER_ERROR;

  return {
    success: false,
    statusCode: fallbackStatus.code,
    message: "Request failed after retries",
    description: fallbackStatus.description,
    data: null,
    timestamp: new Date().toISOString(),
  };
}
