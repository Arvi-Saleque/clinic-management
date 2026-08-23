"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState, useState, useRef } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAction, type AuthActionState } from "@/lib/server/auth";
import { cn } from "@/lib/utils";

const initialState: AuthActionState = { error: null };

interface DemoAccount {
  name: string;
  role: string;
  specialty?: string;
  email: string;
  badge: string;
  category: "doctor" | "staff" | "patient";
}

const DEMO_CLINICIANS: DemoAccount[] = [
  {
    name: "Dr Charlotte Hughes",
    role: "Dentist",
    specialty: "Cosmetic & Restorative",
    email: "charlotte.hughes.demo@cliniccare.test",
    badge: "Cosmetic",
    category: "doctor",
  },
  {
    name: "Dr Oliver Bennett",
    role: "Dentist",
    specialty: "Oral Surgery & Implants",
    email: "oliver.bennett.demo@cliniccare.test",
    badge: "Implants",
    category: "doctor",
  },
  {
    name: "Dr Emily White",
    role: "Dentist",
    specialty: "Specialist Orthodontist",
    email: "emily.white.demo@cliniccare.test",
    badge: "Orthodontics",
    category: "doctor",
  },
  {
    name: "Dr George Carter",
    role: "Dentist",
    specialty: "Consultant Endodontist",
    email: "george.carter.demo@cliniccare.test",
    badge: "Endodontics",
    category: "doctor",
  },
  {
    name: "Dr Sarah Jenkins",
    role: "Dentist",
    specialty: "Periodontist & Gum Health",
    email: "sarah.jenkins.demo@cliniccare.test",
    badge: "Periodontics",
    category: "doctor",
  },
  {
    name: "Dr Marcus Vance",
    role: "Dentist",
    specialty: "Prosthodontics & Crowns",
    email: "marcus.vance.demo@cliniccare.test",
    badge: "Prosthodontics",
    category: "doctor",
  },
  {
    name: "Dr Alice Morgan",
    role: "Dentist",
    specialty: "Paediatric Dentist",
    email: "alice.morgan.demo@cliniccare.test",
    badge: "Paediatric",
    category: "doctor",
  },
  {
    name: "Dr Henry Collins",
    role: "Dentist",
    specialty: "General & Preventative",
    email: "henry.collins.demo@cliniccare.test",
    badge: "General",
    category: "doctor",
  },
];

const DEMO_STAFF: DemoAccount[] = [
  {
    name: "Dr William Foster",
    role: "Owner Admin",
    specialty: "Clinic Director & Practice Management",
    email: "william.foster.demo@cliniccare.test",
    badge: "Admin",
    category: "staff",
  },
  {
    name: "Eleanor Brooks",
    role: "Receptionist",
    specialty: "Front Desk & Patient Scheduling",
    email: "eleanor.brooks.demo@cliniccare.test",
    badge: "Receptionist",
    category: "staff",
  },
];

