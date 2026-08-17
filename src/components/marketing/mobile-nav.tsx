"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { ChevronDown, Menu, Stethoscope, X } from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavLink {
  href: string;
  label: string;
}
interface Account {
  label: string;
  href: string;
}

export function MobileNav({
  navLinks,
  treatmentLinks,
  account,
}: {
  navLinks: NavLink[];
  treatmentLinks: NavLink[];
  account: Account | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [treatmentsOpen, setTreatmentsOpen] = React.useState(false);

  // Close the drawer on route change so a nav click always lands the user
  // on the new page instead of leaving the drawer open over it.
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger
        render={<Button variant="outline" size="icon" className="md:hidden" aria-label="Open menu" />}
      >
        <Menu className="size-4" />
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-sm flex-col overflow-y-auto bg-surface-elevated shadow-2xl outline-none data-open:animate-in data-open:slide-in-from-right data-closed:animate-out data-closed:slide-out-to-right">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <Link href="/" className="flex items-center gap-2 font-serif text-xl">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Stethoscope className="size-5" />
              </span>
              Clinic Care
            </Link>
            <DialogPrimitive.Close
              render={<Button variant="ghost" size="icon" aria-label="Close menu" />}
            >
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
            <Link
              href="/"
              data-active={pathname === "/"}
              className="rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-muted data-[active=true]:bg-primary-soft data-[active=true]:text-primary"
            >
              Home
            </Link>

            <div>
              <button
                onClick={() => setTreatmentsOpen((v) => !v)}
                aria-expanded={treatmentsOpen}
                className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-base font-medium text-foreground hover:bg-muted"
              >
                Treatments
                <ChevronDown className={cn("size-4 transition-transform", treatmentsOpen && "rotate-180")} />
              </button>
              {treatmentsOpen && (
                <div className="ml-3 flex flex-col border-l border-border pl-3">
                  {treatmentLinks.map((t) => (
                    <Link
                      key={t.href}
                      href={t.href}
                      className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      {t.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                data-active={pathname === link.href}
                className="rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-muted data-[active=true]:bg-primary-soft data-[active=true]:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-2 border-t border-border p-4">
            <ButtonLink href={account ? account.href : "/login"} variant="outline">
              {account ? `My account (${account.label})` : "Patient Login"}
            </ButtonLink>
            <ButtonLink href="/book">Book Appointment</ButtonLink>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
