import type { Metadata } from "next";
import { ClipboardCheck, Clock3, FileHeart, LockKeyhole, ShieldCheck } from "lucide-react";

import { RegistrationForm } from "@/components/portal/registration-form";

export const metadata: Metadata = { title: "Complete patient registration" };

export default function PortalRegisterPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="relative overflow-hidden rounded-[30px] bg-secondary p-6 text-secondary-foreground shadow-xl sm:p-8">
        <div className="absolute -right-16 -top-20 size-64 rounded-full bg-accent/15 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Secure digital intake</p>
          <h1 className="mt-2 font-serif text-4xl">Complete your patient registration</h1>
          <p className="mt-3 text-sm leading-6 text-white/60">Provide the clinic with the essential personal, emergency and medical information needed before your first visit.</p>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
        <div className="space-y-4">
          {[
            { icon: Clock3, title: "About 2 minutes", text: "A focused form with only the information needed for your initial patient record." },
            { icon: FileHeart, title: "Safer clinical decisions", text: "Allergies, medicines and health conditions are visible to authorised clinicians." },
            { icon: LockKeyhole, title: "Private by design", text: "Your submission is tied to your signed-in account and protected by role-based access." },
          ].map((item) => (
            <article key={item.title} className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary"><item.icon className="size-5" /></span>
              <h2 className="mt-4 font-heading text-lg font-bold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-text-muted">{item.text}</p>
            </article>
          ))}
          <div className="flex items-start gap-3 rounded-2xl bg-primary-soft p-4 text-xs leading-5 text-primary"><ShieldCheck className="mt-0.5 size-4 shrink-0" />You can update personal contact details later. Medical changes are reviewed with the clinic to preserve clinical record accuracy.</div>
        </div>

        <article className="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-7">
          <div className="mb-7 flex items-center gap-3 border-b border-border pb-5"><span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><ClipboardCheck className="size-5" /></span><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">Patient intake form</p><h2 className="font-heading text-xl font-bold">Your details</h2></div></div>
          <RegistrationForm />
        </article>
      </section>
    </div>
  );
}
