import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";

export const getSession = async () => {
  try {
    const session = await auth();

    return session;
  } catch (error: any) {
    console.error(error);
    return null;
  }
};

export const logout = async () => {
  try {
    await signOut({ redirectTo: "/login" });
  } catch (error: any) {
    console.error(error);
    redirect(`/error`);
  }
};

export const permissionCheck = async (permissionCode: string) => {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "ADMIN") {
    return true;
  }

  const codes = session.user.allPermissCodes ?? [];
  if (!codes.includes(permissionCode)) {
    redirect("/");
  }

  return true;
};
