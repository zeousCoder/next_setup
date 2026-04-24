"use client";

import React, { useMemo, useState } from "react";
import { PencilIcon } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import DataTable from "@/components/datatable/DataTable";
import { ColumnDef, createColumns } from "@/components/datatable/Column";

import { useVendorFans } from "@/hooks/user-management/use-vendor-fans";
import type {
  CreateFanInput,
  FanRow,
  UpdateFanInput,
} from "@/actions/user-management/fan-action";

const BILL_CYCLE_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

type Props = {
  vendorId: number;
  vendorLoginId: string | null;
  /** Optional custom trigger. Defaults to an "Add/Edit FAN" button. */
  trigger?: React.ReactNode;
};

type FormState = {
  id: number | null; // null = create mode, number = edit mode
  fan: string;
  fanName: string;
  fanDescription: string;
  billCycleDay: string;
  status: "Active" | "Inactive";
  setAsDefault: "Yes" | "No";
};

const emptyForm: FormState = {
  id: null,
  fan: "",
  fanName: "",
  fanDescription: "",
  billCycleDay: "",
  status: "Active",
  setAsDefault: "No",
};

export default function FanManagerDialog({
  vendorId,
  vendorLoginId,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const {
    fans,
    isLoading,
    createFanMutation,
    updateFanMutation,
  } = useVendorFans(open ? vendorId : null);

  const isEdit = form.id !== null;
  const pending =
    createFanMutation.isPending || updateFanMutation.isPending;

  const rows = useMemo<FanRow[]>(() => (fans ?? []) as FanRow[], [fans]);

  const resetForm = () => setForm(emptyForm);

  const handleEdit = (row: FanRow) => {
    setForm({
      id: row.id,
      fan: row.fan ?? "",
      fanName: row.fan_name ?? "",
      fanDescription: row.fan_description ?? "",
      billCycleDay:
        row.bill_cycle_day != null ? String(row.bill_cycle_day) : "",
      status: row.status === "Inactive" ? "Inactive" : "Active",
      setAsDefault: row.set_as_default === "Yes" ? "Yes" : "No",
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const billCycleDay = form.billCycleDay ? Number(form.billCycleDay) : NaN;

    if (!isEdit && !form.fan.trim()) {
      toast.error("FAN required.");
      return;
    }
    if (
      !Number.isFinite(billCycleDay) ||
      billCycleDay < 1 ||
      billCycleDay > 28
    ) {
      toast.error("Please select a billing cycle day (1-28).");
      return;
    }

    try {
      if (isEdit && form.id != null) {
        const payload: UpdateFanInput = {
          id: form.id,
          vendorId,
          fanName: form.fanName.trim() || null,
          fanDescription: form.fanDescription.trim() || null,
          billCycleDay,
          status: form.status,
          setAsDefault: form.setAsDefault,
        };
        const res = await updateFanMutation.mutateAsync(payload);
        if (res.success) resetForm();
      } else {
        if (!vendorLoginId) {
          toast.error("Missing vendor login id.");
          return;
        }
        const payload: CreateFanInput = {
          vendorId,
          vendorLoginId,
          fan: form.fan.trim(),
          fanName: form.fanName.trim() || null,
          fanDescription: form.fanDescription.trim() || null,
          billCycleDay,
          status: form.status,
          setAsDefault: form.setAsDefault,
        };
        const res = await createFanMutation.mutateAsync(payload);
        if (res.success) resetForm();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const columns = useMemo<ColumnDef<FanRow, any>[]>(
    () =>
      createColumns<FanRow>([
        { key: "fan", header: "FAN" },
        { key: "fan_name", header: "FAN Name" },
        { key: "fan_description", header: "Description" },
        {
          key: "bill_cycle_day",
          header: "Bill cycle Start day",
          cell: (row) => row.bill_cycle_day ?? "-",
        },
        {
          key: "status",
          header: "Status",
          cell: (row) =>
            row.status === "Active" ? (
              <Badge variant="default">Active</Badge>
            ) : (
              <Badge variant="destructive">Inactive</Badge>
            ),
        },
        {
          key: "set_as_default",
          header: "Set as Default",
          cell: (row) => (row.set_as_default === "Yes" ? "Yes" : "No"),
        },
        {
          id: "actions",
          header: "Action",
          cell: (row) => (
            <Button
              variant="default"
              size="sm"
              aria-label="Edit FAN"
              onClick={() => handleEdit(row)}
            >
              <PencilIcon className="size-4" />
              Edit
            </Button>
          ),
        },
      ]),
    [],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" aria-label="Add or Edit FAN">
            Add/Edit FAN
          </Button>
        )}
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-5xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Add/Edit FAN</DialogTitle>
          <DialogDescription>
            Vendor ID:{" "}
            <span className="font-medium text-foreground">
              {vendorLoginId ?? `#${vendorId}`}
            </span>
          </DialogDescription>
        </DialogHeader>

        <form
          key={form.id ?? "new"}
          onSubmit={handleSubmit}
          noValidate
          className="space-y-3"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* FAN (readonly in edit mode) */}
            <FieldGroup>
              <Field>
                <FieldLabel>FAN *</FieldLabel>
                <FieldContent>
                  <Input
                    name="fan"
                    value={form.fan}
                    readOnly={isEdit}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, fan: e.target.value }))
                    }
                    placeholder="Enter FAN"
                    autoComplete="off"
                  />
                </FieldContent>
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel>FAN Name</FieldLabel>
                <FieldContent>
                  <Input
                    name="fan_name"
                    value={form.fanName}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, fanName: e.target.value }))
                    }
                    placeholder="FAN Name"
                    autoComplete="off"
                  />
                </FieldContent>
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel>FAN Description</FieldLabel>
                <FieldContent>
                  <Input
                    name="fan_description"
                    value={form.fanDescription}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        fanDescription: e.target.value,
                      }))
                    }
                    placeholder="Enter FAN Description"
                    autoComplete="off"
                  />
                </FieldContent>
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel>Bill Cycle Start Day *</FieldLabel>
                <FieldContent>
                  <Select
                    value={form.billCycleDay}
                    onValueChange={(v) =>
                      setForm((s) => ({ ...s, billCycleDay: v }))
                    }
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

            <FieldGroup>
              <Field>
                <FieldLabel>Status *</FieldLabel>
                <FieldContent>
                  <Select
                    value={form.status}
                    onValueChange={(v) =>
                      setForm((s) => ({
                        ...s,
                        status: v as "Active" | "Inactive",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel>Set as Default</FieldLabel>
                <FieldContent>
                  <Select
                    value={form.setAsDefault}
                    onValueChange={(v) =>
                      setForm((s) => ({
                        ...s,
                        setAsDefault: v as "Yes" | "No",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Set as default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
            </FieldGroup>
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : isEdit ? "Update" : "Save"}
            </Button>
            {isEdit && (
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={pending}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>

        <div className="border-t pt-3">
          <p className="mb-2 text-xs text-primary">
            <span className="font-semibold">ⓘ Existing FAN cannot be edited</span>
          </p>
          <DataTable
            data={rows}
            columns={columns}
            emptyMessage="No FANs yet."
            isLoading={isLoading}
            loadingRows={3}
          />
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
