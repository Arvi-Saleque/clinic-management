"use client";

import React, { useEffect, useRef } from "react";
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
  Camera,
  UserCheck,
  Building2,
  Moon,
  Smartphone,
  Printer,
  CalendarIcon,
  MessageCircle,
  TrendingUp,
  Sparkles,
} from "lucide-react";

export const CATEGORIES = [
  {
    id: "operations",
    label: "Daily Operations",
    primaryColor: "#2B5748",
    secondaryColor: "#1B3D32",
    accentColor: "#4E8270",
    lightBg: "#F2F8F5",
    badgeBg: "#E3F0EA",
    badgeText: "#1B3D32",
    borderTint: "#2B574830",
    glowColor: "rgba(43,87,72,0.18)",
    icon: LayoutDashboard,
    headline: "Your clinic runs itself.",
    highlightWord: "itself.",
    subtitle:
      "Automate front-desk queues, daily appointment workflows, and doctor availability in one single workspace.",
  },
  {
    id: "clinical",
    label: "Clinical Tools",
    primaryColor: "#1A4B75",
    secondaryColor: "#0F2E4A",
    accentColor: "#2563EB",
    lightBg: "#F0F6FC",
    badgeBg: "#E0EFFE",
    badgeText: "#0F2E4A",
    borderTint: "#1A4B7530",
    glowColor: "rgba(26,75,117,0.18)",
    icon: Stethoscope,
    headline: "Dentists document everything digitally.",
    highlightWord: "everything digitally.",
    subtitle:
      "Full chairside consultation workspaces, digital odontograms, allergy warnings, and paperless prescriptions.",
  },
  {
    id: "patient",
    label: "Patient Experience",
    primaryColor: "#7E22CE",
    secondaryColor: "#581C87",
    accentColor: "#9333EA",
    lightBg: "#FAF5FF",
    badgeBg: "#F3E8FF",
    badgeText: "#581C87",
    borderTint: "#7E22CE30",
    glowColor: "rgba(126,34,206,0.18)",
    icon: UserCircle,
    headline: "Patients feel looked after.",
    highlightWord: "looked after.",
    subtitle:
      "Dedicated self-service portal, 1-click calendar sync, transparent wait times, and permanent medical safety.",
  },
  {
    id: "marketing",
    label: "Marketing & Growth",
    primaryColor: "#C2410C",
    secondaryColor: "#7C2D12",
    accentColor: "#EA580C",
    lightBg: "#FFF7ED",
    badgeBg: "#FFEDD5",
    badgeText: "#7C2D12",
    borderTint: "#C2410C30",
    glowColor: "rgba(194,65,12,0.18)",
    icon: Globe,
    headline: "Your website becomes your best salesperson.",
    highlightWord: "best salesperson.",
    subtitle:
      "High-converting marketing architecture with AI smile simulator, doctor portfolios, and branch locators.",
  },
  {
    id: "finance",
    label: "Finance & Billing",
    primaryColor: "#0F766E",
    secondaryColor: "#134E4A",
    accentColor: "#0D9488",
    lightBg: "#F0FDFA",
    badgeBg: "#CCFBF1",
    badgeText: "#134E4A",
    borderTint: "#0F766E30",
    glowColor: "rgba(15,118,110,0.18)",
    icon: CreditCard,
    headline: "No invoice is ever lost again.",
    highlightWord: "ever lost again.",
    subtitle:
      "Auto-generated treatment invoices, payment method splitting, outstanding balance tracking, and browser receipts.",
  },
  {
    id: "technology",
    label: "Technology & Access",
    primaryColor: "#4338CA",
    secondaryColor: "#312E81",
    accentColor: "#4F46E5",
    lightBg: "#EEF2FF",
    badgeBg: "#E0E7FF",
    badgeText: "#312E81",
    borderTint: "#4338CA30",
    glowColor: "rgba(67,56,202,0.18)",
    icon: Smartphone,
    headline: "Works everywhere, for everyone.",
    highlightWord: "for everyone.",
    subtitle:
      "Role-based access control, responsive mobile-first UI, dark/light theme switching, and instant WhatsApp support.",
  },
];

