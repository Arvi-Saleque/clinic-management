import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  ShieldCheck,
  Users,
  ClipboardList,
  CreditCard,
  Lock,
  FileText,
  Smile,
  Pill,
  Clock,
  LayoutDashboard,
  Stethoscope,
  UserCircle,
  CalendarCheck,
  Globe,
  Sparkles,
  Camera,
  BookOpen,
  GraduationCap,
  UserCheck,
  List,
  Building2,
  Moon,
  Smartphone,
  Printer,
  CalendarIcon,
  MessageCircle,
  CheckCircle2,
  ArrowRight,
  Star,
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

const STATS = [
  {
    value: "26+",
    label: "Core Modules",
    desc: "Operations, clinical, marketing & finance",
    badge: "Enterprise",
    icon: Star,
  },
  {
    value: "100%",
    label: "Digital Paperless",
    desc: "Digital charts, odontograms & prescriptions",
    badge: "Chairside",
    icon: Sparkles,
  },
  {
    value: "3 Tiers",
    label: "Role-Based Access",
    desc: "Admin, Doctor & Receptionist security",
    badge: "Security",
    icon: ShieldCheck,
  },
  {
    value: "24/7",
    label: "Patient Self-Service",
    desc: "Online booking wizard & patient portal",
    badge: "Cloud Hub",
    icon: Clock,
  },
];

