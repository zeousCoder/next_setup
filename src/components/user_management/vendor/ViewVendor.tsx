"use client";

import React, { useMemo, useState } from "react";
import { PencilIcon } from "lucide-react";

import CardHandler from "@/components/layout/CardHandler";
import DataTable from "@/components/datatable/DataTable";
import { ColumnDef, createColumns } from "@/components/datatable/Column";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import GlobalCSVDownloader from "@/components/download/GlobalCSVDownloader";

import { useVendors } from "@/hooks/user-management/use-vendors";
import { useCompanies } from "@/hooks/user-management/use-companies";
import { formatDateTime } from "@/lib/utils";

import AddVendorForm from "./AddVendorForm";
import FanManagerDialog from "./FanManagerDialog";
import FilterForm, { type StatusOption } from "../FilterForm";
import type { Company } from "../SelectCompany";
import UpdatePassword from "../UpdatePassword";
import GroupPermissionsDrawer from "../GroupPermissionsDrawer";

type VendorRow = {
  id: number; // login_details.id
  LoginID: string | null;
  Name: string | null;
  fname: string | null;
  lname: string | null;
  email: string | null;
  contactnumber: string | null;
  Status: number | null; // 0 = Active, 1 = Inactive
  UpdatedTime: string | null;
  PIN: string | null;
  FAN: string | null;
  activation_asyc: string | null;
  bill_cycle_day: number | null;
  company_id: number | null;
  companyName: string | null;
  group_id: number | null;
  groupName: string | null;
};

const VENDOR_STATUS_OPTIONS: StatusOption[] = [
  { value: "Y", label: "Active" },
  { value: "N", label: "Inactive" },
];

// login_details.Status convention: 0 = Active, 1 = Inactive
const statusFlag = (row: VendorRow) => (row.Status === 0 ? "Y" : "N");

const statusBadge = (row: VendorRow) =>
  row.Status === 0 ? (
    <Badge variant="default">Active</Badge>
  ) : (
    <Badge variant="destructive">Inactive</Badge>
  );

export default function ViewVendor() {
  const { vendors, isLoading, updateVendorPasswordMutation } = useVendors();
  const { companies } = useCompanies();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "Y" | "N">("all");
  const [company, setCompany] = useState("all");

  const filteredVendors = useMemo<VendorRow[]>(() => {
    const rows = (vendors ?? []) as VendorRow[];
    const query = search.trim().toLowerCase();

    return rows.filter((row) => {
      if (query && !(row.LoginID ?? "").toLowerCase().includes(query)) {
        return false;
      }
      if (status !== "all" && statusFlag(row) !== status) {
        return false;
      }
      if (company !== "all" && String(row.company_id ?? "") !== company) {
        return false;
      }
      return true;
    });
  }, [vendors, search, status, company]);

  const columns = useMemo<ColumnDef<VendorRow, any>[]>(
    () =>
      createColumns<VendorRow>([
        { key: "LoginID", header: "Login ID", sortable: true },
        {
          key: "fname",
          header: "Name",
          cell: (row) => `${row.fname ?? ""} ${row.lname ?? ""}`.trim() || "-",
        },
        { key: "email", header: "Email" },
        { key: "contactnumber", header: "Phone" },
        { key: "companyName", header: "Company" },
        {
          key: "Status",
          header: "Status",
          cell: (row) => statusBadge(row),
        },
        {
          key: "groupName",
          header: "Group Name",
          cell: (row) => (
            <GroupPermissionsDrawer
              groupId={row.group_id}
              groupName={row.groupName}
              groupStatus={statusFlag(row)}
            />
          ),
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
              <AddVendorForm
                vendor={{
                  id: row.id,
                  LoginID: row.LoginID,
                  status: statusFlag(row),
                  email: row.email,
                  fname: row.fname,
                  lname: row.lname,
                  contactnumber: row.contactnumber,
                  companyId: row.company_id,
                  pin: row.PIN,
                  fan: row.FAN,
                  activationAsync: row.activation_asyc,
                  billCycleDay: row.bill_cycle_day,
                }}
                trigger={
                  <Button variant="outline" size="sm" aria-label="Edit vendor">
                    <PencilIcon className="size-4" />
                    Update Vendor
                  </Button>
                }
              />
              <UpdatePassword
                displayName={row.LoginID}
                isPending={updateVendorPasswordMutation.isPending}
                onSubmit={(password) =>
                  updateVendorPasswordMutation.mutateAsync({
                    id: row.id,
                    password,
                  })
                }
              />
              <FanManagerDialog vendorId={row.id} vendorLoginId={row.LoginID} />
            </div>
          ),
        },
      ]),
    [updateVendorPasswordMutation],
  );

  return (
    <CardHandler
      className="w-full"
      title="Vendor List"
      description="A list of all vendors."
      actions={<AddVendorForm />}
      filters={
        <div className="flex flex-row items-center justify-between">
          <FilterForm
            search={search}
            setSearch={setSearch}
            searchLabel="Login ID"
            searchPlaceholder="Search login id..."
            status={status}
            setStatus={(v) => setStatus(v as "all" | "Y" | "N")}
            statusOptions={VENDOR_STATUS_OPTIONS}
            companies={(companies ?? []) as Company[]}
            company={company}
            setCompany={setCompany}
            companyLabel="Company"
            downloadButton={
              <GlobalCSVDownloader
                data={filteredVendors.map((item, index) => ({
                  SrNo: index + 1,
                  LoginID: item.LoginID,
                  fname: item.fname,
                  lname: item.lname,
                  email: item.email,
                  contactnumber: item.contactnumber,
                  companyName: item.companyName,
                  status: item.Status === 0 ? "Active" : "Inactive",
                  UpdatedTime: formatDateTime(item.UpdatedTime),
                }))}
                columns={[
                  { key: "SrNo", header: "Sr. No." },
                  { key: "LoginID", header: "Login ID" },
                  { key: "fname", header: "First Name" },
                  { key: "lname", header: "Last Name" },
                  { key: "email", header: "Email" },
                  { key: "contactnumber", header: "Phone" },
                  { key: "companyName", header: "Company" },
                  { key: "status", header: "Status" },
                  { key: "UpdatedTime", header: "Updated At" },
                ]}
                fileName="vendors.csv"
                name="Vendors"
              />
            }
          />
        </div>
      }
    >
      <DataTable
        data={filteredVendors}
        columns={columns}
        showSrNo
        paginated
        pageSize={10}
        emptyMessage="No vendors found."
        isLoading={isLoading}
        loadingRows={5}
      />
    </CardHandler>
  );
}
