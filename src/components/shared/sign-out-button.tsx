"use client";

import * as React from "react";
import { Loader2, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/server/auth";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const [pending, setPending] = React.useState(false);

  async function handleSignOut() {
    if (pending) return;

    setPending(true);

    try {
      const result = await signOutAction();
      if (result.error) {
        setPending(false);
        return;
      }

      window.location.replace("/");
    } catch {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size={compact ? "icon-sm" : "sm"}
      className="gap-2"
      aria-label="Sign out"
      title="Sign out"
      disabled={pending}
      onClick={handleSignOut}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
      {!compact && (pending ? "Signing out..." : "Sign out")}
    </Button>
  );
}
