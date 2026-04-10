const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not set");
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiFetcherOptions<TBody = unknown> {
  method?: HttpMethod;
  body?: TBody;
  headers?: HeadersInit;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
  token?: string;
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
  } = options;

  const url = `${API_URL}${endpoint}`;

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;
  const requestHeaders = new Headers(headers);

  if (token && !requestHeaders.has("Authorization")) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
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
    body: body
      ? isFormData
        ? (body as FormData)
        : JSON.stringify(body)
      : undefined,
  };

  try {
    const res = await fetch(url, config);
    let data: unknown = null;

    const contentType = res.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    if (isApiResponseShape<TResponse>(data)) {
      return data;
    }

    if (!res.ok) {
      return {
        success: false,
        statusCode: res.status,
        message:
          typeof data === "object" && data && "message" in data
            ? String(
                (data as { message?: unknown }).message ?? "Request failed",
              )
            : `HTTP Error: ${res.status}`,
        description: res.statusText || "Request failed",
        data: null,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      statusCode: res.status,
      message: "Success",
      description: "The request was successful",
      data: data as TResponse,
      timestamp: new Date().toISOString(),
    };
  } catch (error: unknown) {
    return {
      success: false,
      statusCode: 500,
      message: getErrorMessage(error),
      description: "Internal Server Error",
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}
