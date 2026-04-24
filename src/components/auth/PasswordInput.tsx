"use client";
import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// PASSWORD VALIDATION — shared helper
// Allowed characters: letters, digits, and @$!%*?&
// Anything else (spaces, #, -, _, etc.) makes the password invalid.
// ─────────────────────────────────────────────────────────────────────────────

export const PASSWORD_ALLOWED_CHARS = "@$!%*?&";
export const PASSWORD_ALLOWED_PATTERN = /^[A-Za-z0-9@$!%*?&]+$/;

// Re-export tag to keep the module identity stable for consumers.

export interface PasswordCheck {
  label: string;
  passed: boolean;
  errorMessage: string;
}

function buildChecks(password: string): PasswordCheck[] {
  return [
    {
      label: "At least 8 characters",
      passed: password.length >= 8,
      errorMessage: "Password must be at least 8 characters.",
    },
    {
      label: "At most 32 characters",
      passed: password.length > 0 && password.length <= 32,
      errorMessage: "Password must be at most 32 characters.",
    },
    {
      label: "One lowercase letter (a–z)",
      passed: /[a-z]/.test(password),
      errorMessage: "Password must contain a lowercase letter.",
    },
    {
      label: "One uppercase letter (A–Z)",
      passed: /[A-Z]/.test(password),
      errorMessage: "Password must contain an uppercase letter.",
    },
    {
      label: "One number (0–9)",
      passed: /\d/.test(password),
      errorMessage: "Password must contain a number.",
    },
    {
      label: `One special character (${PASSWORD_ALLOWED_CHARS})`,
      passed: /[@$!%*?&]/.test(password),
      errorMessage: `Password must contain a special character (${PASSWORD_ALLOWED_CHARS}).`,
    },
    {
      label: `Only allowed characters (A–Z, a–z, 0–9, ${PASSWORD_ALLOWED_CHARS})`,
      passed: password.length > 0 && PASSWORD_ALLOWED_PATTERN.test(password),
      errorMessage: `Password can only contain letters, numbers, and ${PASSWORD_ALLOWED_CHARS}.`,
    },
  ];
}

export interface PasswordValidationResult {
  valid: boolean;
  checks: PasswordCheck[];
  firstFailure?: string;
}

/**
 * Validate a password against the full rule set. Use this in form submit
 * handlers to block submission when any rule fails.
 */
export function validatePassword(password: string): PasswordValidationResult {
  const checks = buildChecks(password);
  const failed = checks.find((c) => !c.passed);
  return {
    valid: !failed,
    checks,
    firstFailure: failed?.errorMessage,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STRENGTH METER — UI only, drives the segmented bar + label
// ─────────────────────────────────────────────────────────────────────────────

interface StrengthResult {
  score: number;
  label: string;
  color: string;
  textColor: string;
  checks: PasswordCheck[];
}

function getStrength(password: string): StrengthResult {
  const checks = buildChecks(password);
  const score = Math.min(5, checks.filter((c) => c.passed).length);

  const levels = [
    { label: "Too weak", color: "bg-red-500", textColor: "text-red-500" },
    { label: "Weak", color: "bg-orange-500", textColor: "text-orange-500" },
    { label: "Fair", color: "bg-yellow-500", textColor: "text-yellow-500" },
    { label: "Good", color: "bg-blue-500", textColor: "text-blue-500" },
    { label: "Strong", color: "bg-green-500", textColor: "text-green-500" },
    {
      label: "Very strong",
      color: "bg-green-600",
      textColor: "text-green-600",
    },
  ];

  return {
    score,
    label: levels[score].label,
    color: levels[score].color,
    textColor: levels[score].textColor,
    checks,
  };
}

interface PasswordInputProps {
  name?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showStrength?: boolean;
}

export default function PasswordInput({
  name = "password",
  placeholder = "Password",
  autoComplete = "off",
  required = false,
  disabled = false,
  className,
  value,
  onChange,
  showStrength = false,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [internalValue, setInternalValue] = useState("");

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const strength = useMemo(() => getStrength(currentValue), [currentValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setInternalValue(e.target.value);
    onChange?.(e);
  };

  return (
    <div className="w-full space-y-2">
      {/* Input + toggle */}
      <div className="relative">
        <Input
          name={name}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          type={showPassword ? "text" : "password"}
          value={currentValue}
          onChange={handleChange}
          className={cn("pr-10", className)}
        />
        <Button
          type="button"
          variant="link"
          size="icon"
          disabled={disabled}
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-1  h-7 w-7 text-muted-foreground hover:text-foreground"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Strength indicator — only shown when showStrength=true and user has typed */}
      {showStrength && currentValue.length > 0 && (
        <div className="space-y-2">
          {/* Segmented bar + label */}
          <div className="flex items-center gap-2">
            <div className="flex flex-1 gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-all duration-300",
                    i < strength.score ? strength.color : "bg-muted",
                  )}
                />
              ))}
            </div>
            <span
              className={cn(
                "text-xs font-medium w-20 text-right",
                strength.textColor,
              )}
            >
              {strength.label}
            </span>
          </div>

          {/* Rule checklist */}
          <ul className="grid grid-cols-1 gap-y-1 sm:grid-cols-2">
            {strength.checks.map((check) => (
              <li
                key={check.label}
                className={cn(
                  "flex items-center gap-1.5 text-xs transition-colors duration-200",
                  check.passed
                    ? "text-green-600 dark:text-green-400"
                    : "text-muted-foreground",
                )}
              >
                <span className="text-[10px] leading-none">
                  {check.passed ? "✓" : "○"}
                </span>
                {check.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
