"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2 } from "lucide-react";

const cards = [
  {
    number: "01",
    title: "Patient First Approach",
    lead: "Care starts with listening to what matters to you.",
    bullets: [
      <span key="explanations"><strong>Clear explanations:</strong> Treatment options, suitability, risks, and alternatives are discussed before you decide how to proceed.</span>,
      <span key="support"><strong>Personalised support:</strong> Appointments, treatment stages, and practical questions are organised around your individual care plan.</span>,
    ],
    href: "/about",
    action: "Discover our approach",
  },
  {
    number: "02",
    title: "Clinical Standards & Safety",
    lead: "A clean, organised clinical environment supports safe and consistent care.",
    body: "We prioritise careful assessment, appropriate consent, infection-control procedures, and clear documentation throughout the patient journey.",
    href: "/about",
    action: "Read about our standards",
  },
  {
    number: "03",
    title: "Personalised Treatment Planning",
    lead: "Your plan should reflect your clinical needs, priorities, timeline, and preferences.",
    body: "Digital tools can support diagnosis and visual planning, while your dentist guides the final clinical recommendations and treatment sequence.",
    href: "/services",
    action: "Explore treatments",
  },
  {
    number: "04",
    title: "Convenience & Comfort",
    lead: "A calmer visit comes from thoughtful details and knowing what to expect.",
    body: "Online booking, clear appointment information, comfort-focused care, and follow-up guidance help make each stage easier to manage.",
    href: "/locations",
    action: "View clinic details",
  },
];

export function LuxuryWhyChoose() {
  return (
    <section className="steps-scroll" id="why-choose">
      <div className="steps-scroll-layout">
        <div className="steps-scroll-left">
          <div className="sticky-content text-box">
            <span className="section-kicker-light">Why Clinic Care Dental</span>
            <h2 className="h3" data-motion-split="true">Why choose our practice?</h2>
            <p>
              We focus on clear communication, considered treatment planning, and a calm patient experience from your first enquiry through aftercare.
            </p>
            <p>
              Our team will explain suitable options, answer questions, and help you understand the next step before treatment begins.
            </p>
            <div className="btn-group">
              <Link href="/book" className="btn">
                <CalendarDays className="w-4 h-4" aria-hidden="true" />
                Book an Appointment
              </Link>
            </div>
          </div>
        </div>

        <div className="steps-scroll-right">
          <div className="card-timeline">
            {cards.map((card, index) => (
              <div
                className="stack-card visible"
                key={card.number}
                style={{ "--stack-index": index } as React.CSSProperties}
              >
                <div className="stack-card-inner">
                  <div className={`ambient-glow glow-${index + 1}`} />
                  <div className="card-accent-bar" />
                  <div className="card-top">
                    <span className="card-num">{card.number}</span>
                    <h3>{card.title}</h3>
                  </div>
                  <div className="card-body">
                    <p className="lead-text">{card.lead}</p>
                    {card.bullets ? (
                      <ul className="details-list">
                        {card.bullets.map((bullet, bulletIndex) => (
                          <li key={bulletIndex}>
                            <CheckCircle2 className="why-check-icon w-4 h-4 shrink-0 mt-0.5" />
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>{card.body}</p>
                    )}
                    <Link href={card.href} className="card-action-link">
                      <span>{card.action}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
