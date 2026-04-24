"use client";

import React, { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetDescription,
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

import { useVendors } from "@/hooks/user-management/use-vendors";
import { useCompanies } from "@/hooks/user-management/use-companies";
import type {
  CreateVendorInput,
  UpdateVendorInput,
} from "@/actions/user-management/vendor-action";
import SelectCompany, { Company } from "../SelectCompany";

type CompanyOption = {
  id: number | bigint;
  company_name: string | null;
  status: string | null;
};

export type VendorFormValues = {
  id: number; // login_details.id
  LoginID?: string | null;
  status?: string | null; // "Y" | "N"
  email?: string | null;
  fname?: string | null;
  lname?: string | null;
  contactnumber?: string | null;
  companyId?: number | null;
  pin?: string | null;
  fan?: string | null;
  activationAsync?: string | null;
  billCycleDay?: number | null;
};

const BILL_CYCLE_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

type Props = {
  /** Pass an existing vendor to switch the form into edit mode. */
  vendor?: VendorFormValues | null;
  /** Optional custom trigger. Defaults to an "Add Vendor" button. */
  trigger?: React.ReactNode;
};

export default function AddVendorForm({ vendor, trigger }: Props) {
  const isEdit = Boolean(vendor?.id);
  const [open, setOpen] = useState(false);

  const { createVendorMutation, updateVendorMutation } = useVendors();
  const { companies } = useCompanies();

  const companyOptions = useMemo<CompanyOption[]>(() => {
    const rows = (companies ?? []) as CompanyOption[];
    // Only show active companies for new assignments, but always include
    // the currently-selected company (even if inactive) so edits don't break.
    return rows.filter(
      (c) =>
        c.status === "Y" ||
        (vendor?.companyId != null &&
          Number(c.id) === Number(vendor.companyId)),
    );
  }, [companies, vendor?.companyId]);

  const pending =
    createVendorMutation.isPending || updateVendorMutation.isPending;

  const defaultStatus =
    vendor?.status === "N" || vendor?.status === "Y" ? vendor.status : "Y";

  const defaultCompanyId =
    vendor?.companyId != null ? String(vendor.companyId) : "";

  const defaultBillCycleDay =
    vendor?.billCycleDay != null ? String(vendor.billCycleDay) : "";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const statusRaw = String(formData.get("status") ?? "Y");
    const companyIdRaw = String(formData.get("company_id") ?? "").trim();
    const companyId = companyIdRaw ? Number(companyIdRaw) : undefined;

    const pinRaw = String(formData.get("pin") ?? "").trim();
    const fanRaw = String(formData.get("fan") ?? "").trim();
    const activationAsyncRaw = String(
      formData.get("activation_async") ?? "",
    ).trim();
    const billCycleDayRaw = String(formData.get("bill_cycle_day") ?? "").trim();
    const billCycleDay = billCycleDayRaw ? Number(billCycleDayRaw) : undefined;

    const base = {
      status: statusRaw === "N" ? ("N" as const) : ("Y" as const),
      email: String(formData.get("email") ?? "").trim(),
      fname: String(formData.get("first_name") ?? "").trim(),
      lname: String(formData.get("last_name") ?? "").trim(),
      contactnumber: String(formData.get("phone") ?? "").trim(),
      pin: pinRaw ? pinRaw : null,
      fan: fanRaw ? fanRaw : null,
      activationAsync: activationAsyncRaw ? activationAsyncRaw : null,
      billCycleDay: billCycleDay ?? null,
    };

    if (!isEdit && !companyId) {
      toast.error("Please select a company for this vendor.");
      return;
    }

    // Shared validation
    if (!base.email) {
      toast.error("Email required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(base.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!base.fname || base.fname.length < 3) {
      toast.error("First name must be at least 3 characters.");
      return;
    }
    if (!base.lname || base.lname.length < 3) {
      toast.error("Last name must be at least 3 characters.");
      return;
    }
    if (!/^\d{10}$/.test(base.contactnumber)) {
      toast.error("Contact number must be exactly 10 digits.");
      return;
    }
    if (!pinRaw) {
      toast.error("PIN required.");
      return;
    }
    if (!isEdit) {
      if (!fanRaw) {
        toast.error("FAN required.");
        return;
      }
      if (
        billCycleDay === undefined ||
        !Number.isFinite(billCycleDay) ||
        billCycleDay < 1 ||
        billCycleDay > 28
      ) {
        toast.error("Please select a billing cycle day (1-28).");
        return;
      }
    }
    if (activationAsyncRaw && !/^https?:\/\/\S+$/i.test(activationAsyncRaw)) {
      toast.error("Async URL must start with http:// or https://");
      return;
    }

    try {
      if (isEdit && vendor) {
        // In edit mode we hide Company / FAN / Billing Cycle Day, so strip
        // them out of the payload — the backend leaves those fields alone
        // when they're not supplied.
        const { fan: _omitFan, billCycleDay: _omitDay, ...editBase } = base;
        void _omitFan;
        void _omitDay;
        const payload: UpdateVendorInput = {
          id: vendor.id,
          ...editBase,
        };
        const res = await updateVendorMutation.mutateAsync(payload);
        if (res.success) setOpen(false);
      } else {
        const LoginID = String(formData.get("login_id") ?? "").trim();
        const password = String(formData.get("password") ?? "");

        if (!LoginID) {
          toast.error("Login ID required.");
          return;
        }
        if (!/^[A-Za-z0-9]+$/.test(LoginID)) {
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

        const payload: CreateVendorInput = {
          ...base,
          LoginID,
          password,
          companyId,
        };
        const res = await createVendorMutation.mutateAsync(payload);
        if (res.success) setOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const title = isEdit ? "Edit Vendor" : "Add Vendor";
  const submitLabel = pending
    ? isEdit
      ? "Saving..."
      : "Creating..."
    : isEdit
      ? "Update Vendor"
      : "Create Vendor";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? <Button>Add Vendor</Button>}
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full "
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <SheetHeader className="shrink-0 border-b p-4">
          <SheetTitle>{title}</SheetTitle>
          {isEdit && vendor && (
            <SheetDescription>
              Editing{" "}
              <span className="font-medium text-foreground">
                {vendor.LoginID ?? `Vendor #${vendor.id}`}
              </span>
              {(vendor.fname || vendor.lname) && (
                <>
                  {" "}
                  <span className="text-muted-foreground">
                    ({`${vendor.fname ?? ""} ${vendor.lname ?? ""}`.trim()})
                  </span>
                </>
              )}
            </SheetDescription>
          )}
        </SheetHeader>

        <form
          key={vendor?.id ?? "new"}
          onSubmit={handleSubmit}
          noValidate
          className="flex min-h-0 w-full flex-1 flex-col"
        >
          <div className="min-h-0 w-full flex-1 space-y-4 overflow-y-auto p-4">
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

            {/* Company + Status (Company hidden in edit mode) */}
            <FieldGroup className="flex flex-row gap-2">
              {!isEdit && (
                <Field>
                  <FieldLabel>Company *</FieldLabel>
                  <FieldContent>
                    <SelectCompany
                      name="company_id"
                      companies={companyOptions as Company[]}
                      defaultValue={defaultCompanyId || undefined}
                      required
                      triggerClassName="w-full"
                      placeholder="Select company"
                    />
                  </FieldContent>
                </Field>
              )}

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
                    defaultValue={vendor?.email ?? ""}
                  />
                </FieldContent>
              </Field>
            </FieldGroup>

            {/* Password — create only */}
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
                    defaultValue={vendor?.fname ?? ""}
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
                    defaultValue={vendor?.lname ?? ""}
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
                    defaultValue={vendor?.contactnumber ?? ""}
                    onInput={(e) => {
                      const el = e.currentTarget;
                      el.value = el.value.replace(/\D/g, "").slice(0, 10);
                    }}
                  />
                </FieldContent>
              </Field>
            </FieldGroup>

            {/* PIN */}
            <FieldGroup>
              <Field>
                <FieldLabel>PIN *</FieldLabel>
                <FieldContent>
                  <Input
                    name="pin"
                    placeholder="Enter PIN"
                    autoComplete="off"
                    defaultValue={vendor?.pin ?? ""}
                  />
                </FieldContent>
              </Field>
            </FieldGroup>

            {/* FAN — create only */}
            {!isEdit && (
              <FieldGroup>
                <Field>
                  <FieldLabel>FAN *</FieldLabel>
                  <FieldContent>
                    <Input
                      name="fan"
                      placeholder="Enter FAN"
                      autoComplete="off"
                      defaultValue={vendor?.fan ?? ""}
                    />
                  </FieldContent>
                </Field>
              </FieldGroup>
            )}

            {/* Billing Cycle Day — create only */}
            {!isEdit && (
              <FieldGroup>
                <Field>
                  <FieldLabel>Billing Cycle Day *</FieldLabel>
                  <FieldContent>
                    <Select
                      name="bill_cycle_day"
                      defaultValue={defaultBillCycleDay}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select day (1-28)" />
                      </SelectTrigger>
                      <SelectContent>
                        {BILL_CYCLE_DAYS.map((day) => (
                          <SelectItem key={day} value={String(day)}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldContent>
                </Field>
              </FieldGroup>
            )}

            {/* Async URL (optional) */}
            <FieldGroup>
              <Field>
                <FieldLabel>Async URL</FieldLabel>
                <FieldContent>
                  <Input
                    name="activation_async"
                    type="url"
                    placeholder="https://example.com/async"
                    autoComplete="off"
                    defaultValue={vendor?.activationAsync ?? ""}
                  />
                </FieldContent>
              </Field>
            </FieldGroup>
          </div>

          <SheetFooter className="shrink-0 border-t">
            <Button type="submit" disabled={pending} className="w-full">
              {submitLabel}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
