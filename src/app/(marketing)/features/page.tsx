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

export const metadata: Metadata = {
  title: "System Features | Clinic Care Dental Management Platform",
  description:
    "Discover all 26+ powerful features of our dental clinic management system — from real-time dashboards and online booking to patient portals and smart billing.",
};

const FEATURE_CATEGORIES = [
  {
    id: "operations",
    label: "Daily Operations",
    color: "#2B5748",
    lightColor: "#EAF2EE",
    icon: LayoutDashboard,
  },
  {
    id: "clinical",
    label: "Clinical Tools",
    color: "#1E3A5F",
    lightColor: "#E8EEF6",
    icon: Stethoscope,
  },
  {
    id: "patient",
    label: "Patient Experience",
    color: "#7B3F8C",
    lightColor: "#F3EAF7",
    icon: Heart,
  },
  {
    id: "marketing",
    label: "Marketing & Growth",
    color: "#B05A1A",
    lightColor: "#FAF0E8",
    icon: TrendingUp,
  },
  {
    id: "finance",
    label: "Finance & Billing",
    color: "#1B5E8C",
    lightColor: "#E6F0F8",
    icon: CreditCard,
  },
  {
    id: "technology",
    label: "Technology & Access",
    color: "#5A3E8C",
    lightColor: "#EEE8F8",
    icon: Zap,
  },
];

