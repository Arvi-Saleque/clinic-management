"use client";

import React, { useState, useEffect, useRef } from "react";
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
  ChevronDown,
  Layers,
  Activity,
  Award,
  Wallet,
  Cpu,
} from "lucide-react";

export const CATEGORIES = [
  {
    id: "operations",
    label: "Daily Operations",
    badge: "Operations Engine",
    themeName: "Emerald",
    primaryColor: "#2B5748",
    secondaryColor: "#1B3D32",
    accentColor: "#4E8270",
    lightBg: "#F2F8F5",
    badgeBg: "#E3F0EA",
    badgeText: "#1B3D32",
    borderTint: "#2B574825",
    glowColor: "rgba(43,87,72,0.15)",
    icon: LayoutDashboard,
    deckIcon: Activity,
    headline: "Your clinic runs itself.",
    highlightWord: "itself.",
    subtitle:
      "Automate front-desk queues, daily appointment workflows, and doctor availability in one single workspace.",
  },
  {
    id: "clinical",
    label: "Clinical Tools",
    badge: "Digital Chairside",
    themeName: "Sapphire",
    primaryColor: "#1A4B75",
    secondaryColor: "#0F2E4A",
    accentColor: "#2563EB",
    lightBg: "#F0F6FC",
    badgeBg: "#E0EFFE",
    badgeText: "#0F2E4A",
    borderTint: "#1A4B7525",
    glowColor: "rgba(26,75,117,0.15)",
    icon: Stethoscope,
    deckIcon: FileText,
    headline: "Dentists document everything digitally.",
    highlightWord: "everything digitally.",
    subtitle:
      "Full chairside consultation workspaces, digital odontograms, allergy warnings, and paperless prescriptions.",
  },
  {
    id: "patient",
    label: "Patient Experience",
    badge: "Patient Portal",
    themeName: "Orchid",
    primaryColor: "#7E22CE",
    secondaryColor: "#581C87",
    accentColor: "#9333EA",
    lightBg: "#FAF5FF",
    badgeBg: "#F3E8FF",
    badgeText: "#581C87",
    borderTint: "#7E22CE25",
    glowColor: "rgba(126,34,206,0.15)",
    icon: Heart,
    deckIcon: Heart,
    headline: "Patients feel looked after.",
    highlightWord: "looked after.",
    subtitle:
      "Dedicated self-service portal, 1-click calendar sync, transparent wait times, and permanent medical safety.",
  },
  {
    id: "marketing",
    label: "Marketing & Growth",
    badge: "Growth Engine",
    themeName: "Amber",
    primaryColor: "#C2410C",
    secondaryColor: "#7C2D12",
    accentColor: "#EA580C",
    lightBg: "#FFF7ED",
    badgeBg: "#FFEDD5",
    badgeText: "#7C2D12",
    borderTint: "#C2410C25",
    glowColor: "rgba(194,65,12,0.15)",
    icon: TrendingUp,
    deckIcon: Award,
    headline: "Your website becomes your best salesperson.",
    highlightWord: "best salesperson.",
    subtitle:
      "High-converting marketing architecture with AI smile simulator, doctor portfolios, and branch locators.",
  },
  {
    id: "finance",
    label: "Finance & Billing",
    badge: "Revenue Shield",
    themeName: "Teal",
    primaryColor: "#0F766E",
    secondaryColor: "#134E4A",
    accentColor: "#0D9488",
    lightBg: "#F0FDFA",
    badgeBg: "#CCFBF1",
    badgeText: "#134E4A",
    borderTint: "#0F766E25",
    glowColor: "rgba(15,118,110,0.15)",
    icon: CreditCard,
    deckIcon: Wallet,
    headline: "No invoice is ever lost again.",
    highlightWord: "ever lost again.",
    subtitle:
      "Auto-generated treatment invoices, payment method splitting, outstanding balance tracking, and browser receipts.",
  },
  {
    id: "technology",
    label: "Technology & Access",
    badge: "Cloud Security",
    themeName: "Indigo",
    primaryColor: "#4338CA",
    secondaryColor: "#312E81",
    accentColor: "#4F46E5",
    lightBg: "#EEF2FF",
    badgeBg: "#E0E7FF",
    badgeText: "#312E81",
    borderTint: "#4338CA25",
    glowColor: "rgba(67,56,202,0.15)",
    icon: Zap,
    deckIcon: Cpu,
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
    tagline: "Your entire clinic at a glance — always up to date.",
    tag: "Real-time Sync",
    description:
      "The moment staff arrive, they see every patient due today, who has checked in, and how many visits are complete — all automatically, all in real time. No more searching through paper lists.",
    highlights: [
      '"Next Patient" card with live countdown timer',
      "Real-time waiting queue and one-click check-in",
      "Today's appointment summary in three numbers",
      "Quick-action buttons for booking and patient registration",
    ],
    benefit: "Staff always know who is next without asking anyone.",
  },
  {
    number: "02",
    category: "operations",
    icon: CalendarCheck,
    title: "Online Patient Booking Wizard",
    tagline: "Patients book appointments themselves — 24 hours a day.",
    tag: "24/7 Automation",
    description:
      "A simple, beautiful 4-step booking form on your website. Patients choose their treatment, pick an available doctor, select an open time slot, and confirm — no phone call needed.",
    highlights: [
      "4-step guided booking: Service → Doctor → Time → Details",
      "Shows only real available time slots — zero double booking",
      "Works on any mobile phone, tablet, or computer",
      "Patients receive instant confirmation with their reference number",
    ],
    benefit: "Fewer interruptions for staff. More appointments filled automatically.",
  },
  {
    number: "10",
    category: "operations",
    icon: ClipboardList,
    title: "Appointments Management",
    tagline: "Every appointment, every status — one organised workspace.",
    tag: "Full Control",
    description:
      "A powerful filtering and search workspace that gives staff full control over all appointments. Jump to any date, filter by doctor, and update appointment statuses with one click.",
    highlights: [
      "Filter by date, doctor, or appointment status",
      "Search by patient name, phone, or appointment ID",
      "Colour-coded status badges for instant identification",
      "One-click check-in, reschedule, and cancellation",
    ],
    benefit: "No more lost appointments or scheduling confusion.",
  },
  {
    number: "09",
    category: "operations",
    icon: Clock,
    title: "Doctor Diary & Availability Planner",
    tagline: "Doctors set their schedule once. The system handles the rest.",
    tag: "Zero Conflict",
    description:
      "Each dentist defines their working hours for each day of the week. The system automatically calculates which time slots are free and offers only those to patients when booking.",
    highlights: [
      "Visual monthly calendar showing booked appointment counts",
      "Set weekly routine hours for each doctor",
      "Override specific dates for holidays or special hours",
      "Zero overbooking — guaranteed by the system",
    ],
    benefit: "Scheduling conflicts become impossible.",
  },

  // CLINICAL (5)
  {
    number: "03",
    category: "clinical",
    icon: Stethoscope,
    title: "Digital Consultation Workspace",
    tagline: "The dentist's clinical record — on screen, not on paper.",
    tag: "Chairside Command",
    description:
      "During each patient visit, the dentist documents the complaint, diagnosis, treatment performed, and aftercare notes directly on screen. All previous visits appear in a sidebar for instant context.",
    highlights: [
      "Chief complaint, diagnosis, and treatment notes",
      "Instant access to the patient's full medical history and allergy alerts",
      "Previous visits shown in a sidebar for reference",
      '"Save Draft" — never lose work mid-consultation',
    ],
    benefit: "No paper files. Every visit is digitally recorded and permanently accessible.",
  },
  {
    number: "06",
    category: "clinical",
    icon: FileText,
    title: "Complete Patient Health Records",
    tagline: "Every patient's full story — identity, history, and allergies — instantly.",
    tag: "Permanent History",
    description:
      "Each patient has a permanent digital profile storing their contact details, medical history, known allergies, chronic conditions, and current medications. Staff see critical alerts the moment they open a record.",
    highlights: [
      "Allergy alerts shown with colour-coded warning badges",
      "Known conditions and current medications always visible",
      "Full appointment history and billing status at a glance",
      "Searchable patient directory with smart filter tabs",
    ],
    benefit: "Staff are always informed — preventing clinical mistakes before they happen.",
  },
  {
    number: "07",
    category: "clinical",
    icon: Smile,
    title: "Digital Tooth Chart (Odontogram)",
    tagline: "Every tooth charted digitally — replaces paper charts entirely.",
    tag: "32-Tooth Visual Map",
    description:
      "An interactive visual map of all 32 teeth, used by dentists to chart the clinical condition of each tooth. Replaces paper tooth charts entirely and links directly to the patient record.",
    highlights: [
      "Interactive diagram of all 32 teeth",
      "Accessible by both dentists and patients in their portal",
      "Linked to the patient's permanent clinical history",
      "Dentists can view any registered patient's chart",
    ],
    benefit: "No more paper tooth charts — conditions are recorded digitally, instantly.",
  },
  {
    number: "08",
    category: "clinical",
    icon: Pill,
    title: "Digital Prescriptions",
    tagline: "Prescriptions issued, saved, and searchable — no handwriting required.",
    tag: "Searchable Rx",
    description:
      "Dentists issue prescriptions directly from within the consultation. Each prescription lists all medications, dosage, frequency, and special instructions. Patients see their prescription history in their portal.",
    highlights: [
      "Multiple medications on a single prescription",
      "Dosage, frequency, duration, and special instructions recorded",
      "Searchable clinic-wide prescription catalog for staff",
      "Patients view their own prescriptions in their secure portal",
    ],
    benefit: "Eliminates illegible handwriting and lost prescription records forever.",
  },
  {
    number: "13",
    category: "clinical",
    icon: CalendarDays,
    title: "Follow-Up Scheduling in Consultation",
    tagline: "Book the next visit before the patient even stands up.",
    tag: "Instant Recall",
    description:
      "Dentists can book the patient's next appointment right from the consultation screen. The date, time, and reason are saved immediately into the clinic calendar without going to reception.",
    highlights: [
      "Book the next visit in under 30 seconds",
      "Doctor, treatment, and follow-up notes pre-filled",
      "Appears immediately on the receptionist's schedule",
      "Patient sees it in their portal instantly",
    ],
    benefit: "Higher patient retention — follow-ups are never forgotten.",
  },

  // PATIENT (4)
  {
    number: "05",
    category: "patient",
    icon: UserCircle,
    title: "Patient Self-Service Portal",
    tagline: "A private online account for every patient — available 24/7.",
    tag: "Self-Service",
    description:
      "Patients log in securely with their mobile number to see their upcoming and past appointments, view their tooth chart, download prescriptions, check invoice receipts, and update their details.",
    highlights: [
      "Passwordless login with mobile number verification",
      "View all upcoming and past appointments with doctor details",
      "Access personal tooth chart and prescription history",
      "View itemised invoices and payment statuses",
    ],
    benefit: "Patients love having everything on their phone. Front-desk calls drop significantly.",
  },
  {
    number: "14",
    category: "patient",
    icon: CalendarIcon,
    title: "1-Click Add-to-Calendar (.ics Export)",
    tagline: "Appointments go straight into the patient's phone calendar.",
    tag: "Calendar Sync",
    description:
      "From their confirmation email, SMS, or patient portal, patients click one button to save their appointment to Apple Calendar, Google Calendar, or Outlook with all clinic details.",
    highlights: [
      "Works with Apple Calendar, Google Calendar, and Outlook",
      "Includes clinic address, doctor name, and appointment time",
      "Available from the booking confirmation screen and portal",
      "Standard .ics format compatible with every smartphone",
    ],
    benefit: "Reduces no-shows — the appointment is in their phone calendar automatically.",
  },
  {
    number: "15",
    category: "patient",
    icon: Clock,
    title: "Live Queue & Wait Time Indicator",
    tagline: "Patients always know where they stand in the queue.",
    tag: "Live Tracker",
    description:
      "The patient portal displays the patient's queue position in real time. Patients can see how many people are ahead of them and their estimated wait time, reducing anxiety in the waiting room.",
    highlights: [
      "Real-time queue number displayed on the patient's screen",
      "Estimated wait time updated automatically",
      "Reduces patient frustration during busy clinic hours",
      "Front-desk staff do not have to answer \"how much longer?\"",
    ],
    benefit: "A calmer waiting room and happier patients.",
  },
  {
    number: "16",
    category: "patient",
    icon: ShieldCheck,
    title: "Patient Safety & Allergy Warnings",
    tagline: "Critical alerts that prevent clinical mistakes before they happen.",
    tag: "Clinical Safety",
    description:
      "Every time a patient's record is opened — in the waiting queue, during booking, or in consultation — bright, prominent warnings highlight known drug allergies and chronic health conditions.",
    highlights: [
      "Allergy warnings shown prominently in red across all screens",
      "Chronic condition badges (e.g. Diabetes, Hypertension, Cardiac)",
      "Alerts are impossible to miss before prescribing medications",
      "Patients can declare allergies during online registration",
    ],
    benefit: "Clinical safety is built in at every single step.",
  },

  // MARKETING (5)
  {
    number: "11",
    category: "marketing",
    icon: Globe,
    title: "Complete Public Website Included",
    tagline: "A world-class website that attracts and converts new patients.",
    tag: "11 Luxury Pages",
    description:
      "The platform comes with a beautifully designed, mobile-first marketing website: Homepage, About Us, Services, Dentists Directory, Smile Gallery, FAQ, and Contact pages — fully integrated with your booking engine.",
    highlights: [
      "11 fully designed pages built in",
      "Modern luxury aesthetic tailored for high-end dental clinics",
      "Fast-loading and fully optimised for search engines (SEO)",
      "Direct \"Book Now\" buttons on every page leading to the booking wizard",
    ],
    benefit: "No need to pay a web agency. You get an enterprise-grade website out of the box.",
  },
  {
    number: "12",
    category: "marketing",
    icon: Camera,
    title: "Interactive Smile Simulator AI",
    tagline: "Patients see their dream smile before they ever sit in the chair.",
    tag: "AI Smile Simulation",
    description:
      "An interactive tool on your website where visitors upload a photo of their smile and preview the results of Teeth Whitening, Veneers, or Aligners. Captures patient interest and leads directly to a booking.",
    highlights: [
      "Interactive photo upload and instant preview",
      "Simulates Whitening, Veneers, Aligners, and Crowns",
      "Direct \"Book This Treatment\" button from the result screen",
      "Drives high-value cosmetic dentistry enquiries",
    ],
    benefit: "Attracts high-value cosmetic patients who are already excited to start.",
  },
  {
    number: "19",
    category: "marketing",
    icon: UserCheck,
    title: "Practitioner Public Profiles",
    tagline: "Every dentist has a beautiful public profile — trust before the first appointment.",
    tag: "Doctor Branding",
    description:
      "Each dentist gets a professionally designed public profile page showing their photo, specialities, biography, and the treatments they offer — with a direct booking button pre-selecting them.",
    highlights: [
      "Professional photo, credentials, and biography",
      "List of offered treatments with prices and durations",
      'Direct "Book with Dr. [Name]" button for patients',
      "Builds personal trust before the first visit",
    ],
    benefit: "Patients who choose their dentist by name show up and stay loyal.",
  },
  {
    number: "20",
    category: "marketing",
    icon: Stethoscope,
    title: "Treatment Services Showcase",
    tagline: "Every treatment gets its own dedicated page — each one a mini landing page.",
    tag: "SEO Landing Pages",
    description:
      "Each dental treatment offered by the clinic has its own individual service page with a full description, what to expect, pricing, FAQs, and a direct booking button for that specific service.",
    highlights: [
      "Individual pages for every treatment category",
      "What to expect, duration, and pricing on each page",
      "Treatment-specific FAQs to reassure hesitant patients",
      'Direct "Book This Treatment" CTA on every page',
    ],
    benefit: "Service pages rank in Google. Patients arrive already informed.",
  },
  {
    number: "21",
    category: "marketing",
    icon: Building2,
    title: "Multi-Location / Branch Support",
    tagline: "One system. Multiple clinics. Zero complexity.",
    tag: "Multi-Branch Ready",
    description:
      "If your clinic grows to a second or third location, the entire system is already built to handle it. Practitioners, appointments, and availability are all branch-aware from day one.",
    highlights: [
      "Each practitioner linked to a specific branch",
      "Appointments, availability, and pricing per branch",
      "Booking wizard filters practitioners by location",
      "No separate system needed for each branch",
    ],
    benefit: "Expand to new locations without changing your software.",
  },

  // FINANCE (4)
  {
    number: "04",
    category: "finance",
    icon: CreditCard,
    title: "Smart Billing & Invoice Management",
    tagline: "Professional invoicing — from zero to paid in under a minute.",
    tag: "Instant Invoicing",
    description:
      "Invoices are generated automatically at the end of each consultation. Staff can add or adjust items, apply discounts, record payments in multiple ways, and track every outstanding balance from one workspace.",
    highlights: [
      "Auto-generated invoices on consultation completion",
      "Partial payment and instalment recording",
      "Invoice statuses: Draft, Outstanding, Partially Paid, Paid, Void",
      "Payment methods: Cash, Card, Bank Transfer, and Other",
    ],
    benefit: "No billing errors. No lost revenue. Full financial transparency.",
  },
  {
    number: "24",
    category: "finance",
    icon: Printer,
    title: "Printable Invoice Receipts",
    tagline: "Professional receipts printed straight from the browser — no extra software.",
    tag: "Print & PDF",
    description:
      "Any invoice can be printed directly from the browser as a formatted receipt. It includes the clinic name, patient details, itemised treatments, subtotal, discount, total, and payment status.",
    highlights: [
      "Clean, branded layout formatted for standard A4 and receipt printers",
      "Includes clinic logo, address, and tax registration number",
      "Itemised breakdown of all treatments and discounts applied",
      "One-click \"Print Receipt\" button on every invoice",
    ],
    benefit: "Patients receive a professional receipt immediately. No accounting delays.",
  },
  {
    number: "25",
    category: "finance",
    icon: TrendingUp,
    title: "Outstanding Balance Tracking",
    tagline: "Never let an unpaid bill slip through the cracks.",
    tag: "Cash Flow Protection",
    description:
      "The billing workspace instantly highlights all invoices with an unpaid or partially paid balance. Staff can see total outstanding amounts across the clinic and filter by overdue days.",
    highlights: [
      "Filter invoices by \"Outstanding\" and \"Partially Paid\" with one click",
      "Total unpaid balance displayed prominently at the top of the billing screen",
      "Quick-record payment button to log incoming payments instantly",
      "Patient profile shows their total outstanding balance",
    ],
    benefit: "Significantly improves clinic cash flow and reduces bad debt.",
  },
  {
    number: "26",
    category: "finance",
    icon: CreditCard,
    title: "Payment Method Splitting",
    tagline: "Accept split payments — part cash, part card — with ease.",
    tag: "Split Tender",
    description:
      "Patients often want to pay a portion in cash and the remainder by card or bank transfer. The system supports multi-method payments against a single invoice with full record-keeping.",
    highlights: [
      "Record multiple payments against a single invoice",
      "Supports Cash, Credit/Debit Card, Bank Transfer, and Other",
      "Shows remaining balance after each payment is logged",
      "Full audit trail of who received each payment and when",
    ],
    benefit: "Flexible for patients, 100% accurate for your accounts.",
  },

  // TECHNOLOGY (4)
  {
    number: "17",
    category: "technology",
    icon: Lock,
    title: "Role-Based Access Control",
    tagline: "Everyone sees only what they need to see. Data stays safe.",
    tag: "3-Tier RBAC",
    description:
      "The system has three built-in role tiers — Administrator, Doctor, and Receptionist. Each role has strictly defined permissions to protect confidential patient data and financial records.",
    highlights: [
      "Administrator: Full access to settings, staff, billing, and reports",
      "Doctor: Clinical workspace, tooth charts, prescriptions, and their own calendar",
      "Receptionist: Booking, check-in, patient registration, and payments",
      "Protected routes prevent unauthorised access automatically",
    ],
    benefit: "Complies with medical data protection standards. Prevents staff errors.",
  },
  {
    number: "18",
    category: "technology",
    icon: Smartphone,
    title: "Mobile-First Responsive Design",
    tagline: "Runs on iPads at the front desk, iPhones on the go, and desktop PCs.",
    tag: "Any Device",
    description:
      "Every single screen — from the receptionist dashboard to the patient booking wizard — is built to work seamlessly on phones, tablets, and desktop computers without installing any app.",
    highlights: [
      "Touch-friendly controls designed for iPad use at reception",
      "Full mobile experience for patients booking from their phones",
      "Dentists can check their schedule from home on their phone",
      "No app download required — opens in any modern web browser",
    ],
    benefit: "No expensive hardware needed. Use whatever devices you already own.",
  },
  {
    number: "22",
    category: "technology",
    icon: Moon,
    title: "Dark & Light Mode Support",
    tagline: "Comfortable for doctors during long shifts. Beautiful in any lighting.",
    tag: "Adaptive UI",
    description:
      "The entire staff dashboard supports both Dark Mode and Light Mode with a single toggle. Dark Mode reduces eye strain for clinicians working long hours at computer screens.",
    highlights: [
      "One-click theme toggle in the navigation bar",
      "Dark Mode with high-contrast, eye-friendly clinical colours",
      "Preference is saved automatically per user",
      "Crisp, readable text in both modes",
    ],
    benefit: "Staff work more comfortably, with less fatigue during busy clinic days.",
  },
  {
    number: "23",
    category: "technology",
    icon: MessageCircle,
    title: "Direct WhatsApp & FAQ Integration",
    tagline: "Connect with patients on the app they use every single day.",
    tag: "Instant Patient Help",
    description:
      "A floating WhatsApp button on the public website lets patients message the clinic instantly with one tap. Combined with an extensive FAQ accordion, common questions are answered automatically.",
    highlights: [
      "Floating WhatsApp chat button on all public pages",
      "Click-to-call phone link for mobile users",
      "Expandable FAQ accordion with common patient questions",
      "Reduces inbound phone calls significantly",
    ],
    benefit: "Fewer phone enquiries. Patients arrive informed and confident.",
  },
];

