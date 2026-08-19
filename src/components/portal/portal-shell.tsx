"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  FileText,
  HeartPulse,
  LayoutDashboard,
  Menu,
  MessageCircleQuestion,
  Plus,
  Receipt,
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
  { href: "/portal/appointments/book", label: "Book a visit", icon: Plus },
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
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-text-secondary hover:bg-primary-soft hover:text-primary",
            )}
          >
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-lg transition-colors",
                active ? "bg-white/12" : "bg-surface group-hover:bg-surface-elevated",
              )}
            >
              <item.icon className="size-4" />
            </span>
            {item.label}
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
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[276px] flex-col border-r border-border bg-surface/95 px-4 py-5 backdrop-blur-xl lg:flex">
        <Link href="/portal/dashboard" className="flex items-center gap-3 px-2">
          <span className="relative flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/15">
            <HeartPulse className="size-5" />
            <span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-surface bg-accent" />
          </span>
          <span>
            <span className="block font-heading text-lg font-bold tracking-tight">Clinic Care</span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
              Patient portal
            </span>
          </span>
        </Link>

        <div className="mt-8 px-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted">My care</p>
        </div>
        <div className="mt-2 flex-1 overflow-y-auto">
          <PortalNavigation pathname={pathname} />
        </div>

        <div className="mb-3 rounded-2xl border border-border bg-background-subtle p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="size-4 text-success" />
            Private health workspace
          </div>
          <p className="mt-1.5 text-xs leading-5 text-text-muted">
            Your clinical and billing records are visible only to you and authorised clinic staff.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface-elevated p-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-sm font-bold text-primary">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{profile.full_name}</p>
              <p className="truncate text-[11px] text-text-muted">
                {patientReference ?? (registered ? "Patient account" : "Registration pending")}
              </p>
            </div>
            <SignOutButton compact />
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-secondary/45 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(88vw,320px)] flex-col border-r border-border bg-surface p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <Link href="/portal/dashboard" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <HeartPulse className="size-5" />
                </span>
                <span className="font-heading text-lg font-bold">Clinic Care</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X />
              </Button>
            </div>
            <div className="mt-8 flex-1 overflow-y-auto">
              <PortalNavigation pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="mt-5 rounded-2xl border border-border p-3">
              <p className="text-sm font-semibold">{profile.full_name}</p>
              <p className="mt-0.5 text-xs text-text-muted">{patientReference ?? "Patient portal"}</p>
              <div className="mt-3">
                <SignOutButton />
              </div>
            </div>
          </aside>
        </div>
      )}

      <div className="lg:pl-[276px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center border-b border-border bg-background/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 lg:hidden"
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
            <ButtonLink href="/contact" variant="ghost" className="hidden gap-2 sm:inline-flex">
              <MessageCircleQuestion className="size-4" />
              Help
            </ButtonLink>
            <ThemeToggle />
            <ButtonLink href={registered ? "/portal/appointments/book" : "/portal/register"} className="gap-2">
              <Plus className="size-4" />
              <span className="hidden sm:inline">{registered ? "Book visit" : "Register"}</span>
            </ButtonLink>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1480px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
