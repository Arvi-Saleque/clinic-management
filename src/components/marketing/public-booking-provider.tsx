"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

import { BookingWizard } from "@/components/portal/booking-wizard";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

interface PublicService {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
}

export interface PublicBookingAccountState {
  authenticated: boolean;
  registered: boolean;
  email?: string | null;
  fullName?: string | null;
}

interface InitialSelection {
  serviceId?: string;
  practitionerId?: string;
  resumeAccount?: boolean;
}

/** Global public booking surface. Every same-origin /book link is intercepted
 * and opens the shared wizard without forcing a login-page navigation. */
export function PublicBookingProvider({
  children,
  services,
  initialAccount,
}: {
  children: React.ReactNode;
  services: PublicService[];
  initialAccount: PublicBookingAccountState;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [wizardKey, setWizardKey] = React.useState(0);
  const [selection, setSelection] = React.useState<InitialSelection>({});
  const [account, setAccount] = React.useState(initialAccount);
  const directRouteOpened = React.useRef(false);

  const openBooking = React.useCallback((url?: URL) => {
    setSelection({
      serviceId: url?.searchParams.get("serviceId") ?? undefined,
      practitionerId: url?.searchParams.get("practitionerId") ?? undefined,
      resumeAccount: url?.searchParams.get("resume") === "account",
    });
    setWizardKey((value) => value + 1);
    setOpen(true);
  }, []);

  React.useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || !/^\/book\/?$/.test(url.pathname)) return;

      // Run this listener during capture so Next.js Link cannot start a
      // client-side navigation before the booking overlay takes ownership.
      event.preventDefault();
      event.stopPropagation();
      openBooking(url);
    }

    function handleCustomOpen(event: Event) {
      const detail = (event as CustomEvent<InitialSelection>).detail;
      const url = new URL("/book", window.location.origin);
      if (detail?.serviceId) url.searchParams.set("serviceId", detail.serviceId);
      if (detail?.practitionerId) url.searchParams.set("practitionerId", detail.practitionerId);
      openBooking(url);
    }

    document.addEventListener("click", handleDocumentClick, true);
    window.addEventListener("clinic:open-booking", handleCustomOpen);
    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      window.removeEventListener("clinic:open-booking", handleCustomOpen);
    };
  }, [openBooking]);

  React.useEffect(() => {
    if (pathname === "/book" && !directRouteOpened.current) {
      directRouteOpened.current = true;
      openBooking(new URL(window.location.href));
    }
    if (pathname !== "/book") directRouteOpened.current = false;
  }, [pathname, openBooking]);

  React.useEffect(() => {
    document.documentElement.classList.toggle("booking-modal-open", open);
    window.dispatchEvent(
      new CustomEvent("clinic:booking-modal-change", {
        detail: { open },
      }),
    );

    return () => {
      document.documentElement.classList.remove("booking-modal-open");
      if (open) {
        window.dispatchEvent(
          new CustomEvent("clinic:booking-modal-change", {
            detail: { open: false },
          }),
        );
      }
    };
  }, [open]);

  const handleAccountChange = React.useCallback((next: PublicBookingAccountState) => {
    setAccount(next);
    router.refresh();
  }, [router]);

  return (
    <>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          data-lenis-prevent
          className="max-h-[calc(100dvh-1rem)] w-[calc(100%-0.75rem)] max-w-[1040px] overscroll-contain overflow-x-hidden overflow-y-auto border-0 bg-transparent p-0 text-foreground shadow-none ring-0 sm:max-h-[90dvh] sm:w-[calc(100%-2rem)] sm:max-w-[1040px] [&>[data-slot=dialog-close]]:right-3 [&>[data-slot=dialog-close]]:top-3 [&>[data-slot=dialog-close]]:z-30 [&>[data-slot=dialog-close]]:rounded-full [&>[data-slot=dialog-close]]:bg-surface/90 [&>[data-slot=dialog-close]]:shadow-md"
          showCloseButton
        >
          <DialogTitle className="sr-only">Book an appointment</DialogTitle>
          <DialogDescription className="sr-only">
            Choose a service, doctor, date and time. Sign in only when you are ready to confirm.
          </DialogDescription>
          <BookingWizard
            key={wizardKey}
            services={services}
            mode="public"
            initialServiceId={selection.serviceId}
            initialPractitionerId={selection.practitionerId}
            resumeAccount={selection.resumeAccount}
            initialAccount={account}
            onAccountChange={handleAccountChange}
            onClose={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
