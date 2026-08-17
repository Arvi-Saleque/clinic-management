import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CONTAINER } from "@/lib/layout";
import { StaggerGroup, StaggerItem, TiltCard } from "@/components/motion";
import { PageBanner } from "@/components/marketing/page-banner";
import {
  imageSrc,
  PAGE_BANNERS,
  SERVICE_CATEGORY_IMAGES,
  SERVICE_IMAGE_FALLBACK,
  toImageProp,
} from "@/lib/marketing-images";
import { listPublicServices } from "@/lib/server/marketing";

export const metadata: Metadata = { title: "Services" };

export default async function ServicesPage() {
  const services = await listPublicServices();

  return (
    <>
      <PageBanner
        eyebrow="Services"
        title="Every treatment, clearly explained"
        description="From routine check-ups to cosmetic transformations — see what's involved and what it costs before you book."
        image={toImageProp(PAGE_BANNERS.services)}
      />

      <section className="w-full py-20">
        <div className={CONTAINER}>
          {services.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">No services are listed yet.</p>
          ) : (
            <StaggerGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => {
                const image =
                  (service.category ? SERVICE_CATEGORY_IMAGES[service.category] : undefined) ??
                  SERVICE_IMAGE_FALLBACK;
                return (
                  <StaggerItem key={service.id}>
                    <TiltCard maxTilt={8} className="h-full">
                      <Link
                        href={`/services/${service.slug}`}
                        className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm transition-shadow hover:shadow-xl hover:shadow-primary/10"
                      >
                        <div className="relative aspect-[16/10] w-full overflow-hidden">
                          <Image
                            src={imageSrc(image, 800)}
                            alt={image.alt}
                            fill
                            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
                          {service.category && (
                            <Badge variant="secondary" className="absolute left-3 top-3 shadow-sm">
                              {service.category}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col justify-between p-6">
                          <div>
                            <h3 className="font-heading text-lg font-semibold">{service.name}</h3>
                            {service.description && (
                              <p className="mt-2 text-sm text-muted-foreground">{service.description}</p>
                            )}
                          </div>
                          <div className="mt-6 flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              From{" "}
                              <span className="font-semibold text-foreground">
                                &#2547;{Number(service.price).toLocaleString()}
                              </span>{" "}
                              &middot; {service.duration_minutes} min
                            </span>
                            <ArrowUpRight className="size-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                          </div>
                        </div>
                      </Link>
                    </TiltCard>
                  </StaggerItem>
                );
              })}
            </StaggerGroup>
          )}
        </div>
      </section>
    </>
  );
}
