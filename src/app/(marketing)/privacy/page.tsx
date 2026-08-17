import type { Metadata } from "next";

import { CONTAINER } from "@/lib/layout";
import { PageBanner } from "@/components/marketing/page-banner";
import { PAGE_BANNERS, toImageProp } from "@/lib/marketing-images";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <>
      <PageBanner eyebrow="Legal" title="Privacy Policy" image={toImageProp(PAGE_BANNERS.contact)} className="min-h-[32vh]" />
      <section className="w-full py-20">
        <div className={CONTAINER}>
          <div className="mx-auto max-w-2xl space-y-4 text-sm text-text-secondary">
            <p>
              We collect and store the personal and clinical information you
              provide when you register, book appointments, and receive
              treatment, so your care team can deliver safe, connected care.
            </p>
            <p>
              Your records are protected by role-based access controls —
              only you and your treating clinicians can see your clinical
              history, appointments, invoices and prescriptions.
            </p>
            <p>
              This page is a placeholder pending final legal review. Please
              contact the clinic directly with any questions about how your
              data is handled in the meantime.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
