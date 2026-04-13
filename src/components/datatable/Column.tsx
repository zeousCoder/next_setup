import { ColumnDef } from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpIcon, ArrowUpDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";

export type { ColumnDef };

/** Column that reads a value from a key on the data object. */
type AccessorColumn<T> = {
  /** Key of the data object to read the cell value from. */
  key: keyof T;
  /** Text shown in the column header. */
  header: string;
  /**
   * Adds a clickable sort button to the header.
   * Click once → asc, again → desc, again → unsorted.
   * @default false
   */
  sortable?: boolean;
  /**
   * Custom cell renderer. Receives the full row object.
   * If omitted, the raw value is rendered as text.
   * @example cell: (row) => <Badge>{row.status}</Badge>
   */
  cell?: (row: T) => React.ReactNode;
  /**
   * Horizontal alignment of the header and cell content.
   * @default "left"
   */
  align?: "left" | "center" | "right";
};

/** Column that has no data key — used for action buttons, computed values, etc. */
type DisplayColumn<T> = {
  /** Unique string id for this column (no accessorKey). */
  id: string;
  /** Text shown in the column header. */
  header: string;
  /**
   * Required cell renderer. Receives the full row object.
   * @example cell: (row) => <DeleteButton id={row.id} />
   */
  cell: (row: T) => React.ReactNode;
  /**
   * Horizontal alignment of the header and cell content.
   * @default "left"
   */
  align?: "left" | "center" | "right";
};

export type DataTableColumn<T> = AccessorColumn<T> | DisplayColumn<T>;

function SortHeader({
  label,
  sorted,
  onToggle,
}: {
  label: string;
  sorted: false | "asc" | "desc";
  onToggle: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className="-ml-2 h-8 gap-1.5 font-medium"
    >
      {label}
      {sorted === "asc" ? (
        <ArrowUpIcon className="h-3.5 w-3.5" />
      ) : sorted === "desc" ? (
        <ArrowDownIcon className="h-3.5 w-3.5" />
      ) : (
        <ArrowUpDownIcon className="h-3.5 w-3.5 text-muted-foreground" />
      )}
    </Button>
  );
}

/**
 * Converts a simple column config array into TanStack Table `ColumnDef[]`.
 *
 * Two column types:
 * - **Accessor** (`key`): reads a value from the data object. Optional `cell` renderer and `sortable`.
 * - **Display** (`id`): no data key, requires a `cell` renderer. Use for action buttons, computed content, etc.
 *
 * @example
 * ```tsx
 * const columns = createColumns<User>([
 *   // Accessor — plain text value
 *   { key: "name", header: "Name", sortable: true },
 *
 *   // Accessor — custom cell renderer
 *   { key: "status", header: "Status", cell: (row) => <Badge>{row.status}</Badge> },
 *
 *   // Accessor — right-aligned
 *   { key: "amount", header: "Amount", align: "right" },
 *
 *   // Display — action buttons (no data key)
 *   { id: "actions", header: "Actions", align: "right", cell: (row) => (
 *     <Button onClick={() => handleDelete(row.id)}>Delete</Button>
 *   )},
 * ]);
 * ```
 *
 * For Sr. No. (stable across sort), use a native ColumnDef directly:
 * ```tsx
 * {
 *   id: "sr_no",
 *   header: "Sr. No.",
 *   enableSorting: false,
 *   cell: ({ row, table }) => {
 *     const pos = table.getRowModel().rows.findIndex((r) => r.id === row.id);
 *     return <span>{pos + 1}</span>;
 *   },
 * }
 * ```
 */
export function createColumns<T>(defs: DataTableColumn<T>[]): ColumnDef<T, any>[] {
  return defs.map((def) => {
    const alignClass =
      def.align === "center"
        ? "text-center"
        : def.align === "right"
          ? "text-right"
          : undefined;

    if ("key" in def) {
      const col: ColumnDef<T, any> = {
        accessorKey: def.key as string,
        header: def.sortable
          ? ({ column }) => (
              <SortHeader
                label={def.header}
                sorted={column.getIsSorted()}
                onToggle={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
              />
            )
          : () => <span className={alignClass}>{def.header}</span>,
        cell: ({ row, getValue }) => {
          const value = def.cell
            ? def.cell(row.original)
            : (getValue() as React.ReactNode);
          return alignClass ? (
            <div className={alignClass}>{value}</div>
          ) : (
            <>{value}</>
          );
        },
      };
      return col;
    }

    return {
      id: def.id,
      header: () => <span className={alignClass}>{def.header}</span>,
      cell: ({ row }) => (
        <div className={alignClass}>{def.cell(row.original)}</div>
      ),
    } as ColumnDef<T, any>;
  });
}
