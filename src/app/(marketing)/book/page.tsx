import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck, CalendarDays, Check, LogIn, ShieldCheck, UserPlus } from "lucide-react";

import { getUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Book Appointment | Clinic Care Dental",
  description: "Start your online appointment request with Clinic Care Dental.",
};

const bookingSteps = [
  "Create or sign in to your patient account",
  "Choose the treatment and practitioner that suit you",
  "Select from the appointment options available to you",
];

export default async function BookPage() {
  const user = await getUser();
  if (user) redirect("/portal/appointments/book");

  return (
    <div className="public-book-page">
      <main>
        <section className="page-hero-banner booking-page-hero text-white">
          <div className="container text-center max-w-4xl mx-auto px-4">
            {/* Breadcrumb Route (Dhaka Heights style) */}
            <nav aria-label="Breadcrumb" className="mb-6 flex justify-center">
              <ol className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-white/70 uppercase">
                <li>
                  <Link href="/" className="hover:text-white transition-colors duration-200">
                    Home
                  </Link>
                </li>
                <li className="text-[#9CB080]" aria-hidden="true">›</li>
                <li className="text-[#9CB080] font-bold" aria-current="page">
                  Book Online
                </li>
              </ol>
            </nav>

            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/15 text-xs text-[#9CB080] font-medium mb-6 shadow-sm">
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Online Appointment Access</span>
            </div>
            <h1 className="page-title text-4xl sm:text-5xl md:text-6xl font-light tracking-tight leading-tight drop-shadow-md">
              Start Your Appointment <br />
              <i className="font-serif text-[#9CB080]">Simply &amp; Securely.</i>
            </h1>
            <p className="page-subtitle text-base sm:text-lg text-white/85 mt-6 max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
              Sign in or create a patient account to continue to online booking and keep your appointments connected to your care record.
            </p>

            {/* Subtle accent divider */}
            <div className="mt-8 flex justify-center">
              <div className="h-0.5 w-16 bg-[#9CB080]/80 rounded-full" />
            </div>
          </div>
        </section>

        <section className="public-booking-section">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="booking-access-grid">
              <div className="booking-intro-panel">
                <span className="subtitle-italic">Before you book</span>
                <h2>A short, connected booking journey</h2>
                <p>
                  Your patient account keeps appointment details together and gives you one place to manage future booking activity.
                </p>

                <div className="booking-step-list">
                  {bookingSteps.map((step, index) => (
                    <div className="booking-step" key={step}>
                      <span className="booking-step-number">0{index + 1}</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>

                <div className="booking-privacy-note">
                  <ShieldCheck className="w-5 h-5" />
                  <span>Your account is used to connect booking activity with your patient profile.</span>
                </div>
              </div>

              <div className="booking-access-card">
                <div className="booking-access-icon">
                  <CalendarCheck className="w-7 h-7" />
                </div>
                <span className="booking-card-kicker">Patient booking</span>
                <h2>Continue to online booking</h2>
                <p>
                  New patient? Create an account first. Returning patient? Sign in and continue directly to the booking flow.
                </p>

                <div className="booking-benefits">
                  <span><Check className="w-4 h-4" /> Keep appointments connected</span>
                  <span><Check className="w-4 h-4" /> Manage future appointment activity</span>
                  <span><Check className="w-4 h-4" /> Access your patient portal after sign-in</span>
                </div>

                <div className="booking-actions">
                  <Link href="/sign-up" className="btn-blue booking-primary-action">
                    <UserPlus className="w-4 h-4" />
                    Create Patient Account
                  </Link>
                  <Link href="/login" className="booking-secondary-action">
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Link>
                </div>

                <Link href="/contact" className="booking-help-link">
                  <CalendarDays className="w-4 h-4" />
                  Need help booking? Contact the clinic
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
