// HTTP Status Code
export const HTTP_STATUS_CODE = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// HTTP Status Message
export const HTTP_STATUS_MESSAGE = {
  SUCCESS: "Success",
  CREATED: "Created",
  BAD_REQUEST: "Bad Request",
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden",
  NOT_FOUND: "Not Found", 
  INTERNAL_SERVER_ERROR: "Internal Server Error",
  BAD_GATEWAY: "Bad Gateway",
  SERVICE_UNAVAILABLE: "Service Unavailable",
  GATEWAY_TIMEOUT: "Gateway Timeout",
} as const;

// HTTP Status Description
export const HTTP_STATUS_DESCRIPTION = {
  SUCCESS: "The request was successful",
  CREATED: "The resource was created",
  BAD_REQUEST: "The request was invalid",
  UNAUTHORIZED: "The request was unauthorized",
  FORBIDDEN: "The request was forbidden",
  NOT_FOUND: "The resource was not found",
  INTERNAL_SERVER_ERROR: "The server encountered an error",
  BAD_GATEWAY: "The upstream server encountered an error",
  SERVICE_UNAVAILABLE: "The server is currently unavailable",
  GATEWAY_TIMEOUT: "The server timed out",
} as const;

// Types
export type HttpStatusKey = keyof typeof HTTP_STATUS_CODE;

type HttpStatusResponse = {
  code: number;
  message: string;
  description: string;
};

// Combined HTTP Status Response (Auto-generated)
export const HTTP_STATUS_RESPONSE: Record<HttpStatusKey, HttpStatusResponse> =
  Object.entries(HTTP_STATUS_CODE).reduce(
    (acc, [key, code]) => {
      const typedKey = key as HttpStatusKey;

      acc[typedKey] = {
        code,
        message: HTTP_STATUS_MESSAGE[typedKey],
        description: HTTP_STATUS_DESCRIPTION[typedKey],
      };

      return acc;
    },
    {} as Record<HttpStatusKey, HttpStatusResponse>,
  );
