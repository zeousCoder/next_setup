"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";
import PasswordInput from "../PasswordInput";
import { apiFetcher } from "@/lib/api/apiFetcher";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const router = useRouter();
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const res = await apiFetcher("/auth/login", {
      method: "POST",
      body: {
        email,
        password,
      },
    });

    if (res.success) {
      toast.success("Login successful");
      setLoading(false);
      router.push("/dashboard");
    } else {
      toast.error(res.message);
      setLoading(false);
    }
  };
  return (
    <form onSubmit={onSubmit} className="space-y-4 w-full">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            name="email"
            autoComplete="off"
            type="email"
            placeholder="Email"
            required
            disabled={loading}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <PasswordInput
            name="password"
            autoComplete="off"
            placeholder="Password"
            value={password}
            required
            disabled={loading}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
      </FieldGroup>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            logging in...
          </span>
        ) : (
          "Login"
        )}
      </Button>
    </form>
  );
}
