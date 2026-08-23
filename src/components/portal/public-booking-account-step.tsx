"use client";

import * as React from "react";
import { useActionState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User,
  UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  forgotPasswordForBookingAction,
  signInForBookingAction,
  signUpForBookingAction,
  type BookingAuthActionState,
} from "@/lib/server/auth";
import { cn } from "@/lib/utils";

const initialState: BookingAuthActionState = { error: null };

export interface PublicBookingSummary {
  service: string;
  doctor: string;
  date: string;
  time: string;
  fee: string;
}

export interface BookingAccountResult {
  registered: boolean;
  email?: string;
  fullName?: string;
}

export function PublicBookingAccountStep({
  summary,
  onAuthenticated,
}: {
  summary: PublicBookingSummary;
  onAuthenticated: (result: BookingAccountResult) => void;
}) {
  const [mode, setMode] = React.useState<"signin" | "signup" | "forgot">("signin");
  const [showSignInPassword, setShowSignInPassword] = React.useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = React.useState(false);
  const [signInState, signInAction, signingIn] = useActionState(signInForBookingAction, initialState);
  const [signUpState, signUpAction, signingUp] = useActionState(signUpForBookingAction, initialState);
  const [forgotState, forgotAction, sendingReset] = useActionState(forgotPasswordForBookingAction, initialState);
  const handledAuth = React.useRef<string | null>(null);

  React.useEffect(() => {
    const state = signInState.authenticated ? signInState : signUpState.authenticated ? signUpState : null;
    if (!state?.authenticated) return;

    const identity = `${state.email ?? "patient"}:${state.registered ? "registered" : "new"}`;
    if (handledAuth.current === identity) return;
    handledAuth.current = identity;
    onAuthenticated({
      registered: Boolean(state.registered),
      email: state.email,
      fullName: state.fullName,
    });
  }, [signInState, signUpState, onAuthenticated]);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(280px,0.88fr)]">
      <section className="order-2 rounded-3xl border border-border/80 bg-surface p-5 shadow-sm sm:p-7 lg:order-1">
        <div className="mb-6 space-y-2 border-b border-border/70 pb-5">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            <ShieldCheck className="size-4" /> Secure account step
          </div>
          <h2 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
            One last step to confirm
          </h2>
          <p className="max-w-xl text-sm leading-6 text-text-secondary">
            Sign in or create a patient account. Your appointment choices stay exactly as selected while we securely connect the visit to your care record.
          </p>
        </div>

        {mode !== "forgot" && (
          <div className="mb-6 grid grid-cols-2 rounded-2xl border border-border/80 bg-background-subtle p-1">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={cn(
                "rounded-xl px-4 py-2.5 text-xs font-bold transition-all",
                mode === "signin" ? "bg-primary text-primary-foreground shadow-md" : "text-text-secondary hover:text-foreground",
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={cn(
                "rounded-xl px-4 py-2.5 text-xs font-bold transition-all",
                mode === "signup" ? "bg-primary text-primary-foreground shadow-md" : "text-text-secondary hover:text-foreground",
              )}
            >
              Create Account
            </button>
          </div>
        )}

        {mode === "signin" && (
          <form action={signInAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="booking-signin-email" className="text-xs font-bold">Email address</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
                <Input
                  id="booking-signin-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  className="h-12 rounded-2xl bg-background-subtle pl-10 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="booking-signin-password" className="text-xs font-bold">Password</Label>
                <button type="button" onClick={() => setMode("forgot")} className="text-xs font-bold text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
                <Input
                  id="booking-signin-password"
                  name="password"
                  type={showSignInPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="h-12 rounded-2xl bg-background-subtle pl-10 pr-11 text-sm"
                />
                <button
                  type="button"
                  aria-label={showSignInPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowSignInPassword((value) => !value)}
                  className="absolute right-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center text-text-muted hover:text-foreground"
                >
                  {showSignInPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {signInState.error && <AuthAlert tone="error">{signInState.error}</AuthAlert>}

            <Button type="submit" size="lg" disabled={signingIn} className="h-12 w-full rounded-2xl bg-primary font-bold text-primary-foreground hover:bg-primary-hover">
              {signingIn ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
              Sign in & confirm appointment
            </Button>
          </form>
        )}

        {mode === "signup" && (
          signUpState.verificationRequired ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-600">
                <Mail className="size-6" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-foreground">Verify your email</h3>
                <p className="mt-2 text-sm leading-6 text-text-secondary">{signUpState.message}</p>
              </div>
              <Button type="button" variant="outline" onClick={() => setMode("signin")} className="rounded-2xl">
                <ArrowLeft className="size-4" /> I&apos;ve verified — sign in
              </Button>
            </div>
          ) : (
            <form action={signUpAction} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="booking-signup-name" className="text-xs font-bold">Full name</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
                  <Input id="booking-signup-name" name="fullName" autoComplete="name" required placeholder="Your full name" className="h-12 rounded-2xl bg-background-subtle pl-10 text-sm" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="booking-signup-email" className="text-xs font-bold">Email address</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
                  <Input id="booking-signup-email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" className="h-12 rounded-2xl bg-background-subtle pl-10 text-sm" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="booking-signup-password" className="text-xs font-bold">Password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
                    <Input id="booking-signup-password" name="password" type={showSignUpPassword ? "text" : "password"} autoComplete="new-password" minLength={8} required className="h-12 rounded-2xl bg-background-subtle pl-10 pr-10 text-sm" />
                    <button type="button" aria-label={showSignUpPassword ? "Hide password" : "Show password"} onClick={() => setShowSignUpPassword((value) => !value)} className="absolute right-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center text-text-muted hover:text-foreground">
                      {showSignUpPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="booking-signup-confirm" className="text-xs font-bold">Confirm password</Label>
                  <Input id="booking-signup-confirm" name="confirmPassword" type={showSignUpPassword ? "text" : "password"} autoComplete="new-password" minLength={8} required className="h-12 rounded-2xl bg-background-subtle text-sm" />
                </div>
              </div>

              <label className="flex items-start gap-2.5 rounded-2xl border border-border/80 bg-background-subtle p-3 text-xs leading-5 text-text-secondary">
                <input type="checkbox" name="consent" required className="mt-0.5 size-4 accent-[#075e5a]" />
                <span>I agree to the clinic&apos;s privacy policy and consent to my account being used to manage appointments and care records.</span>
              </label>

              {signUpState.error && <AuthAlert tone="error">{signUpState.error}</AuthAlert>}

              <Button type="submit" size="lg" disabled={signingUp} className="h-12 w-full rounded-2xl bg-primary font-bold text-primary-foreground hover:bg-primary-hover">
                {signingUp ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
                Create account & continue
              </Button>
            </form>
          )
        )}

        {mode === "forgot" && (
          <div className="space-y-5">
            <button type="button" onClick={() => setMode("signin")} className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
              <ArrowLeft className="size-3.5" /> Back to sign in
            </button>
            <div>
              <div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-primary-soft text-primary"><KeyRound className="size-5" /></div>
              <h3 className="font-heading text-xl font-bold text-foreground">Reset your password</h3>
              <p className="mt-1 text-sm leading-6 text-text-secondary">We&apos;ll send a secure recovery link. Your booking choices will remain saved.</p>
            </div>
            {forgotState.message ? (
              <AuthAlert tone="success">{forgotState.message}</AuthAlert>
            ) : (
              <form action={forgotAction} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="booking-forgot-email" className="text-xs font-bold">Email address</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
                    <Input id="booking-forgot-email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" className="h-12 rounded-2xl bg-background-subtle pl-10 text-sm" />
                  </div>
                </div>
                {forgotState.error && <AuthAlert tone="error">{forgotState.error}</AuthAlert>}
                <Button type="submit" size="lg" disabled={sendingReset} className="h-12 w-full rounded-2xl bg-primary font-bold text-primary-foreground hover:bg-primary-hover">
                  {sendingReset ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                  Send reset link
                </Button>
              </form>
            )}
          </div>
        )}
      </section>

      <aside className="order-1 self-start rounded-3xl border border-primary/20 bg-gradient-to-br from-primary-soft via-surface to-background-subtle p-5 shadow-sm sm:p-6 lg:order-2 lg:sticky lg:top-4">
        <div className="flex items-center gap-3 border-b border-primary/15 pb-4">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md"><CalendarCheck className="size-5" /></span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">Your selection is saved</p>
            <h3 className="font-heading text-lg font-extrabold text-foreground">Appointment summary</h3>
          </div>
        </div>
        <dl className="mt-5 space-y-4 text-sm">
          <SummaryItem label="Treatment" value={summary.service} />
          <SummaryItem label="Doctor" value={summary.doctor} />
          <SummaryItem label="Date" value={summary.date} />
          <SummaryItem label="Time" value={summary.time} />
          <div className="flex items-center justify-between gap-4 border-t border-primary/15 pt-4">
            <dt className="text-xs font-bold uppercase tracking-wider text-text-muted">Service fee</dt>
            <dd className="font-heading text-xl font-extrabold text-foreground">{summary.fee}</dd>
          </div>
        </dl>
        <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs leading-5 text-emerald-900 dark:text-emerald-200">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> The slot will be rechecked and booked only after your account is ready.
        </div>
      </aside>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{label}</dt>
      <dd className="mt-0.5 font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function AuthAlert({ children, tone }: { children: React.ReactNode; tone: "error" | "success" }) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-2xl border px-4 py-3 text-xs font-semibold leading-5",
        tone === "error"
          ? "border-destructive/25 bg-destructive/10 text-destructive"
          : "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
      )}
    >
      {children}
    </div>
  );
}
