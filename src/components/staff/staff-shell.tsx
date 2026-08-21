"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  CalendarCheck2,
  CalendarDays,
  ChevronRight,
  Command,
  LayoutDashboard,
  Menu,
  Plus,
  Receipt,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
  X,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { Button, ButtonLink } from "@/components/ui/button";
import { formatRoleLabel } from "@/lib/constants/roles";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/auth/session";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}

const RECEPTIONIST_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", shortLabel: "Dashboard", icon: LayoutDashboard },
  { href: "/appointments", label: "Appointments", shortLabel: "Appointments", icon: CalendarCheck2 },
  { href: "/patients", label: "Patients", shortLabel: "Patients", icon: Users },
  { href: "/scheduler", label: "Clinical Diary", shortLabel: "Clinical Diary", icon: CalendarDays },
  { href: "/billing/invoices", label: "Billing & Payments", shortLabel: "Billing", icon: Receipt },
];

const DENTIST_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", shortLabel: "Dashboard", icon: LayoutDashboard },
  { href: "/patients", label: "Patients", shortLabel: "Patients", icon: Users },
  { href: "/scheduler", label: "Clinical Diary", shortLabel: "Clinical Diary", icon: CalendarDays },
  { href: "/appointments", label: "Appointments", shortLabel: "Appointments", icon: CalendarCheck2 },
  { href: "/billing/invoices", label: "Billing & Payments", shortLabel: "Billing", icon: Receipt },
  { href: "/clinical/services", label: "Services & Treatments", shortLabel: "Services", icon: Stethoscope },
];

const OWNER_ADMIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", shortLabel: "Dashboard", icon: LayoutDashboard },
  { href: "/appointments", label: "Appointments", shortLabel: "Appointments", icon: CalendarCheck2 },
  { href: "/patients", label: "Patients", shortLabel: "Patients", icon: Users },
  { href: "/scheduler", label: "Clinical Diary", shortLabel: "Clinical Diary", icon: CalendarDays },
  { href: "/billing/invoices", label: "Billing & Payments", shortLabel: "Billing", icon: Receipt },
  { href: "/clinical/services", label: "Services & Treatments", shortLabel: "Services", icon: Stethoscope },
];

const ALL_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", shortLabel: "Dashboard", icon: LayoutDashboard },
  { href: "/appointments", label: "Appointments", shortLabel: "Appointments", icon: CalendarCheck2 },
  { href: "/patients", label: "Patients", shortLabel: "Patients", icon: Users },
  { href: "/scheduler", label: "Clinical Diary", shortLabel: "Clinical Diary", icon: CalendarDays },
  { href: "/billing/invoices", label: "Billing & Payments", shortLabel: "Billing", icon: Receipt },
  { href: "/clinical/services", label: "Services & Treatments", shortLabel: "Services", icon: Stethoscope },
];

function getNavForRole(role: string): NavItem[] {
  switch (role) {
    case "receptionist":
      return RECEPTIONIST_NAV;
    case "dentist":
      return DENTIST_NAV;
    case "owner_admin":
      return OWNER_ADMIN_NAV;
    default:
      return RECEPTIONIST_NAV;
  }
}

