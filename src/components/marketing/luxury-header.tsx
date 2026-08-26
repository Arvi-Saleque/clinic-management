"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LogIn, Phone, Search, User } from "lucide-react";

interface LuxuryHeaderProps {
  phone?: string | null;
  account?: { label: string; href: string } | null;
  treatments?: { href: string; label: string }[];
  onOpenSearch?: () => void;
}

export function LuxuryHeader({
  phone = "+44 1632 960123",
  account,
  onOpenSearch,
}: LuxuryHeaderProps) {
  const pathname = usePathname();
  const [headerClass, setHeaderClass] = React.useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = React.useState(false);

  React.useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (isMobileMenuOpen || isBookingModalOpen) {
        setHeaderClass(currentScrollY > 80 ? "header-sticky" : "");
        lastScrollY = currentScrollY;
        return;
      }

      let nextClass = "";
      if (currentScrollY > 80) {
        nextClass = "header-sticky";
        if (currentScrollY > lastScrollY && currentScrollY > 200) {
          nextClass += " header-hidden";
        }
      }
      setHeaderClass(nextClass);
      lastScrollY = currentScrollY;
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isBookingModalOpen, isMobileMenuOpen]);

  React.useEffect(() => {
    const handleBookingModalChange = (event: Event) => {
      const nextOpen = Boolean((event as CustomEvent<{ open?: boolean }>).detail?.open);
      setIsBookingModalOpen(nextOpen);
      if (nextOpen) setIsMobileMenuOpen(false);
    };

    window.addEventListener("clinic:booking-modal-change", handleBookingModalChange);
    return () => window.removeEventListener("clinic:booking-modal-change", handleBookingModalChange);
  }, []);

  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1025px)");
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setIsMobileMenuOpen(false);
    };
    desktopQuery.addEventListener("change", closeOnDesktop);
    return () => desktopQuery.removeEventListener("change", closeOnDesktop);
  }, []);

  React.useEffect(() => {
    if (!isMobileMenuOpen) return;

    const html = document.documentElement;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = html.style.overflow;

    html.classList.add("luxury-mobile-menu-open");
    document.body.style.overflow = "hidden";
    html.style.overflow = "hidden";

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      html.classList.remove("luxury-mobile-menu-open");
      document.body.style.overflow = previousBodyOverflow;
      html.style.overflow = previousHtmlOverflow;
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header
        className={`luxury-site-header ${pathname === "/" ? "homepage-header" : ""} ${headerClass} ${isMobileMenuOpen ? "mobile-menu-open" : ""} ${isBookingModalOpen ? "header-hidden" : ""}`}
      >
        <div className="header-full-width-container">
          <div className="header-row">
            {/* Brand Logo */}
            <Link href="/" className="logo">
              <span className="logo-text">
                CLINIC CARE <i>DENTAL</i>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:block">
              <ul className="nav-menu">
                <li className={pathname?.startsWith("/services") ? "active-link" : ""}>
                  <Link href="/services">Treatments</Link>
                </li>
                <li className={pathname === "/about" ? "active-link" : ""}>
                  <Link href="/about">About Us</Link>
                </li>
                <li className={pathname === "/practitioners" ? "active-link" : ""}>
                  <Link href="/practitioners">Doctors</Link>
                </li>
                <li className={pathname === "/results" ? "active-link" : ""}>
                  <Link href="/results">Results</Link>
                </li>
                <li className={pathname === "/contact" ? "active-link" : ""}>
                  <Link href="/contact">Contact</Link>
                </li>
              </ul>
            </nav>

            {/* Header Right Actions */}
            <div className="others">
              {onOpenSearch && (
                <button
                  type="button"
                  className="search-toggle"
                  title="Search treatments"
                  onClick={onOpenSearch}
                  aria-label="Search"
                >
                  <Search className="w-4 h-4 text-white" />
                </button>
              )}

              {phone && (
                <a href={`tel:${phone.replace(/\s+/g, "")}`} className="btn-call hidden xl:inline-flex">
                  <Phone className="w-4 h-4 mr-1.5" />
                  <span>Call Us</span>
                </a>
              )}

              {account ? (
                <Link href={account.href} className="btn-account-pill hidden sm:inline-flex">
                  <User className="w-3.5 h-3.5 mr-1.5" />
                  <span>{account.label}</span>
                </Link>
              ) : (
                <Link href="/login" className="btn-account-pill hidden sm:inline-flex">
                  <LogIn className="w-3.5 h-3.5 mr-1.5" />
                  <span>Portal Login</span>
                </Link>
              )}

              <Link href="/book" className="btn-blue header-book-cta">
                <CalendarDays className="w-3.5 h-3.5 mr-1.5 hidden sm:inline" />
                Book an Appointment
              </Link>

              {/* Mobile Hamburger Toggle */}
              <button
                type="button"
                className={`hamburger lg:hidden ${isMobileMenuOpen ? "active" : ""}`}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle navigation menu"
                aria-expanded={isMobileMenuOpen}
                aria-controls="luxury-mobile-navigation"
              >
                <span style={isMobileMenuOpen ? { transform: "rotate(45deg) translate(5px, 5px)" } : {}} />
                <span style={isMobileMenuOpen ? { opacity: 0 } : {}} />
                <span style={isMobileMenuOpen ? { transform: "rotate(-45deg) translate(5px, -5px)" } : {}} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div id="luxury-mobile-navigation" className="luxury-mobile-menu lg:hidden">
          <div className="container py-6 space-y-4">
            <nav className="space-y-2">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2.5 text-base font-semibold border-b border-white/10 text-white"
              >
                Home
              </Link>
              <Link
                href="/services"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2.5 text-base font-semibold border-b border-white/10 text-white"
              >
                Treatments & Services
              </Link>
              <Link
                href="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2.5 text-base font-semibold border-b border-white/10 text-white"
              >
                About Clinic
              </Link>
              <Link
                href="/practitioners"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2.5 text-base font-semibold border-b border-white/10 text-white"
              >
                Our Doctors
              </Link>
              <Link
                href="/results"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2.5 text-base font-semibold border-b border-white/10 text-white"
              >
                Smile Results
              </Link>
              <Link
                href="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2.5 text-base font-semibold border-b border-white/10 text-white"
              >
                Contact Us
              </Link>
              <Link
                href={account ? account.href : "/login"}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2.5 text-base font-semibold border-b border-white/10 text-white"
              >
                {account ? `Account (${account.label})` : "Patient Portal Login"}
              </Link>
            </nav>

            <div className="pt-4">
              <Link
                href="/book"
                onClick={() => setIsMobileMenuOpen(false)}
                className="btn-blue w-full text-center block"
              >
                Book an Appointment
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
