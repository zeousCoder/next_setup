"use server";

import { db } from "@/lib/db/mysql";
import { getSession } from "@/session/auth-session";
import bcrypt from "bcryptjs";
import { serialize } from "@/lib/utils";

export type CreateCompanyInput = {
  companyName: string;
  loginId: string;
  status: "Y" | "N";
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
};

export type UpdateCompanyInput = {
  id: number; // tbl_company.id
  companyName: string;
  status: "Y" | "N";
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
};

export async function createCompany(data: CreateCompanyInput) {
  try {
    const currentUser = await getSession();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" } as const;
    }

    // Duplicate checks
    const loginExists = await db("login_details")
      .whereEq("LoginID", data.loginId)
      .first();
    if (loginExists) {
      return { success: false, error: "Login ID already exists" } as const;
    }

    const emailExists = await db("login_details")
      .whereEq("email", data.email)
      .first();
    if (emailExists) {
      return { success: false, error: "Email already exists" } as const;
    }

    const phoneExists = await db("login_details")
      .whereEq("contactnumber", data.phone)
      .first();
    if (phoneExists) {
      return { success: false, error: "Phone already exists" } as const;
    }

    const companyExists = await db("tbl_company")
      .whereEq("company_name", data.companyName)
      .first();
    if (companyExists) {
      return { success: false, error: "Company name already exists" } as const;
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const updatedTime = now;

    // 1) Insert the company first — the returned id is used for login_details.company_id
    const companyId = await db("tbl_company").insert({
      company_name: data.companyName,
      company_oss_id: 1,
      status: data.status,
      addeddate: now,
      description: data.companyName,
      VendorID: data.loginId,
      parrent_id: currentUser.user.id,
      password: hashedPassword,
      subs_wise_ban: "No",
      FAN: null,
      APP_ID: null,
      APP_SECRET: null,
      PACKET_DATA_PROFILE: null,
      APN: null,
      other_desc: null,
      ocs_instance: null,
      passcode: null,
      company_url: null,
      company_ocs_url: null,
      company_logo: null,
      cdr_db_name: null,
    });

    // 2) Insert the login row linked to the freshly created company
    try {
      const userId = await db("login_details").insert({
        Name: `${data.firstName} ${data.lastName}`,
        LoginID: data.loginId,
        Password: hashedPassword,
        twoFa_sceret: null,
        VendorID: data.loginId,

        PIN: null,
        UpdatedTime: updatedTime,
        Status: data.status === "Y" ? 0 : 1,
        is_admin: "N",
        OperatorID: 0,

        ZIP: "N",
        superadmin: "N",

        company_id: companyId,
        is_company_admin: "N",
        parrent_id: currentUser.user.id,
        profile_image_id: 0,

        fname: data.firstName,
        lname: data.lastName,
        address: "",
        email: data.email,
        contactnumber: data.phone,
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
        type: "COMPANY",
      });

      // 3) Create a default group for this company
      const groupId = await db("tbl_group").insert({
        vendorAutoId: currentUser.user.id,
        vendorLoginId: currentUser.user.LoginId,
        userAutoId: userId,
        userLoginId: data.loginId,
        gr_name: `${data.companyName}_GROUP`,
        gr_status: "Y",
        created_date: now,
        is_default_group: 0,
        modified_date: now,
        created_by: currentUser.user.role ?? null,
      });

      await db("login_details").whereEq("id", userId).update({
        group_id: groupId,
      });

      const companyDefaultPermission = await db("tbl_permission")
        .whereEq("forAdmin", "Y")
        .whereEq("p_status", "Y")
        .orderBy("id", "ASC")
        .get();
      for (const permission of companyDefaultPermission) {
        await db("tbl_permission_group").insert({
          p_id: permission.id,
          status: "Y", // Y = Active, N = Inactive
          gr_id: groupId,

          transaction_datetime: now,
        });
      }

      const addApi = await db("api_master").whereEq("status", 0).get();
      for (const api of addApi) {
        await db("company_api_master").insert({
          company_login_id: data.loginId,
          company_id: userId,
          api_id: api.id,
          api_status: 0,
          updated_by: currentUser.user.role ?? null,
        });
      }

      return { success: true, companyId, userId, groupId, addApi } as const;
    } catch (loginErr) {
      // Roll back the company row so we don't leave an orphan if the login insert fails.
      try {
        await db("tbl_company").whereEq("id", companyId).delete();
      } catch (cleanupErr) {
        console.error(
          "[createCompany] cleanup failed for companyId",
          companyId,
          cleanupErr,
        );
      }
      throw loginErr;
    }
  } catch (error: any) {
    console.error("[createCompany] failed:", error);
    return {
      success: false,
      error: error.message ?? "Failed to create company",
    } as const;
  }
}

