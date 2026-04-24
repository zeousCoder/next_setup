"use server";

import { db } from "@/lib/db/mysql";
import { serialize } from "@/lib/utils";

export type GroupPermissionRow = {
  pg_id: number;
  gr_id: number;
  pg_status: "Y" | "N";
  transaction_datetime: string | null;
  p_id: number;
  cat_id: number | null;
  p_code: string;
  p_name: string;
  p_desc: string | null;
  p_status: "Y" | "N";
  forVendor: "Y" | "N";
  forAdmin: "Y" | "N";
  p_allow_msg: string | null;
  cat_name: string | null;
};

/**
 * Returns every permission (joined with `tbl_permission` and
 * `tbl_permission_category`) assigned to the given group id.
 * Works for any group — company, vendor, admin, etc.
 */
export async function getGroupPermissions(groupId: number) {
  try {
    const allPermission = await db("tbl_permission_group pg")
      .select(
        "pg.id AS pg_id",
        "pg.gr_id",
        "pg.status AS pg_status",
        "pg.transaction_datetime",
        "p.id AS p_id",
        "p.cat_id",
        "p.p_code",
        "p.p_name",
        "p.p_desc",
        "p.p_status",
        "p.forVendor",
        "p.forAdmin",
        "p.p_allow_msg",
        "c.cat_name",
      )
      .join("tbl_permission p", "p.id = pg.p_id")
      .leftJoin("tbl_permission_category c", "c.id = p.cat_id")
      .whereEq("pg.gr_id", groupId)
      .orderBy("c.cat_name", "ASC")
      .orderBy("p.id", "ASC")
      .get();

    return { success: true, data: serialize(allPermission) } as const;
  } catch (error: any) {
    console.error("[getGroupPermissions] failed:", error);
    return {
      success: false,
      error: error.message ?? "Failed to get group permissions",
    } as const;
  }
}
