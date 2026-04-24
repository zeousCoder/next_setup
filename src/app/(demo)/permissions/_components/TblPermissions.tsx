"use client";

import { useState } from "react";
import { usePermissions } from "../_hooks/use-permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import GlobalCSVDownloader from "@/components/download/GlobalCSVDownloader";
import DataTable from "@/components/datatable/DataTable";
import { createColumns } from "@/components/datatable/Column";

type Permission = {
  id: number;
  cat_id: number;
  p_code: string;
  p_name: string;
  p_desc: string;
  p_status: string;
  forVendor: string;
  forAdmin: string;
  p_allow_msg: string;
};

const statusBadge = (val: string) =>
  val === "Y" ? (
    <Badge variant="default">Active</Badge>
  ) : (
    <Badge variant="destructive">Inactive</Badge>
  );

const yesNoBadge = (val: string) =>
  val === "Y" ? (
    <Badge variant="outline" className="border-green-500 text-green-600">
      Yes
    </Badge>
  ) : (
    <Badge variant="outline" className="border-red-400 text-red-500">
      No
    </Badge>
  );

const columns = createColumns<Permission>([
  { key: "p_code", header: "Code", sortable: true },
  { key: "p_name", header: "Permission Name", sortable: true },
  { key: "p_desc", header: "Description" },
  {
    key: "p_status",
    header: "Status",
    cell: (row) => statusBadge(row.p_status),
  },
  {
    key: "forVendor",
    header: "Vendor",
    align: "center",
    cell: (row) => yesNoBadge(row.forVendor),
  },
  {
    key: "forAdmin",
    header: "Admin",
    align: "center",
    cell: (row) => yesNoBadge(row.forAdmin),
  },
  { key: "p_allow_msg", header: "Allow Msg" },
]);

export default function TblPermissions() {
  const { data: permissionData, isLoading: permissionIsLoading, error: permissionError } =
    usePermissions();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Y" | "N">("all");

  const rows = Array.isArray(permissionData)
    ? (permissionData as Permission[])
    : [];

  const filtered = rows.filter((item) => {
    const matchesSearch =
      item.p_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.p_code?.toLowerCase().includes(search.toLowerCase()) ||
      item.p_desc?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || item.p_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const hasFilters = search !== "" || statusFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  return (
    <div className="flex flex-col gap-2">
      <FieldGroup className="flex flex-row items-center">
        <Field className="w-full max-w-xs">
          <FieldLabel>Search</FieldLabel>
          <FieldContent>
            <Input
              type="text"
              placeholder="Search by name, code or description"
              className="w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </FieldContent>
        </Field>
        <FieldSeparator />
        <Field>
          <FieldLabel>Status</FieldLabel>
          <FieldContent>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as "all" | "Y" | "N")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Y">Active</SelectItem>
                <SelectItem value="N">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1.5 text-muted-foreground"
          >
            <XIcon className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
        <GlobalCSVDownloader
          data={filtered.map((item, index) => ({
            sr_no: index + 1,
            p_code: item.p_code,
            p_name: item.p_name,
            p_desc: item.p_desc,
            p_status: item.p_status === "Y" ? "Active" : "Inactive",
            forVendor: item.forVendor === "Y" ? "Yes" : "No",
            forAdmin: item.forAdmin === "Y" ? "Yes" : "No",
            p_allow_msg: item.p_allow_msg,
          }))}
          columns={[
            { key: "sr_no", header: "Sr. No." },
            { key: "p_code", header: "Code" },
            { key: "p_name", header: "Permission Name" },
            { key: "p_desc", header: "Description" },
            { key: "p_status", header: "Status" },
            { key: "forVendor", header: "For Vendor" },
            { key: "forAdmin", header: "For Admin" },
            { key: "p_allow_msg", header: "Allow Msg" },
          ]}
          fileName="permissions.csv"
          name="Permissions"
        />
      </FieldGroup>

      {permissionError && (
        <p className="text-sm text-destructive">{permissionError.message}</p>
      )}

      <DataTable
        data={filtered}
        columns={columns}
        isLoading={permissionIsLoading}
        loadingRows={5}
        showSrNo
        paginated
        pageSize={25}
        emptyMessage={
          hasFilters ? "No results match your filters." : "No data found."
        }
      />
    </div>
  );
}
