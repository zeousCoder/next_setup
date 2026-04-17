"use client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings2 } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";

export default function Controller() {
  const { data: session } = useSession();

  const isSuperAdmin = session?.user?.role === "SUPERADMIN";
  const isAdmin = session?.user?.role === "ADMIN";
  const isCompany =
    session?.user?.role === "COMPANY" || session?.user?.role === "COMPANYCHILD";
  const isVendor =
    session?.user?.role === "VENDOR" || session?.user?.role === "VENDORCHILD";
  const router = useRouter();

  console.log(session?.user?.role);

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Settings2 size={16} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Admin User Management</DropdownMenuLabel>
          <DropdownMenuItem>
            <Link href="#" className="flex items-center gap-2">
              Admin User List (PC1)
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href="#">Admin User Group (PC2)</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-foreground/10" />

        <DropdownMenuGroup>
          <DropdownMenuLabel>Company User Management</DropdownMenuLabel>
          <DropdownMenuItem>
            <Link href="#">Company User List (PC3)</Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href="#">Company User Group (PC4)</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-foreground/10" />

        <DropdownMenuGroup>
          <DropdownMenuLabel>Vendor User Management</DropdownMenuLabel>
          <DropdownMenuItem>
            <Link href="#">Vendor User List (PC5)</Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href="#">Vendor User Group (PC6)</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-foreground/10" />

        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
