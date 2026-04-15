"use client";

import { useMemo, useState } from "react";
import { usePermissions } from "./use-permissions";
import { Button } from "@/components/ui/button";
import { Trash2Icon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import GlobalCSVDownloader from "@/components/download/GlobalCSVDownloader";
import CreatePermissionButton from "./CreatePermissionButton";
import DataTable from "@/components/datatable/DataTable";
import { ColumnDef, createColumns } from "@/components/datatable/Column";

type PermissionCategory = {
  id: number;
  cat_name: string;
  cat_status: "Y" | "N";
  utype: string;
};

export default function TblPermissionsCategory() {
  const { data, isLoading, error, deleteCategoryMutation } = usePermissions();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Y" | "N">("all");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const rows = Array.isArray(data) ? (data as PermissionCategory[]) : [];

  const filtered = rows.filter((item) => {
    const matchesSearch = item.cat_name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || item.cat_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const hasFilters = search !== "" || statusFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
    deleteCategoryMutation.mutate(id, {
      onSettled: () => setDeletingId(null),
    });
  };

  const columns = useMemo<ColumnDef<PermissionCategory, any>[]>(
    () => [
      ...createColumns<PermissionCategory>([
        { key: "cat_name", header: "Category Name", sortable: true },
        {
          key: "cat_status",
          header: "Category Status",
          sortable: true,
          cell: (row) =>
            row.cat_status === "Y" ? (
              <Badge variant="default">Active</Badge>
            ) : (
              <Badge variant="destructive">Inactive</Badge>
            ),
        },
        {
          key: "utype",
          header: "User Type",
          cell: (row) => (
            <div className="flex flex-wrap gap-1">
              {row.utype.split(",").map((t) => (
                <Badge key={t} variant="outline">
                  {t.trim()}
                </Badge>
              ))}
            </div>
          ),
        },
        {
          id: "actions",
          header: "Actions",
          align: "right",
          cell: (row) => (
            <div className="flex items-center justify-end gap-1">
              <CreatePermissionButton
                initialData={{
                  id: row.id,
                  cat_name: row.cat_name,
                  cat_status: row.cat_status,
                  utype: row.utype,
                }}
              />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deleteCategoryMutation.isPending}
                  >
                    <Trash2Icon className="h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete category?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete{" "}
                      <span className="font-semibold text-foreground">
                        {row.cat_name}
                      </span>
                      . This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(row.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ),
        },
      ]),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deleteCategoryMutation.isPending, deletingId],
  );

  return (
    <div className="flex flex-col gap-2">
      <FieldGroup className="flex flex-row items-center">
        <Field className="w-full max-w-xs">
          <FieldLabel>Search</FieldLabel>
          <FieldContent>
            <Input
              type="text"
              placeholder="Search by category name"
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
          data={filtered.map((item, index) => ({ ...item, sr_no: index + 1 }))}
          columns={[
            { key: "sr_no", header: "Sr. No." },
            { key: "cat_name", header: "Category Name" },
            { key: "cat_status", header: "Category Status" },
            { key: "utype", header: "User Type" },
          ]}
          fileName="permissions-category.csv"
          name="Category"
        />
      </FieldGroup>

      {error && <p className="text-sm text-destructive">{error.message}</p>}

      <DataTable
        data={filtered}
        columns={columns}
        isLoading={isLoading}
        loadingRows={10}
        showSrNo
        emptyMessage={
          hasFilters ? "No results match your filters." : "No data found."
        }
        rowClassName={(row) =>
          deletingId === row.id && deleteCategoryMutation.isPending
            ? "opacity-50 pointer-events-none"
            : undefined
        }
        paginated={true}
        pageSize={10}
      />
    </div>
  );
}