export default function FeaturesPage() {
  return (
    <div className="features-page bg-white">
      {/* Luxury Hero Banner — Full 100vh Viewport Height */}
      <section className="relative overflow-hidden bg-[#0A1612] text-white min-h-screen w-full flex flex-col justify-center border-b border-white/10 pt-20 pb-8 sm:pt-24 sm:pb-12">
        {/* Ambient atmospheric lighting */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,_rgba(156,176,128,0.22),_transparent_65%)]" />
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse_at_center,_rgba(43,87,72,0.35),_transparent_70%)] blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <div className="container relative z-10 max-w-6xl mx-auto px-4 text-center my-auto">
          {/* Breadcrumb navigation */}
          <nav aria-label="Breadcrumb" className="mb-3 flex justify-center">
            <ol className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-widest text-white/60 uppercase">
              <li>
                <Link href="/" className="hover:text-white transition-colors duration-200">
                  Home
                </Link>
              </li>
              <li className="text-[#9CB080]" aria-hidden="true">›</li>
              <li className="text-[#9CB080] font-bold" aria-current="page">System Features</li>
            </ol>
          </nav>

          {/* Premium Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 bg-white/[0.08] hover:bg-white/[0.12] transition-colors border border-white/15 backdrop-blur-xl px-3.5 py-1 rounded-full text-[11px] text-[#9CB080] font-semibold tracking-wide uppercase mb-4 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9CB080] animate-pulse" />
            <ShieldCheck className="w-3.5 h-3.5 text-[#9CB080]" />
            <span>Complete Practice Operating Platform · 26 Capabilities</span>
          </div>

          {/* Master Headline */}
          <h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-light tracking-tight leading-[1.12] !text-white max-w-4xl mx-auto"
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
          <p className="text-sm sm:text-base md:text-lg !text-white/80 mt-3 max-w-2xl mx-auto leading-relaxed font-light">
            From 24/7 patient booking and waiting room queues to digital chairside charting, paperless prescriptions, and automated billing.
          </p>

          {/* Action CTAs */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="#slide-intro"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#2B5748] hover:bg-[#386D5B] !text-white font-semibold text-xs sm:text-sm shadow-[0_8px_20px_rgba(43,87,72,0.4)] hover:scale-105 transition-all duration-300 border border-white/20"
            >
              <span>Explore All 26 Features</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] !text-white font-semibold text-xs sm:text-sm border border-white/20 backdrop-blur-md transition-all duration-300 hover:scale-105"
            >
              <CalendarDays className="w-3.5 h-3.5 text-[#9CB080]" />
              <span>Book a Demo</span>
            </Link>
          </div>

          {/* Integrated Frosted Glass Stats Matrix */}
          <div className="mt-8 md:mt-10 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto">
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="group relative rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 sm:p-4 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.2)] hover:border-[#9CB080]/40 hover:bg-white/[0.08] transition-all duration-300 text-left"
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="w-8 h-8 rounded-xl bg-[#9CB080]/15 border border-[#9CB080]/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-4 h-4 text-[#9CB080]" />
                    </div>
                    <span className="text-[9px] font-bold text-[#9CB080] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#9CB080]/15 border border-[#9CB080]/20">
                      {s.badge}
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight !text-white mb-0.5" style={{ color: "#FFFFFF" }}>
                    {s.value}
                  </div>
                  <div className="text-xs font-bold !text-white/95" style={{ color: "rgba(255,255,255,0.95)" }}>
                    {s.label}
                  </div>
                  <div className="text-[10px] !text-white/60 mt-0.5 leading-snug hidden sm:block" style={{ color: "rgba(255,255,255,0.65)" }}>
                    {s.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Before / After Transformation Matrix */}
      <section className="py-24 bg-[#FBFBF9] text-[#273338]">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="title-box text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#2B5748]/10 border border-[#2B5748]/20 text-[#2B5748] text-xs font-semibold tracking-wide uppercase mb-3">
              <span>Practice Transformation Matrix</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-[#182320] tracking-tight mb-3">
              From Traditional Clinic to <i className="font-serif text-[#2B5748]">Digital Practice</i>
            </h2>
            <p className="text-[#55645E] text-sm sm:text-base max-w-2xl mx-auto font-normal">
              See how routine operations transform from manual paper bottlenecks to automated digital precision.
            </p>
          </div>

          <div className="rounded-[32px] overflow-hidden border border-[#273338]/12 bg-white shadow-[0_24px_70px_-15px_rgba(27,38,33,0.09)]">
            <div className="grid grid-cols-1 md:grid-cols-2 border-b border-[#273338]/10 bg-[#162520] text-white">
              <div className="px-6 sm:px-8 py-5 flex items-center justify-between border-b md:border-b-0 md:border-r border-white/10 bg-red-950/20">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="text-xs sm:text-sm font-bold tracking-wider uppercase text-red-200">
                    Traditional / Manual Clinic
                  </span>
                </div>
                <span className="text-[11px] text-white/50 uppercase tracking-widest font-semibold">Legacy</span>
              </div>

              <div className="px-6 sm:px-8 py-5 flex items-center justify-between bg-[#2B5748]/30">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#9CB080] animate-pulse" />
                  <span className="text-xs sm:text-sm font-bold tracking-wider uppercase text-[#D7E8C5]">
                    With Clinic Care System
                  </span>
                </div>
                <span className="text-[11px] text-[#9CB080] uppercase tracking-widest font-semibold">Automated</span>
              </div>
            </div>

            <div className="divide-y divide-[#273338]/06">
              {COMPARISON.map((row, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-1 md:grid-cols-2 transition-colors hover:bg-[#F4F8F6]/60 ${
                    i % 2 === 0 ? "bg-white" : "bg-[#FAFBF9]"
                  }`}
                >
                  <div className="px-6 sm:px-8 py-4 flex items-center gap-3.5 border-b md:border-b-0 md:border-r border-[#273338]/06 text-[#55645E]">
                    <span className="w-5 h-5 rounded-full bg-red-50 text-red-500 border border-red-200/60 flex items-center justify-center text-xs font-bold shrink-0">
                      ✕
                    </span>
                    <span className="text-xs sm:text-sm font-normal leading-relaxed text-[#4E5B55]">
                      {row.before}
                    </span>
                  </div>

                  <div className="px-6 sm:px-8 py-4 flex items-center gap-3.5 bg-gradient-to-r from-transparent to-[#2B5748]/[0.02]">
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
      <section className="relative py-28 bg-[#1B2623] text-white overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(156,176,128,0.18),transparent_70%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(16,26,23,0.85)_0%,rgba(10,18,16,0.95)_100%)]" />

        <div className="container relative z-10 text-center max-w-4xl mx-auto px-4">
          <div className="p-10 sm:p-14 md:p-16 rounded-[32px] bg-white/[0.06] border border-[#9CB080]/25 backdrop-blur-xl shadow-[0_30px_80px_-15px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)]">
            <div className="inline-flex items-center gap-2 bg-[#14201C]/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-[#9CB080]/30 text-xs text-[#B5C89B] font-semibold uppercase tracking-widest mb-6 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-[#B5C89B]" />
              <span>Built for Modern Dental Clinics</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white leading-tight tracking-tight mb-4 drop-shadow-md">
              Ready to Transform <br className="hidden sm:inline" />
              <i className="font-serif text-[#B5C89B]">Your Clinic Experience?</i>
            </h2>

            <p className="text-base sm:text-lg text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed drop-shadow-sm font-normal">
              Every feature shown on this page is ready to deploy for your clinic — customised with your branding, your doctors, and your services.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
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
