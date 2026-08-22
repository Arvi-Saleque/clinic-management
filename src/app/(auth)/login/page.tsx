import type { Metadata } from "next";
import { Lock } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in · Clinic Care" };

export default function LoginPage() {
  return (
    <div className="w-full rounded-[32px] border border-white/20 bg-[#1E272B]/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl text-white space-y-6">
      {/* ── Box Header ── */}
      <div className="space-y-1.5 border-b border-white/10 pb-4 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#9CB080]">
          <Lock className="size-3.5" />
          <span>PORTAL LOGIN</span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Sign in to Clinic Care
        </h1>
        <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
          Staff and patients both sign in here.
        </p>
      </div>

      {/* ── Login Form & Demo Accounts Station ── */}
      <LoginForm />
    </div>
  );
}
