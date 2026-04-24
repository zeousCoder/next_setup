"use server";

import { db } from "@/lib/db/mysql";
import { getSession } from "@/session/auth-session";
import bcrypt from "bcryptjs";
import { serialize } from "@/lib/utils";

export type CreateVendorInput = {
  LoginID: string;
  password: string;
  fname: string;
  lname: string;
  email: string;
  contactnumber: string;
  status?: "Y" | "N";
  companyId?: number;
  pin?: string | null;
  fan?: string | null;
  activationAsync?: string | null;
  billCycleDay?: number | null;
};

export type UpdateVendorInput = {
  id: number; // login_details.id
  fname: string;
  lname: string;
  email: string;
  contactnumber: string;
  status: "Y" | "N";
  companyId?: number;
  pin?: string | null;
  fan?: string | null;
  activationAsync?: string | null;
  billCycleDay?: number | null;
};

export async function createVendor({ data }: { data: CreateVendorInput }) {
  try {
    const currentUser = await getSession();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" } as const;
    }

    // Duplicate checks
    const loginExists = await db("login_details")
      .whereEq("LoginID", data.LoginID)
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
      .whereEq("contactnumber", data.contactnumber)
      .first();
    if (phoneExists) {
      return { success: false, error: "Phone already exists" } as const;
    }

    // Resolve the company this vendor belongs to.
    // Priority: explicit companyId on input -> current user's companyId (COMPANY session) -> 0
    const companyId = data.companyId ?? currentUser.user.companyId ?? 0;

    // If a company id was resolved, make sure it actually exists in tbl_company
    if (companyId) {
      const company = (await db("tbl_company")
        .whereEq("id", companyId)
        .first()) as { id: number } | null;
      if (!company) {
        return { success: false, error: "Company not found" } as const;
      }
    }

    // parrent_id for a vendor = the COMPANY user's login_details.id for the
    // selected company. Fall back to the current session user if we cannot
    // find one (e.g. admin creating a vendor not yet wired to a company user).
    let parentId: number | null = null;
    if (companyId) {
      const companyLogin = (await db("login_details")
        .whereEq("company_id", companyId)
        .where("type = ?", "COMPANY")
        .first()) as { id: number } | null;
      parentId = companyLogin?.id ?? null;
    }
    if (parentId == null) {
      parentId = Number(currentUser.user.id) || 0;
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const updatedTime = now;
    const statusFlag = data.status ?? "Y";

    const userId = await db("login_details").insert({
      Name: `${data.fname} ${data.lname}`,
      LoginID: data.LoginID,
      Password: hashedPassword,
      twoFa_sceret: null,
      VendorID: data.LoginID,

      PIN: data.pin ?? null,
      UpdatedTime: updatedTime,
      Status: statusFlag === "Y" ? 0 : 1,
      is_admin: "N",
      OperatorID: 0,

      ZIP: "N",
      superadmin: "N",

      company_id: companyId,
      is_company_admin: "N",
      parrent_id: parentId,
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

      activation_asyc: data.activationAsync ?? "",
      BILLING_CODE: "N",
      group_id: null,
      UpdatedBy: null,
      APP_ID: "",
      APP_SECRET: "",
      type: "VENDOR",
    });

    try {
      // Default group for this vendor
      const groupId = await db("tbl_group").insert({
        vendorAutoId: currentUser.user.id,
        vendorLoginId: currentUser.user.LoginId,
        userAutoId: userId,
        userLoginId: data.LoginID,
        gr_name: `${data.LoginID}_GROUP`,
        gr_status: "Y",
        created_date: now,
        is_default_group: 0,
        modified_date: now,
        created_by: currentUser.user.role ?? null,
      });

      await db("login_details").whereEq("id", userId).update({
        group_id: groupId,
      });

      // Seed default permissions for the vendor group
      const vendorDefaultPermission = await db("tbl_permission")
        .where("forAdmin", "N")
        .whereEq("forVendor", "Y")
        .whereEq("p_status", "Y")
        .orderBy("id", "ASC")
        .get();

      for (const permission of vendorDefaultPermission) {
        await db("tbl_permission_group").insert({
          p_id: permission.id,
          status: "Y",
          gr_id: groupId,
          transaction_datetime: now,
        });
      }

      // Default FAN row for this vendor — stored separately in fan_mvno_details.
      // bill_cycle_day also lives here (not on login_details).
      const fanId = await db("fan_mvno_details").insert({
        mvno_id: userId,
        mvno_vendorID: data.LoginID,
        fan: data.fan ?? "",
        fan_name: `${data.fan}_DEFAULT_FAN`,
        fan_description: "",
        status: "Active",
        set_as_default: "Yes",
        created_by: currentUser.user.role ?? null,
        created_date: now,
        bill_cycle_day: data.billCycleDay ?? null,
      });

      const addApi = await db("api_master").whereEq("status", 0).get();
      for (const api of addApi) {
        await db("vendor_api_master").insert({
          VendorAutoID: userId,
          VendorID: data.LoginID,
          ApiID: api.id,
          Status: 0,
        });
      }

      return { success: true, userId, groupId, fanId, companyId } as const;
    } catch (groupErr) {
      // Roll back the vendor login_details row and any default fan_mvno_details
      // row so we don't leave orphans if the group / fan setup fails.
      try {
        await db("fan_mvno_details").whereEq("mvno_id", userId).delete();
      } catch (cleanupErr) {
        console.error(
          "[createVendor] fan cleanup failed for userId",
          userId,
          cleanupErr,
        );
      }
      try {
        await db("login_details").whereEq("id", userId).delete();
      } catch (cleanupErr) {
        console.error(
          "[createVendor] cleanup failed for userId",
          userId,
          cleanupErr,
        );
      }
      throw groupErr;
    }
  } catch (error: any) {
    console.error("[createVendor] failed:", error);
    return {
      success: false,
      error: error.message ?? "Failed to create vendor",
    } as const;
  }
}

