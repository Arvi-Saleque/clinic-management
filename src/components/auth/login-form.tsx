"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { Loader2, Stethoscope } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAction, type AuthActionState } from "@/lib/server/auth";

const initialState: AuthActionState = { error: null };

/** Local-dev-only convenience — never render this in a real deployment. */
const DEMO_ACCOUNTS =
  process.env.NODE_ENV !== "production"
    ? [
        {
          label: "Dentist — Dr. Nadia Islam (Cosmetic, Implants)",
          email: "nadia.islam.demo@example.com",
          password: "ClinicDemo2026!",
        },
        {
          label: "Dentist — Dr. Rafi Ahmed (Implants, Oral Surgery)",
          email: "rafi.ahmed.demo@example.com",
          password: "ClinicDemo2026!",
        },
        {
          label: "Orthodontist — Dr. Emily White",
          email: "emily.white.demo@example.com",
          password: "ClinicDemo2026!",
        },
      ]
    : [];

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signInAction, initialState);
  const emailRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);

  function fillDemoAccount(email: string, password: string) {
    if (emailRef.current) emailRef.current.value = email;
    if (passwordRef.current) passwordRef.current.value = password;
  }

  return (
    <div className="space-y-4">
      {DEMO_ACCOUNTS.length > 0 && (
        <div className="rounded-lg border border-dashed border-border bg-muted/40 p-3">
          <p className="text-xs font-medium text-muted-foreground">Demo login (local testing only)</p>
          <div className="mt-2 space-y-1.5">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => fillDemoAccount(account.email, account.password)}
                className="flex w-full items-center gap-2 rounded-md border border-border bg-background px-2.5 py-2 text-left text-xs transition-colors hover:border-primary hover:bg-muted"
              >
                <Stethoscope className="size-3.5 shrink-0 text-primary" />
                <span className="flex-1">
                  <span className="block font-medium text-foreground">{account.label}</span>
                  <span className="text-muted-foreground">{account.email}</span>
                </span>
                <span className="shrink-0 text-primary">Use</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input ref={emailRef} id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">
              Forgot password?
            </Link>
          </div>
          <Input
            ref={passwordRef}
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>

        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Sign in
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          New patient?{" "}
          <Link href="/sign-up" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}