function getPageLabel(pathname: string) {
  const match = [...ALL_NAV_ITEMS].reverse().find((item) => pathname.startsWith(item.href));
  if (pathname.includes("/new")) return `New ${match?.shortLabel.toLowerCase() ?? "record"}`;
  return match?.shortLabel ?? "Clinic workspace";
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function StaffShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const visibleNav = getNavForRole(profile.role);

  const initials = profile.full_name
    .split(" ")
    .slice(0, 2)
    .map((name) => name[0])
    .join("")
    .toUpperCase();

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const query = search.trim();
    router.push(query ? `/patients?q=${encodeURIComponent(query)}` : "/patients");
  }

  const navContent = (onNavigate?: () => void) => (
    <nav aria-label="Staff clinical workspace" className="space-y-1">
      {visibleNav.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200",
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
            <Link href="/dashboard" className="flex items-center gap-3.5 px-2 py-1 group shrink-0">
              <span className="relative flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary to-primary-hover text-primary-foreground shadow-lg shadow-primary/25 ring-2 ring-primary/15 group-hover:scale-105 transition-transform duration-300">
                <Stethoscope className="size-5.5" />
                <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-surface bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
              </span>
              <div className="min-w-0">
                <span className="block font-heading text-lg font-extrabold tracking-tight text-foreground group-hover:text-primary transition-colors leading-tight">
                  Clinic Care
                </span>
                <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-primary leading-tight">
                  {formatRoleLabel(profile.role)}
                </span>
              </div>
            </Link>

            {/* Section Heading */}
            <div className="mt-6 px-3 flex items-center justify-between shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">Workspace</p>
            </div>

            {/* Nav List */}
            <div className="mt-2 flex-1 overflow-y-auto pr-1">
              {navContent()}
            </div>
          </div>

          <div className="space-y-3 pt-3 shrink-0">
            {/* Privacy & Workspace Badge */}
            <div className="rounded-2xl border border-border/70 bg-background-subtle/70 backdrop-blur-md p-3.5 space-y-1 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <span className="flex size-5 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="size-3.5" />
                </span>
                Secure clinical workspace
              </div>
              <p className="text-[11px] leading-relaxed text-text-muted">
                Role-scoped access with full HIPAA-ready clinical audit trails.
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
                    {formatRoleLabel(profile.role)}
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
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-secondary/50 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(88vw,320px)] flex-col border-r border-border/80 bg-surface/95 backdrop-blur-2xl p-5 shadow-2xl overflow-hidden">
            {/* Ambient Lighting */}
            <div className="pointer-events-none absolute -top-16 -left-16 size-52 rounded-full bg-primary/15 blur-3xl" />

            <div className="relative z-10 flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
                <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-hover text-primary-foreground shadow-md shadow-primary/20">
                  <Stethoscope className="size-5.5" />
                </span>
                <div>
                  <span className="font-heading text-lg font-extrabold text-foreground">Clinic Care</span>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                    {formatRoleLabel(profile.role)}
                  </span>
                </div>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="Close menu" className="rounded-xl">
                <X className="size-5" />
              </Button>
            </div>

            <div className="relative z-10 mt-6 flex-1 overflow-y-auto">
              {navContent(() => setMobileOpen(false))}
            </div>

            <div className="relative z-10 mt-4 rounded-[22px] border border-border/80 bg-background-subtle/80 p-3.5 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="flex size-9.5 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-hover font-serif text-xs font-extrabold text-primary-foreground shadow-md shadow-primary/20">
                  {initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground truncate">{profile.full_name}</p>
                  <p className="text-[10px] font-mono font-semibold text-primary truncate">
                    {formatRoleLabel(profile.role)}
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
        {/* Full Main Sanctuary Background Atmosphere */}
        <div
          className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-50 dark:opacity-20 lg:left-[288px]"
          style={{ backgroundImage: "url('/marketing/portal_sanctuary_bg.jpg')" }}
        />
        {/* Soft, Light Glass Wash for Crisp Text Contrast */}
        <div className="pointer-events-none fixed inset-0 z-0 bg-background/40 dark:bg-background/65 backdrop-blur-[0.5px] lg:left-[288px]" />

        {/* TOP BAR */}
        <header className="sticky top-0 z-30 flex h-[72px] items-center gap-2.5 sm:gap-3 border-b border-border/70 bg-background/70 px-4 sm:px-6 lg:px-8 backdrop-blur-xl">
          <Button
            variant="ghost"
            size="icon"
            className="mr-1 lg:hidden rounded-xl"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </Button>

          <div className="hidden min-w-36 md:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Clinical Workspace</p>
            <p className="text-sm font-extrabold tracking-tight text-foreground truncate">{getPageLabel(pathname)}</p>
          </div>

          <form
            onSubmit={submitSearch}
            className="mx-auto flex min-w-0 flex-1 max-w-[560px] items-center rounded-2xl border border-border/80 bg-surface/80 px-3 sm:px-3.5 backdrop-blur-md shadow-xs transition focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10"
          >
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-10 min-w-0 flex-1 bg-transparent px-2 text-xs sm:text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Search patient name, phone or ID…"
              aria-label="Search patients"
            />
            <span className="hidden items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground sm:flex">
              <Command className="size-3" /> K
            </span>
          </form>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" aria-label="Notifications" className="relative rounded-xl">
              <Bell className="size-4" />
              <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-background bg-emerald-500" />
            </Button>
            <ThemeToggle />
            <ButtonLink
              href="/scheduler"
              className="gap-2 rounded-2xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 h-10 px-4 hidden sm:inline-flex"
            >
              <Plus className="size-4" />
              <span>Schedule Visit</span>
            </ButtonLink>
          </div>
        </header>

        <main className="relative z-10 mx-auto w-full max-w-[1560px] p-4 sm:p-6 lg:p-8">
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-primary/15 bg-primary/5 px-3.5 py-2 text-xs text-primary lg:hidden shadow-2xs">
            <Sparkles className="size-3.5" />
            <span className="font-bold">{getPageLabel(pathname)}</span>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
