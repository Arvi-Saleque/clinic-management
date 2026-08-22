"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpAction, type AuthActionState } from "@/lib/server/auth";

const initialState: AuthActionState = { error: null };

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  if (state.message) {
    return (
      <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-5 text-center space-y-2">
        <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">{state.message}</p>
        <p className="text-xs text-muted-foreground">Please check your inbox to confirm your email and log in.</p>
        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl bg-[#0B3B36] text-white text-xs font-bold shadow-md"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4.5">
      {/* Full Name */}
      <div className="space-y-1.5">
        <Label htmlFor="fullName" className="text-xs font-bold text-foreground">
          Full name
        </Label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            placeholder="e.g. Eleanor Vance"
            required
            className="h-11 rounded-2xl pl-10 pr-4 text-xs bg-muted/20 border-border/80 focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/20 shadow-2xs font-medium"
          />
        </div>
      </div>

      {/* Email */}
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
            placeholder="e.g. eleanor.vance@example.com"
            required
            className="h-11 rounded-2xl pl-10 pr-4 text-xs bg-muted/20 border-border/80 focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/20 shadow-2xs font-medium"
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-xs font-bold text-foreground">
          Password
        </Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            minLength={8}
            placeholder="At least 8 characters..."
            required
            className="h-11 rounded-2xl pl-10 pr-10 text-xs bg-muted/20 border-border/80 focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/20 shadow-2xs font-mono placeholder:font-sans"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {/* Error */}
      {state.error && (
        <div role="alert" className="rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-xs font-semibold text-destructive">
          {state.error}
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="w-full gap-2 rounded-2xl bg-gradient-to-r from-[#0B3B36] via-[#0D4D46] to-[#0B3B36] hover:opacity-95 text-white shadow-lg shadow-[#0B3B36]/20 font-bold text-xs h-11.5 cursor-pointer transition-all hover:scale-[1.005]"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
        <span>Create Account</span>
      </Button>

      {/* Sign In Link */}
      <p className="text-center text-xs text-muted-foreground pt-2">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-primary hover:underline">
          Sign in &rarr;
        </Link>
      </p>
    </form>
  );
}
