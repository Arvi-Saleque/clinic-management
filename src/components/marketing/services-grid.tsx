import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ScrollReveal, StaggerGroup, StaggerItem, TiltCard } from "@/components/motion";
import { CONTAINER } from "@/lib/layout";
import { imageSrc, SERVICE_CATEGORY_IMAGES, SERVICE_IMAGE_FALLBACK } from "@/lib/marketing-images";
import { cn } from "@/lib/utils";

export interface ServiceCardData {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  duration_minutes: number;
  price: number;
}

export function ServicesGrid({ services }: { services: ServiceCardData[] }) {
  return (
    <section className="w-full bg-background-subtle py-24 lg:py-32">
      <div className={CONTAINER}>
        <ScrollReveal className="max-w-lg">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Treatments
          </p>
          <h2 className="mt-3 font-serif text-display-section text-balance text-foreground">
            Complete care for <span className="text-primary">every smile.</span>
          </h2>
        </ScrollReveal>

        <StaggerGroup className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => {
            const image =
              (service.category ? SERVICE_CATEGORY_IMAGES[service.category] : undefined) ??
              SERVICE_IMAGE_FALLBACK;
            const featured = index === 0;
            return (
              <StaggerItem key={service.id} className={featured ? "lg:col-span-2" : undefined}>
                <TiltCard maxTilt={6} className="h-full">
                  <Link
                    href={`/services/${service.slug}`}
                    className={cn(
                      "group relative flex h-full overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-shadow hover:shadow-xl hover:shadow-primary/10",
                      featured ? "flex-col sm:flex-row" : "flex-col",
                    )}
                  >
                    <div
                      className={cn(
                        "relative w-full shrink-0 overflow-hidden",
                        featured ? "aspect-[4/3] sm:aspect-auto sm:w-1/2" : "aspect-[4/3]",
                      )}
                    >
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
                        <h3 className="text-display-card font-serif text-foreground">{service.name}</h3>
                        {service.description && (
                          <p className="mt-2 text-sm text-text-secondary">{service.description}</p>
                        )}
                      </div>
                      <div className="mt-6 flex items-center justify-between text-sm">
                        <span className="text-text-secondary">
                          From{" "}
                          <span className="font-semibold text-foreground">
                            €{Number(service.price).toLocaleString()}
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
      </div>
    </section>
  );
}
