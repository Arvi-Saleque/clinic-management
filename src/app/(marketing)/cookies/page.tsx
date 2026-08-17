import type { Metadata } from "next";

import { CONTAINER } from "@/lib/layout";
import { PageBanner } from "@/components/marketing/page-banner";
import { PAGE_BANNERS, toImageProp } from "@/lib/marketing-images";

export const metadata: Metadata = { title: "Cookie Policy" };

export default function CookiesPage() {
  return (
    <>
      <PageBanner eyebrow="Legal" title="Cookie Policy" image={toImageProp(PAGE_BANNERS.contact)} className="min-h-[32vh]" />
      <section className="w-full py-20">
        <div className={CONTAINER}>
          <div className="mx-auto max-w-2xl space-y-4 text-sm text-text-secondary">
            <p>
              We use essential cookies to keep you signed in and to remember
              your light/dark theme preference. We don&apos;t use third-party
              advertising or tracking cookies.
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
