"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { toast } from "sonner";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createAdminUser } from "@/actions/auth/create-user-action";
import PasswordInput, { validatePassword } from "../PasswordInput";


const registerSchema = z.object({
  LoginID: z
    .string()
    .min(3, "Login ID must be at least 3 characters")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Only letters, numbers, . _ - allowed"),
  fname: z.string().min(1, "First name is required"),
  lname: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  contactnumber: z
    .string()
    .min(7, "Contact number must be at least 7 digits")
    .regex(/^[+0-9\s-]+$/, "Invalid contact number"),
  password: z.string().superRefine((value, ctx) => {
    const result = validatePassword(value);
    if (!result.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          result.firstFailure ?? "Password does not meet requirements.",
      });
    }
  }),
});

export default function RegisterForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const values = {
      LoginID: formData.get("LoginID") as string,
      fname: formData.get("fname") as string,
      lname: formData.get("lname") as string,
      email: formData.get("email") as string,
      contactnumber: formData.get("contactnumber") as string,
      password: formData.get("password") as string,
    };

    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setPending(true);
    const result = await createAdminUser({
      data: {
        LoginID: parsed.data.LoginID,
        fname: parsed.data.fname,
        lname: parsed.data.lname,
        email: parsed.data.email,
        contactnumber: parsed.data.contactnumber,
        password: parsed.data.password,
      },
    });
    setPending(false);

    if (result.success) {
      toast.success("Account created successfully");
      router.push("/login");
    } else {
      toast.error(result.error ?? "Failed to create account");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <FieldGroup>
        <FieldSet>
          <Field>
            <FieldLabel>Login ID</FieldLabel>
            <FieldContent>
              <Input
                name="LoginID"
                type="text"
                placeholder="johndoe"
                autoComplete="username"
                disabled={pending}
              />
              <FieldDescription>
                This will be used to sign in.
              </FieldDescription>
            </FieldContent>
          </Field>
        </FieldSet>

        <FieldSet>
          <Field>
            <FieldLabel>First Name</FieldLabel>
            <FieldContent>
              <Input
                name="fname"
                type="text"
                placeholder="John"
                autoComplete="given-name"
                disabled={pending}
              />
            </FieldContent>
          </Field>
        </FieldSet>

        <FieldSet>
          <Field>
            <FieldLabel>Last Name</FieldLabel>
            <FieldContent>
              <Input
                name="lname"
                type="text"
                placeholder="Doe"
                autoComplete="family-name"
                disabled={pending}
              />
            </FieldContent>
          </Field>
        </FieldSet>

        <FieldSet>
          <Field>
            <FieldLabel>Email</FieldLabel>
            <FieldContent>
              <Input
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                disabled={pending}
              />
              <FieldDescription>
                We&apos;ll never share your email with anyone.
              </FieldDescription>
            </FieldContent>
          </Field>
        </FieldSet>

        <FieldSet>
          <Field>
            <FieldLabel>Contact Number</FieldLabel>
            <FieldContent>
              <Input
                name="contactnumber"
                type="tel"
                placeholder="+1 555 123 4567"
                autoComplete="tel"
                disabled={pending}
              />
            </FieldContent>
          </Field>
        </FieldSet>

        <FieldSet>
          <Field>
            <FieldLabel>Password</FieldLabel>
            <FieldContent>
              <PasswordInput
                name="password"
                placeholder="••••••••"
                disabled={pending}
                showStrength
              />
            </FieldContent>
          </Field>
        </FieldSet>
      </FieldGroup>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>

      <FieldSeparator>or</FieldSeparator>

      <p className="text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <a
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </a>
      </p>
    </form>
  );
}
