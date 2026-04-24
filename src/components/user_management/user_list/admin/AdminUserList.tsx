"use client";

import React, { useMemo, useState } from "react";

import CardHandler from "@/components/layout/CardHandler";
import DataTable from "@/components/datatable/DataTable";
import { ColumnDef, createColumns } from "@/components/datatable/Column";
import { Badge } from "@/components/ui/badge";
import GlobalCSVDownloader from "@/components/download/GlobalCSVDownloader";
import { useAdminChildUsers } from "@/hooks/user-management/use-admins";

import AddAdminUserForm from "./AddAdminUserForm";
import FilterForm from "../../FilterForm";
import UpdatePassword from "../../UpdatePassword";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PencilIcon } from "lucide-react";

type AdminChildUser = {
  id: number;
  userName: string | null;
  email: string | null;
  fname: string | null;
  lname: string | null;
  contactnumber: string | null;
  address: string | null;
  aboutme: string | null;
  type: string | null;
  status: number | null;
  created_date: string | null;
  UpdatedTime: string | null;
  created_by: string | null;
};

// Convention: 1 = Active, 0 = Inactive
const statusBadge = (status: number | null) =>
  status === 1 ? (
    <Badge variant="default">Active</Badge>
  ) : (
    <Badge variant="destructive">Inactive</Badge>
  );

export default function AdminUserList() {
  const { adminChildUsers, isLoading, updateAdminChildUserPasswordMutation } =
    useAdminChildUsers();

  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<"all" | "1" | "0">("all");

  const filteredUsers = useMemo<AdminChildUser[]>(() => {
    const rows = (adminChildUsers ?? []) as AdminChildUser[];
    const query = username.trim().toLowerCase();

    return rows.filter((row) => {
      if (query && !(row.userName ?? "").toLowerCase().includes(query)) {
        return false;
      }
      if (status !== "all" && String(row.status ?? "") !== status) {
        return false;
      }
      return true;
    });
  }, [adminChildUsers, username, status]);

  const columns = useMemo<ColumnDef<AdminChildUser, any>[]>(
    () =>
      createColumns<AdminChildUser>([
        { key: "userName", header: "Username", sortable: true },

        { key: "email", header: "Email" },
        { key: "contactnumber", header: "Phone" },
        { key: "type", header: "Role" },
        {
          key: "status",
          header: "Status",

          cell: (row) => statusBadge(row.status),
        },
        {
          key: "created_date",
          header: "Created At",

          cell: (row) => formatDateTime(row.created_date),
        },
        {
          key: "UpdatedTime",
          header: "Updated At",

          cell: (row) => formatDateTime(row.UpdatedTime),
        },
        { key: "created_by", header: "Created By" },
        {
          id: "actions",
          header: "Actions",
          cell: (row) => (
            <div className="flex items-center w-full justify-start gap-1">
              <AddAdminUserForm
                user={{
                  id: row.id,
                  userName: row.userName,
                  email: row.email,
                  fname: row.fname,
                  lname: row.lname,
                  contactnumber: row.contactnumber,
                  address: row.address,
                  aboutme: row.aboutme,
                  status: row.status,
                }}
                trigger={
                  <Button variant="outline" size="sm" aria-label="Edit user">
                    <PencilIcon className="size-4" />
                    Update User
                  </Button>
                }
              />
              <UpdatePassword
                displayName={row.userName}
                isPending={updateAdminChildUserPasswordMutation.isPending}
                onSubmit={(password) =>
                  updateAdminChildUserPasswordMutation.mutateAsync({
                    id: row.id,
                    password,
                  })
                }
              />
            </div>
          ),
        },
      ]),
    [updateAdminChildUserPasswordMutation],
  );

  return (
    <CardHandler
      className="w-full"
      title="Admin User List"
      description="A list of all admin users."
      actions={<AddAdminUserForm />}
      filters={
        <div className="flex flex-row items-center justify-between">
          <FilterForm
            search={username}
            setSearch={setUsername}
            searchLabel="Username"
            searchPlaceholder="Search username..."
            status={status}
            setStatus={(v) => setStatus(v as "all" | "1" | "0")}
            downloadButton={
              <GlobalCSVDownloader
                data={filteredUsers.map((item, index) => ({
                  SrNo: index + 1,
                  userName: item.userName,
                  email: item.email,
                  contactnumber: item.contactnumber,
                  type: item.type,
                  status: item.status,
                  created_date: formatDateTime(item.created_date),
                  UpdatedTime: formatDateTime(item.UpdatedTime),
                  created_by: item.created_by,
                }))}
                columns={[
                  { key: "SrNo", header: "Sr. No." },
                  { key: "userName", header: "UserName" },
                  { key: "email", header: "Email" },
                  { key: "contactnumber", header: "Phone" },
                  { key: "type", header: "Role" },
                  { key: "status", header: "Status" },
                  { key: "created_date", header: "Created At" },
                  { key: "UpdatedTime", header: "Updated At" },
                  { key: "created_by", header: "Created By" },
                ]}
                fileName="admin-users.csv"
                name="Admin Users"
              />
            }
          />
        </div>
      }
    >
      <DataTable
        data={filteredUsers}
        columns={columns}
        showSrNo
        paginated
        pageSize={10}
        emptyMessage="No admin users found."
        isLoading={isLoading}
        loadingRows={5}
      />
    </CardHandler>
  );
}
