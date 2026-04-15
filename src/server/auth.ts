import { apiFetcher } from "@/lib/api/apiFetcher";
import { cookies } from "next/headers";

export async function getAuthSesstion() {
  //   const session = await cookies();
  //   const authToken = session.get("auth_token");
  //   if (!authToken) {
  //     console.log("Unauthorized");
  //     throw new ApiError("UNAUTHORIZED", "Unauthorized", null);
  //   }
  //   const res = await apiFetcher("/auth/me", {
  //     method: "GET",
  //     token: authToken.value,
  //   });
  //   if (!res.success) {
  //     console.log("Unauthorized");
  //     throw new ApiError("UNAUTHORIZED", "Unauthorized", null);
  //   }
  //   return res.data;
}