const FEATURES = [
  {
    number: "01",
    category: "operations",
    icon: LayoutDashboard,
    title: "Live Receptionist Dashboard",
    tagline: "Your entire clinic at a glance — always up to date.",
    description:
      "The moment staff arrive, they see every patient due today, who has checked in, and how many visits are complete — all automatically, all in real time. No more searching through paper lists.",
    highlights: [
      "\"Next Patient\" card with live countdown timer",
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
    title: "Online Appointment Booking",
    tagline: "Patients book 24/7 — even at midnight.",
    description:
      "A beautifully guided step-by-step booking experience on your public website. Patients pick their treatment, choose their preferred dentist, select a date and time, and confirm — no phone call needed.",
    highlights: [
      "7-step guided booking wizard on your website",
      "Real-time slot availability — no double-bookings possible",
      "Works on mobile phones, tablets, and computers",
      "Patients can reschedule or cancel online anytime",
    ],
    benefit: "Fewer interruptions for staff. More appointments filled automatically.",
  },
  {
    number: "10",
    category: "operations",
    icon: ClipboardList,
    title: "Appointments Management",
    tagline: "Every appointment, every status — one organised workspace.",
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
  {
    number: "03",
    category: "clinical",
    icon: Stethoscope,
    title: "Digital Consultation Workspace",
    tagline: "The dentist's clinical record — on screen, not on paper.",
    description:
      "During each patient visit, the dentist documents the complaint, diagnosis, treatment performed, and aftercare notes directly on screen. All previous visits appear in a sidebar for instant context.",
    highlights: [
      "Chief complaint, diagnosis, and treatment notes",
      "Instant access to the patient's full medical history and allergy alerts",
      "Previous visits shown in a sidebar for reference",
      "\"Save Draft\" — never lose work mid-consultation",
    ],
    benefit: "No paper files. Every visit is digitally recorded and permanently accessible.",
  },
  {
    number: "06",
    category: "clinical",
    icon: FileText,
    title: "Complete Patient Health Records",
    tagline: "Every patient's full story — identity, history, and allergies — instantly.",
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
    title: "Follow-Up Booking Inside the Consultation",
    tagline: "Book the next appointment before the patient leaves the chair.",
    description:
      "At the end of a consultation, dentists can schedule the patient's next appointment directly from the same screen — choosing the service, date, and time without any extra steps.",
    highlights: [
      "Toggle \"Follow-Up Recommended\" inside the consultation form",
      "Live slot availability shown in real time",
      "Books the next appointment with one click",
      "Patient leaves with their next visit already confirmed",
    ],
    benefit: "More repeat visits secured. Better continuity of patient care.",
  },
  {
    number: "11",
    category: "clinical",
    icon: List,
    title: "Treatments & Services Catalog",
    tagline: "All treatments in one place — with per-doctor pricing control.",
    description:
      "Administrators create the clinic's master list of treatments. Each dentist then independently selects which services they offer and sets their own prices and durations.",
    highlights: [
      "Clinic-level master treatment catalog by category",
      "Each dentist controls their own offered services",
      "Per-doctor price and duration overrides",
      "Services displayed publicly on the marketing website",
    ],
    benefit: "Multi-doctor clinics run different pricing per doctor with zero confusion.",
  },
  {
    number: "12",
    category: "patient",
    icon: UserCircle,
    title: "Patient Self-Service Portal",
    tagline: "Patients manage their own health information — 24/7, from any device.",
    description:
      "Every registered patient gets a secure personal dashboard showing their upcoming appointments, prescriptions, invoices, and health records. They can update their own details and book new appointments without calling the clinic.",
    highlights: [
      "Upcoming appointments with countdown timers",
      "View and track all invoices and payment status",
      "Access prescriptions and tooth chart anytime",
      "Edit personal details and medical history",
    ],
    benefit: "Reduces admin phone calls dramatically. Patients feel in control.",
  },
  {
    number: "25",
    category: "patient",
    icon: CalendarIcon,
    title: "Calendar Export — Google & Apple",
    tagline: "One click and the appointment is saved to any calendar app.",
    description:
      "Patients can add their upcoming dental appointment to Google Calendar, Apple Calendar, or Microsoft Outlook with a single click — complete with the doctor's name, clinic location, and exact times.",
    highlights: [
      "Add to Google Calendar — pre-filled in one click",
      "Download ICS file — works with Apple and Outlook",
      "Appointment title, time, doctor, and location included",
      "Reduces patient no-shows significantly",
    ],
    benefit: "Patients get automatic reminders. Your chairs stay full.",
  },
  {
    number: "05",
    category: "patient",
    icon: Lock,
    title: "Role-Based Staff Access Control",
    tagline: "The right tools for each role — nothing more, nothing less.",
    description:
      "Three distinct staff roles — Receptionist, Dentist, and Owner/Admin — each with their own tailored navigation. Receptionists manage bookings. Dentists access clinical tools. Owners see everything.",
    highlights: [
      "Receptionist: booking, patients, billing, and dashboard",
      "Dentist: clinical workspace, prescriptions, and availability",
      "Owner/Admin: full access to all modules",
      "Roles assigned automatically from the staff account",
    ],
    benefit: "Prevents accidental access to private clinical or financial data.",
  },
  {
    number: "14",
    category: "marketing",
    icon: Globe,
    title: "Premium Public Marketing Website",
    tagline: "A stunning website that converts visitors into booked patients.",
    description:
      "A complete, luxury public-facing website with a homepage, about page, services catalog, practitioner directory, gallery, blog, academy, locations page, and contact page — all integrated with your booking system.",
    highlights: [
      "Luxury animated homepage with auto-cycling hero slideshow",
      "11 fully designed pages included",
      "Direct booking button on every page",
      "Smooth scroll animations throughout for a premium feel",
    ],
    benefit: "Your website is your #1 sales tool — it works while you sleep.",
  },
  {
    number: "15",
    category: "marketing",
    icon: Sparkles,
    title: "Interactive Smile Simulator",
    tagline: "Visitors preview their new smile before booking — and then they book.",
    description:
      "Website visitors choose a treatment type, tooth shade, and shape to see a visual preview of their potential results. This interactive tool dramatically increases the likelihood of booking.",
    highlights: [
      "Treatment types: Veneers, Whitening, Aligners, Implants",
      "Multiple tooth shades and shapes to choose from",
      "Smooth animated preview that updates instantly",
      "\"Book a Consultation\" prompt shown after simulation",
    ],
    benefit: "Patients who can visualise results are far more likely to book.",
  },
  {
    number: "16",
    category: "marketing",
    icon: Camera,
    title: "Before & After Smile Gallery",
    tagline: "Drag to reveal real results — the most powerful sales tool on your website.",
    description:
      "An interactive drag-to-reveal comparison slider showing genuine patient smile transformations. Each case includes the treatment type, concern summary, solution, and treatment duration.",
    highlights: [
      "Drag-to-reveal comparison slider — works on touchscreens",
      "Multiple treatment cases: Veneers, Implants, Aligners, Whitening",
      "Each case includes full treatment detail and timeline",
      "High-impact visual proof of real results",
    ],
    benefit: "Nothing converts a cosmetic dentistry prospect faster than visible results.",
  },
  {
    number: "17",
    category: "marketing",
    icon: BookOpen,
    title: "Blog & Patient Education Hub",
    tagline: "Educational content that builds trust and attracts new patients from Google.",
    description:
      "A built-in blog with fully designed article pages covering dental health topics with rich content, category badges, read times, and thumbnail images. Articles are searchable and filterable.",
    highlights: [
      "Magazine-style article grid layout",
      "Search by title, category, or article text",
      "Individual full-length article detail pages",
      "Drives organic Google search traffic to your website",
    ],
    benefit: "Educational content keeps your website fresh and boosts search rankings.",
  },
  {
    number: "18",
    category: "marketing",
    icon: GraduationCap,
    title: "Clinic Academy — Education Portal",
    tagline: "Position your clinic as the leader in dental education.",
    description:
      "A dedicated continuing professional development section on your website where you can promote workshops and educational events for other clinicians — establishing the clinic as a centre of excellence.",
    highlights: [
      "Workshop listings with full descriptions and topic breakdowns",
      "Topics: Digital Smile Planning, Guided Implantology, and more",
      "Positions the clinic as an educational authority",
      "Attracts high-calibre clinicians and professional referrals",
    ],
    benefit: "A secondary revenue stream — and a powerful reputation builder.",
  },
  {
    number: "19",
    category: "marketing",
    icon: UserCheck,
    title: "Practitioner Public Profiles",
    tagline: "Every dentist has a beautiful public profile — trust before the first appointment.",
    description:
      "Each dentist gets a professionally designed public profile page showing their photo, specialities, biography, and the treatments they offer — with a direct booking button pre-selecting them.",
    highlights: [
      "Professional photo, credentials, and biography",
      "List of offered treatments with prices and durations",
      "Direct \"Book with Dr. [Name]\" button for patients",
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
    description:
      "Each dental treatment offered by the clinic has its own individual service page with a full description, what to expect, pricing, FAQs, and a direct booking button for that specific service.",
    highlights: [
      "Individual pages for every treatment category",
      "What to expect, duration, and pricing on each page",
      "Treatment-specific FAQs to reassure hesitant patients",
      "Direct \"Book This Treatment\" CTA on every page",
    ],
    benefit: "Service pages rank in Google. Patients arrive already informed.",
  },
  {
    number: "21",
    category: "marketing",
    icon: Building2,
    title: "Multi-Location / Branch Support",
    tagline: "One system. Multiple clinics. Zero complexity.",
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
  {
    number: "04",
    category: "finance",
    icon: CreditCard,
    title: "Smart Billing & Invoice Management",
    tagline: "Professional invoicing — from zero to paid in under a minute.",
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
    description:
      "Any invoice can be printed directly from the browser as a formatted receipt. It includes the clinic name, patient details, itemised treatments, subtotal, discount, total, and payment status.",
    highlights: [
      "Clinic branding, patient reference, and invoice number",
      "Itemised treatment list with quantities and prices",
      "Subtotal, discount, total, and balance remaining",
      "Perfect for patient insurance claims",
    ],
    benefit: "Patients get paper receipts for their records — no extra hardware needed.",
  },
  {
    number: "22",
    category: "technology",
    icon: Moon,
    title: "Dark Mode & Theme Toggle",
    tagline: "Comfortable for staff — day or night, in any lighting condition.",
    description:
      "All staff tools support full dark mode — instantly toggled with one click. The system remembers each staff member's preference across sessions, and every component is perfectly styled in both modes.",
    highlights: [
      "One-click theme toggle in the staff navigation bar",
      "Instant switch — no page reload required",
      "All clinical and admin screens styled for dark mode",
      "Preference saved automatically per user",
    ],
    benefit: "Reduced eye strain for staff working long hours in clinical settings.",
  },
  {
    number: "23",
    category: "technology",
    icon: Smartphone,
    title: "Fully Responsive — Works on Any Device",
    tagline: "Every screen — staff tools, patient portal, website — works on phones and tablets.",
    description:
      "The entire system — from the staff dashboard to the patient portal to the public website — is fully responsive. Patients book on their phone. Staff check records on a tablet. It all just works.",
    highlights: [
      "Staff dashboard and clinical workspace work on tablets",
      "Patient portal fully usable on smartphones",
      "Public booking wizard optimised for mobile touchscreens",
      "No app to download — runs entirely in the browser",
    ],
    benefit: "No app required. No separate mobile version. Everything in one place.",
  },
  {
    number: "26",
    category: "technology",
    icon: MessageCircle,
    title: "Contact Page & FAQ Accordion",
    tagline: "Common questions answered before patients even pick up the phone.",
    description:
      "The public website includes a comprehensive contact page with click-to-call phone, email, address, opening hours, and a full FAQ accordion covering the most common patient questions.",
    highlights: [
      "Click-to-call phone link for mobile users",
      "Expandable FAQ accordion with common patient questions",
      "Covers booking, payments, emergencies, and treatments",
      "Reduces inbound phone calls significantly",
    ],
    benefit: "Fewer phone enquiries. Patients arrive informed and confident.",
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
  const grouped: Record<string, typeof FEATURES> = {};
  for (const f of FEATURES) {
    if (!grouped[f.category]) grouped[f.category] = [];
    grouped[f.category].push(f);
  }

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

      {/* Feature Sections by Category */}
      {FEATURE_CATEGORIES.map((cat, catIdx) => {
        const features = grouped[cat.id] || [];
        if (!features.length) return null;
        const CatIcon = cat.icon;
        const isAlt = catIdx % 2 === 1;
        const bg = isAlt ? "#F2F4F2" : "#FBFBF9";

        const headings: Record<string, React.ReactNode> = {
          operations: <>Your clinic runs <i className="font-serif" style={{ color: cat.color }}>itself.</i></>,
          clinical: <>Dentists document <i className="font-serif" style={{ color: cat.color }}>everything digitally.</i></>,
          patient: <>Patients feel <i className="font-serif" style={{ color: cat.color }}>looked after.</i></>,
          marketing: <>Your website becomes your <i className="font-serif" style={{ color: cat.color }}>best salesperson.</i></>,
          finance: <>No invoice is <i className="font-serif" style={{ color: cat.color }}>ever lost again.</i></>,
          technology: <>Works everywhere, <i className="font-serif" style={{ color: cat.color }}>for everyone.</i></>,
        };

        return (
          <section
            key={cat.id}
            id={`category-${cat.id}`}
            className="py-24"
            style={{ backgroundColor: bg, color: "#273338" }}
          >
            <div className="container">
              <div className="title-box text-center max-w-3xl mx-auto mb-16">
                <div
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4 border"
                  style={{
                    backgroundColor: cat.lightColor,
                    color: cat.color,
                    borderColor: cat.color + "30",
                  }}
                >
                  <CatIcon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-light tracking-tight" style={{ color: "#182320" }}>
                  {headings[cat.id]}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {features.map((feature) => {
                  const FIcon = feature.icon;
                  return (
                    <div
                      key={feature.number}
                      className="group relative bg-white rounded-[28px] p-8 border border-[#273338]/08 shadow-[0_8px_30px_-6px_rgba(27,38,33,0.08)] hover:shadow-[0_20px_50px_-10px_rgba(27,38,33,0.14)] transition-all duration-300 hover:-translate-y-1 flex flex-col"
                    >
                      <div className="absolute top-6 right-7 text-4xl font-black opacity-[0.06] select-none leading-none" style={{ color: cat.color }}>
                        {feature.number}
                      </div>

                      <div className="flex items-start gap-4 mb-5">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: cat.lightColor }}
                        >
                          <FIcon className="w-6 h-6" style={{ color: cat.color }} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-[#182320] leading-snug">{feature.title}</h3>
                          <p className="text-xs text-[#7A8681] mt-0.5 font-medium italic">{feature.tagline}</p>
                        </div>
                      </div>

                      <p className="text-sm text-[#4E5B55] leading-relaxed mb-5">{feature.description}</p>

                      <ul className="space-y-2 mb-6 flex-1">
                        {feature.highlights.map((h, hi) => (
                          <li key={hi} className="flex items-start gap-2.5 text-xs text-[#273338]">
                            <span
                              className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                              style={{ backgroundColor: cat.lightColor, color: cat.color }}
                            >
                              ✓
                            </span>
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>

                      <div
                        className="rounded-xl p-3.5 border text-xs leading-relaxed"
                        style={{
                          backgroundColor: cat.lightColor,
                          borderColor: cat.color + "25",
                          color: cat.color,
                        }}
                      >
                        <span className="font-bold uppercase tracking-wide text-[10px]">Key Benefit · </span>
                        {feature.benefit}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })}

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
                  const count = (grouped[cat.id] || []).length;
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
                          {count} Feature{count !== 1 ? "s" : ""}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-[#273338] text-white">
                  <td className="px-6 py-4 font-bold text-sm">Total</td>
                  <td className="px-6 py-4 text-center font-black text-[#9CB080] text-sm">26+ Features</td>
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
