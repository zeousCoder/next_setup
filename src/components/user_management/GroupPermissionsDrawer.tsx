"use client";

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import { useGroupPermissions } from "@/hooks/user-management/use-group-permissions";

type Props = {
  /** `tbl_group.id` whose permissions should be displayed. */
  groupId: number | null;
  /** Label shown on the trigger button and in the summary row. */
  groupName: string | null;
  /** "Y" | "N" — displayed in the summary row. Optional. */
  groupStatus?: string | null;
  /** Drawer title. Defaults to "Group Permissions". */
  title?: string;
  /** Optional custom trigger. Defaults to a button showing the group name. */
  trigger?: React.ReactNode;
};

/**
 * Reusable drawer that shows every permission assigned to a group
 * (from `tbl_permission_group`), bucketed by `tbl_permission_category`.
 *
 * Works for any group — company, vendor, admin, etc. Permissions are
 * loaded lazily (only when the drawer opens) and cached per `groupId`
 * via react-query.
 */
export default function GroupPermissionsDrawer({
  groupId,
  groupName,
  groupStatus,
  title = "Group Permissions",
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);

  const { grouped, isLoading, error } = useGroupPermissions(groupId, {
    enabled: open,
  });

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {trigger ?? (
          <Button
            variant="outline"
            size="sm"
            aria-label="View group permissions"
            disabled={!groupName}
          >
            {groupName ?? "—"}
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>

        <div className="max-h-[75vh] space-y-4 overflow-y-auto px-4 pb-6">
          {/* Summary: group name + status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-muted-foreground">Group Name</Label>
              <Input value={groupName ?? ""} readOnly />
            </div>
            {groupStatus !== undefined && (
              <div className="space-y-1">
                <Label className="text-muted-foreground">Status</Label>
                <Input
                  value={groupStatus === "Y" ? "Active" : "Inactive"}
                  readOnly
                />
              </div>
            )}
          </div>

          {isLoading && (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}

          {!isLoading && error && (
            <p className="text-sm text-destructive">{error.message}</p>
          )}

          {!isLoading && !error && grouped.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No permissions assigned to this group.
            </p>
          )}

          {!isLoading &&
            !error &&
            grouped.map(({ cat_name, items }) => {
              const allActive = items.every((i) => i.pg_status === "Y");
              return (
                <section
                  key={cat_name}
                  className="overflow-hidden rounded-md border"
                >
                  <header className="bg-primary/80 px-4 py-2 text-primary-foreground">
                    <h3 className="font-semibold">{cat_name}</h3>
                  </header>
                  <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 md:grid-cols-3">
                    <Label
                      className="flex items-center gap-2 text-sm"
                      htmlFor="select-all"
                    >
                      <Checkbox id="select-all" checked={allActive} disabled />
                      <Label htmlFor="select-all" className="font-medium">
                        Select All
                      </Label>
                    </Label>
                    {items.map((p) => (
                      <Label
                        key={p.pg_id}
                        className="flex items-center gap-2 text-sm"
                        title={p.p_desc ?? undefined}
                      >
                        <Checkbox checked={p.pg_status === "Y"} disabled />
                        <Label
                          htmlFor={p.pg_id.toString()}
                          className="font-medium"
                        >
                          {p.p_name}{" "}
                          <span className="text-muted-foreground">
                            ({p.p_code})
                          </span>
                        </Label>
                      </Label>
                    ))}
                  </div>
                </section>
              );
            })}
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button>Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
