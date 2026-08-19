"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { ChevronDown, ChevronUp, Loader2, ShieldCheck, Stethoscope, UserCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAction, type AuthActionState } from "@/lib/server/auth";

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
    name: "Dr. Nadia Islam",
    role: "Dentist",
    specialty: "Cosmetic & Restorative",
    email: "nadia.islam.demo@cliniccare.test",
    badge: "Cosmetic",
    category: "doctor",
  },
  {
    name: "Dr. Rafi Ahmed",
    role: "Dentist",
    specialty: "Oral Surgery & Implants",
    email: "rafi.ahmed.demo@cliniccare.test",
    badge: "Implants",
    category: "doctor",
  },
  {
    name: "Dr. Emily White",
    role: "Dentist",
    specialty: "Specialist Orthodontist",
    email: "emily.white.demo@cliniccare.test",
    badge: "Orthodontics",
    category: "doctor",
  },
  {
    name: "Dr. Tariq Hasan",
    role: "Dentist",
    specialty: "Consultant Endodontist",
    email: "tariq.hasan.demo@cliniccare.test",
    badge: "Endodontics",
    category: "doctor",
  },
  {
    name: "Dr. Sarah Jenkins",
    role: "Dentist",
    specialty: "Periodontist & Gum Health",
    email: "sarah.jenkins.demo@cliniccare.test",
    badge: "Periodontics",
    category: "doctor",
  },
  {
    name: "Dr. Marcus Vance",
    role: "Dentist",
    specialty: "Prosthodontics & Crowns",
    email: "marcus.vance.demo@cliniccare.test",
    badge: "Prosthodontics",
    category: "doctor",
  },
  {
    name: "Dr. Maya Lin",
    role: "Dentist",
    specialty: "Paediatric Dentist",
    email: "maya.lin.demo@cliniccare.test",
    badge: "Paediatric",
    category: "doctor",
  },
  {
    name: "Dr. Farhan Chowdhury",
    role: "Dentist",
    specialty: "General & Preventative",
    email: "farhan.chowdhury.demo@cliniccare.test",
    badge: "General",
    category: "doctor",
  },
];

const DEMO_STAFF: DemoAccount[] = [
  {
    name: "Dr. Karim Mansoor",
    role: "Owner Admin",
    specialty: "Clinic Director & Practice Management",
    email: "admin.demo@cliniccare.test",
    badge: "Admin",
    category: "staff",
  },
  {
    name: "Nusrat Jahan",
    role: "Receptionist",
    specialty: "Front Desk & Patient Scheduling",
    email: "reception.demo@cliniccare.test",
    badge: "Front Desk",
    category: "staff",
  },
];

const DEMO_PATIENTS: DemoAccount[] = [
  {
    name: "Zubair Ahmed",
    role: "Patient",
    specialty: "Rich History (Veneers, Rx, Odontogram)",
    email: "zubair.patient.demo@cliniccare.test",
    badge: "Full History",
    category: "patient",
  },
  {
    name: "Fatima Rahman",
    role: "Patient",
    specialty: "Moderate History (Periodontal, Chart)",
    email: "fatima.patient.demo@cliniccare.test",
    badge: "Active Care",
    category: "patient",
  },
  {
    name: "Aarav Patel",
    role: "Patient",
    specialty: "New Patient (Orthodontic Consult)",
    email: "aarav.patient.demo@cliniccare.test",
    badge: "New Intake",
    category: "patient",
  },
];

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signInAction, initialState);
  const [activeTab, setActiveTab] = useState<"doctors" | "staff" | "patients">("doctors");
  const [isExpanded, setIsExpanded] = useState(false);
  const emailRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);

  function fillEmail(email: string) {
    if (emailRef.current) {
      emailRef.current.value = email;
    }
    if (passwordRef.current) {
      passwordRef.current.value = "ClinicDemo#2026";
    }
  }

  const currentList =
    activeTab === "doctors"
      ? DEMO_CLINICIANS
      : activeTab === "staff"
        ? DEMO_STAFF
        : DEMO_PATIENTS;

  const displayList = isExpanded ? currentList : currentList.slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Demo Accounts Panel */}
      <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground">Demo Accounts</p>
          <span className="text-[10px] text-muted-foreground">Select to auto-fill</span>
        </div>

        {/* Tab switcher */}
        <div className="mt-2.5 grid grid-cols-3 gap-1 rounded-lg bg-muted/80 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("doctors")}
            className={`flex items-center justify-center gap-1 rounded-md py-1 font-medium transition-all ${
              activeTab === "doctors"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Stethoscope className="size-3" />
            <span>Doctors ({DEMO_CLINICIANS.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("staff")}
            className={`flex items-center justify-center gap-1 rounded-md py-1 font-medium transition-all ${
              activeTab === "staff"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShieldCheck className="size-3" />
            <span>Staff ({DEMO_STAFF.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("patients")}
            className={`flex items-center justify-center gap-1 rounded-md py-1 font-medium transition-all ${
              activeTab === "patients"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserCheck className="size-3" />
            <span>Patients ({DEMO_PATIENTS.length})</span>
          </button>
        </div>

        {/* Account list */}
        <div className="mt-2 space-y-1.5">
          {displayList.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => fillEmail(account.email)}
              className="flex w-full items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/90 px-2.5 py-1.5 text-left text-xs transition-colors hover:border-primary hover:bg-muted"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-medium text-foreground">{account.name}</span>
                  <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.2 text-[10px] font-medium text-primary">
                    {account.badge}
                  </span>
                </div>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {account.specialty || account.role} · <span className="font-mono">{account.email}</span>
                </span>
              </div>
              <span className="shrink-0 rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-primary hover:text-primary-foreground">
                Use
              </span>
            </button>
          ))}
        </div>

        {currentList.length > 3 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 flex w-full items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="size-3" />
                <span>Show fewer accounts</span>
              </>
            ) : (
              <>
                <ChevronDown className="size-3" />
                <span>View all {currentList.length} accounts</span>
              </>
            )}
          </button>
        )}
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input ref={emailRef} id="email" name="email" type="email" autoComplete="email" placeholder="e.g. nadia.islam.demo@cliniccare.test" required />
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
            placeholder="••••••••••••"
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

