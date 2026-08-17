import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, Tag } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { CONTAINER } from "@/lib/layout";
import { GlassPanel, ScrollReveal } from "@/components/motion";
import { PageBanner } from "@/components/marketing/page-banner";
import { SERVICE_CATEGORY_IMAGES, SERVICE_IMAGE_FALLBACK, toImageProp } from "@/lib/marketing-images";
import { getPublicServiceBySlug } from "@/lib/server/marketing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await getPublicServiceBySlug(slug);
  return { title: service?.name ?? "Service" };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = await getPublicServiceBySlug(slug);
  if (!service) notFound();

  const image =
    (service.category ? SERVICE_CATEGORY_IMAGES[service.category] : undefined) ?? SERVICE_IMAGE_FALLBACK;

  return (
    <>
      <PageBanner
        eyebrow={service.category ?? "Service"}
        title={service.name}
        image={toImageProp(image)}
        className="min-h-[38vh]"
      />

      <section className="w-full py-20">
        <div className={CONTAINER}>
          <ScrollReveal className="mx-auto max-w-2xl">
            <GlassPanel className="p-8">
              {service.description && <p className="text-muted-foreground">{service.description}</p>}

              <div className="mt-6 flex flex-wrap gap-6 text-sm">
                <span className="flex items-center gap-2">
                  <Clock className="size-4 text-primary" />
                  {service.duration_minutes} minutes
                </span>
                <span className="flex items-center gap-2">
                  <Tag className="size-4 text-primary" />
                  From &#2547;{Number(service.price).toLocaleString()}
                </span>
              </div>

              <ButtonLink href="/book" className="mt-8">
                Book this service
              </ButtonLink>
            </GlassPanel>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
