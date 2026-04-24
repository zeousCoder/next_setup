"use client";

import React, { useState } from "react";
import { Edit2Icon, KeyRoundIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import PasswordInput, {
  validatePassword,
} from "@/components/auth/PasswordInput";

export type UpdatePasswordResult =
  | { success: true }
  | { success: false; error?: string };

export type UpdatePasswordProps = {
  /**
   * Called when the user submits a valid password.
   * Return `{ success: true }` to close the dialog and reset state.
   * Return `{ success: false, error? }` (or throw) to keep it open.
   */
  onSubmit: (password: string) => Promise<UpdatePasswordResult | void>;

  /** Disables inputs & the submit button while an update is in flight. */
  isPending?: boolean;

  /** Human-readable label shown in the description, e.g. username or email. */
  displayName?: string | null;

  /** Custom trigger. Defaults to a small outline pencil icon button. */
  trigger?: React.ReactNode;

  /** Minimum password length. Defaults to 6. */
  minLength?: number;

  /** Dialog title. */
  title?: string;

  /** Optional description override. */
  description?: React.ReactNode;
};

export default function UpdatePassword({
  onSubmit,
  isPending = false,
  displayName,
  trigger,
  minLength = 8,
  title = "Update Password",
  description,
}: UpdatePasswordProps) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState(false);

  const passwordCheck = validatePassword(password);
  const passwordError =
    password.length > 0 && !passwordCheck.valid
      ? passwordCheck.firstFailure
      : undefined;
  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const canSubmit =
    passwordCheck.valid && password === confirmPassword && !isPending;

  const resetState = () => {
    setPassword("");
    setConfirmPassword("");
    setTouched(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (isPending) return;
    setOpen(next);
    if (!next) resetState();
  };

  const handleSubmit = async () => {
    setTouched(true);
    if (!canSubmit) return;

    try {
      const result = await onSubmit(password);
      if (!result || result.success) {
        resetState();
        setOpen(false);
      }
    } catch {
      // Caller is responsible for surfacing errors (toast, etc.).
      // Keep the dialog open so the user can retry.
    }
  };

  const label = displayName ?? "this user";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="outline"
            size="sm"
            aria-label={`Update password for ${label}`}
          >
            <KeyRoundIcon className="size-4" />
            Change Password
          </Button>
        )}
      </DialogTrigger>

      <DialogContent
        className="w-full lg:max-w-xl max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description ?? (
              <>
                Set a new password for{" "}
                <span className="font-medium">{label}</span>. Minimum{" "}
                {minLength} characters.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <PasswordInput
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPending}
              autoComplete="new-password"
              showStrength
            />
            {touched && passwordError && (
              <span className="text-xs text-destructive">{passwordError}</span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <PasswordInput
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isPending}
              autoComplete="new-password"
            />
            {mismatch && (
              <span className="text-xs text-destructive">
                Passwords do not match.
              </span>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button className="w-full" onClick={handleSubmit} disabled={!canSubmit}>
            {isPending ? "Updating..." : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