export async function getCompanies() {
  try {
    const rows = await db("tbl_company c")
      .select(
        "c.id",
        "c.company_name",
        "c.VendorID",
        "c.status",
        "c.addeddate",
        "c.description",
        "l.id AS login_id",
        "l.email",
        "l.contactnumber",
        "l.fname",
        "l.lname",
        "l.UpdatedTime",
        "g.id AS group_id",
        "g.gr_name AS groupName",
      )
      .leftJoin(
        "login_details l",
        "l.company_id = c.id AND l.type = ?",
        "COMPANY",
      )
      .leftJoin("tbl_group g", "g.id = l.group_id")
      .orderBy("c.id", "DESC")
      .get();

    return { success: true, data: serialize(rows) } as const;
  } catch (error) {
    console.error("[getCompanies] failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load companies";
    return { success: false, error: message } as const;
  }
}

export async function updateCompany(data: UpdateCompanyInput) {
  try {
    const currentUser = await getSession();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" } as const;
    }

    const existing = (await db("tbl_company")
      .whereEq("id", data.id)
      .first()) as { id: number } | null;
    if (!existing) {
      return { success: false, error: "Company not found" } as const;
    }

    // Uniqueness: company name against other companies
    const nameTaken = (await db("tbl_company")
      .whereEq("company_name", data.companyName)
      .first()) as { id: number } | null;
    if (nameTaken && nameTaken.id !== data.id) {
      return { success: false, error: "Company name already exists" } as const;
    }

    // Uniqueness: email / phone against other login rows
    const emailTaken = (await db("login_details")
      .whereEq("email", data.email)
      .first()) as { id: number; company_id: number | null } | null;
    if (emailTaken && emailTaken.company_id !== data.id) {
      return { success: false, error: "Email already exists" } as const;
    }

    const phoneTaken = (await db("login_details")
      .whereEq("contactnumber", data.phone)
      .first()) as { id: number; company_id: number | null } | null;
    if (phoneTaken && phoneTaken.company_id !== data.id) {
      return { success: false, error: "Phone already exists" } as const;
    }

    const updatedTime = new Date().toISOString().slice(0, 19).replace("T", " ");

    await db("tbl_company").whereEq("id", data.id).update({
      company_name: data.companyName,
      description: data.companyName,
      status: data.status,
    });

    await db("login_details")
      .whereEq("company_id", data.id)
      .where("type = ?", "COMPANY")
      .update({
        Name: `${data.firstName} ${data.lastName}`,
        fname: data.firstName,
        lname: data.lastName,
        email: data.email,
        contactnumber: data.phone,
        Status: data.status === "Y" ? 0 : 1, // 0 = Active, 1 = Inactive
        UpdatedTime: updatedTime,
      });

    return { success: true, companyId: data.id } as const;
  } catch (error) {
    console.error("[updateCompany] failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update company";
    return { success: false, error: message } as const;
  }
}

export async function updateCompanyPassword(data: {
  id: number; // tbl_company.id
  password: string;
}) {
  try {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const updatedTime = new Date().toISOString().slice(0, 19).replace("T", " ");

    await db("tbl_company").whereEq("id", data.id).update({
      password: hashedPassword,
    });

    await db("login_details")
      .whereEq("company_id", data.id)
      .where("type = ?", "COMPANY")
      .update({
        Password: hashedPassword,
        UpdatedTime: updatedTime,
      });

    return { success: true } as const;
  } catch (error: any) {
    console.error("[updateCompanyPassword] failed:", error);
    return {
      success: false,
      error: error.message ?? "Failed to update company password",
    } as const;
  }
}
