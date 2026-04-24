"use server";

import { db } from "@/lib/db/mysql";
import { getSession } from "@/session/auth-session";
import bcrypt from "bcryptjs";
import { serialize } from "@/lib/utils";

export type CreateAdminChildUserInput = {
  id?: number;
  email: string;
  password: string;
  userName: string;
  first_name: string;
  last_name: string;
  phone: string;
  address?: string;
  about_me?: string;
  status?: string | number;
};

export type UpdateAdminChildUserInput = {
  id: number;
  userName: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  address?: string;
  about_me?: string;
  status?: string | number;
};

export async function createAdminChildUser(data: CreateAdminChildUserInput) {
  try {
    const currentUser = await getSession();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" } as const;
    }

    const emailExists = await db("tbl_child_user")
      .whereEq("email", data.email)
      .first();
    if (emailExists) {
      return { success: false, error: "Email already exists" } as const;
    }

    const usernameExists = await db("tbl_child_user")
      .whereEq("userName", data.userName)
      .first();
    if (usernameExists) {
      return { success: false, error: "Username already exists" } as const;
    }

    const phoneExists = await db("tbl_child_user")
      .whereEq("contactnumber", data.phone)
      .first();
    if (phoneExists) {
      return { success: false, error: "Phone already exists" } as const;
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const updatedTime = now;

    // status convention: 1 = Active, 0 = Inactive
    const statusValue =
      typeof data.status === "string"
        ? Number(data.status)
        : (data.status ?? 1);

    const userId = await db("tbl_child_user").insert({
      group_id: 0,
      VendorAutoID: currentUser.user.id,
      VendorID: currentUser.user.LoginId,
      userName: data.userName,
      email: data.email,
      password: hashedPassword,
      twoFa_sceret: null,
      UpdatedTime: updatedTime,
      status: Number.isFinite(statusValue) ? statusValue : 1,
      type: "ADMINCHILD",
      created_by: currentUser.user.VendorID,
      created_date: now,
      profile_image_id: 0,
      fname: data.first_name,
      lname: data.last_name,
      address: data.address ?? "",
      contactnumber: data.phone,
      aboutme: data.about_me ?? "",
      lastvisited: now,
      CLIENT_ID: 1,
    });

    return { success: true, userId } as const;
  } catch (error) {
    console.error("[createAdminChildUser] failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create user";
    return { success: false, error: message } as const;
  }
}

export async function getAdminChildUsers() {
  try {
    const rows = await db("tbl_child_user")
      .select(
        "id, userName, email, fname, lname, contactnumber, address, aboutme, type, status, created_date, UpdatedTime, created_by",
      )
      .whereEq("type", "ADMINCHILD")
      .orderBy("id", "DESC")
      .get();
    return {
      success: true,
      data: serialize(rows),
    } as const;
  } catch (error) {
    console.error("[getAdminChildUsers] failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to get admin child users";
    return { success: false, error: message } as const;
  }
}

export async function updateAdminChildUserPassword(data: {
  id: number;
  password: string;
}) {
  try {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const updatedTime = new Date().toISOString().slice(0, 19).replace("T", " ");
    await db("tbl_child_user").whereEq("id", data.id).update({
      password: hashedPassword,
      UpdatedTime: updatedTime,
    });
    return { success: true } as const;
  } catch (error: any) {
    console.error("[updateAdminChildUserPassword] failed:", error);
    return {
      success: false,
      error: error.message ?? "Failed to update user password",
    } as const;
  }
}

export async function updateAdminChildUser(data: UpdateAdminChildUserInput) {
  try {
    const currentUser = await getSession();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" } as const;
    }

    const existing = await db("tbl_child_user").whereEq("id", data.id).first();
    if (!existing) {
      return { success: false, error: "User not found" } as const;
    }

    const emailTaken = (await db("tbl_child_user")
      .whereEq("email", data.email)
      .first()) as { id: number } | null;
    if (emailTaken && emailTaken.id !== data.id) {
      return { success: false, error: "Email already exists" } as const;
    }

    const phoneTaken = (await db("tbl_child_user")
      .whereEq("contactnumber", data.phone)
      .first()) as { id: number } | null;
    if (phoneTaken && phoneTaken.id !== data.id) {
      return { success: false, error: "Phone already exists" } as const;
    }

    const userNameTaken = (await db("tbl_child_user")
      .whereEq("userName", data.userName)
      .first()) as { id: number } | null;
    if (userNameTaken && userNameTaken.id !== data.id) {
      return { success: false, error: "Username already exists" } as const;
    }

    // status convention: 1 = Active, 0 = Inactive
    const statusValue =
      typeof data.status === "string"
        ? Number(data.status)
        : (data.status ?? 1);

    const updatedTime = new Date().toISOString().slice(0, 19).replace("T", " ");

    await db("tbl_child_user")
      .whereEq("id", data.id)
      .update({
        email: data.email,
        userName: data.userName,
        fname: data.first_name,
        lname: data.last_name,
        contactnumber: data.phone,
        address: data.address ?? "",
        aboutme: data.about_me ?? "",
        status: Number.isFinite(statusValue) ? statusValue : 1,
        UpdatedTime: updatedTime,
      });

    return { success: true, userId: data.id } as const;
  } catch (error) {
    console.error("[updateAdminChildUser] failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update user";
    return { success: false, error: message } as const;
  }
}
