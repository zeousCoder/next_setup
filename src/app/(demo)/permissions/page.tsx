"use client"
import PermissionsTab from "./_components/PermissionsTab";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function PermissionsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session) {
    router.push("/login");
  }
  return (
    <div>
      <PermissionsTab />
    </div>
  );
}
