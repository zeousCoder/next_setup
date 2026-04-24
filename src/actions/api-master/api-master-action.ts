"use server";

import { db } from "@/lib/db/mysql";
import { serialize } from "@/lib/utils";
import { getSession } from "@/session/auth-session";

export type CreateApiMasterInput = {
  api_name: string;
  api_full_name: string;
  table_name: string;
  default_async_value: string;
  status: 0 | 1; // 0 = inactive, 1 = active
  tbl_mobility: string;
};

export async function createApiMaster({ data }: { data: any }) {
  try {
    const currentUser = await getSession();

    if (!currentUser) {
      return { success: false, error: "Unauthorized" } as const;
    }

    const apiMasterId = await db("api_master").insert({
      api_name: data.api_name,
      api_full_name: data.api_full_name,
      table_name: data.table_name,
      default_async_value: data.default_async_value,
      status: data.status,
      tbl_mobility: data.tbl_mobility,
    });

    return {
      success: true,
      apiMasterId,
      message: "Api Master created successfully",
    } as const;
  } catch (error: any) {
    console.error("[createApiMaster] failed:", error);
    return { success: false, error: "Failed to create Api Master" } as const;
  }
}

export async function updateApiMaster({ data }: { data: any }) {
  try {
    const currentUser = await getSession();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" } as const;
    }

    const apiMaster = await db("api_master").whereEq("id", data.id).first();

    if (!apiMaster) {
      return { success: false, error: "Api Master not found" } as const;
    }

    await db("api_master").whereEq("id", data.id).update({
      api_name: data.api_name,
      api_full_name: data.api_full_name,
      table_name: data.table_name,
      default_async_value: data.default_async_value,
      status: data.status,
      tbl_mobility: data.tbl_mobility,
    });
    return {
      success: true,
      message: "Api Master updated successfully",
    } as const;
  } catch (error: any) {
    console.error("[updateApiMaster] failed:", error);
    return { success: false, error: "Failed to update Api Master" } as const;
  }
}

export async function deleteApiMaster({ id }: { id: number }) {
  try {
    const currentUser = await getSession();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" } as const;
    }
    const deleted = await db("api_master").whereEq("id", id).delete();
    if (deleted === 0) {
      return { success: false, error: "Api Master not found" } as const;
    }
    return {
      success: true,
      message: "Api Master deleted successfully",
    } as const;
  } catch (error: any) {
    console.error("[deleteApiMaster] failed:", error);
    return { success: false, error: "Failed to delete Api Master" } as const;
  }
}

export async function getApiMaster() {
  try {
    const apiMaster = await db("api_master").get();
    return {
      success: true,
      data: serialize(apiMaster) as CreateApiMasterInput[],
    } as const;
  } catch (error: any) {
    console.error("[getApiMaster] failed:", error);
    return { success: false, error: "Failed to get Api Master" } as const;
  }
}
