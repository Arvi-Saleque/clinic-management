import type { Metadata } from "next";
import { KeyRound } from "lucide-react";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Choose a new password · Clinic Care" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;
  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xl p-6 sm:p-8 lg:p-9 shadow-xl space-y-6">
      <div className="space-y-1.5 border-b border-border/60 pb-4 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
          <KeyRound className="size-3.5" />
          <span>New Credentials</span>
        </div>
        <h2 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Choose a new password
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Set a secure, modern password for your Clinic Care account.
        </p>
      </div>

      <ResetPasswordForm returnTo={returnTo} />
    </div>
  );
}
