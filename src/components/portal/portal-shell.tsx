"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  HeartPulse,
  LayoutDashboard,
  Menu,
  MessageCircleQuestion,
  Plus,
  ShieldCheck,
  Smile,
  UserRound,
  X,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { Button, ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/portal/dashboard", label: "Care overview", icon: LayoutDashboard },
  { href: "/portal/appointments", label: "My visits", icon: CalendarDays },
  { href: "/portal/appointments/book", label: "Book an appointment", icon: Plus },
  { href: "/portal/odontogram", label: "My dental care", icon: Smile },
  { href: "/portal/profile", label: "Health profile", icon: UserRound },
] as const;

interface PortalShellProps {
  profile: { full_name: string; email: string };
  patientReference: string | null;
  registered: boolean;
  children: React.ReactNode;
}

function isActive(pathname: string, href: string) {
  if (href === "/portal/dashboard") return pathname === href;
  if (href === "/portal/appointments/book") return pathname === href;
  if (href === "/portal/appointments") {
    return pathname.startsWith(href) && pathname !== "/portal/appointments/book";
  }
  return pathname.startsWith(href);
}

function PortalNavigation({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Patient portal" className="space-y-1">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center justify-between rounded-2xl px-3 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200",
              active
                ? "bg-gradient-to-r from-primary to-primary-hover text-primary-foreground font-bold shadow-md shadow-primary/20 ring-1 ring-primary/30"
                : "text-text-secondary hover:bg-background-subtle/90 hover:text-foreground",
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={cn(
                  "flex size-8.5 shrink-0 items-center justify-center rounded-xl transition-all duration-200 shadow-2xs",
                  active
                    ? "bg-white/20 text-white shadow-inner"
                    : "bg-background-subtle text-text-muted group-hover:bg-primary-soft group-hover:text-primary group-hover:scale-105",
                )}
              >
                <item.icon className="size-4" />
              </span>
              <span className="truncate">{item.label}</span>
            </div>

            {active && (
              <span className="size-1.5 rounded-full bg-white/80 shadow-xs mr-0.5 shrink-0" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function PortalShell({ profile, patientReference, registered, children }: PortalShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const initials = profile.full_name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background-subtle text-foreground">
      {/* ── DESKTOP CLASSY FROSTED SIDEBAR ── */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden h-screen w-[288px] flex-col border-r border-border/80 bg-surface/95 px-4.5 py-5 backdrop-blur-2xl shadow-xl lg:flex overflow-hidden">
        {/* Soft Ambient Glow inside Sidebar */}
        <div className="pointer-events-none absolute -top-16 -left-16 size-52 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 size-52 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex flex-col min-h-0 flex-1">
            {/* Logo / Brand */}
            <Link href="/portal/dashboard" className="flex items-center gap-3.5 px-2 py-1 group shrink-0">
              <span className="relative flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary to-primary-hover text-primary-foreground shadow-lg shadow-primary/25 ring-2 ring-primary/15 group-hover:scale-105 transition-transform duration-300">
                <HeartPulse className="size-5.5" />
                <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-surface bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
              </span>
              <div className="min-w-0">
                <span className="block font-heading text-lg font-extrabold tracking-tight text-foreground group-hover:text-primary transition-colors leading-tight">
                  Clinic Care
                </span>
                <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-primary leading-tight">
                  Patient Sanctuary
                </span>
              </div>
            </Link>

            {/* Section Heading */}
            <div className="mt-6 px-3 flex items-center justify-between shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">My care</p>
            </div>

            {/* Nav List */}
            <div className="mt-2 flex-1 overflow-y-auto pr-1">
              <PortalNavigation pathname={pathname} />
            </div>
          </div>

          <div className="space-y-3 pt-3 shrink-0">
            {/* Privacy & Workspace Badge */}
            <div className="rounded-2xl border border-border/70 bg-background-subtle/70 backdrop-blur-md p-3.5 space-y-1 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <span className="flex size-5 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="size-3.5" />
                </span>
                Private health workspace
              </div>
              <p className="text-[11px] leading-relaxed text-text-muted">
                Your clinical and billing records are visible only to you and authorised clinic staff.
              </p>
            </div>

            {/* User Profile Card */}
            <div className="rounded-[22px] border border-border/80 bg-surface/90 backdrop-blur-md p-3 shadow-xs transition-all hover:border-primary/30">
              <div className="flex items-center gap-3">
                <span className="flex size-9.5 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-hover font-serif text-xs font-extrabold text-primary-foreground shadow-md shadow-primary/20 ring-2 ring-primary/10">
                  {initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-foreground">{profile.full_name}</p>
                  <p className="truncate text-[10px] font-mono font-semibold text-primary">
                    {patientReference ?? (registered ? "Patient account" : "Registration pending")}
                  </p>
                </div>
                <SignOutButton compact />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MOBILE DRAWER NAVIGATION ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-secondary/50 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(88vw,320px)] flex-col border-r border-border/80 bg-surface/95 backdrop-blur-2xl p-5 shadow-2xl overflow-hidden">
            {/* Ambient Lighting */}
            <div className="pointer-events-none absolute -top-16 -left-16 size-52 rounded-full bg-primary/15 blur-3xl" />

            <div className="relative z-10 flex items-center justify-between">
              <Link href="/portal/dashboard" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
                <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-hover text-primary-foreground shadow-md shadow-primary/20">
                  <HeartPulse className="size-5.5" />
                </span>
                <div>
                  <span className="font-heading text-lg font-extrabold text-foreground">Clinic Care</span>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                    Patient Sanctuary
                  </span>
                </div>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="Close menu" className="rounded-xl">
                <X className="size-5" />
              </Button>
            </div>

            <div className="relative z-10 mt-6 flex-1 overflow-y-auto">
              <PortalNavigation pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </div>

            <div className="relative z-10 mt-4 rounded-[22px] border border-border/80 bg-background-subtle/80 p-3.5 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="flex size-9.5 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-hover font-serif text-xs font-extrabold text-primary-foreground shadow-md shadow-primary/20">
                  {initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground truncate">{profile.full_name}</p>
                  <p className="text-[10px] font-mono font-semibold text-primary truncate">
                    {patientReference ?? "Patient portal"}
                  </p>
                </div>
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-border/60">
                <SignOutButton />
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ── MAIN CONTENT WORKSPACE ── */}
      <div className="relative min-h-screen lg:pl-[288px]">
        {/* Full Main Patient Section Sanctuary Background Image (High Visibility) */}
        <div
          className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-60 dark:opacity-30 lg:left-[288px]"
          style={{ backgroundImage: "url('/marketing/portal_sanctuary_bg.jpg')" }}
        />
        {/* Soft, Light Glass Wash for Crisp Text Contrast */}
        <div className="pointer-events-none fixed inset-0 z-0 bg-background/30 dark:bg-background/60 backdrop-blur-[0.5px] lg:left-[288px]" />

        {/* TOP BAR */}
        <header className="sticky top-0 z-30 flex h-[72px] items-center border-b border-border/70 bg-background/70 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 lg:hidden rounded-xl"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Personal Care Sanctuary</p>
            <p className="truncate text-xs text-text-muted sm:text-sm">Calm, gentle & private dental care</p>
          </div>
          <div className="flex items-center gap-2">
            <ButtonLink href="/contact" variant="ghost" className="hidden gap-2 sm:inline-flex rounded-xl">
              <MessageCircleQuestion className="size-4" />
              Help
            </ButtonLink>
            <ThemeToggle />
            <ButtonLink
              href={registered ? "/portal/appointments/book" : "/portal/register"}
              className="gap-2 rounded-2xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 h-10 px-4"
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">{registered ? "Book an appointment" : "Register"}</span>
            </ButtonLink>
          </div>
        </header>

        <main className="relative z-10 mx-auto w-full max-w-[1480px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
