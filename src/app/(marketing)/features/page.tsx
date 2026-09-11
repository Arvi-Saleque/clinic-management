import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  ShieldCheck,
  CreditCard,
  LayoutDashboard,
  Stethoscope,
  ArrowRight,
  Zap,
  TrendingUp,
  Heart,
} from "lucide-react";
import { FeaturesSlideDeck } from "@/components/marketing/features-slide-deck";

export const metadata: Metadata = {
  title: "System Features | Clinic Care Dental Management Platform",
  description:
    "Discover all 26+ powerful features of our dental clinic management system — from real-time dashboards and online booking to patient portals and smart billing.",
};

const FEATURE_CATEGORIES = [
  {
    id: "operations",
    label: "Daily Operations",
    badge: "Operations Engine",
    color: "#2B5748",
    lightColor: "#EAF2EE",
    icon: LayoutDashboard,
    headline: (
      <>
        Your clinic runs <i className="font-serif text-[#9CB080] font-normal">itself.</i>
      </>
    ),
    subtitle:
      "Automate front-desk queues, daily appointment workflows, and doctor availability in one single workspace.",
  },
  {
    id: "clinical",
    label: "Clinical Tools",
    badge: "Digital Chairside",
    color: "#1E3A5F",
    lightColor: "#E8EEF6",
    icon: Stethoscope,
    headline: (
      <>
        Dentists document <i className="font-serif text-[#9CB080] font-normal">everything digitally.</i>
      </>
    ),
    subtitle:
      "Full chairside consultation workspaces, digital odontograms, allergy warnings, and paperless prescriptions.",
  },
  {
    id: "patient",
    label: "Patient Experience",
    badge: "Patient Portal",
    color: "#7B3F8C",
    lightColor: "#F3EAF7",
    icon: Heart,
    headline: (
      <>
        Patients feel <i className="font-serif text-[#9CB080] font-normal">looked after.</i>
      </>
    ),
    subtitle:
      "Dedicated self-service portal, 1-click calendar sync, transparent wait times, and permanent medical safety.",
  },
  {
    id: "marketing",
    label: "Marketing & Growth",
    badge: "Growth Engine",
    color: "#B05A1A",
    lightColor: "#FAF0E8",
    icon: TrendingUp,
    headline: (
      <>
        Your website becomes your <i className="font-serif text-[#9CB080] font-normal">best salesperson.</i>
      </>
    ),
    subtitle:
      "High-converting marketing architecture with AI smile simulator, doctor portfolios, and branch locators.",
  },
  {
    id: "finance",
    label: "Finance & Billing",
    badge: "Revenue Shield",
    color: "#1B5E8C",
    lightColor: "#E6F0F8",
    icon: CreditCard,
    headline: (
      <>
        No invoice is <i className="font-serif text-[#9CB080] font-normal">ever lost again.</i>
      </>
    ),
    subtitle:
      "Auto-generated treatment invoices, payment method splitting, outstanding balance tracking, and browser receipts.",
  },
  {
    id: "technology",
    label: "Technology & Access",
    badge: "Cloud Security",
    color: "#5A3E8C",
    lightColor: "#EEE8F8",
    icon: Zap,
    headline: (
      <>
        Works everywhere, <i className="font-serif text-[#9CB080] font-normal">for everyone.</i>
      </>
    ),
    subtitle:
      "Role-based access control, responsive mobile-first UI, dark/light theme switching, and instant WhatsApp support.",
  },
];

const COMPARISON = [
  { before: "Paper appointment book", after: "Live digital dashboard with real-time queues" },
  { before: "Phone-only bookings", after: "24/7 online booking wizard on your website" },
  { before: "Paper patient records", after: "Full digital medical history with allergy alerts" },
  { before: "Handwritten prescriptions", after: "Digital prescriptions with searchable catalog" },
  { before: "Manual paper invoices", after: "Auto-generated, printable, filterable invoices" },
  { before: "No patient self-service", after: "Patient portal with calendar export" },
  { before: "Generic clinic website", after: "Premium marketing site with smile simulator" },
  { before: "One role for all staff", after: "Three-tier role-based access control" },
  { before: "Patients forget follow-ups", after: "Follow-up booked inside the consultation" },
  { before: "Scheduling conflicts", after: "Real-time availability engine — zero overbooking" },
];

