import { auth } from "@/lib/auth";
import PermissionsTab from "./_components/PermissionsTab";
import { redirect } from "next/navigation";

export default async function PermissionsPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  return (
    <div>
      <PermissionsTab />
    </div>
  );
}
