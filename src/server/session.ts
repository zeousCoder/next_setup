import { ApiError } from "@/lib/api/apiHandler";
import { cookies } from "next/headers";

export async function getSession<T = unknown>(): Promise<T> {
  const session = (await cookies()).get("session")?.value;

  if (!session) {
    throw new ApiError("UNAUTHORIZED", "Unauthorized: No active session");
  }

  try {
    return JSON.parse(session) as T;
  } catch {
    throw new ApiError("INTERNAL_SERVER_ERROR", "Invalid session format");
  }
}
