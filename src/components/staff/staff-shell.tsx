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
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/auth/session";
import type { LucideIcon } from "lucide-react";

const NAV: { href: string; label: string; shortLabel: string; icon: LucideIcon; clinical?: boolean }[] = [
  { href: "/dashboard", label: "Dashboard", shortLabel: "Dashboard", icon: LayoutDashboard },
  { href: "/patients", label: "Patients", shortLabel: "Patients", icon: Users },
  { href: "/scheduler", label: "Clinical Diary", shortLabel: "Clinical Diary", icon: CalendarDays },
  { href: "/appointments", label: "Appointments", shortLabel: "Appointments", icon: CalendarCheck2 },
  { href: "/billing/invoices", label: "Billing & Payments", shortLabel: "Billing", icon: Receipt },
  { href: "/clinical/services", label: "Services & Treatments", shortLabel: "Services", icon: Stethoscope, clinical: true },
];

function getPageLabel(pathname: string) {
  const match = [...NAV].reverse().find((item) => pathname.startsWith(item.href));
  if (pathname.includes("/new")) return `New ${match?.shortLabel.toLowerCase() ?? "record"}`;
  return match?.shortLabel ?? "Clinic workspace";
}

export function StaffShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const isClinician = profile.role === "dentist" || profile.role === "owner_admin";
  const visibleNav = NAV.filter((item) => !item.clinical || isClinician);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const query = search.trim();
    router.push(query ? `/patients?q=${encodeURIComponent(query)}` : "/patients");
  }

  const navigation = (
    <>
      <div className="flex h-[84px] items-center justify-between border-b border-sidebar-border px-5">
        <Link href="/dashboard" className="group flex items-center gap-3" aria-label="Clinic Care dashboard">
          <span className="relative flex size-10 items-center justify-center overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-[0_10px_28px_-12px_var(--primary)]">
            <Stethoscope className="size-[18px] transition-transform duration-300 group-hover:scale-110" />
            <span className="absolute -right-2 -top-2 size-5 rounded-full bg-accent/70 blur-md" />
          </span>
          <span>
            <span className="block font-heading text-[15px] font-extrabold tracking-[-0.02em] text-sidebar-foreground">Clinic Care</span>
            <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Dental workspace</span>
          </span>
        </Link>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation">
          <X className="size-4" />
        </Button>
      </div>

      <div className="px-4 pb-2 pt-5">
        <p className="px-3 text-[10px] font-bold uppercase tracking-[0.17em] text-muted-foreground">Workspace</p>
      </div>
      <nav className="flex-1 space-y-1.5 px-3" aria-label="Clinic workspace">
        {visibleNav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-[13px] font-semibold transition-all duration-200",
                active
                  ? "bg-primary text-primary-foreground shadow-[0_10px_30px_-18px_var(--primary)]"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className={cn("size-[17px]", active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="size-3.5 opacity-70" />}
            </Link>
          );
        })}
      </nav>

      <div className="m-4 rounded-2xl border border-primary/15 bg-primary-soft/65 p-4 dark:bg-primary-soft/45">
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck className="size-4" />
          <span className="text-xs font-bold">Secure clinical record</span>
        </div>
        <p className="mt-2 text-[11px] leading-5 text-muted-foreground">Patient activity is role-scoped and recorded for audit continuity.</p>
      </div>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-2xl bg-sidebar-accent/60 p-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-secondary text-xs font-extrabold text-secondary-foreground">
            {profile.full_name.split(" ").slice(0, 2).map((name) => name[0]).join("").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-sidebar-foreground">{profile.full_name}</p>
            <p className="truncate text-[10px] capitalize text-muted-foreground">{profile.role.replace("_", " ")}</p>
          </div>
          <SignOutButton compact />
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background-subtle text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col border-r border-sidebar-border bg-sidebar/95 backdrop-blur-xl md:flex">{navigation}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" className="absolute inset-0 bg-secondary/55 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-label="Close navigation backdrop" />
          <aside className="absolute inset-y-0 left-0 flex w-[min(88vw,320px)] flex-col border-r border-sidebar-border bg-sidebar shadow-2xl">{navigation}</aside>
        </div>
      )}

      <div className="min-h-screen min-w-0 max-w-full overflow-x-hidden md:pl-[272px]">
        <header className="sticky top-0 z-30 flex h-[76px] items-center gap-2.5 border-b border-border/80 bg-background/88 px-3.5 backdrop-blur-xl sm:gap-3 sm:px-6 xl:px-8">
          <Button variant="outline" size="icon" className="shrink-0 md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu className="size-4" /></Button>

          <div className="hidden min-w-36 lg:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Clinical workspace</p>
            <p className="mt-1 text-sm font-extrabold tracking-tight">{getPageLabel(pathname)}</p>
          </div>

          <form onSubmit={submitSearch} className="mx-auto flex min-w-0 flex-1 max-w-[560px] items-center rounded-2xl border border-border bg-surface px-2.5 shadow-[0_8px_30px_-24px_rgba(4,34,31,0.4)] transition focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/8 sm:px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="h-11 min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground sm:px-3" placeholder="Search patient name, phone or patient ID…" aria-label="Search patients" />
            <span className="hidden items-center gap-1 rounded-md border border-border bg-muted px-1.5 py-1 text-[10px] font-semibold text-muted-foreground sm:flex"><Command className="size-3" /> K</span>
          </form>

          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
              <Bell className="size-[17px]" />
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full border-2 border-background bg-destructive" />
            </Button>
            <ThemeToggle />
            <ButtonLink href="/scheduler" size="lg" className="hidden gap-2 rounded-xl px-4 sm:inline-flex"><Plus className="size-4" />Appointment</ButtonLink>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1680px] p-4 sm:p-6 xl:p-8">
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-primary/10 bg-primary-soft/45 px-3 py-2 text-xs text-primary md:hidden"><Sparkles className="size-3.5" /><span className="font-semibold">{getPageLabel(pathname)}</span></div>
          {children}
        </main>
      </div>
    </div>
  );
}
