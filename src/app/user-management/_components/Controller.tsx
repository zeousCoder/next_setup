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
import { LockIcon, LogOut, Settings2 } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function Controller() {
  const isAccessGranted = false;
  const pcCode = "1";

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
          <DropdownMenuItem disabled={!isAccessGranted}>
            <Link href="#" className="flex items-center gap-2">
              Admin User List (PC1) <LockIcon size={16} />
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