export const SLIDE_FEATURES = [
  // OPERATIONS (4)
  {
    number: "01",
    category: "operations",
    icon: LayoutDashboard,
    title: "Live Receptionist Dashboard",
    tagline: "Real-time front-desk queue & instant check-in.",
    highlights: [
      "Live patient countdown & waiting queue",
      "One-click check-in & instant arrival alerts",
      "Daily appointment summary in three metrics",
    ],
    benefit: "Staff always know who is next without asking.",
  },
  {
    number: "02",
    category: "operations",
    icon: CalendarCheck,
    title: "Online Patient Booking Wizard",
    tagline: "24/7 self-service booking embedded directly on your website.",
    highlights: [
      "4-step guided booking: Service → Doctor → Time",
      "Real-time slot engine — zero double bookings",
      "Instant SMS & email appointment confirmations",
    ],
    benefit: "Fewer receptionist calls; fills empty chair slots 24/7.",
  },
  {
    number: "10",
    category: "operations",
    icon: ClipboardList,
    title: "Appointments Management",
    tagline: "Filter, search, and manage every appointment in one hub.",
    highlights: [
      "Filter by doctor, date, or appointment status",
      "One-click status updates, reschedule, and cancel",
      "Instant search by patient name or phone",
    ],
    benefit: "Zero lost bookings or scheduling confusion.",
  },
  {
    number: "09",
    category: "operations",
    icon: Clock,
    title: "Doctor Diary & Availability Planner",
    tagline: "Dentists configure routine hours once; the system handles the rest.",
    highlights: [
      "Visual monthly calendar with booked slot counts",
      "Custom routine hours & holiday date overrides",
      "Smart conflict prevention engine",
    ],
    benefit: "Overlapping appointments become mathematically impossible.",
  },

  // CLINICAL (5)
  {
    number: "03",
    category: "clinical",
    icon: Stethoscope,
    title: "Digital Consultation Workspace",
    tagline: "Chairside clinical documentation on screen — not on paper.",
    highlights: [
      "Chief complaint, diagnosis, and treatment logging",
      "Instant medical history & allergy alert badges",
      "One-click auto-save draft functionality",
    ],
    benefit: "100% paperless consultations with permanent digital records.",
  },
  {
    number: "06",
    category: "clinical",
    icon: FileText,
    title: "Complete Patient Health Records",
    tagline: "Permanent digital health profiles with critical medical alerts.",
    highlights: [
      "Color-coded drug allergy & condition warnings",
      "Full appointment history & billing overview",
      "Fast searchable clinic-wide patient directory",
    ],
    benefit: "Prevents clinical mistakes before they happen.",
  },
  {
    number: "07",
    category: "clinical",
    icon: Smile,
    title: "Digital Tooth Chart (Odontogram)",
    tagline: "Interactive 32-tooth visual chart — replaces paper charts.",
    highlights: [
      "Interactive 32-tooth anatomical diagram",
      "Document restorative & periodontal conditions",
      "Synced directly to patient portal & record",
    ],
    benefit: "Modern digital charting visible to dentist and patient.",
  },
  {
    number: "08",
    category: "clinical",
    icon: Pill,
    title: "Digital Prescriptions",
    tagline: "Issue clear digital prescriptions straight from consultation.",
    highlights: [
      "Searchable clinic medication catalog",
      "Pre-filled dosing, duration, and instructions",
      "Direct sync to patient's secure portal",
    ],
    benefit: "Eliminates illegible handwriting and lost slips forever.",
  },
  {
    number: "13",
    category: "clinical",
    icon: CalendarDays,
    title: "Follow-Up Scheduling in Consultation",
    tagline: "Schedule the next recall visit before the patient stands up.",
    highlights: [
      "Schedule next visit in under 30 seconds",
      "Pre-fills doctor, service, and clinical notes",
      "Appears instantly on front-desk schedule",
    ],
    benefit: "Maximizes patient retention and treatment continuity.",
  },

  // PATIENT (4)
  {
    number: "05",
    category: "patient",
    icon: UserCircle,
    title: "Patient Self-Service Portal",
    tagline: "A private online portal for every patient — accessible 24/7.",
    highlights: [
      "Passwordless login via mobile verification",
      "View appointments, tooth chart & prescriptions",
      "Instant invoice receipts and payment history",
    ],
    benefit: "Dramatically cuts front-desk phone calls.",
  },
  {
    number: "14",
    category: "patient",
    icon: CalendarIcon,
    title: "1-Click Add-to-Calendar (.ics Export)",
    tagline: "Appointments save straight into the patient's phone calendar.",
    highlights: [
      "Syncs with Apple, Google, and Outlook calendars",
      "Includes clinic address, doctor & time details",
      "Universal .ics file support for all devices",
    ],
    benefit: "Drastically reduces patient no-shows.",
  },
  {
    number: "15",
    category: "patient",
    icon: Clock,
    title: "Live Queue & Wait Time Indicator",
    tagline: "Patients see live queue position & estimated wait times.",
    highlights: [
      "Real-time queue number on patient screen",
      "Dynamic estimated wait time calculation",
      "Transparent waiting experience",
    ],
    benefit: "Calmer waiting room and happier patients.",
  },
  {
    number: "16",
    category: "patient",
    icon: ShieldCheck,
    title: "Patient Safety & Allergy Alerts",
    tagline: "Prominent clinical alerts at every stage of patient care.",
    highlights: [
      "High-visibility allergy warnings across all views",
      "Chronic condition badges (Diabetes, Cardiac, etc.)",
      "Instant alert during prescription creation",
    ],
    benefit: "Guarantees patient safety at every touchpoint.",
  },

  // MARKETING (5)
  {
    number: "11",
    category: "marketing",
    icon: Globe,
    title: "Complete Public Website Included",
    tagline: "11 luxury designed pages built for high-end conversion.",
    highlights: [
      "Homepage, About, Services, Dentists & FAQ",
      "Direct online booking integration on every page",
      "Optimized for fast mobile loading and SEO",
    ],
    benefit: "No agency fees — complete turnkey dental website.",
  },
  {
    number: "12",
    category: "marketing",
    icon: Camera,
    title: "Interactive Smile Simulator AI",
    tagline: "Visitors preview their dream smile before booking.",
    highlights: [
      "Instant preview for Whitening, Veneers & Aligners",
      "Interactive photo upload tool on your site",
      "Direct \"Book This Treatment\" conversion button",
    ],
    benefit: "Captures high-value cosmetic dentistry cases.",
  },
  {
    number: "19",
    category: "marketing",
    icon: UserCheck,
    title: "Practitioner Public Profiles",
    tagline: "Dedicated profiles showcasing doctor credentials & services.",
    highlights: [
      "Professional biography, photo & specialities",
      "Itemized treatment catalog with pricing",
      "Direct \"Book with Dr.\" instant CTA",
    ],
    benefit: "Builds trust and patient loyalty before visit.",
  },
  {
    number: "20",
    category: "marketing",
    icon: Stethoscope,
    title: "Treatment Services Showcase",
    tagline: "Individual landing pages for every dental procedure.",
    highlights: [
      "What to expect, duration, and pricing details",
      "Service-specific FAQs to reassure patients",
      "Dedicated booking button per treatment",
    ],
    benefit: "Ranks on Google and educates patients in advance.",
  },
  {
    number: "21",
    category: "marketing",
    icon: Building2,
    title: "Multi-Location / Branch Support",
    tagline: "Manage multiple clinic branches in a single system.",
    highlights: [
      "Link doctors, schedules & pricing per branch",
      "Location filter on public booking wizard",
      "Unified reporting across all locations",
    ],
    benefit: "Scale to new branches without buying new software.",
  },

  // FINANCE (4)
  {
    number: "04",
    category: "finance",
    icon: CreditCard,
    title: "Smart Billing & Invoicing",
    tagline: "Auto-generated invoices with multi-method payment support.",
    highlights: [
      "Auto-generated on consultation completion",
      "Supports Cash, Card, Bank Transfer & Split",
      "Record partial payments and installments",
    ],
    benefit: "Zero billing errors and 100% financial transparency.",
  },
  {
    number: "24",
    category: "finance",
    icon: Printer,
    title: "Printable Invoice Receipts",
    tagline: "Professional branded receipts printed directly from browser.",
    highlights: [
      "Formatted for standard A4 and receipt printers",
      "Includes clinic logo, tax number & itemization",
      "One-click PDF download & print",
    ],
    benefit: "Instant professional receipts for insurance claims.",
  },
  {
    number: "25",
    category: "finance",
    icon: TrendingUp,
    title: "Outstanding Balance Tracking",
    tagline: "Track overdue balances and protect clinic cash flow.",
    highlights: [
      "Filter by \"Outstanding\" & \"Partially Paid\"",
      "Total clinic unpaid balance dashboard summary",
      "Quick payment recording in seconds",
    ],
    benefit: "Significantly reduces bad debt and overdue invoices.",
  },
  {
    number: "26",
    category: "finance",
    icon: CreditCard,
    title: "Payment Method Splitting",
    tagline: "Accept split payments (e.g. cash + card) against one bill.",
    highlights: [
      "Record multiple payment types per invoice",
      "Automatic remaining balance calculation",
      "Full audit trail of all transactions",
    ],
    benefit: "Convenient for patients; accurate for bookkeeping.",
  },

  // TECHNOLOGY (4)
  {
    number: "17",
    category: "technology",
    icon: Lock,
    title: "Role-Based Access Control",
    tagline: "Three security tiers: Admin, Doctor, and Receptionist.",
    highlights: [
      "Strict permissions for sensitive financial data",
      "Doctor access to clinical charts & diary only",
      "Receptionist access to booking & check-in",
    ],
    benefit: "Protects patient confidentiality and prevents errors.",
  },
  {
    number: "18",
    category: "technology",
    icon: Smartphone,
    title: "Mobile-First Responsive Design",
    tagline: "Flawless on iPads at reception, phones on the go, and PCs.",
    highlights: [
      "Touch-optimized for front-desk tablets",
      "Mobile web booking for smartphone patients",
      "No app download required — opens in browser",
    ],
    benefit: "Use the iPads and computers you already own.",
  },
  {
    number: "22",
    category: "technology",
    icon: Moon,
    title: "Dark & Light Mode Support",
    tagline: "Eye-friendly dark mode for long clinical doctor shifts.",
    highlights: [
      "One-click theme switch in navigation",
      "High-contrast clinical color palette",
      "Remembers preference per staff member",
    ],
    benefit: "Reduces clinician eye fatigue during busy days.",
  },
  {
    number: "23",
    category: "technology",
    icon: MessageCircle,
    title: "Direct WhatsApp & FAQ Integration",
    tagline: "Instant patient messaging & automated FAQ answers.",
    highlights: [
      "Floating WhatsApp chat button on all pages",
      "Expandable FAQ accordion for common queries",
      "Click-to-call mobile phone integration",
    ],
    benefit: "Reduces repetitive inbound receptionist calls.",
  },
];