export async function updateVendor(data: UpdateVendorInput) {
  try {
    const currentUser = await getSession();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" } as const;
    }

    const existing = (await db("login_details")
      .whereEq("id", data.id)
      .where("type = ?", "VENDOR")
      .first()) as { id: number; LoginID: string | null } | null;
    if (!existing) {
      return { success: false, error: "Vendor not found" } as const;
    }

    // Uniqueness: email / phone against other login rows
    const emailTaken = (await db("login_details")
      .whereEq("email", data.email)
      .first()) as { id: number } | null;
    if (emailTaken && emailTaken.id !== data.id) {
      return { success: false, error: "Email already exists" } as const;
    }

    const phoneTaken = (await db("login_details")
      .whereEq("contactnumber", data.contactnumber)
      .first()) as { id: number } | null;
    if (phoneTaken && phoneTaken.id !== data.id) {
      return { success: false, error: "Phone already exists" } as const;
    }

    // If a new companyId is supplied, verify it exists in tbl_company
    if (data.companyId) {
      const company = (await db("tbl_company")
        .whereEq("id", data.companyId)
        .first()) as { id: number } | null;
      if (!company) {
        return { success: false, error: "Company not found" } as const;
      }
    }

    const updatedTime = new Date().toISOString().slice(0, 19).replace("T", " ");

    const updatePayload: Record<string, any> = {
      Name: `${data.fname} ${data.lname}`,
      fname: data.fname,
      lname: data.lname,
      email: data.email,
      contactnumber: data.contactnumber,
      Status: data.status === "Y" ? 0 : 1,
      UpdatedTime: updatedTime,
    };

    if (data.companyId !== undefined) {
      updatePayload.company_id = data.companyId;

      // Re-resolve parrent_id to the COMPANY user's login row for the new company
      if (data.companyId) {
        const companyLogin = (await db("login_details")
          .whereEq("company_id", data.companyId)
          .where("type = ?", "COMPANY")
          .first()) as { id: number } | null;
        if (companyLogin?.id) {
          updatePayload.parrent_id = companyLogin.id;
        }
      }
    }

    if (data.pin !== undefined) {
      updatePayload.PIN = data.pin;
    }
    if (data.activationAsync !== undefined) {
      updatePayload.activation_asyc = data.activationAsync ?? "";
    }

    await db("login_details")
      .whereEq("id", data.id)
      .where("type = ?", "VENDOR")
      .update(updatePayload);

    // FAN + bill_cycle_day live on fan_mvno_details (not login_details).
    // Upsert the vendor's default FAN row.
    if (data.fan !== undefined || data.billCycleDay !== undefined) {
      const defaultFan = (await db("fan_mvno_details")
        .whereEq("mvno_id", data.id)
        .whereEq("set_as_default", "Yes")
        .first()) as { id: number } | null;

      const fanPayload: Record<string, any> = {};
      if (data.fan !== undefined) {
        fanPayload.fan = data.fan ?? "";
        fanPayload.fan_name = data.fan ?? existing.LoginID ?? "";
      }
      if (data.billCycleDay !== undefined) {
        fanPayload.bill_cycle_day = data.billCycleDay;
      }

      if (defaultFan) {
        await db("fan_mvno_details")
          .whereEq("id", defaultFan.id)
          .update(fanPayload);
      } else {
        // No default row yet — create one.
        await db("fan_mvno_details").insert({
          mvno_id: data.id,
          mvno_vendorID: existing.LoginID,
          fan: data.fan ?? "",
          fan_name: data.fan ?? existing.LoginID ?? "",
          fan_description: "",
          status: "Active",
          set_as_default: "Yes",
          created_by: currentUser.user.role ?? null,
          created_date: updatedTime,
          bill_cycle_day: data.billCycleDay ?? null,
        });
      }
    }

    return { success: true, userId: data.id } as const;
  } catch (error) {
    console.error("[updateVendor] failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update vendor";
    return { success: false, error: message } as const;
  }
}

