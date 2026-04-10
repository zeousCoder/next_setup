import * as z from "zod";
import { loginTypes, signUpTypes } from "@/types/auth";

const passwordSchema = z
  .string()
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character",
  )
  .min(8, "Password must be at least 8 characters long")
  .max(32, "Password must be less than 32 characters long");

export const loginSchema: z.ZodType<loginTypes> = z.object({
  email: z.string().email("Invalid email address"),
  password: passwordSchema,
});

export const signUpSchema: z.ZodType<signUpTypes> = z
  .object({
    email: z.string().email("Invalid email address"),
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginTypes = z.infer<typeof loginSchema>;
export type SignUpTypes = z.infer<typeof signUpSchema>;
