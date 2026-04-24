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
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function Controller({ user }: { user?: any }) {
  const { data: session } = useSession();
  const sessionUser = session?.user ?? user;
  const role = sessionUser?.role;
  const codes: string[] = sessionUser?.allPermissCodes ?? [];

  // ADMIN bypasses every permission code. Everyone else must have the code.
  const has = (code: string) => role === "ADMIN" || codes.includes(code);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Settings2 size={16} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56">
        {(role === "ADMIN" || role === "ADMINCHILD") && (
          <>
            <DropdownMenuItem asChild disabled={!has("MV268")}>
              <Link href="/user-management/view_company">
                View Company (MV268)
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-foreground/10" />
          </>
        )}
        {(role === "ADMIN" || role === "ADMINCHILD") && (
          <>
            <DropdownMenuItem asChild disabled={!has("MV267")}>
              <Link href="/user-management/view_vendor">
                View Vendor (MV267)
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-foreground/10" />
          </>
        )}

        {(role === "ADMIN" || role === "ADMINCHILD") && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Admin User Management</DropdownMenuLabel>
              <DropdownMenuItem asChild disabled={!has("MV56")}>
                <Link href="/user-management/admin?tab=admin-list">
                  Admin User List (MV56)
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild disabled={!has("MV55")}>
                <Link href="/user-management/admin?tab=admin-group">
                  Admin User Group (MV55)
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-foreground/10" />
          </>
        )}

        {(role === "COMPANY" ||
          role === "COMPANYCHILD" ||
          role === "ADMIN" ||
          role === "ADMINCHILD") && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Company User Management</DropdownMenuLabel>
              <DropdownMenuItem asChild disabled={!has("MV265")}>
                <Link href="/user-management/company?tab=company-list">
                  Company User List (MV265)
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild disabled={!has("MV263")}>
                <Link href="/user-management/company?tab=company-group">
                  Company User Group (MV263)
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-foreground/10" />
          </>
        )}

        {(role === "VENDOR" ||
          role === "VENDORCHILD" ||
          role === "ADMIN" ||
          role === "ADMINCHILD" ||
          role === "COMPANY" ||
          role === "COMPANYCHILD") && (
          <DropdownMenuGroup>
            <DropdownMenuLabel>Vendor User Management</DropdownMenuLabel>
            <DropdownMenuItem asChild disabled={!has("MV266")}>
              <Link href="/user-management/vendor?tab=vendor-list">
                Vendor User List (MV266)
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild disabled={!has("MV264")}>
              <Link href="/user-management/vendor?tab=vendor-group">
                Vendor User Group (MV264)
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
