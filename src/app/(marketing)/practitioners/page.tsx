import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { CONTAINER } from "@/lib/layout";
import { StaggerGroup, StaggerItem, TiltCard } from "@/components/motion";
import { PageBanner } from "@/components/marketing/page-banner";
import {
  imageSrc,
  PAGE_BANNERS,
  pickFromPool,
  PRACTITIONER_PHOTO_FALLBACKS,
  toImageProp,
} from "@/lib/marketing-images";
import { listPublicPractitioners } from "@/lib/server/marketing";

export const metadata: Metadata = { title: "Practitioners" };

export default async function PractitionersPage() {
  const practitioners = await listPublicPractitioners();

  return (
    <>
      <PageBanner
        eyebrow="Our team"
        title="Meet your care team"
        description="Experienced clinicians dedicated to clear, comfortable, connected care."
        image={toImageProp(PAGE_BANNERS.practitioners)}
      />

      <section className="w-full py-20">
        <div className={CONTAINER}>
          {practitioners.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">No practitioners are listed yet.</p>
          ) : (
            <StaggerGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {practitioners.map((p) => {
                const name = p.profiles?.full_name ?? "Practitioner";
                const image = p.photo_url
                  ? { src: p.photo_url, alt: name }
                  : { src: imageSrc(pickFromPool(PRACTITIONER_PHOTO_FALLBACKS, p.id), 800), alt: name };

                return (
                  <StaggerItem key={p.id}>
                    <TiltCard maxTilt={6} className="h-full">
                      <Link
                        href={`/practitioners/${p.id}`}
                        className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm transition-shadow hover:shadow-xl hover:shadow-primary/10"
                      >
                        <div className="relative aspect-[4/3] w-full overflow-hidden">
                          <Image
                            src={image.src}
                            alt={image.alt}
                            fill
                            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" />
                        </div>
                        <div className="p-6">
                          <h3 className="font-heading text-lg font-semibold">{name}</h3>
                          {p.title && <p className="text-sm text-muted-foreground">{p.title}</p>}
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {(p.specialties ?? []).map((s) => (
                              <Badge key={s} variant="outline" className="text-xs">
                                {s}
                              </Badge>
                            ))}
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
