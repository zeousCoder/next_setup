"use client";

import { LogOutIcon, MailIcon, ShieldCheckIcon, UserIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";
import type { Session } from "next-auth";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type ProfileUser = Session["user"] | undefined | null;

function initials(name?: string | null): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (
    parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)
  ).toUpperCase();
}

export default function Profile({ user }: { user: ProfileUser }) {
  const [signingOut, setSigningOut] = useState(false);

  if (!user) return null;

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut({ callbackUrl: "/login" });
  };

  const role = (user as { role?: string }).role;
  const loginId = (user as { LoginId?: string | null }).LoginId;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Open profile menu"
          className={cn(
            "rounded-full outline-none transition-all",
            "ring-0 ring-primary/50 hover:ring-2 focus-visible:ring-2",
          )}
        >
          <Avatar className="h-10 w-10 cursor-pointer">
            <AvatarImage
              src={(user as { avatar?: string }).avatar}
              alt={user.name ?? "User"}
            />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-72 p-0">
        <PopoverHeader className="flex flex-row items-center gap-3 border-b border-border p-3">
          <Avatar className="h-11 w-11 shrink-0">
            <AvatarImage
              src={(user as { avatar?: string }).avatar}
              alt={user.name ?? "User"}
            />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <p className="truncate text-sm font-semibold text-foreground">
              {user.name ?? "Unknown user"}
            </p>
            {user.email && (
              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                <MailIcon size={12} />
                <span className="truncate">{user.email}</span>
              </p>
            )}
          </div>
        </PopoverHeader>

        <div className="flex flex-col gap-2 px-3 py-2.5 text-xs">
          {role && (
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <ShieldCheckIcon size={12} />
                Role
              </span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                {role}
              </span>
            </div>
          )}

          {loginId && (
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <UserIcon size={12} />
                Login ID
              </span>
              <span className="truncate font-medium text-foreground">
                {loginId}
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-border p-2">
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            <LogOutIcon size={14} className="mr-2" />
            {signingOut ? "Signing out…" : "Sign Out"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
