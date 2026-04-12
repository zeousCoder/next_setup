"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePermissions } from "./use-permissions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2Icon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
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
import GlobalDownloader from "@/components/layout/GlobalDownloader";
import CreatePermissionButton from "./CreatePermissionButton";

const COLS = 5;

export default function TblPermissionsCategory() {
  const { data, isLoading, error, deleteCategoryMutation } = usePermissions();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Y" | "N">("all");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered = (data ?? []).filter((item: any) => {
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
            className=" gap-1.5 text-muted-foreground"
          >
            <XIcon className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
        <GlobalDownloader
          data={filtered.map((item, index) => ({ ...item, sr_no: index + 1 }))}
          onClick={data?.mutate}
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

      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead>Sr. No.</TableHead>
            <TableHead>Category Name</TableHead>
            <TableHead>Category Status</TableHead>
            <TableHead>User Type</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: COLS }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-5 w-full rounded-md" />
                  </TableCell>
                ))}
              </TableRow>
            ))}

          {!isLoading && error && (
            <TableRow>
              <TableCell
                colSpan={COLS}
                className="text-center text-destructive"
              >
                {error.message}
              </TableCell>
            </TableRow>
          )}

          {!isLoading && !error && filtered.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={COLS}
                className="text-center text-muted-foreground"
              >
                {hasFilters
                  ? "No results match your filters."
                  : "No data found."}
              </TableCell>
            </TableRow>
          )}

          {!isLoading &&
            !error &&
            filtered.map((item: any, index: number) => {
              const isDeleting =
                deletingId === item.id && deleteCategoryMutation.isPending;
              return (
                <TableRow
                  key={item.id}
                  className={isDeleting ? "opacity-50 pointer-events-none" : ""}
                >
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="font-medium">{item.cat_name}</TableCell>
                  <TableCell>
                    {item.cat_status === "Y" ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.utype.split(",").map((t: string) => (
                        <Badge key={t} variant="outline">
                          {t.trim()}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <CreatePermissionButton
                        initialData={{
                          id: item.id,
                          cat_name: item.cat_name,
                          cat_status: item.cat_status,
                          utype: item.utype,
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
                            <AlertDialogTitle>
                              Delete category?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete{" "}
                              <span className="font-semibold text-foreground">
                                {item.cat_name}
                              </span>
                              . This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(item.id as number)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </div>
  );
}
