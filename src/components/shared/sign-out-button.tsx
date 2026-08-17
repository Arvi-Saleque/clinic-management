"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/server/auth";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  return (
    <form action={signOutAction}>
      <Button
        type="submit"
        variant="ghost"
        size={compact ? "icon-sm" : "sm"}
        className="gap-2"
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut className="size-4" />
        {!compact && "Sign out"}
      </Button>
    </form>
  );
}
