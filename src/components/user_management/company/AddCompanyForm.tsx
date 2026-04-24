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

import { useCompanies } from "@/hooks/user-management/use-companies";
import type {
  CreateCompanyInput,
  UpdateCompanyInput,
} from "@/actions/user-management/company-action";

export type CompanyFormValues = {
  id: number; // tbl_company.id
  companyName?: string | null;
  loginId?: string | null;
  status?: string | null; // "Y" | "N"
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
};

type Props = {
  /** Pass an existing company to switch the form into edit mode. */
  company?: CompanyFormValues | null;
  /** Optional custom trigger. Defaults to an "Add Company" button. */
  trigger?: React.ReactNode;
};

export default function AddCompanyForm({ company, trigger }: Props) {
  const isEdit = Boolean(company?.id);
  const [open, setOpen] = useState(false);

  const { createCompanyMutation, updateCompanyMutation } = useCompanies();

  const pending =
    createCompanyMutation.isPending || updateCompanyMutation.isPending;

  const defaultStatus =
    company?.status === "N" || company?.status === "Y" ? company.status : "Y";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const statusRaw = String(formData.get("status") ?? "Y");
    const base = {
      companyName: String(formData.get("company_name") ?? "").trim(),
      status: statusRaw === "N" ? ("N" as const) : ("Y" as const),
      email: String(formData.get("email") ?? "").trim(),
      firstName: String(formData.get("first_name") ?? "").trim(),
      lastName: String(formData.get("last_name") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
    };

    // Shared validation
    if (!base.companyName) {
      toast.error("Company name required.");
      return;
    }
    if (/\s/.test(base.companyName)) {
      toast.error("Company name cannot contain spaces.");
      return;
    }
    if (!base.email) {
      toast.error("Email required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(base.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!base.firstName || base.firstName.length < 3) {
      toast.error("First name must be at least 3 characters.");
      return;
    }
    if (!base.lastName || base.lastName.length < 3) {
      toast.error("Last name must be at least 3 characters.");
      return;
    }
    if (!/^\d{10}$/.test(base.phone)) {
      toast.error("Contact number must be exactly 10 digits.");
      return;
    }

    try {
      if (isEdit && company) {
        const payload: UpdateCompanyInput = { id: company.id, ...base };
        const res = await updateCompanyMutation.mutateAsync(payload);
        if (res.success) setOpen(false);
      } else {
        const loginId = String(formData.get("login_id") ?? "").trim();
        const password = String(formData.get("password") ?? "");

        if (!loginId) {
          toast.error("Login ID required.");
          return;
        }
        if (!/^[A-Za-z0-9]+$/.test(loginId)) {
          toast.error("Login ID can only contain letters and numbers.");
          return;
        }
        if (!password) {
          toast.error("Password required.");
          return;
        }
        const pw = validatePassword(password);
        if (!pw.valid) {
          toast.error(
            pw.firstFailure ?? "Password does not meet requirements.",
          );
          return;
        }

        const payload: CreateCompanyInput = { ...base, loginId, password };
        const res = await createCompanyMutation.mutateAsync(payload);
        if (res.success) setOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const title = isEdit ? "Edit Company" : "Add Company";
  const submitLabel = pending
    ? isEdit
      ? "Saving..."
      : "Creating..."
    : isEdit
      ? "Update Company"
      : "Create Company";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? <Button>Add Company</Button>}
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

        <form
          key={company?.id ?? "new"}
          onSubmit={handleSubmit}
          noValidate
          className="flex h-full w-full flex-col"
        >
          <div className="w-full flex-1 space-y-4 overflow-y-auto p-4">
            {/* Company Name */}
            <FieldGroup>
              <Field>
                <FieldLabel>Business / Company Name *</FieldLabel>
                <FieldContent>
                  <Input
                    name="company_name"
                    placeholder="Enter business/company name (no spaces)"
                    autoComplete="organization"
                    defaultValue={company?.companyName ?? ""}
                    onInput={(e) => {
                      const el = e.currentTarget;
                      el.value = el.value.replace(/\s+/g, "");
                    }}
                  />
                </FieldContent>
              </Field>
            </FieldGroup>

            {/* Login ID — create only */}
            {!isEdit && (
              <FieldGroup>
                <Field>
                  <FieldLabel>Login ID *</FieldLabel>
                  <FieldContent>
                    <Input
                      name="login_id"
                      placeholder="Letters and numbers only"
                      autoComplete="username"
                      onInput={(e) => {
                        const el = e.currentTarget;
                        el.value = el.value.replace(/[^A-Za-z0-9]/g, "");
                      }}
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
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Y">Active</SelectItem>
                      <SelectItem value="N">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
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
                    placeholder="Enter email address"
                    autoComplete="email"
                    defaultValue={company?.email ?? ""}
                  />
                </FieldContent>
              </Field>
            </FieldGroup>

            {/* Password — create only (edit uses dedicated UpdatePassword) */}
            {!isEdit && (
              <FieldGroup>
                <Field>
                  <FieldLabel>Password *</FieldLabel>
                  <FieldContent>
                    <PasswordInput
                      name="password"
                      placeholder="Min. 8 characters"
                      autoComplete="new-password"
                      showStrength
                    />
                  </FieldContent>
                </Field>
              </FieldGroup>
            )}

            {/* First Name */}
            <FieldGroup>
              <Field>
                <FieldLabel>First Name *</FieldLabel>
                <FieldContent>
                  <Input
                    name="first_name"
                    placeholder="Min. 3 characters"
                    autoComplete="given-name"
                    defaultValue={company?.firstName ?? ""}
                  />
                </FieldContent>
              </Field>
            </FieldGroup>

            {/* Last Name */}
            <FieldGroup>
              <Field>
                <FieldLabel>Last Name *</FieldLabel>
                <FieldContent>
                  <Input
                    name="last_name"
                    placeholder="Min. 3 characters"
                    autoComplete="family-name"
                    defaultValue={company?.lastName ?? ""}
                  />
                </FieldContent>
              </Field>
            </FieldGroup>

            {/* Contact Number */}
            <FieldGroup>
              <Field>
                <FieldLabel>Contact Number *</FieldLabel>
                <FieldContent>
                  <Input
                    name="phone"
                    placeholder="10-digit contact number"
                    inputMode="numeric"
                    maxLength={10}
                    autoComplete="tel-national"
                    defaultValue={company?.phone ?? ""}
                    onInput={(e) => {
                      const el = e.currentTarget;
                      el.value = el.value.replace(/\D/g, "").slice(0, 10);
                    }}
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