export async function updateVendorPassword(data: {
  id: number; // login_details.id
  password: string;
}) {
  try {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const updatedTime = new Date().toISOString().slice(0, 19).replace("T", " ");

    await db("login_details")
      .whereEq("id", data.id)
      .where("type = ?", "VENDOR")
      .update({
        Password: hashedPassword,
        UpdatedTime: updatedTime,
      });

    return { success: true } as const;
  } catch (error: any) {
    console.error("[updateVendorPassword] failed:", error);
    return {
      success: false,
      error: error.message ?? "Failed to update vendor password",
    } as const;
  }
}

export async function getVendors() {
  try {
    const rows = await db("login_details l")
      .select(
        "l.id",
        "l.LoginID",
        "l.Name",
        "l.fname",
        "l.lname",
        "l.email",
        "l.contactnumber",
        "l.Status",
        "l.UpdatedTime",
        "l.PIN",
        "l.activation_asyc",
        "l.company_id",
        "c.company_name AS companyName",
        "g.id AS group_id",
        "g.gr_name AS groupName",
        "f.id AS fan_id",
        "f.fan AS FAN",
        "f.bill_cycle_day",
      )
      .where("l.type = ?", "VENDOR")
      .leftJoin("tbl_company c", "c.id = l.company_id")
      .leftJoin("tbl_group g", "g.id = l.group_id")
      .leftJoin(
        "fan_mvno_details f",
        "f.mvno_id = l.id AND f.set_as_default = ?",
        "Yes",
      )
      .orderBy("l.id", "DESC")
      .get();

    return { success: true, data: serialize(rows) } as const;
  } catch (error) {
    console.error("[getVendors] failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load vendors";
    return { success: false, error: message } as const;
  }
}
