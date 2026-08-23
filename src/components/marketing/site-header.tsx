"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { LogIn, Stethoscope, UserCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { MagneticButton } from "@/components/motion";
import { MobileNav } from "@/components/marketing/mobile-nav";
import { CONTAINER } from "@/lib/layout";

const NAV_LINKS = [
  { href: "/practitioners", label: "Practitioners" },
  { href: "/#faq", label: "Patient Resources" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

interface TreatmentLink {
  href: string;
  label: string;
}
interface Account {
  label: string;
  href: string;
}

export function SiteHeader({ treatments, account }: { treatments: TreatmentLink[]; account: Account | null }) {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = React.useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 16);
  });

  return (
    <motion.header
      className={cn(
        "fixed inset-x-0 top-0 z-40 w-full border-b transition-colors duration-300",
        scrolled
          ? "border-border bg-surface-elevated/90 backdrop-blur-lg"
          : "border-transparent bg-transparent",
      )}
    >
      <div className={cn(CONTAINER, "flex h-20 items-center justify-between")}>
        <Link
          href="/"
          data-scrolled={scrolled}
          className="flex items-center gap-2.5 font-serif text-2xl text-white transition-colors data-[scrolled=true]:text-foreground"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Stethoscope className="size-5" />
          </span>
          Clinic Care
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          <DropdownMenu>
            <DropdownMenuTrigger
              data-scrolled={scrolled}
              className="rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white data-[scrolled=true]:text-foreground/80 data-[scrolled=true]:hover:bg-muted data-[scrolled=true]:hover:text-foreground"
            >
              Treatments
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-56">
              {treatments.map((t) => (
                <DropdownMenuItem key={t.href} render={<Link href={t.href} />}>
                  {t.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem render={<Link href="/services" />} className="font-medium text-primary">
                View all treatments
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                data-active={active}
                data-scrolled={scrolled}
                className="rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white data-[active=true]:text-white data-[scrolled=true]:text-foreground/80 data-[scrolled=true]:hover:bg-muted data-[scrolled=true]:hover:text-foreground data-[scrolled=true]:data-[active=true]:text-primary"
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href={account ? account.href : "/login"}
            data-scrolled={scrolled}
            className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white data-[scrolled=true]:text-foreground/80 data-[scrolled=true]:hover:bg-muted data-[scrolled=true]:hover:text-foreground sm:flex"
          >
            {account ? (
              <>
                <UserCircle className="size-4" />
                {account.label}
              </>
            ) : (
              <>
                <LogIn className="size-4" />
                Patient Login
              </>
            )}
          </Link>

          <ThemeToggle scrolled={scrolled} />

          <MagneticButton className="hidden sm:inline-block">
            <ButtonLink href="/book" className="bg-accent text-accent-foreground hover:bg-accent/90">
              Book an Appointment
            </ButtonLink>
          </MagneticButton>

          <MobileNav navLinks={NAV_LINKS} treatmentLinks={treatments} account={account} />
        </div>
      </div>
    </motion.header>
  );
}