export default function FeaturesPage() {
  return (
    <div className="features-page bg-white">
      {/* Luxury Hero Banner — Full 100vh Viewport Height with High-End Clinic Background Image */}
      <section className="relative overflow-hidden bg-[#07110E] text-white min-h-screen w-full flex flex-col justify-center items-center border-b border-white/10 px-4 py-20">
        {/* Background Image with Dark Luxury Gradients & Frosted Ambience */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 scale-105 transition-transform duration-1000"
          style={{ backgroundImage: `url('/marketing/features_hero_bg.jpg')` }}
        />
        {/* Vignette & Atmospheric Gradients */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#07110E]/90 via-[#0A1612]/70 to-[#07110E]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,_rgba(156,176,128,0.22),_transparent_65%)]" />
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse_at_center,_rgba(43,87,72,0.35),_transparent_70%)] blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:5rem_5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)]" />

        <div className="container relative z-10 max-w-5xl mx-auto px-4 text-center my-auto flex flex-col items-center justify-center">
          {/* Master Headline */}
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-light tracking-tight leading-[1.12] !text-white max-w-4xl mx-auto mb-6 sm:mb-8"
            style={{ color: "#FFFFFF" }}
          >
            Everything Your Clinic Needs, <br className="hidden sm:inline" />
            <span
              className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#9CB080] via-[#E2EDD6] to-[#9CB080]"
              style={{
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Built Into One Flawless System.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl !text-white/85 max-w-3xl mx-auto leading-relaxed font-light">
            From 24/7 patient booking and waiting room queues to digital chairside charting, paperless prescriptions, and automated billing.
          </p>
        </div>
      </section>

      {/* Before / After Transformation Matrix */}
      <section className="py-24 bg-[#FBFBF9] text-[#273338]">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="title-box text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-[#182320] tracking-tight mb-3">
              From Traditional Clinic to <i className="font-serif text-[#2B5748]">Digital Practice</i>
            </h2>
            <p className="text-[#55645E] text-sm sm:text-base max-w-2xl mx-auto font-normal">
              See how routine operations transform from manual paper bottlenecks to automated digital precision.
            </p>
          </div>

          <div className="rounded-2xl sm:rounded-[32px] overflow-hidden border border-[#273338]/12 bg-white shadow-[0_24px_70px_-15px_rgba(27,38,33,0.09)]">
            <div className="grid grid-cols-1 md:grid-cols-2 border-b border-[#273338]/10 bg-[#162520] text-white">
              <div className="px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between border-b md:border-b-0 md:border-r border-white/10 bg-red-950/20">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400 shrink-0" />
                  <span className="text-xs sm:text-sm font-bold tracking-wider uppercase text-red-200">
                    Traditional / Manual Clinic
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-white/50 uppercase tracking-widest font-semibold shrink-0">Legacy</span>
              </div>

              <div className="px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between bg-[#2B5748]/30">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#9CB080] animate-pulse shrink-0" />
                  <span className="text-xs sm:text-sm font-bold tracking-wider uppercase text-[#D7E8C5]">
                    With Clinic Care System
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-[#9CB080] uppercase tracking-widest font-semibold shrink-0">Automated</span>
              </div>
            </div>

            <div className="divide-y divide-[#273338]/06">
              {COMPARISON.map((row, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-1 md:grid-cols-2 transition-colors hover:bg-[#F4F8F6]/60 ${i % 2 === 0 ? "bg-white" : "bg-[#FAFBF9]"
                    }`}
                >
                  <div className="px-4 sm:px-8 py-3.5 sm:py-4 flex items-center gap-3 border-b md:border-b-0 md:border-r border-[#273338]/06 text-[#55645E]">
                    <span className="w-5 h-5 rounded-full bg-red-50 text-red-500 border border-red-200/60 flex items-center justify-center text-xs font-bold shrink-0">
                      ✕
                    </span>
                    <span className="text-xs sm:text-sm font-normal leading-relaxed text-[#4E5B55]">
                      {row.before}
                    </span>
                  </div>

                  <div className="px-4 sm:px-8 py-3.5 sm:py-4 flex items-center gap-3 bg-gradient-to-r from-transparent to-[#2B5748]/[0.02]">
                    <span className="w-5 h-5 rounded-full bg-[#2B5748]/10 text-[#2B5748] border border-[#2B5748]/20 flex items-center justify-center text-xs font-bold shrink-0">
                      ✓
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-[#14231E] leading-relaxed">
                      {row.after}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Sections Presentation Slide Deck */}
      <FeaturesSlideDeck />

      {/* CTA Section */}
      <section className="relative py-16 sm:py-24 md:py-28 bg-[#1B2623] text-white overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(156,176,128,0.18),transparent_70%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(16,26,23,0.85)_0%,rgba(10,18,16,0.95)_100%)]" />

        <div className="container relative z-10 text-center max-w-4xl mx-auto px-4">
          <div className="p-6 sm:p-12 md:p-16 rounded-2xl sm:rounded-[32px] bg-white/[0.06] border border-[#9CB080]/25 backdrop-blur-xl shadow-[0_30px_80px_-15px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)]">
            <div className="inline-flex items-center gap-2 bg-[#14201C]/80 backdrop-blur-md px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full border border-[#9CB080]/30 text-[11px] sm:text-xs text-[#B5C89B] font-semibold uppercase tracking-widest mb-4 sm:mb-6 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-[#B5C89B]" />
              <span>Built for Modern Dental Clinics</span>
            </div>

            <h2 className="text-2xl sm:text-4xl md:text-5xl font-light text-white leading-tight tracking-tight mb-3 sm:mb-4 drop-shadow-md">
              Ready to Transform <br className="hidden sm:inline" />
              <i className="font-serif text-[#B5C89B]">Your Clinic Experience?</i>
            </h2>

            <p className="text-sm sm:text-base md:text-lg text-white/90 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed drop-shadow-sm font-normal">
              Every feature shown on this page is ready to deploy for your clinic — customised with your branding, your doctors, and your services.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 sm:gap-4 max-w-md sm:max-w-none mx-auto">
              <Link
                href="/book"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#2B5748] to-[#18362B] hover:from-[#376d5b] hover:to-[#2B5748] px-8 py-4 text-xs sm:text-sm font-bold uppercase tracking-wider text-white shadow-[0_8px_24px_rgba(43,87,72,0.4)] hover:shadow-[0_12px_32px_rgba(43,87,72,0.6)] transition-all duration-300 hover:scale-105 border border-[#9CB080]/30"
                style={{ color: "#ffffff" }}
              >
                <CalendarDays className="w-4 h-4" />
                <span>Book a Demo Appointment</span>
              </Link>

              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 hover:bg-white/20 px-8 py-4 text-xs sm:text-sm font-semibold uppercase tracking-wider text-white border border-white/25 hover:border-white/50 backdrop-blur-md transition-all duration-300 hover:scale-105"
                style={{ color: "#ffffff" }}
              >
                <ArrowRight className="w-4 h-4 text-[#B5C89B]" />
                <span>Get in Touch</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
