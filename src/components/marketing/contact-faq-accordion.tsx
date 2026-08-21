"use client";

import * as React from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
}

const contactFaqs: FaqItem[] = [
  {
    q: "How do I book an initial consultation or emergency visit?",
    a: "You can book directly online 24/7 through our interactive booking portal by selecting your preferred treatment and clinician. If you are experiencing acute dental discomfort or require an urgent same-day appointment, please call our clinic concierge directly at the telephone number listed above.",
  },
  {
    q: "What should I bring with me to my first dental appointment?",
    a: "Please bring a valid photo ID, details of any current medications or medical conditions, and any relevant dental records or recent radiographs if available. You will also be able to complete your digital medical history form securely online before arrival.",
  },
  {
    q: "How does the practice accommodate nervous or anxious patients?",
    a: "Our clinic is designed as a calming sanctuary with dedicated quiet suites and gentle, unhurried care. We offer tailored comfort options including gentle local anaesthesia techniques, ceiling entertainment, noise-cancelling headphones, and clinician-guided pauses throughout your treatment.",
  },
  {
    q: "Do you offer payment installment options and itemized treatment quotes?",
    a: "Yes. Following your comprehensive examination and 3D digital scan, you will receive a transparent, itemized treatment plan with no hidden costs. We provide staged payment arrangements for multi-phase treatments and assist with private insurance receipts.",
  },
  {
    q: "What is your appointment cancellation and rescheduling policy?",
    a: "We kindly request at least 48 hours' notice if you need to reschedule or cancel an appointment. This allows our clinical team to offer the reserved time to patients on our priority waiting list.",
  },
  {
    q: "How do I reach the clinic and is parking available nearby?",
    a: "We are centrally situated on Harley Street in Marylebone, within a short walking distance of Regent's Park, Oxford Circus, and Bond Street stations. Convenient underground parking is available nearby at Q-Park Oxford Street and Cavendish Square.",
  },
];

export function ContactFaqAccordion() {
  const [openIdx, setOpenIdx] = React.useState<number | null>(0);

  return (
    <div className="contact-faq-accordion w-full max-w-4xl mx-auto space-y-4">
      {contactFaqs.map((faq, idx) => {
        const isOpen = openIdx === idx;
        return (
          <div
            key={faq.q}
            className={`rounded-2xl sm:rounded-3xl border transition-all duration-300 overflow-hidden ${
              isOpen
                ? "bg-white border-[#9CB080]/60 shadow-[0_12px_30px_-8px_rgba(43,87,72,0.15)]"
                : "bg-white/80 border-[#273338]/10 hover:border-[#9CB080]/40 hover:bg-white"
            }`}
          >
            <button
              type="button"
              onClick={() => setOpenIdx(isOpen ? null : idx)}
              className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left cursor-pointer transition-colors"
              aria-expanded={isOpen}
            >
              <span className="text-base sm:text-lg font-semibold text-[#182320]">
                {faq.q}
              </span>
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                  isOpen
                    ? "bg-[#2B5748] text-white rotate-180"
                    : "bg-[#2B5748]/10 text-[#2B5748]"
                }`}
              >
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>

            {isOpen && (
              <div className="px-5 sm:px-6 pb-6 pt-1 text-sm sm:text-base text-[#4E5B55] leading-relaxed border-t border-[#273338]/06 mt-1">
                {faq.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
