import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, CheckCircle2, ShieldCheck, Stethoscope } from "lucide-react";

export const metadata: Metadata = {
  title: "Book an Appointment | Clinic Care Dental",
  description: "Choose your treatment, doctor and appointment time before signing in to confirm.",
};

const journey = [
  { icon: Stethoscope, title: "Choose your care", text: "Select a treatment and the doctor you prefer." },
  { icon: CalendarCheck, title: "Pick a live time", text: "Browse the clinic's current date and time availability." },
  { icon: ShieldCheck, title: "Confirm securely", text: "Sign in or create an account only at the final step." },
];

/** Direct /book visits open the global booking modal automatically. This page
 * remains as a useful, login-free fallback if the visitor closes the modal. */
export default function BookPage() {
  return (
    <main className="min-h-[78vh] bg-[#f4f1e8] text-[#102a2e]">
      <section className="relative overflow-hidden px-4 py-24 sm:py-32">
        <div className="pointer-events-none absolute -left-24 top-10 size-80 rounded-full bg-[#9CB080]/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 size-96 rounded-full bg-[#075e5a]/12 blur-3xl" />
        <div className="relative mx-auto max-w-5xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#075e5a]/15 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-[#075e5a] shadow-sm">
            <CheckCircle2 className="size-4" /> Online booking
          </span>
          <h1 className="mt-6 font-serif text-5xl leading-tight sm:text-6xl">Your appointment, planned around you.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#526764]">
            Explore services, doctors and live appointment times first. Your patient account is only required when you are ready to confirm.
          </p>
          <Link href="/book?booking=1" className="btn-blue mt-8 inline-flex">Book an Appointment</Link>

          <div className="mt-14 grid gap-4 text-left md:grid-cols-3">
            {journey.map((item) => (
              <article key={item.title} className="rounded-3xl border border-[#075e5a]/10 bg-white/75 p-6 shadow-sm backdrop-blur">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-[#dff3ef] text-[#075e5a]"><item.icon className="size-5" /></span>
                <h2 className="mt-4 font-heading text-lg font-extrabold">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#526764]">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
