import Login from "@/components/auth/Login";
import { getAuthSesstion } from "@/server/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  return <Login />;
}
