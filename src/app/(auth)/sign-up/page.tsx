import type { Metadata } from "next";
import { UserPlus } from "lucide-react";

import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = { title: "Create patient account · Clinic Care" };

export default function SignUpPage() {
  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xl p-6 sm:p-8 lg:p-9 shadow-xl space-y-6">
      <div className="space-y-1.5 border-b border-border/60 pb-4 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
          <UserPlus className="size-3.5" />
          <span>Patient Registration</span>
        </div>
        <h2 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Create your patient account
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Book specialist dental appointments and access your health records online 24/7.
        </p>
      </div>

      <SignUpForm />
    </div>
  );
}
