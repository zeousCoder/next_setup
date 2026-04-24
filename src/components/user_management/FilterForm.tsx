"use client";

import React from "react";
import { RotateCcwIcon, SearchIcon } from "lucide-react";

import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SelectCompany, { type Company } from "./SelectCompany";
import SelectVendor, { type Vendor } from "./SelectVendor";

export type StatusOption = { value: string; label: string };

type Props = {
  search: string;
  setSearch: (value: string) => void;
  searchLabel?: string;
  searchPlaceholder?: string;

  status: string;
  setStatus: (value: string) => void;
  /** Options that appear under the "All statuses" entry. */
  statusOptions?: StatusOption[];

  /**
   * Optional company filter. Only shown when `companies` is provided.
   * The value "all" represents "no company filter".
   */
  companies?: Company[];
  company?: string;
  setCompany?: (value: string) => void;
  companyLabel?: string;

  /**
   * Optional vendor filter. Only shown when `vendors` is provided.
   * The value "all" represents "no vendor filter".
   */
  vendors?: Vendor[];
  vendor?: string;
  setVendor?: (value: string) => void;
  vendorLabel?: string;

  downloadButton?: React.ReactNode;
};

const DEFAULT_STATUS_OPTIONS: StatusOption[] = [
  { value: "1", label: "Active" },
  { value: "0", label: "Inactive" },
];

export default function FilterForm({
  search,
  setSearch,
  searchLabel = "Username",
  searchPlaceholder = "Search username...",
  status,
  setStatus,
  statusOptions = DEFAULT_STATUS_OPTIONS,
  companies,
  company = "all",
  setCompany,
  companyLabel = "Company",
  vendors,
  vendor = "all",
  setVendor,
  vendorLabel = "Vendor",
  downloadButton = null,
}: Props) {
  const companyEnabled = Boolean(companies && setCompany);
  const vendorEnabled = Boolean(vendors && setVendor);

  const activeCount =
    (search.trim() ? 1 : 0) +
    (status !== "all" ? 1 : 0) +
    (companyEnabled && company !== "all" ? 1 : 0) +
    (vendorEnabled && vendor !== "all" ? 1 : 0);
  const hasFilters = activeCount > 0;

  const handleReset = () => {
    setSearch("");
    setStatus("all");
    if (companyEnabled) setCompany!("all");
    if (vendorEnabled) setVendor!("all");
  };

  return (
    <div className="flex w-full flex-col gap-3 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
        {companyEnabled && (
          <Field className="sm:w-56">
            <FieldLabel className="text-xs font-medium text-muted-foreground">
              {companyLabel}
            </FieldLabel>
            <FieldContent>
              <SelectCompany
                companies={companies!}
                value={company}
                onValueChange={setCompany!}
                placeholder="All companies"
                allOption={{ value: "all", label: "All companies" }}
                triggerClassName="w-full"
              />
            </FieldContent>
          </Field>
        )}

        {vendorEnabled && (
          <Field className="sm:w-56">
            <FieldLabel className="text-xs font-medium text-muted-foreground">
              {vendorLabel}
            </FieldLabel>
            <FieldContent>
              <SelectVendor
                vendors={vendors!}
                value={vendor}
                onValueChange={setVendor!}
                placeholder="All vendors"
                allOption={{ value: "all", label: "All vendors" }}
                triggerClassName="w-full"
              />
            </FieldContent>
          </Field>
        )}

        <Field className="sm:w-60">
          <FieldLabel className="text-xs font-medium text-muted-foreground">
            {searchLabel}
          </FieldLabel>
          <FieldContent>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-7"
              />
            </div>
          </FieldContent>
        </Field>

        <Field className="sm:w-44">
          <FieldLabel className="text-xs font-medium text-muted-foreground">
            Status
          </FieldLabel>
          <FieldContent>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>
      </div>

      <div className="flex items-center gap-2 sm:self-end">
        {hasFilters && (
          <Badge variant="secondary" className="h-6 px-2 text-xs">
            {activeCount} filter{activeCount > 1 ? "s" : ""} active
          </Badge>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={!hasFilters}
        >
          <RotateCcwIcon />
          Reset
        </Button>

        {downloadButton}
      </div>
    </div>
  );
}
