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
  { value: "26+", label: "Powerful Features", icon: Star },
  { value: "3", label: "Staff Role Levels", icon: Users },
  { value: "11", label: "Website Pages Included", icon: Globe },
  { value: "24/7", label: "Patient Self-Service", icon: Clock },
];

export default function FeaturesPage() {
  return (
    <div className="features-page">
      {/* Hero Banner */}
      <section className="page-hero-banner py-24 text-white">
        <div className="container text-center max-w-5xl mx-auto px-4">
          <nav aria-label="Breadcrumb" className="mb-6 flex justify-center">
            <ol className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-white/70 uppercase">
              <li>
                <Link href="/" className="hover:text-white transition-colors duration-200">
                  Home
                </Link>
              </li>
              <li className="text-[#9CB080]" aria-hidden="true">›</li>
              <li className="text-[#9CB080] font-bold" aria-current="page">System Features</li>
            </ol>
          </nav>

          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/15 text-xs text-[#9CB080] font-medium mb-6 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Complete Platform Overview — 26 Features</span>
          </div>

          <h1 className="page-title text-4xl sm:text-5xl md:text-6xl font-light tracking-tight leading-tight drop-shadow-md">
            Everything Your Clinic Needs, <br />
            <i className="font-serif text-[#9CB080]">Built Into One System.</i>
          </h1>

          <p className="page-subtitle text-base sm:text-lg text-white/85 mt-6 max-w-3xl mx-auto leading-relaxed drop-shadow-sm">
            From the moment a patient visits your website to the moment they walk out of the clinic, every step is managed, recorded, and simplified — so your team can focus on care, not paperwork.
          </p>

          <div className="mt-10 flex justify-center">
            <div className="h-0.5 w-16 bg-[#9CB080]/80 rounded-full" />
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="py-14 bg-[#1B2623] text-white border-y border-white/10">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="text-center">
                  <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-[#9CB080]/15 border border-[#9CB080]/25 mb-3">
                    <Icon className="w-5 h-5 text-[#9CB080]" />
                  </div>
                  <div className="text-3xl font-bold text-white">{s.value}</div>
                  <div className="text-xs text-white/60 mt-1 font-medium uppercase tracking-wider">{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Before / After Comparison */}
      <section className="py-24 bg-[#FBFBF9] text-[#273338]">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="title-box text-center max-w-3xl mx-auto mb-14">
            <span className="subtitle-italic text-[#2B5748] font-semibold text-sm">The Transformation</span>
            <h2 className="h3 text-3xl sm:text-4xl md:text-5xl font-light text-[#182320] mt-2 mb-4 tracking-tight">
              From Traditional Clinic to <i className="font-serif text-[#2B5748]">Digital Practice</i>
            </h2>
            <p className="text-[#4E5B55] text-sm sm:text-base max-w-2xl mx-auto">
              See exactly what changes when your clinic runs on this system — and what you leave behind.
            </p>
          </div>

          <div className="rounded-[32px] overflow-hidden border border-[#273338]/10 shadow-[0_20px_50px_-10px_rgba(27,38,33,0.10)]">
            <div className="grid grid-cols-2 bg-[#273338] text-white text-sm font-bold uppercase tracking-widest">
              <div className="px-6 py-4 border-r border-white/10">Before — Traditional Clinic</div>
              <div className="px-6 py-4 text-[#9CB080]">After — With This System</div>
            </div>
            {COMPARISON.map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-2 border-b border-[#273338]/06 last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-[#F8F9F8]"}`}
              >
                <div className="px-6 py-4 flex items-start gap-3 border-r border-[#273338]/06">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-xs font-bold shrink-0">✕</span>
                  <span className="text-sm text-[#4E5B55]">{row.before}</span>
                </div>
                <div className="px-6 py-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#2B5748] shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-[#182320]">{row.after}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Sections Presentation Slide Deck */}
      <FeaturesSlideDeck />

      {/* Summary Table */}
      <section className="py-24 bg-white text-[#273338]">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="title-box text-center mb-14">
            <span className="subtitle-italic text-[#2B5748] font-semibold text-sm">What&apos;s Included</span>
            <h2 className="h3 text-3xl sm:text-4xl md:text-5xl font-light text-[#182320] mt-2 mb-4 tracking-tight">
              The Complete Feature <i className="font-serif text-[#2B5748]">Summary</i>
            </h2>
          </div>

          <div className="rounded-[28px] overflow-hidden border border-[#273338]/10 shadow-[0_16px_44px_-8px_rgba(27,38,33,0.08)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#273338] text-white text-xs uppercase tracking-widest">
                  <th className="px-6 py-4 text-left font-semibold">Category</th>
                  <th className="px-6 py-4 text-center font-semibold">Features Included</th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_CATEGORIES.map((cat, i) => {
                  const CIcon = cat.icon;
                  const count = cat.id === "clinical" || cat.id === "marketing" ? 5 : 4;
                  return (
                    <tr key={cat.id} className={`border-b border-[#273338]/06 last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-[#FAFAF9]"}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: cat.lightColor }}
                          >
                            <CIcon className="w-4 h-4" style={{ color: cat.color }} />
                          </div>
                          <span className="font-semibold text-[#182320]">{cat.label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className="inline-block px-3 py-1 rounded-full text-xs font-bold"
                          style={{ backgroundColor: cat.lightColor, color: cat.color }}
                        >
                          {count} Features
                        </span>
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-[#273338] text-white">
                  <td className="px-6 py-4 font-bold text-sm">Total</td>
                  <td className="px-6 py-4 text-center font-black text-[#9CB080] text-sm">26 Core Features</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

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
