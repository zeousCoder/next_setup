"use server";

import { db } from "@/lib/db/mysql";
import { getSession } from "@/session/auth-session";
import { serialize } from "@/lib/utils";

// fan_mvno_details uses literal strings (not "Y"/"N"):
//   status          → "Active" | "Inactive"
//   set_as_default  → "Yes"    | "No"
export type FanStatus = "Active" | "Inactive";
export type FanDefault = "Yes" | "No";

export type FanRow = {
  id: number;
  mvno_id: number;
  mvno_vendorID: string | null;
  fan: string | null;
  fan_name: string | null;
  fan_description: string | null;
  status: FanStatus | string | null;
  set_as_default: FanDefault | string | null;
  bill_cycle_day: number | null;
  created_by: string | null;
  created_date: string | null;
};

export type CreateFanInput = {
  vendorId: number; // login_details.id of the vendor
  vendorLoginId: string; // login_details.LoginID
  fan: string;
  fanName?: string | null;
  fanDescription?: string | null;
  billCycleDay: number;
  status: FanStatus;
  setAsDefault: FanDefault;
};

export type UpdateFanInput = {
  id: number;
  vendorId: number; // login_details.id — used for default-swap scope
  fanName?: string | null;
  fanDescription?: string | null;
  billCycleDay: number;
  status: FanStatus;
  setAsDefault: FanDefault;
};

/** List FANs for one vendor, default first then newest. */
export async function getFansByVendor(vendorId: number) {
  try {
    const rows = await db("fan_mvno_details")
      .whereEq("mvno_id", vendorId)
      .orderBy("set_as_default", "DESC")
      .orderBy("id", "DESC")
      .get();
    return { success: true, data: serialize(rows) } as const;
  } catch (error) {
    console.error("[getFansByVendor] failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load FANs";
    return { success: false, error: message } as const;
  }
}

export async function createFan(data: CreateFanInput) {
  try {
    const currentUser = await getSession();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" } as const;
    }

    if (!data.fan?.trim()) {
      return { success: false, error: "FAN required" } as const;
    }
    if (
      !Number.isFinite(data.billCycleDay) ||
      data.billCycleDay < 1 ||
      data.billCycleDay > 28
    ) {
      return {
        success: false,
        error: "Billing cycle day must be between 1 and 28",
      } as const;
    }

    // FAN must be unique per vendor
    const fanExists = (await db("fan_mvno_details")
      .whereEq("mvno_id", data.vendorId)
      .whereEq("fan", data.fan)
      .first()) as { id: number } | null;
    if (fanExists) {
      return {
        success: false,
        error: "This FAN already exists for the vendor",
      } as const;
    }

    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    // If the new row is the default, clear default on any existing rows first
    if (data.setAsDefault === "Yes") {
      await db("fan_mvno_details")
        .whereEq("mvno_id", data.vendorId)
        .update({ set_as_default: "No" });
    }

    const fanId = await db("fan_mvno_details").insert({
      mvno_id: data.vendorId,
      mvno_vendorID: data.vendorLoginId,
      fan: data.fan,
      fan_name: data.fanName ?? `${data.fan}_DEFAULT_FAN`,
      fan_description: data.fanDescription ?? "",
      status: data.status,
      set_as_default: data.setAsDefault,
      created_by: currentUser.user.role ?? null,
      created_date: now,
      bill_cycle_day: data.billCycleDay,
    });

    return { success: true, fanId } as const;
  } catch (error) {
    console.error("[createFan] failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create FAN";
    return { success: false, error: message } as const;
  }
}

export async function updateFan(data: UpdateFanInput) {
  try {
    const currentUser = await getSession();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" } as const;
    }

    const existing = (await db("fan_mvno_details")
      .whereEq("id", data.id)
      .first()) as FanRow | null;
    if (!existing) {
      return { success: false, error: "FAN not found" } as const;
    }

    if (
      !Number.isFinite(data.billCycleDay) ||
      data.billCycleDay < 1 ||
      data.billCycleDay > 28
    ) {
      return {
        success: false,
        error: "Billing cycle day must be between 1 and 28",
      } as const;
    }

    // If this row is being promoted to default, demote the other rows first
    if (
      data.setAsDefault === "Yes" &&
      existing.set_as_default !== "Yes"
    ) {
      await db("fan_mvno_details")
        .whereEq("mvno_id", data.vendorId)
        .update({ set_as_default: "No" });
    }

    await db("fan_mvno_details").whereEq("id", data.id).update({
      // NOTE: `fan` is intentionally NOT updated — existing FAN numbers are locked
      fan_name: data.fanName ?? existing.fan_name,
      fan_description: data.fanDescription ?? "",
      status: data.status,
      set_as_default: data.setAsDefault,
      bill_cycle_day: data.billCycleDay,
    });

    return { success: true, fanId: data.id } as const;
  } catch (error) {
    console.error("[updateFan] failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update FAN";
    return { success: false, error: message } as const;
  }
}
