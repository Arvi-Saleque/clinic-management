import type { Metadata } from "next";

import { CONTAINER } from "@/lib/layout";
import { PageBanner } from "@/components/marketing/page-banner";
import { PAGE_BANNERS, toImageProp } from "@/lib/marketing-images";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  return (
    <>
      <PageBanner eyebrow="Legal" title="Terms & Conditions" image={toImageProp(PAGE_BANNERS.contact)} className="min-h-[32vh]" />
      <section className="w-full py-20">
        <div className={CONTAINER}>
          <div className="mx-auto max-w-2xl space-y-4 text-sm text-text-secondary">
            <p>
              By booking an appointment or creating a patient account, you
              agree to attend or cancel appointments with reasonable notice,
              and to provide accurate information during registration.
            </p>
            <p>
              Treatment costs are outlined before you proceed, and invoices
              are made available in your patient portal after each visit.
            </p>
            <p>
              This page is a placeholder pending final legal review. Please
              contact the clinic directly with any questions in the meantime.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
