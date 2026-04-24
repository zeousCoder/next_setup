"use client";

import React, { useState } from "react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PasswordInput, {
  validatePassword,
} from "@/components/auth/PasswordInput";

import { useAdminChildUsers } from "@/hooks/user-management/use-admins";
import type {
  CreateAdminChildUserInput,
  UpdateAdminChildUserInput,
} from "@/actions/user-management/admin-action";

export type AdminUserFormValues = {
  id: number;
  userName?: string | null;
  email?: string | null;
  fname?: string | null;
  lname?: string | null;
  contactnumber?: string | null;
  address?: string | null;
  aboutme?: string | null;
  status?: number | string | null;
};

type Props = {
  /** Pass an existing user to switch the form into edit mode. */
  user?: AdminUserFormValues | null;
  /** Optional custom trigger. Defaults to an "Add Admin User" button. */
  trigger?: React.ReactNode;
};

export default function AddAdminUserForm({ user, trigger }: Props) {
  const isEdit = Boolean(user?.id);
  const [open, setOpen] = useState(false);

  const { createAdminChildUserMutation, updateAdminChildUserMutation } =
    useAdminChildUsers();

  const pending =
    createAdminChildUserMutation.isPending ||
    updateAdminChildUserMutation.isPending;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const base = {
      userName: String(formData.get("user_name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      first_name: String(formData.get("first_name") ?? "").trim(),
      last_name: String(formData.get("last_name") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      address: String(formData.get("address") ?? ""),
      about_me: String(formData.get("about_me") ?? ""),
      status: String(formData.get("status") ?? "1"),
    };
    const password = String(formData.get("password") ?? "");

    // client-side validation → toast
    if (!base.userName) {
      toast.error("Username is required");
      return;
    }
    if (!/^[A-Za-z0-9_]+$/.test(base.userName)) {
      toast.error(
        "Username can only contain letters, numbers, and underscores (_)",
      );
      return;
    }
    if (!base.email) {
      toast.error("Email is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(base.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!isEdit) {
      if (!password) {
        toast.error("Password is required");
        return;
      }
      const pw = validatePassword(password);
      if (!pw.valid) {
        toast.error(pw.firstFailure ?? "Password does not meet requirements.");
        return;
      }
    }
    if (!/^\d{10}$/.test(base.phone)) {
      toast.error("Phone must be exactly 10 digits");
      return;
    }

    try {
      if (isEdit && user) {
        const payload: UpdateAdminChildUserInput = { id: user.id, ...base };
        const res = await updateAdminChildUserMutation.mutateAsync(payload);
        if (res.success) setOpen(false);
      } else {
        const payload: CreateAdminChildUserInput = {
          ...base,
          password,
        };
        const res = await createAdminChildUserMutation.mutateAsync(payload);
        if (res.success) setOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const defaultStatus =
    user?.status !== undefined && user?.status !== null
      ? String(user.status)
      : "1";

  const title = isEdit ? "Edit Admin User" : "Add Admin User";
  const submitLabel = pending
    ? isEdit
      ? "Saving..."
      : "Creating..."
    : isEdit
      ? "Update Admin User"
      : "Create Admin User";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? <Button>Add Admin User</Button>}
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <SheetHeader className="border-b p-4">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        {/* key forces a fresh form when switching between users / create mode */}
        <form
          key={user?.id ?? "new"}
          onSubmit={handleSubmit}
          noValidate
          className="flex h-full w-full flex-col"
        >
          <div className="w-full flex-1 space-y-4 overflow-y-auto p-4">
            {/* Username */}
            <FieldGroup>
              <Field>
                <FieldLabel>Username *</FieldLabel>
                <FieldContent>
                  <Input
                    name="user_name"
                    placeholder="Username"
                    autoComplete="username"
                    defaultValue={user?.userName ?? ""}
                    onInput={(e) => {
                      const el = e.currentTarget;
                      el.value = el.value.replace(/[^A-Za-z0-9_]/g, "");
                    }}
                  />
                </FieldContent>
              </Field>
            </FieldGroup>

            {/* Email */}
            <FieldGroup>
              <Field>
                <FieldLabel>Email *</FieldLabel>
                <FieldContent>
                  <Input
                    name="email"
                    type="email"
                    placeholder="Email"
                    defaultValue={user?.email ?? ""}
                  />
                </FieldContent>
              </Field>
            </FieldGroup>

            {/* Password — only in create mode (edit uses the dedicated UpdatePassword flow) */}
            {!isEdit && (
              <FieldGroup>
                <Field>
                  <FieldLabel>Password *</FieldLabel>
                  <FieldContent>
                    <PasswordInput
                      name="password"
                      placeholder="Password"
                      showStrength
                      autoComplete="new-password"
                    />
                  </FieldContent>
                </Field>
              </FieldGroup>
            )}

            {/* Status */}
            <FieldGroup>
              <Field>
                <FieldLabel>Status *</FieldLabel>
                <FieldContent>
                  <Select name="status" defaultValue={defaultStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Active</SelectItem>
                      <SelectItem value="0">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
            </FieldGroup>

            {/* First Name */}
            <FieldGroup>
              <Field>
                <FieldLabel>First Name</FieldLabel>
                <FieldContent>
                  <Input
                    name="first_name"
                    placeholder="First Name"
                    defaultValue={user?.fname ?? ""}
                  />
                </FieldContent>
              </Field>
            </FieldGroup>

            {/* Last Name */}
            <FieldGroup>
              <Field>
                <FieldLabel>Last Name</FieldLabel>
                <FieldContent>
                  <Input
                    name="last_name"
                    placeholder="Last Name"
                    defaultValue={user?.lname ?? ""}
                  />
                </FieldContent>
              </Field>
            </FieldGroup>

            {/* Phone */}
            <FieldGroup>
              <Field>
                <FieldLabel>Phone *</FieldLabel>
                <FieldContent>
                  <Input
                    name="phone"
                    placeholder="10-digit phone number"
                    inputMode="numeric"
                    maxLength={10}
                    defaultValue={user?.contactnumber ?? ""}
                    onInput={(e) => {
                      const el = e.currentTarget;
                      el.value = el.value.replace(/\D/g, "").slice(0, 10);
                    }}
                  />
                </FieldContent>
              </Field>
            </FieldGroup>

            {/* Address */}
            <FieldGroup>
              <Field>
                <FieldLabel>Address</FieldLabel>
                <FieldContent>
                  <Textarea
                    name="address"
                    placeholder="Address"
                    rows={2}
                    defaultValue={user?.address ?? ""}
                  />
                </FieldContent>
              </Field>
            </FieldGroup>

            {/* About */}
            <FieldGroup>
              <Field>
                <FieldLabel>About Me</FieldLabel>
                <FieldContent>
                  <Textarea
                    name="about_me"
                    placeholder="About Me"
                    rows={2}
                    defaultValue={user?.aboutme ?? ""}
                  />
                </FieldContent>
              </Field>
            </FieldGroup>
          </div>

          <SheetFooter className="border-t">
            <Button type="submit" disabled={pending} className="w-full">
              {submitLabel}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
