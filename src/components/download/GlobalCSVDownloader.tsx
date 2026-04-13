"use client";

import React from "react";
import { Button } from "../ui/button";
import { DownloadIcon } from "lucide-react";
import { toast } from "sonner";

type Column<T> = {
  key: keyof T;
  header: string;
};

export type GlobalDownloaderProps<T extends Record<string, any>> = {
  data: T[];
  fileName?: string;
  columns?: Column<T>[];
  variant?: "default" | "secondary" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  name?: string;
};

function convertToCSV<T extends Record<string, any>>(
  data: T[],
  columns?: Column<T>[],
): string {
  if (!data || data.length === 0) return "";

  // Determine headers
  const headers = columns
    ? columns.map((col) => col.header)
    : Object.keys(data[0]);

  // Determine keys
  const keys = columns
    ? columns.map((col) => col.key as string)
    : Object.keys(data[0]);

  // Escape CSV values
  const escapeCSV = (value: unknown) => {
    if (value === null || value === undefined) return "";
    const stringValue = String(value).replace(/"/g, '""');
    return `"${stringValue}"`;
  };

  // Create rows
  const rows = data.map((row) =>
    keys.map((key) => escapeCSV(row[key])).join(","),
  );

  return [headers.join(","), ...rows].join("\n");
}

function downloadCSV(csv: string, fileName: string) {
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function GlobalCSVDownloader<T extends Record<string, any>>({
  data,
  fileName = "download.csv",
  columns,
  variant = "secondary",
  size = "sm",
  name = "",
}: GlobalDownloaderProps<T>) {
  const handleDownload = () => {
    if (!data || data.length === 0) {
      toast.warning("No data available to download.");
      return;
    }

    const csv = convertToCSV(data, columns);
    downloadCSV(csv, fileName);
  };

  return (
    <Button variant={variant} size={size} onClick={handleDownload}>
      <DownloadIcon className="h-4 w-4 mr-2" />
      Download {name}
    </Button>
  );
}