const DEMO_PATIENTS: DemoAccount[] = [
  {
    name: "Daniel Harper",
    role: "Patient",
    specialty: "Full History (Veneers, Prescriptions, Odontogram)",
    email: "daniel.harper.demo@cliniccare.test",
    badge: "Full History",
    category: "patient",
  },
  {
    name: "Lucy Walker",
    role: "Patient",
    specialty: "Active Care (Periodontal, Chart, Invoices)",
    email: "lucy.walker.demo@cliniccare.test",
    badge: "Active Care",
    category: "patient",
  },
  {
    name: "Thomas Reed",
    role: "Patient",
    specialty: "New Patient (Orthodontic Consult)",
    email: "thomas.reed.demo@cliniccare.test",
    badge: "New Intake",
    category: "patient",
  },
];

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signInAction, initialState);
  const [activeTab, setActiveTab] = useState<"doctors" | "staff" | "patients">("doctors");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [filledEmail, setFilledEmail] = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  function fillEmail(email: string) {
    if (emailRef.current) {
      emailRef.current.value = email;
      emailRef.current.focus();
    }
    if (passwordRef.current) {
      passwordRef.current.value = "ClinicDemo#2026";
    }
    setFilledEmail(email);
    setTimeout(() => setFilledEmail(null), 2500);
  }

  const currentList =
    activeTab === "doctors"
      ? DEMO_CLINICIANS
      : activeTab === "staff"
        ? DEMO_STAFF
        : DEMO_PATIENTS;

  const displayList = isExpanded ? currentList : currentList.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* ── DEMO ACCOUNTS QUICK-FILL STATION ── */}
      <div className="rounded-3xl border border-white/15 bg-white/5 p-4 sm:p-4.5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="flex size-5 items-center justify-center rounded-md bg-[#9CB080]/20 text-[#9CB080]">
              <Sparkles className="size-3" />
            </span>
            <p className="text-xs font-bold uppercase tracking-wider text-white">Demo Accounts</p>
          </div>
          <span className="text-[11px] font-medium text-white/70">Click to auto-fill</span>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-black/40 border border-white/10 p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("doctors")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-xl py-1.5 font-bold transition-all cursor-pointer",
              activeTab === "doctors"
                ? "bg-[#0B3B36] text-white shadow-md border border-[#9CB080]/30"
                : "text-white/70 hover:text-white hover:bg-white/5",
            )}
          >
            <Stethoscope className="size-3 text-[#9CB080]" />
            <span>Doctors ({DEMO_CLINICIANS.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("staff")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-xl py-1.5 font-bold transition-all cursor-pointer",
              activeTab === "staff"
                ? "bg-[#0B3B36] text-white shadow-md border border-[#9CB080]/30"
                : "text-white/70 hover:text-white hover:bg-white/5",
            )}
          >
            <ShieldCheck className="size-3 text-[#9CB080]" />
            <span>Staff ({DEMO_STAFF.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("patients")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-xl py-1.5 font-bold transition-all cursor-pointer",
              activeTab === "patients"
                ? "bg-[#0B3B36] text-white shadow-md border border-[#9CB080]/30"
                : "text-white/70 hover:text-white hover:bg-white/5",
            )}
          >
            <UserCheck className="size-3 text-[#9CB080]" />
            <span>Patients ({DEMO_PATIENTS.length})</span>
          </button>
        </div>

        {/* Account list */}
        <div className="space-y-1.5">
          {displayList.map((account) => {
            const isJustFilled = filledEmail === account.email;
            return (
              <button
                key={account.email}
                type="button"
                onClick={() => fillEmail(account.email)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-2xl border p-2.5 sm:px-3 text-left text-xs transition-all cursor-pointer group",
                  isJustFilled
                    ? "border-[#9CB080] bg-[#0B3B36]/60 shadow-md"
                    : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10 shadow-2xs",
                )}
              >
                <div className="min-w-0 flex-1 flex items-center gap-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-[#0B3B36] text-[#9CB080] font-black text-[10px] border border-[#9CB080]/20">
                    {account.name
                      .replace(/^Dr\.?\s+/, "")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-bold text-white group-hover:text-[#9CB080] transition-colors">
                        {account.name}
                      </span>
                      <span className="shrink-0 rounded-md bg-[#9CB080]/20 border border-[#9CB080]/30 px-1.5 py-0.5 text-[9px] font-bold text-[#9CB080]">
                        {account.badge}
                      </span>
                    </div>
                    <span className="block truncate text-[11px] text-white/70 font-medium">
                      {account.specialty || account.role} · <span className="font-mono text-[10px] text-white/80">{account.email}</span>
                    </span>
                  </div>
                </div>

                <span
                  className={cn(
                    "inline-flex items-center gap-1 shrink-0 rounded-xl px-2.5 py-1 text-[11px] font-bold transition-all shadow-2xs",
                    isJustFilled
                      ? "bg-[#9CB080] text-[#0B3B36]"
                      : "border border-white/20 bg-white/10 text-white group-hover:bg-[#0B3B36] group-hover:text-white group-hover:border-[#9CB080]/50",
                  )}
                >
                  {isJustFilled ? (
                    <>
                      <Check className="size-3 font-bold" />
                      <span>Filled</span>
                    </>
                  ) : (
                    <span>Use</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {currentList.length > 3 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="pt-1 flex w-full items-center justify-center gap-1.5 text-xs font-bold text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="size-3.5 text-[#9CB080]" />
                <span>Show fewer accounts</span>
              </>
            ) : (
              <>
                <ChevronDown className="size-3.5 text-[#9CB080]" />
                <span>View all {currentList.length} accounts</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* ── CREDENTIALS SIGN IN FORM ── */}
      <form action={formAction} className="space-y-4.5">
        {/* Email Field */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-bold text-white">
            Email address
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/60" />
            <Input
              ref={emailRef}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="e.g. charlotte.hughes.demo@cliniccare.test"
              required
              className="h-11 rounded-2xl pl-10 pr-4 text-xs bg-black/40 border-white/20 text-white placeholder:text-white/40 focus-visible:bg-black/60 focus-visible:ring-2 focus-visible:ring-[#9CB080]/40 shadow-2xs font-medium"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-bold text-white">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-[#9CB080] hover:underline hover:text-white transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/60" />
            <Input
              ref={passwordRef}
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••••••"
              required
              className="h-11 rounded-2xl pl-10 pr-10 text-xs bg-black/40 border-white/20 text-white placeholder:text-white/40 focus-visible:bg-black/60 focus-visible:ring-2 focus-visible:ring-[#9CB080]/40 shadow-2xs font-mono placeholder:font-sans"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 size-5 text-white/60 hover:text-white cursor-pointer flex items-center justify-center"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {state?.error && (
          <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/20 px-4 py-3 text-xs font-semibold text-red-200">
            {state.error}
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="w-full gap-2 rounded-2xl bg-[#0B3B36] hover:bg-[#0D4D46] border border-[#9CB080]/40 text-white shadow-xl shadow-black/40 font-bold text-xs h-11.5 cursor-pointer transition-all hover:scale-[1.005] active:scale-[0.99]"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <span>Sign In to Clinic Care</span>
              <ArrowRight className="size-4 text-[#9CB080]" />
            </>
          )}
        </Button>

        {/* Create Account Link Strip */}
        <div className="pt-2">
          <Link
            href="/sign-up"
            className="flex items-center justify-center gap-1.5 w-full rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30 px-4 py-3 text-xs font-bold text-white transition-all shadow-2xs"
          >
            <span>New patient?</span>
            <span className="text-[#9CB080] hover:underline">Create your account &rarr;</span>
          </Link>
        </div>
      </form>
    </div>
  );
}
