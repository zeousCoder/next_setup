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
import PasswordInput from "./PasswordInput";
import * as z from "zod";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export default function LoginForm() {
  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    const response = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (response?.error) {
      toast.error("Invalid email or password");
    } else {
      toast.success("Login successful");
      router.push("/permissions");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <FieldGroup>
        <FieldSet>
          <Field>
            <FieldLabel>Email</FieldLabel>
            <FieldContent>
              <Input
                type="email"
                name="email"
                placeholder="you@example.com"
                autoComplete="email"
              />
              <FieldDescription>
                We&apos;ll never share your email with anyone.
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
              <PasswordInput name="password" placeholder="••••••••" />
            </FieldContent>
          </Field>
        </FieldSet>
      </FieldGroup>

      <Button type="submit" size="lg" className="w-full">
        Sign in
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
