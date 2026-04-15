"use server";

import { sqlQuery } from "@/lib/db/mysql";
import { serialize } from "@/lib/utils";

// tbl_permission_category

export async function getCategory() {
  try {
    const response = await sqlQuery(
      "SELECT * FROM tbl_permission_category",
      [],
      "db1",
    );
    return serialize(response);
  } catch (error: any) {
    console.error(error);
    throw new Error(error.message || "Failed to fetch categories");
  }
}

export async function deleteCategory(id: number) {
  try {
    const response = await sqlQuery(
      "DELETE FROM tbl_permission_category WHERE id = ?",
      [id],
      "db1",
    );
    return serialize(response);
  } catch (error: any) {
    console.error(error);
    throw new Error(error.message || "Failed to delete category");
  }
}

export async function createCategory(
  cat_name: string,
  cat_status: "Y" | "N",
  utype: string[],
) {
  try {
    // 🔹 Trim input
    const trimmedName = cat_name.trim();

    // 🔹 Validation
    if (!trimmedName || !cat_status || !Array.isArray(utype)) {
      throw new Error("All fields are required");
    }

    if (trimmedName.length < 3) {
      throw new Error("Category name must be at least 3 characters long");
    }

    if (utype.length === 0) {
      throw new Error("At least one user type must be selected");
    }

    // 🔹 Normalize and remove duplicates
    const sanitizedUTypes = [...new Set(utype.map((u) => u.toUpperCase()))];
    const utypeString = sanitizedUTypes.join(",");

    // 🔹 Check for duplicate category name (case-insensitive)
    const checkDuplicate = await sqlQuery(
      `SELECT id 
       FROM tbl_permission_category 
       WHERE LOWER(cat_name) = LOWER(?) 
       LIMIT 1`,
      [trimmedName],
      "db1",
    );

    if ((checkDuplicate as any[]).length > 0) {
      throw new Error("Category already exists");
    }

    // 🔹 Insert into database
    const response = await sqlQuery(
      `INSERT INTO tbl_permission_category 
       (cat_name, cat_status, utype) 
       VALUES (?, ?, ?)`,
      [trimmedName, cat_status, utypeString],
      "db1",
    );

    // 🔹 Return serializable response
    return serialize(response);
  } catch (error: any) {
    console.error("Error creating category:", error);
    throw new Error(error.message || "Failed to create category");
  }
}

export async function updateCategory(
  id: number,
  cat_name: string,
  cat_status: "Y" | "N",
  utype: string[],
) {
  try {
    const trimmedName = cat_name.trim();
    if (!trimmedName || !cat_status || !Array.isArray(utype)) {
      throw new Error("All fields are required");
    }
    if (trimmedName.length < 3) {
      throw new Error("Category name must be at least 3 characters long");
    }
    if (utype.length === 0) {
      throw new Error("At least one user type must be selected");
    }
    const sanitizedUTypes = [...new Set(utype.map((u) => u.toUpperCase()))];
    const utypeString = sanitizedUTypes.join(",");
    const checkDuplicate = await sqlQuery(
      `SELECT id 
       FROM tbl_permission_category 
       WHERE LOWER(cat_name) = LOWER(?) AND id != ? LIMIT 1`,
      [trimmedName, id],
      "db1",
      // { debug: true },
    );
    if ((checkDuplicate as any[]).length > 0) {
      throw new Error("Category already exists");
    }
    const response = await sqlQuery(
      "UPDATE tbl_permission_category SET cat_name = ?, cat_status = ?, utype = ? WHERE id = ?",
      [trimmedName, cat_status, utypeString, id],
      "db1",
    );
    return serialize(response);
  } catch (error: any) {
    console.error("Error updating category:", error);
    throw new Error(error.message || "Failed to update category");
  }
}

//  tbl_permission
export async function getPermission() {
  try {
    const response = await sqlQuery("SELECT * FROM tbl_permission", [], "db1");
    return serialize(response);
  } catch (error: any) {
    console.error(error);
    throw new Error(error.message || "Failed to fetch permissions");
  }
}
