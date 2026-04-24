"use client";

import React, { useMemo, useState } from "react";
import { PencilIcon } from "lucide-react";

import CardHandler from "@/components/layout/CardHandler";
import DataTable from "@/components/datatable/DataTable";
import { ColumnDef, createColumns } from "@/components/datatable/Column";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import GlobalCSVDownloader from "@/components/download/GlobalCSVDownloader";

import { useCompanies } from "@/hooks/user-management/use-companies";
import { formatDateTime } from "@/lib/utils";

import AddCompanyForm from "./AddCompanyForm";
import FilterForm, { type StatusOption } from "../FilterForm";
import UpdatePassword from "../UpdatePassword";
import GroupPermissionsDrawer from "../GroupPermissionsDrawer";

type CompanyRow = {
  id: number;
  company_name: string | null;
  VendorID: string | null;
  status: string | null; // "Y" | "N"
  addeddate: string | null;
  groupName: string | null;
  group_id: number | null;
  description: string | null;
  login_id: number | null;
  email: string | null;
  contactnumber: string | null;
  fname: string | null;
  lname: string | null;
  UpdatedTime: string | null;
};

const COMPANY_STATUS_OPTIONS: StatusOption[] = [
  { value: "Y", label: "Active" },
  { value: "N", label: "Inactive" },
];

// Convention: "Y" = Active, "N" = Inactive
const statusBadge = (status: string | null) =>
  status === "Y" ? (
    <Badge variant="default">Active</Badge>
  ) : (
    <Badge variant="destructive">Inactive</Badge>
  );

export default function ViewCompany() {
  const { companies, isLoading, updateCompanyPasswordMutation } =
    useCompanies();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "Y" | "N">("all");

  const filteredCompanies = useMemo<CompanyRow[]>(() => {
    const rows = (companies ?? []) as CompanyRow[];
    const query = search.trim().toLowerCase();

    return rows.filter((row) => {
      if (query && !(row.company_name ?? "").toLowerCase().includes(query)) {
        return false;
      }
      if (status !== "all" && (row.status ?? "") !== status) {
        return false;
      }
      return true;
    });
  }, [companies, search, status]);

  const columns = useMemo<ColumnDef<CompanyRow, any>[]>(
    () =>
      createColumns<CompanyRow>([
        { key: "company_name", header: "Company Name", sortable: true },
        { key: "VendorID", header: "Login ID" },
        { key: "email", header: "Email" },
        { key: "contactnumber", header: "Phone" },
        {
          key: "status",
          header: "Status",
          cell: (row) => statusBadge(row.status),
        },
        {
          key: "groupName",
          header: "Group Name",
          cell: (row) => (
            <GroupPermissionsDrawer
              groupId={row.group_id}
              groupName={row.groupName}
              groupStatus={row.status}
            />
          ),
        },
        {
          key: "addeddate",
          header: "Created At",
          cell: (row) => formatDateTime(row.addeddate),
        },
        {
          key: "UpdatedTime",
          header: "Updated At",
          cell: (row) => formatDateTime(row.UpdatedTime),
        },
        {
          id: "actions",
          header: "Actions",
          cell: (row) => (
            <div className="flex w-full items-center justify-start gap-1">
              <AddCompanyForm
                company={{
                  id: row.id,
                  companyName: row.company_name,
                  loginId: row.VendorID,
                  status: row.status,
                  email: row.email,
                  firstName: row.fname,
                  lastName: row.lname,
                  phone: row.contactnumber,
                }}
                trigger={
                  <Button variant="outline" size="sm" aria-label="Edit company">
                    <PencilIcon className="size-4" />
                    Update Company
                  </Button>
                }
              />
              <UpdatePassword
                displayName={row.company_name}
                isPending={updateCompanyPasswordMutation.isPending}
                onSubmit={(password) =>
                  updateCompanyPasswordMutation.mutateAsync({
                    id: row.id,
                    password,
                  })
                }
              />
            </div>
          ),
        },
      ]),
    [updateCompanyPasswordMutation],
  );

  return (
    <CardHandler
      className="w-full"
      title="Company List"
      description="A list of all companies."
      actions={<AddCompanyForm />}
      filters={
        <div className="flex flex-row items-center justify-between">
          <FilterForm
            search={search}
            setSearch={setSearch}
            searchLabel="Company Name"
            searchPlaceholder="Search company name..."
            status={status}
            setStatus={(v) => setStatus(v as "all" | "Y" | "N")}
            statusOptions={COMPANY_STATUS_OPTIONS}
            downloadButton={
              <GlobalCSVDownloader
                data={filteredCompanies.map((item, index) => ({
                  SrNo: index + 1,
                  company_name: item.company_name,
                  VendorID: item.VendorID,
                  email: item.email,
                  contactnumber: item.contactnumber,
                  fname: item.fname,
                  lname: item.lname,
                  status: item.status === "Y" ? "Active" : "Inactive",
                  addeddate: formatDateTime(item.addeddate),
                  UpdatedTime: formatDateTime(item.UpdatedTime),
                }))}
                columns={[
                  { key: "SrNo", header: "Sr. No." },
                  { key: "company_name", header: "Company Name" },
                  { key: "VendorID", header: "Login ID" },
                  { key: "email", header: "Email" },
                  { key: "contactnumber", header: "Phone" },
                  { key: "fname", header: "First Name" },
                  { key: "lname", header: "Last Name" },
                  { key: "status", header: "Status" },
                  { key: "addeddate", header: "Created At" },
                  { key: "UpdatedTime", header: "Updated At" },
                ]}
                fileName="companies.csv"
                name="Companies"
              />
            }
          />
        </div>
      }
    >
      <DataTable
        data={filteredCompanies}
        columns={columns}
        showSrNo
        paginated
        pageSize={10}
        emptyMessage="No companies found."
        isLoading={isLoading}
        loadingRows={5}
      />
    </CardHandler>
  );
}
