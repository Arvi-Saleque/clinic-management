"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordAction, type AuthActionState } from "@/lib/server/auth";

const initialState: AuthActionState = { error: null };

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialState);

  if (state.message) {
    return (
      <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-5 text-center space-y-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 mx-auto">
          <CheckCircle2 className="size-5" />
        </div>
        <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">{state.message}</p>
        <p className="text-xs text-muted-foreground">Please check your inbox and spam folder for the recovery link.</p>
        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl bg-[#0B3B36] text-white text-xs font-bold shadow-md"
          >
            <ArrowLeft className="size-3.5" />
            <span>Return to Sign In</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4.5">
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-xs font-bold text-foreground">
          Email address
        </Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="e.g. charlotte.hughes@example.com"
            required
            className="h-11 rounded-2xl pl-10 pr-4 text-xs bg-muted/20 border-border/80 focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/20 shadow-2xs font-medium"
          />
        </div>
      </div>

      {state.error && (
        <div role="alert" className="rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-xs font-semibold text-destructive">
          {state.error}
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="w-full gap-2 rounded-2xl bg-gradient-to-r from-[#0B3B36] via-[#0D4D46] to-[#0B3B36] hover:opacity-95 text-white shadow-lg shadow-[#0B3B36]/20 font-bold text-xs h-11.5 cursor-pointer transition-all hover:scale-[1.005]"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
        <span>Send Reset Link</span>
      </Button>

      <p className="text-center text-xs text-muted-foreground pt-2">
        Remember your password?{" "}
        <Link href="/login" className="font-bold text-primary hover:underline">
          Back to sign in &rarr;
        </Link>
      </p>
    </form>
  );
}