export function FeaturesSlideDeck() {
  const [activeSlide, setActiveSlide] = useState(0);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Group features by category
  const grouped: Record<string, typeof SLIDE_FEATURES> = {};
  for (const f of SLIDE_FEATURES) {
    if (!grouped[f.category]) grouped[f.category] = [];
    grouped[f.category].push(f);
  }

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const triggerPoint = scrollY + viewportHeight * 0.35;

      slideRefs.current.forEach((el, index) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const elementTop = rect.top + scrollY;
        const elementBottom = elementTop + rect.height;

        if (triggerPoint >= elementTop && triggerPoint < elementBottom) {
          setActiveSlide(index);
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSlide = (index: number) => {
    const el = slideRefs.current[index];
    if (el) {
      const yOffset = -90;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <section className="relative w-full bg-gradient-to-b from-[#F7FAF8] via-[#EFF5F1] to-[#FBFBF9] py-16 md:py-24 overflow-visible text-[#273338]">
      {/* Ambient background soft luxury lighting */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(43,87,72,0.08),_transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_60%,_rgba(156,176,128,0.10),_transparent_60%)]" />

      {/* Section Title & Intro */}
      <div className="container relative z-10 mx-auto max-w-5xl px-4 text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2B5748]/10 text-[#2B5748] text-xs font-bold uppercase tracking-wider mb-4 border border-[#2B5748]/20 shadow-xs">
          <Layers className="w-3.5 h-3.5 text-[#2B5748]" />
          <span>Interactive Feature Showcase</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-[#182320] tracking-tight leading-tight">
          Explore Every Capability, <br />
          <i className="font-serif text-[#2B5748] font-normal">Slide by Slide.</i>
        </h2>
        <p className="text-[#55645E] text-sm sm:text-base max-w-2xl mx-auto mt-4 leading-relaxed">
          Scroll down to seamlessly transition through each specialized operational pillar. Each slide reveals full chairside, operational, and financial tools with rich interactive details.
        </p>
      </div>

      {/* Sticky Presentation Navigation Dock (Bright Luxury Glassmorphic Pill) */}
      <div className="sticky top-20 z-50 mb-16 flex justify-center px-4">
        <div className="flex max-w-full items-center gap-1.5 sm:gap-2 overflow-x-auto rounded-full border border-[#273338]/10 bg-white/90 p-1.5 shadow-[0_16px_45px_-10px_rgba(27,38,33,0.12)] backdrop-blur-2xl no-scrollbar">
          <div className="flex items-center gap-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-[#2B5748] shrink-0">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Deck:</span>
          </div>

          {CATEGORIES.map((cat, idx) => {
            const isActive = activeSlide === idx;
            const CatIcon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => scrollToSlide(idx)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 sm:px-4 py-1.5 text-xs font-semibold transition-all duration-300 shrink-0 ${
                  isActive
                    ? "text-white shadow-md scale-105"
                    : "text-[#55645E] hover:bg-[#273338]/05 hover:text-[#182320]"
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: cat.primaryColor,
                        boxShadow: `0 6px 20px -4px ${cat.primaryColor}50`,
                      }
                    : {}
                }
              >
                <CatIcon
                  className="h-3.5 w-3.5"
                  style={{ color: isActive ? "#ffffff" : cat.primaryColor }}
                />
                <span>
                  0{idx + 1}. {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stacked Presentation Slides Container */}
      <div className="container relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="space-y-28 md:space-y-40">
          {CATEGORIES.map((cat, idx) => {
            const features = grouped[cat.id] || [];
            const CatIcon = cat.icon;
            const isLast = idx === CATEGORIES.length - 1;

            return (
              <div
                key={cat.id}
                id={`slide-${cat.id}`}
                ref={(el) => {
                  slideRefs.current[idx] = el;
                }}
                className="group/slide sticky z-20 transition-all duration-500"
                style={{
                  top: `${90 + idx * 6}px`,
                }}
              >
                {/* Master Presentation Slide Canvas (Bright, Crisp, Luxurious) */}
                <div
                  className="relative overflow-hidden rounded-[32px] sm:rounded-[40px] border bg-white shadow-[0_20px_60px_-15px_rgba(27,38,33,0.12)] transition-all duration-500 hover:shadow-[0_30px_80px_-15px_rgba(27,38,33,0.18)]"
                  style={{
                    borderColor: `${cat.primaryColor}30`,
                    boxShadow: `0 24px 70px -15px ${cat.glowColor}, 0 10px 30px -10px rgba(0,0,0,0.06)`,
                  }}
                >
                  {/* Subtle ambient light gradient at the top matching category color */}
                  <div
                    className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full opacity-20 blur-3xl"
                    style={{
                      background: `radial-gradient(circle, ${cat.primaryColor} 0%, transparent 70%)`,
                    }}
                  />
                  <div
                    className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full opacity-15 blur-3xl"
                    style={{
                      background: `radial-gradient(circle, ${cat.accentColor} 0%, transparent 70%)`,
                    }}
                  />

                  {/* Slide Top Banner / Header (Bright luxury styling with category theme) */}
                  <div
                    className="relative border-b p-6 sm:p-8 md:p-10 transition-colors"
                    style={{
                      backgroundColor: cat.lightBg,
                      borderColor: `${cat.primaryColor}20`,
                    }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      {/* Left Category Indicator */}
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-2xl border shadow-xs"
                          style={{
                            backgroundColor: "#ffffff",
                            borderColor: `${cat.primaryColor}35`,
                            color: cat.primaryColor,
                          }}
                        >
                          <CatIcon className="h-6 w-6" style={{ color: cat.primaryColor }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-[11px] font-bold uppercase tracking-widest"
                              style={{ color: cat.primaryColor }}
                            >
                              Slide 0{idx + 1} of 0{CATEGORIES.length}
                            </span>
                            <span className="text-[#273338]/30">•</span>
                            <span
                              className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-xs"
                              style={{
                                backgroundColor: cat.badgeBg,
                                color: cat.badgeText,
                                border: `1px solid ${cat.primaryColor}30`,
                              }}
                            >
                              {cat.badge}
                            </span>
                          </div>
                          <h3 className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#55645E]">
                            {cat.label}
                          </h3>
                        </div>
                      </div>

                      {/* Right Feature Count Badge */}
                      <div
                        className="flex items-center gap-2 rounded-full border bg-white px-4 py-1.5 text-xs font-bold shadow-xs"
                        style={{
                          borderColor: `${cat.primaryColor}30`,
                          color: cat.primaryColor,
                        }}
                      >
                        <Sparkles className="h-3.5 w-3.5" style={{ color: cat.primaryColor }} />
                        <span>{features.length} Core Modules</span>
                      </div>
                    </div>

                    {/* Headline and Subtitle */}
                    <div className="mt-6 md:mt-8">
                      <h2 className="text-2xl font-light tracking-tight text-[#182320] sm:text-3xl md:text-4xl lg:text-5xl">
                        {cat.headline.split(cat.highlightWord)[0]}
                        <i
                          className="font-serif font-normal"
                          style={{ color: cat.primaryColor }}
                        >
                          {cat.highlightWord}
                        </i>
                      </h2>
                      <p className="mt-3 max-w-3xl text-sm font-normal leading-relaxed text-[#55645E] sm:text-base">
                        {cat.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Feature Cards Grid within this Slide — Customized Layout per Theme */}
                  <div className="relative p-6 sm:p-8 md:p-10 bg-white">
                    <div
                      className={`grid gap-6 ${
                        features.length === 5
                          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                          : "grid-cols-1 md:grid-cols-2"
                      }`}
                    >
                      {features.map((feature, fIdx) => {
                        const FIcon = feature.icon;
                        const isSpan = features.length === 5 && fIdx === 0;

                        return (
                          <div
                            key={feature.number}
                            className={`group relative flex flex-col justify-between rounded-3xl border p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                              isSpan ? "md:col-span-2 lg:col-span-1" : ""
                            }`}
                            style={{
                              backgroundColor: fIdx % 2 === 0 ? "#FFFFFF" : cat.lightBg,
                              borderColor: `${cat.primaryColor}20`,
                              boxShadow: `0 8px 30px -10px rgba(0,0,0,0.05)`,
                            }}
                          >
                            {/* Watermark Number in background */}
                            <div
                              className="pointer-events-none absolute right-6 top-6 select-none text-4xl font-black opacity-[0.08]"
                              style={{ color: cat.primaryColor }}
                            >
                              {feature.number}
                            </div>

                            <div>
                              {/* Top Bar with Icon, Tag & Title */}
                              <div className="mb-4 flex items-start gap-4">
                                <div
                                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-xs transition-transform duration-300 group-hover:scale-110"
                                  style={{
                                    backgroundColor: "#ffffff",
                                    borderColor: `${cat.primaryColor}30`,
                                    color: cat.primaryColor,
                                  }}
                                >
                                  <FIcon className="h-6 w-6" style={{ color: cat.primaryColor }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span
                                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                                      style={{
                                        backgroundColor: cat.badgeBg,
                                        color: cat.badgeText,
                                      }}
                                    >
                                      {feature.tag || `Feature ${feature.number}`}
                                    </span>
                                  </div>
                                  <h4 className="text-base font-bold leading-snug text-[#182320] sm:text-lg">
                                    {feature.title}
                                  </h4>
                                  <p
                                    className="mt-0.5 text-xs font-medium italic"
                                    style={{ color: cat.primaryColor }}
                                  >
                                    {feature.tagline}
                                  </p>
                                </div>
                              </div>

                              {/* Description */}
                              <p className="mb-5 text-xs font-normal leading-relaxed text-[#55645E] sm:text-sm">
                                {feature.description}
                              </p>

                              {/* Highlights Checklist */}
                              <ul className="mb-6 space-y-2.5">
                                {feature.highlights.map((h, hi) => (
                                  <li
                                    key={hi}
                                    className="flex items-start gap-2.5 text-xs text-[#273338]"
                                  >
                                    <span
                                      className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                                      style={{
                                        backgroundColor: cat.badgeBg,
                                        color: cat.primaryColor,
                                      }}
                                    >
                                      ✓
                                    </span>
                                    <span className="leading-snug font-medium text-[#3A4843]">
                                      {h}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Benefit Badge Footer */}
                            <div
                              className="mt-auto rounded-xl border p-3 text-xs leading-relaxed transition-colors group-hover:shadow-xs"
                              style={{
                                backgroundColor: "#ffffff",
                                borderColor: `${cat.primaryColor}25`,
                                color: cat.secondaryColor,
                              }}
                            >
                              <span
                                className="font-bold uppercase tracking-wider text-[10px]"
                                style={{ color: cat.primaryColor }}
                              >
                                Key Outcome ·{" "}
                              </span>
                              <span className="font-medium">{feature.benefit}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Slide Bottom Bar with Next Hint */}
                  {!isLast && (
                    <div
                      className="border-t px-6 py-3.5 sm:px-8 flex items-center justify-between text-xs transition-colors"
                      style={{
                        backgroundColor: cat.lightBg,
                        borderColor: `${cat.primaryColor}15`,
                        color: "#55645E",
                      }}
                    >
                      <span className="text-[11px] font-medium tracking-wide">
                        Scroll down for next slide:{" "}
                        <strong style={{ color: CATEGORIES[idx + 1].primaryColor }}>
                          0{idx + 2}. {CATEGORIES[idx + 1].label}
                        </strong>
                      </span>
                      <button
                        onClick={() => scrollToSlide(idx + 1)}
                        className="inline-flex items-center gap-1 text-xs font-bold transition-transform hover:scale-105"
                        style={{ color: cat.primaryColor }}
                      >
                        <span>Next Slide</span>
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
