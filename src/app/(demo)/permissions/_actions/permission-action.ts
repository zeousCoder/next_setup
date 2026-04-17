"use server";

import { sqlQuery } from "@/lib/db/mysql";
import { serialize } from "@/lib/utils";

export async function getPermission() {
  try {
    const response = await sqlQuery("SELECT * FROM tbl_permission", [], "db1");
    return serialize(response);
  } catch (error: any) {
    console.error(error);
    throw new Error(error.message || "Failed to fetch permissions");
  }
}
