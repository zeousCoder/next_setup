"use client";
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
import * as z from "zod";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PasswordInput from "../PasswordInput";

const loginSchema = z.object({
  identifier: z.string().min(1, "Email or Login ID is required"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);
    const values = {
      identifier: (formData.get("identifier") as string)?.trim(),
      password: formData.get("password") as string,
    };

    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setPending(true);
    const response = await signIn("credentials", {
      // `authorize` reads this as the identifier (email OR LoginID).
      email: parsed.data.identifier,
      password: parsed.data.password,
      redirect: false,
    });
    setPending(false);

    if (response?.error) {
      toast.error("Invalid credentials");
      return;
    }

    toast.success("Login successful");
    router.push("/permissions");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <FieldGroup>
        <FieldSet>
          <Field>
            <FieldLabel>Email or Login ID</FieldLabel>
            <FieldContent>
              <Input
                type="text"
                name="identifier"
                placeholder="you@example.com or your login ID"
                autoComplete="username"
                disabled={pending}
              />
              <FieldDescription>
                You can sign in with either your email address or your Login ID.
              </FieldDescription>
            </FieldContent>
          </Field>
        </FieldSet>

        <FieldSet>
          <Field>
            <FieldLabel>
              <span className="flex w-full items-center justify-between">
                Password
                <a
                  href="#"
                  className="text-xs font-normal text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                >
                  Forgot password?
                </a>
              </span>
            </FieldLabel>
            <FieldContent>
              <PasswordInput
                name="password"
                placeholder="********"
                disabled={pending}
              />
            </FieldContent>
          </Field>
        </FieldSet>
      </FieldGroup>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <FieldSeparator>or</FieldSeparator>

      <p className="text-center text-xs text-muted-foreground">
        Don&apos;t have an account?{" "}
        <a
          href="/register"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign up
        </a>
      </p>
    </form>
  );
}
