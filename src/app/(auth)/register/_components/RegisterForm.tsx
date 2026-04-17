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
import PasswordInput from "@/app/(auth)/login/_components/PasswordInput";
import { createUser } from "../_actions/create-user";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function RegisterForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const values = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };

    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setPending(true);
    const result = await createUser({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setPending(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Account created! Please sign in.");
    router.push("/login");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <FieldGroup>
        <FieldSet>
          <Field>
            <FieldLabel>Full Name</FieldLabel>
            <FieldContent>
              <Input
                name="name"
                type="text"
                placeholder="John Doe"
                autoComplete="name"
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

        <FieldSet>
          <Field>
            <FieldLabel>Confirm Password</FieldLabel>
            <FieldContent>
              <PasswordInput
                name="confirmPassword"
                placeholder="••••••••"
                disabled={pending}
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
