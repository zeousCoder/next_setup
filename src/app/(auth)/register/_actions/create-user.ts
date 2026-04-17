"use server";

import bcrypt from "bcryptjs";
import * as z from "zod";
import { sqlQuery } from "@/lib/db/mysql";

export type UserRole =
  | "SUPERADMIN"
  | "ADMIN"
  | "COMPANY"
  | "COMPANYCHILD"
  | "VENDOR"
  | "VENDORCHILD";

const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  role: z
    .enum([
      "SUPERADMIN",
      "ADMIN",
      "COMPANY",
      "COMPANYCHILD",
      "VENDOR",
      "VENDORCHILD",
    ])
    .optional(),
});

type CreateUserInput = z.infer<typeof createUserSchema>;

type ActionResult =
  | { success: true; userId: number }
  | { success: false; error: string };

export async function createUser(input: CreateUserInput): Promise<ActionResult> {
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, email, password, role } = parsed.data;

  try {
    // Check if a user with this email already exists
    const existing = (await sqlQuery<{ count: number }[]>(
      "SELECT COUNT(*) AS count FROM login_details WHERE email = ?",
      [email],
    )) as { count: number }[];
    if (existing[0]?.count > 0) {
      return { success: false, error: "A user with this email already exists" };
    }

    // If no users exist at all, the first user becomes SUPERADMIN
    const total = (await sqlQuery<{ count: number }[]>(
      "SELECT COUNT(*) AS count FROM login_details",
      [],
    )) as { count: number }[];
    const isFirstUser = total[0]?.count === 0;
    const assignedRole: UserRole = isFirstUser ? "SUPERADMIN" : (role ?? "ADMIN");

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = (await sqlQuery<{ insertId: number }>(
      "INSERT INTO login_details (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, assignedRole],
    )) as { insertId: number };

    return { success: true, userId: result.insertId };
  } catch {
    return { success: false, error: "Failed to create user. Please try again." };
  }
}
