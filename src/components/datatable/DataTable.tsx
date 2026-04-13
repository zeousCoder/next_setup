"use client";

import React, { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface DataTableProps<T> {
  /** Array of data objects to display in the table. */
  data: T[];

  /** Column definitions built with `createColumns<T>()` from Column.tsx or raw TanStack `ColumnDef<T>[]`. */
  columns: ColumnDef<T, any>[];

  /**
   * Shows skeleton placeholder rows while data is loading.
   * @default false
   */
  isLoading?: boolean;

  /**
   * Number of skeleton rows shown when `isLoading` is true.
   * @default 5
   */
  loadingRows?: number;

  /**
   * Shows a search input above the table that filters all columns globally.
   * @default false
   */
  searchable?: boolean;

  /**
   * Placeholder text for the search input. Only used when `searchable` is true.
   * @default "Search..."
   */
  searchPlaceholder?: string;

  /**
   * Enables pagination controls (rows-per-page selector + prev/next buttons) below the table.
   * @default false
   */
  paginated?: boolean;

  /**
   * Initial number of rows per page. Only used when `paginated` is true.
   * @default 10
   */
  pageSize?: number;

  /**
   * Message shown when the table has no rows to display (after loading completes).
   * @default "No data found."
   */
  emptyMessage?: string;

  /**
   * Automatically prepends a Sr. No. column.
   * Numbers stay correct across pages and are unaffected by sorting other columns.
   * @default false
   */
  showSrNo?: boolean;

  /**
   * Callback to apply a dynamic className to each row.
   * Return a string to apply, or `undefined` to apply nothing.
   * @example rowClassName={(row) => row.id === deletingId ? "opacity-50 pointer-events-none" : undefined}
   */
  rowClassName?: (row: T) => string | undefined;

  /** Extra className applied to the outer wrapper div. */
  className?: string;
}

const SR_NO_COLUMN: ColumnDef<any, any> = {
  id: "_sr_no",
  header: "Sr. No.",
  enableSorting: false,
  cell: ({ row, table }) => {
    const { pageIndex, pageSize } = table.getState().pagination;
    const pos = table
      .getRowModel()
      .rows.findIndex((r) => r.id === row.id);
    return <span className="font-medium">{pageIndex * pageSize + pos + 1}</span>;
  },
};

export default function DataTable<T>({
  data,
  columns,
  isLoading = false,
  loadingRows = 5,
  searchable = false,
  searchPlaceholder = "Search...",
  paginated = false,
  pageSize = 10,
  emptyMessage = "No data found.",
  showSrNo = false,
  rowClassName,
  className,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const resolvedColumns = showSrNo ? [SR_NO_COLUMN, ...columns] : columns;

  const table = useReactTable({
    data,
    columns: resolvedColumns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(paginated ? { getPaginationRowModel: getPaginationRowModel() } : {}),
    // Only apply pageSize when pagination is actually enabled
    ...(paginated ? { initialState: { pagination: { pageSize } } } : {}),
  });

  const colCount = resolvedColumns.length;
  const { pageIndex, pageSize: currentPageSize } = table.getState().pagination;
  const totalFiltered = table.getFilteredRowModel().rows.length;
  const from = pageIndex * currentPageSize + 1;
  const to = Math.min((pageIndex + 1) * currentPageSize, totalFiltered);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {searchable && (
        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-xs">
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pr-8"
            />
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {globalFilter && (
            <span className="text-xs text-muted-foreground">
              {totalFiltered} result{totalFiltered !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      <Table>
        <TableHeader className="bg-muted">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} colSpan={header.colSpan}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {isLoading &&
            Array.from({ length: loadingRows }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: colCount }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-5 w-full rounded-md" />
                  </TableCell>
                ))}
              </TableRow>
            ))}

          {!isLoading && table.getRowModel().rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={colCount}
                className="py-10 text-center text-muted-foreground"
              >
                {globalFilter
                  ? `No results for "${globalFilter}".`
                  : emptyMessage}
              </TableCell>
            </TableRow>
          )}

          {!isLoading &&
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? "selected" : undefined}
                className={rowClassName?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  // whitespace-normal overrides shadcn's default whitespace-nowrap
                  // so cell content (like badge lists) wraps instead of overflowing
                  <TableCell key={cell.id} className="whitespace-normal">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
        </TableBody>
      </Table>

      {paginated && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Rows per page</span>
            <Select
              value={String(currentPageSize)}
              onValueChange={(v) => table.setPageSize(Number(v))}
            >
              <SelectTrigger className="h-8 w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <span className="text-xs text-muted-foreground">
            {totalFiltered === 0
              ? "No results"
              : `${from}–${to} of ${totalFiltered}`}
          </span>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <span className="min-w-[80px] text-center text-xs text-muted-foreground">
              Page {pageIndex + 1} of {table.getPageCount() || 1}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
