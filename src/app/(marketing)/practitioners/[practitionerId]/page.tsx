import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { CONTAINER } from "@/lib/layout";
import { GlassPanel, ScrollReveal } from "@/components/motion";
import { PageBanner } from "@/components/marketing/page-banner";
import { imageSrc, pickFromPool, PRACTITIONER_PHOTO_FALLBACKS } from "@/lib/marketing-images";
import { getPublicPractitionerById } from "@/lib/server/marketing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ practitionerId: string }>;
}): Promise<Metadata> {
  const { practitionerId } = await params;
  const practitioner = await getPublicPractitionerById(practitionerId);
  return { title: practitioner?.profiles?.full_name ?? "Practitioner" };
}

export default async function PractitionerDetailPage({
  params,
}: {
  params: Promise<{ practitionerId: string }>;
}) {
  const { practitionerId } = await params;
  const practitioner = await getPublicPractitionerById(practitionerId);
  if (!practitioner) notFound();

  const name = practitioner.profiles?.full_name ?? "Practitioner";
  const image = practitioner.photo_url
    ? { src: practitioner.photo_url, alt: name }
    : { src: imageSrc(pickFromPool(PRACTITIONER_PHOTO_FALLBACKS, practitioner.id), 1920), alt: name };

  return (
    <>
      <PageBanner
        eyebrow={practitioner.title ?? "Practitioner"}
        title={name}
        image={image}
        className="min-h-[38vh]"
      />

      <section className="w-full py-20">
        <div className={CONTAINER}>
          <ScrollReveal className="mx-auto max-w-2xl">
            <GlassPanel className="p-8">
              <div className="flex flex-wrap gap-1.5">
                {(practitioner.specialties ?? []).map((s) => (
                  <Badge key={s} variant="outline">
                    {s}
                  </Badge>
                ))}
              </div>

              {practitioner.bio && <p className="mt-4 text-sm text-muted-foreground">{practitioner.bio}</p>}

              <ButtonLink href="/book" className="mt-8">
                Book with {name.split(" ")[0]}
              </ButtonLink>
            </GlassPanel>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
