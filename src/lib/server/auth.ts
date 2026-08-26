"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signUpSchema,
} from "@/lib/validation/auth";

export type AuthActionState = { error: string | null; message?: string; redirectTo?: string };
export type BookingAuthActionState = AuthActionState & {
  authenticated?: boolean;
  registered?: boolean;
  verificationRequired?: boolean;
  email?: string;
  fullName?: string;
};

function firstIssueMessage(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Invalid input";
}

async function getRequestOrigin() {
  const requestHeaders = await headers();
  const explicitOrigin = requestHeaders.get("origin");
  if (explicitOrigin) return explicitOrigin;

  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host?.includes("localhost") ? "http" : "https");
  return host ? `${protocol}://${host}` : "http://localhost:3000";
}

function getAuthCallbackUrl(origin: string, next: string) {
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", next);
  return callbackUrl.toString();
}

// Public demo aliases keep the UK-facing account list coherent while preserving
// the existing Supabase demo users and their credentials.
const DEMO_LOGIN_ALIASES: Record<string, string> = {
  "charlotte.hughes.demo@cliniccare.test": "nadia.islam.demo@cliniccare.test",
  "oliver.bennett.demo@cliniccare.test": "rafi.ahmed.demo@cliniccare.test",
  "george.carter.demo@cliniccare.test": "tariq.hasan.demo@cliniccare.test",
  "alice.morgan.demo@cliniccare.test": "maya.lin.demo@cliniccare.test",
  "henry.collins.demo@cliniccare.test": "farhan.chowdhury.demo@cliniccare.test",
  "william.foster.demo@cliniccare.test": "admin.demo@cliniccare.test",
  "eleanor.brooks.demo@cliniccare.test": "reception.demo@cliniccare.test",
  "daniel.harper.demo@cliniccare.test": "zubair.patient.demo@cliniccare.test",
  "lucy.walker.demo@cliniccare.test": "fatima.patient.demo@cliniccare.test",
  "thomas.reed.demo@cliniccare.test": "aarav.patient.demo@cliniccare.test",
};

function resolveDemoLoginEmail(email: string) {
  const normalised = email.trim().toLowerCase();
  return DEMO_LOGIN_ALIASES[normalised] ?? normalised;
}

export async function signInAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const supabase = await createClient();
  const { error, data } = await supabase.auth.signInWithPassword({
    ...parsed.data,
    email: resolveDemoLoginEmail(parsed.data.email),
  });
  if (error) return { error: error.message };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  return {
    error: null,
    redirectTo: profile?.role === "patient" ? "/portal/dashboard" : "/dashboard",
  };
}

export async function signUpAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const origin = await getRequestOrigin();
  const supabase = await createClient();
  const { error, data } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: getAuthCallbackUrl(origin, "/portal/register"),
    },
  });
  if (error) return { error: error.message };

  if (!data.session) {
    return { error: null, message: "Check your email to confirm your account before signing in." };
  }

  redirect("/portal/register");
}

export async function signOutAction() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  return { error: error?.message ?? null };
}

export async function forgotPasswordAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const origin = await getRequestOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: getAuthCallbackUrl(origin, "/reset-password"),
  });
  if (error) return { error: error.message };

  return { error: null, message: "If that email has an account, a reset link is on its way." };
}

export async function resetPasswordAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };

  const requestedReturn = formData.get("returnTo");
  const returnTo =
    typeof requestedReturn === "string" && requestedReturn.startsWith("/") && !requestedReturn.startsWith("//")
      ? requestedReturn
      : "/login";
  redirect(returnTo);
}

/** Inline patient sign-in used by the public booking wizard. It never
 * redirects, so the selected service/doctor/date/time remains mounted. */
export async function signInForBookingAction(
  _prev: BookingAuthActionState,
  formData: FormData,
): Promise<BookingAuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const supabase = await createClient();
  const { error, data } = await supabase.auth.signInWithPassword({
    ...parsed.data,
    email: resolveDemoLoginEmail(parsed.data.email),
  });
  if (error) return { error: error.message };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profile?.role !== "patient") {
    await supabase.auth.signOut();
    return { error: "Please sign in with a patient account to book an appointment." };
  }

  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("profile_id", data.user.id)
    .maybeSingle();

  return {
    error: null,
    authenticated: true,
    registered: Boolean(patient),
    email: parsed.data.email,
    fullName: profile.full_name,
  };
}

/** Inline patient sign-up used by the public booking wizard. When email
 * confirmation is enabled, the callback returns to /book and resumes the
 * preserved draft instead of losing the booking journey. */
export async function signUpForBookingAction(
  _prev: BookingAuthActionState,
  formData: FormData,
): Promise<BookingAuthActionState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  if (formData.get("password") !== formData.get("confirmPassword")) {
    return { error: "Passwords do not match." };
  }
  if (formData.get("consent") !== "on") {
    return { error: "Please accept the privacy terms to create your account." };
  }

  const origin = await getRequestOrigin();
  const supabase = await createClient();
  const { error, data } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: getAuthCallbackUrl(origin, "/book?booking=1&resume=account"),
    },
  });
  if (error) return { error: error.message };

  if (!data.session) {
    return {
      error: null,
      message: "Check your email to verify your account. Your appointment choices are saved and will resume when you return.",
      verificationRequired: true,
      email: parsed.data.email,
      fullName: parsed.data.fullName,
    };
  }

  return {
    error: null,
    authenticated: true,
    registered: false,
    email: data.user?.email ?? parsed.data.email,
    fullName: parsed.data.fullName,
  };
}

export async function forgotPasswordForBookingAction(
  _prev: BookingAuthActionState,
  formData: FormData,
): Promise<BookingAuthActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const origin = await getRequestOrigin();
  const supabase = await createClient();
  const bookingReturn = "/book?booking=1&resume=account";
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: getAuthCallbackUrl(origin, `/reset-password?returnTo=${encodeURIComponent(bookingReturn)}`),
  });
  if (error) return { error: error.message };

  return {
    error: null,
    message: "If that email has an account, a secure reset link is on its way.",
    email: parsed.data.email,
  };
}
