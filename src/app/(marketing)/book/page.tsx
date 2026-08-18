import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck, CalendarDays, Check, LogIn, ShieldCheck, Sparkles, UserPlus } from "lucide-react";

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
        <section className="page-hero-banner booking-page-hero">
          <div className="container text-center max-w-4xl mx-auto px-4">
            <div className="public-page-eyebrow">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Online Appointment Access</span>
            </div>
            <h1 className="page-title">
              Start Your Appointment <br />
              <i>Simply &amp; Securely.</i>
            </h1>
            <p className="page-subtitle">
              Sign in or create a patient account to continue to online booking and keep your appointments connected to your care record.
            </p>
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
