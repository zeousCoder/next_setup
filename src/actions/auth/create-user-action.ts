"use server";

import { db } from "@/lib/db/mysql";
import { getSession } from "@/session/auth-session";
import bcrypt from "bcryptjs";
import { serialize } from "@/lib/utils";

export async function createAdminUser({ data }: { data: any }) {
  try {
    const existing = await db("login_details")
      .whereEq("LoginID", data.LoginID)
      .first();

    if (existing) {
      return {
        success: false,
        error: "Login ID already exists",
      };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const updatedTime = now; // date like this 2026-04-20 10:00:00

    const userId = await db("login_details").insert({
      Name: `${data.fname} ${data.lname}`,
      LoginID: data.LoginID,
      Password: hashedPassword,
      twoFa_sceret: null,
      VendorID: data.LoginID,

      PIN: null,
      UpdatedTime: updatedTime,
      Status: 0,
      is_admin: "Y",
      OperatorID: 0,

      ZIP: "N",
      superadmin: "Y",

      company_id: 0,
      is_company_admin: "N",
      parrent_id: 0,
      profile_image_id: 0,

      fname: data.fname,
      lname: data.lname,
      address: "",
      email: data.email,
      contactnumber: data.contactnumber,
      aboutme: "",

      lastvisited: now,
      CLIENT_ID: 1,

      HOTLINE_OUTOF_CREDIT: null,
      ETC_NE_Disconnect: "N",
      ETC_NE_VendorID: null,
      ETC_NE_PLANCODE: null,

      ETC_Holding_Activation: null,
      ETC_Holding_Activation_ZIP: "N",
      ETC_Holding_Activation_PLAN: "N",

      activation_asyc: "",
      BILLING_CODE: "N",
      group_id: null,
      UpdatedBy: null,
      APP_ID: "",
      APP_SECRET: "",
      type: "ADMIN",
    });

    return {
      success: true,
      userId: userId,
    };
  } catch (error: any) {
    console.error(error);
    return {
      success: false,
      error: error.message ?? "Failed to create user",
    };
  }
}
