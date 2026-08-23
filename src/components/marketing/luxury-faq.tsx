"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, HelpCircle, CalendarDays } from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
}

const faqs: FaqItem[] = [
  {
    q: "How does digital smile planning work?",
    a: "Your dentist may use digital scans, photographs, and other records to assess your teeth and discuss suitable treatment options. Where appropriate, a visual preview or trial can help you talk through shape, proportion, and aesthetic preferences before the final plan is confirmed.",
  },
  {
    q: "What is the difference between porcelain veneers and composite bonding?",
    a: "Both can change tooth shape and appearance, but they use different materials and clinical techniques. Porcelain restorations are made outside the mouth and bonded to the tooth, while composite bonding is placed and shaped directly. Suitability, maintenance, cost, and expected longevity vary by patient and should be discussed with your dentist.",
  },
  {
    q: "What if I feel nervous about dental treatment?",
    a: "Tell the team before or during your appointment. We focus on clear explanations, gentle techniques, and a pace that allows time for questions and breaks. Your dentist can discuss appropriate comfort options based on the treatment and your medical history.",
  },
  {
    q: "How long does implant treatment take?",
    a: "Implant treatment is planned in stages and timing varies depending on healing, bone condition, the number of implants, and the type of restoration. Your clinician will explain the expected sequence and review points after assessment.",
  },
  {
    q: "How do payments, pricing, and treatment phases work?",
    a: "We aim to explain planned treatment and associated fees before care begins. Ask our team about available payment options and whether treatment can be arranged in appropriate stages for your individual plan.",
  },
];

export function LuxuryFaq() {
  const [openIdx, setOpenIdx] = React.useState<number | null>(0);

  return (
    <section className="faq-section-luxury" id="faq-section">
      <div className="container">
        <div className="faq-heading-wrap">
          <div className="faq-eyebrow">
            <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Questions, answered clearly</span>
          </div>
          <h2 className="h3" data-motion-split="true">Frequently Asked Questions</h2>
          <p className="faq-intro">
            A quick overview of treatment planning, comfort, appointments, and payment options before you get in touch.
          </p>
        </div>

        <div className="faq-list">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={faq.q} className={`faq-item ${isOpen ? "is-open" : ""}`}>
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="faq-question"
                  aria-expanded={isOpen}
                  aria-controls={`homepage-faq-answer-${idx}`}
                >
                  <span>{faq.q}</span>
                  <ChevronDown className="faq-chevron w-5 h-5" aria-hidden="true" />
                </button>
                <div
                  className="faq-answer-shell"
                  id={`homepage-faq-answer-${idx}`}
                  aria-hidden={!isOpen}
                >
                  <div className="faq-answer-clip">
                    <div className="faq-answer">{faq.a}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="faq-cta-row">
          <Link href="/book" className="btn-blue">
            <CalendarDays className="w-4 h-4" aria-hidden="true" />
            Book an Appointment
          </Link>
        </div>
      </div>
    </section>
  );
}
