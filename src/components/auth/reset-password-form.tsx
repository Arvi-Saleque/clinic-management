"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowRight, Eye, EyeOff, Loader2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordAction, type AuthActionState } from "@/lib/server/auth";

const initialState: AuthActionState = { error: null };

export function ResetPasswordForm({ returnTo }: { returnTo?: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4.5">
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-xs font-bold text-foreground">
          New password
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
        <span>Update Password</span>
      </Button>

      <p className="text-center text-xs text-muted-foreground pt-2">
        <Link href="/login" className="font-bold text-primary hover:underline">
          Back to sign in &rarr;
        </Link>
      </p>
    </form>
  );
}
