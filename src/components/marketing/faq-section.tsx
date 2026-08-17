import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollReveal } from "@/components/motion";
import { CONTAINER } from "@/lib/layout";

const FAQS = [
  {
    question: "How do I book an appointment?",
    answer:
      "Create a free patient account, then book online in a few clicks — choose your treatment, practitioner and a time that suits you. You can also call the clinic directly to book over the phone.",
  },
  {
    question: "Can I reschedule an appointment?",
    answer:
      "Yes. Sign in to your patient portal, open the appointment from your appointments list, and choose a new time. If you'd rather speak to someone, our reception team can help too.",
  },
  {
    question: "What's your cancellation policy?",
    answer:
      "You can cancel an upcoming appointment yourself from your patient portal at any time before your visit. For late cancellations, please call the clinic directly so we can offer the slot to another patient.",
  },
  {
    question: "Do I need to complete registration before my first visit?",
    answer:
      "Yes — a short digital registration (contact details and medical history) is completed when you create your account, so your care team has what they need before you arrive. It only takes a few minutes.",
  },
  {
    question: "How do payments and invoices work?",
    answer:
      "After treatment, an invoice is added to your patient portal showing a full breakdown of costs and any payments received. You can review past invoices there at any time.",
  },
  {
    question: "Can I access my prescriptions online?",
    answer:
      "Yes. Any prescriptions issued by your practitioner appear in your patient portal, with medicine, dosage and instructions, so you always have a record to refer back to.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="w-full py-24 lg:py-32">
      <div className={CONTAINER}>
        <ScrollReveal className="mx-auto max-w-lg text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">FAQ</p>
          <h2 className="mt-3 font-serif text-display-section text-balance text-foreground">
            Questions, <span className="text-primary">answered.</span>
          </h2>
        </ScrollReveal>

        <ScrollReveal className="mx-auto mt-12 max-w-2xl rounded-3xl border border-border bg-card px-6 shadow-sm sm:px-8">
          <Accordion>
            {FAQS.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollReveal>
      </div>
    </section>
  );
}