export function FeaturesSlideDeck() {
  const deckWrapperRef = useRef<HTMLDivElement | null>(null);

  // Group features by category
  const grouped: Record<string, typeof SLIDE_FEATURES> = {};
  for (const f of SLIDE_FEATURES) {
    if (!grouped[f.category]) grouped[f.category] = [];
    grouped[f.category].push(f);
  }

  // Initialize GSAP ScrollTrigger
  useEffect(() => {
    let ctx: any;

    const initGSAP = async () => {
      const gsapModule = await import("gsap");
      const scrollTriggerModule = await import("gsap/ScrollTrigger");

      const gsap = gsapModule.gsap || gsapModule.default;
      const ScrollTrigger =
        scrollTriggerModule.ScrollTrigger || scrollTriggerModule.default;

      gsap.registerPlugin(ScrollTrigger);

      if (!deckWrapperRef.current) return;

      ctx = gsap.context(() => {
        const panels = gsap.utils.toArray<HTMLElement>(
          ".gsap-feature-section",
          deckWrapperRef.current
        );

        if (!panels.length) return;

        // Apply vanishing & rising step scroll effect for all panels except the last
        const animPanels = [...panels];
        animPanels.pop(); // Last panel continues naturally into the next section

        animPanels.forEach((panel) => {
          const innerPanel = panel.querySelector<HTMLElement>(".section-inner");
          if (!innerPanel) return;

          const panelHeight = innerPanel.offsetHeight;
          const windowHeight = window.innerHeight;
          const difference = panelHeight - windowHeight;

          const fakeScrollRatio =
            difference > 0 ? difference / (difference + windowHeight) : 0;

          if (fakeScrollRatio) {
            panel.style.marginBottom = `${panelHeight * fakeScrollRatio}px`;
          }

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: panel,
              start: "bottom bottom",
              end: () =>
                fakeScrollRatio
                  ? `+=${innerPanel.offsetHeight}`
                  : "bottom top",
              pinSpacing: false,
              pin: true,
              scrub: 0.8,
            },
          });

          if (fakeScrollRatio) {
            tl.to(innerPanel, {
              yPercent: -100,
              y: window.innerHeight,
              duration: 1 / (1 - fakeScrollRatio) - 1,
              ease: "none",
            });
          }

          // Vanishing effect: Scales down & fades out while next card scrolls up
          tl.fromTo(
            panel,
            { scale: 1, opacity: 1 },
            { scale: 0.76, opacity: 0.35, duration: 0.85, ease: "power1.inOut" }
          ).to(panel, {
            opacity: 0,
            scale: 0.68,
            duration: 0.15,
            ease: "power1.in",
          });
        });

        ScrollTrigger.refresh();
      }, deckWrapperRef);
    };

    initGSAP();

    return () => {
      if (ctx) ctx.revert();
    };
  }, []);

  return (
    <div
      ref={deckWrapperRef}
      className="slides-wrapper relative w-full bg-gradient-to-b from-[#F7FAF8] via-[#EFF5F1] to-[#FBFBF9] py-12 md:py-16 text-[#273338]"
    >
      {/* Ambient background soft luxury lighting */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(43,87,72,0.08),_transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_60%,_rgba(156,176,128,0.10),_transparent_60%)]" />

      {/* Feature Showcase Main Introductory Header */}
      <div className="container max-w-5xl mx-auto px-4 text-center mb-16 md:mb-20 pt-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2B5748]/10 border border-[#2B5748]/20 text-[#2B5748] text-xs font-semibold tracking-wide uppercase mb-4 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Feature Breakdown</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-[#182320] tracking-tight mb-4 leading-tight">
          Explore All System <i className="font-serif text-[#2B5748]">Features & Capabilities</i>
        </h2>
        <p className="text-[#55645E] text-base sm:text-lg md:text-xl max-w-2xl mx-auto font-normal leading-relaxed">
          Scroll down to discover the core modules and integrated tools built for modern dental clinics.
        </p>
      </div>

      {/* The 6 GSAP Pinned Sections */}
      <div className="slides-container container relative mx-auto max-w-6xl px-3 sm:px-6">
        {CATEGORIES.map((cat) => {
          const features = grouped[cat.id] || [];

          return (
            <section
              key={cat.id}
              id={`slide-${cat.id}`}
              className="gsap-feature-section w-full min-h-[calc(100vh-100px)] mb-16 sm:mb-24 flex justify-center items-center relative box-border"
              style={{
                willChange: "transform, opacity",
              }}
            >
              <div className="section-content w-full">
                {/* Master Presentation Slide Card */}
                <div
                  className="section-inner w-full rounded-[32px] sm:rounded-[40px] border bg-white shadow-[0_24px_70px_-15px_rgba(27,38,33,0.14)] overflow-hidden transition-colors"
                  style={{
                    borderColor: `${cat.primaryColor}35`,
                    boxShadow: `0 24px 70px -15px ${cat.glowColor}, 0 10px 30px -10px rgba(0,0,0,0.06)`,
                  }}
                >
                  {/* Slide Top Banner — CENTERED HEADLINE & VALUE PROPOSITION */}
                  <div
                    className="relative border-b p-6 sm:p-8 md:p-10 text-center transition-colors"
                    style={{
                      backgroundColor: cat.lightBg,
                      borderColor: `${cat.primaryColor}20`,
                    }}
                  >
                    {/* Centered Large Bold Headline */}
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-[#182320] max-w-4xl mx-auto leading-tight">
                      {cat.headline.split(cat.highlightWord)[0]}
                      <i
                        className="font-serif font-normal italic drop-shadow-xs"
                        style={{ color: cat.primaryColor }}
                      >
                        {cat.highlightWord}
                      </i>
                    </h2>

                    {/* Centered Clean Subtitle */}
                    <p className="mt-3 max-w-2xl mx-auto text-sm sm:text-base font-normal leading-relaxed text-[#55645E]">
                      {cat.subtitle}
                    </p>
                  </div>

                  {/* Feature Cards Grid within this Slide — Focused, Lucrative, High-Impact */}
                  <div className="relative p-5 sm:p-7 md:p-9 bg-white">
                    <div
                      className={`grid gap-5 sm:gap-6 ${
                        features.length === 5
                          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                          : "grid-cols-1 md:grid-cols-2"
                      }`}
                    >
                      {features.map((feature, fIdx) => {
                        const FIcon = feature.icon;
                        const isSpan = features.length === 5 && fIdx === 0;
                        const cardNum = `0${fIdx + 1}`;

                        return (
                          <div
                            key={feature.title}
                            className={`group relative flex flex-col justify-between rounded-2xl sm:rounded-3xl border p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                              isSpan ? "md:col-span-2 lg:col-span-1" : ""
                            }`}
                            style={{
                              backgroundColor:
                                fIdx % 2 === 0 ? "#FFFFFF" : cat.lightBg,
                              borderColor: `${cat.primaryColor}25`,
                              boxShadow: `0 4px 20px -6px rgba(0,0,0,0.04)`,
                            }}
                          >
                            {/* Watermark Number per Section (01, 02, 03, 04...) */}
                            <div
                              className="pointer-events-none absolute right-5 top-5 select-none text-3xl sm:text-4xl font-black opacity-[0.09]"
                              style={{ color: cat.primaryColor }}
                            >
                              {cardNum}
                            </div>

                            <div>
                              {/* Top Bar with Sequential Number Badge, Icon & Title */}
                              <div className="mb-3 flex items-center gap-3.5">
                                <div
                                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-xs transition-transform duration-300 group-hover:scale-105"
                                  style={{
                                    backgroundColor: "#ffffff",
                                    borderColor: `${cat.primaryColor}30`,
                                    color: cat.primaryColor,
                                  }}
                                >
                                  <FIcon
                                    className="h-5 w-5"
                                    style={{ color: cat.primaryColor }}
                                  />
                                </div>
                                <div className="flex-1 min-w-0 pr-6">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span
                                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                                      style={{
                                        backgroundColor: cat.badgeBg,
                                        color: cat.badgeText,
                                      }}
                                    >
                                      {cardNum}
                                    </span>
                                  </div>
                                  <h4 className="text-base sm:text-lg font-bold leading-snug text-[#182320]">
                                    {feature.title}
                                  </h4>
                                </div>
                              </div>

                              {/* Focused Tagline */}
                              <p
                                className="mb-3.5 text-xs font-medium italic leading-relaxed"
                                style={{ color: cat.primaryColor }}
                              >
                                {feature.tagline}
                              </p>

                              {/* Focused 3 Key Feature Highlights */}
                              <ul className="mb-4 space-y-2">
                                {feature.highlights.map((h, hi) => (
                                  <li
                                    key={hi}
                                    className="flex items-start gap-2 text-xs text-[#273338]"
                                  >
                                    <span
                                      className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
                                      style={{
                                        backgroundColor: cat.badgeBg,
                                        color: cat.primaryColor,
                                      }}
                                    >
                                      ✓
                                    </span>
                                    <span className="leading-tight font-medium text-[#3A4843]">
                                      {h}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Benefit Badge Footer */}
                            <div
                              className="mt-auto rounded-xl border p-2.5 sm:p-3 text-xs leading-relaxed transition-colors group-hover:shadow-xs"
                              style={{
                                backgroundColor: "#ffffff",
                                borderColor: `${cat.primaryColor}25`,
                                color: cat.secondaryColor,
                              }}
                            >
                              <span
                                className="font-bold uppercase tracking-wider text-[9px]"
                                style={{ color: cat.primaryColor }}
                              >
                                Key Outcome ·{" "}
                              </span>
                              <span className="font-medium text-[#273338]">
                                {feature.benefit}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
