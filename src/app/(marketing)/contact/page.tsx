import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

import { CONTAINER } from "@/lib/layout";
import { GlassPanel } from "@/components/motion";
import { PageBanner } from "@/components/marketing/page-banner";
import { PAGE_BANNERS, toImageProp } from "@/lib/marketing-images";
import { getClinicInfo } from "@/lib/server/marketing";

export const metadata: Metadata = { title: "Contact" };

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatTime(time: string | null) {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = Number(h);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${m} ${period}`;
}

export default async function ContactPage() {
  const { branch, hours } = await getClinicInfo();

  return (
    <>
      <PageBanner
        eyebrow="Contact"
        title="Get in touch"
        description="Have a question before booking? Reach out — we're happy to help."
        image={toImageProp(PAGE_BANNERS.contact)}
      />

      <section className="w-full py-20">
        <div className={CONTAINER}>
          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
            <GlassPanel className="p-6">
              <h2 className="font-heading text-lg font-semibold">{branch?.name ?? "Clinic Care"}</h2>
              <ul className="mt-4 space-y-3 text-sm">
                {branch?.address && (
                  <li className="flex items-start gap-2">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{branch.address}</span>
                  </li>
                )}
                {branch?.phone && (
                  <li className="flex items-center gap-2">
                    <Phone className="size-4 shrink-0 text-primary" />
                    <a href={`tel:${branch.phone}`} className="hover:underline">
                      {branch.phone}
                    </a>
                  </li>
                )}
                {branch?.email && (
                  <li className="flex items-center gap-2">
                    <Mail className="size-4 shrink-0 text-primary" />
                    <a href={`mailto:${branch.email}`} className="hover:underline">
                      {branch.email}
                    </a>
                  </li>
                )}
              </ul>
            </GlassPanel>

            <GlassPanel className="p-6">
              <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
                <Clock className="size-4 text-primary" />
                Opening hours
              </h2>
              <ul className="mt-4 space-y-1.5 text-sm">
                {hours.map((h) => (
                  <li key={h.day_of_week} className="flex justify-between">
                    <span className="text-muted-foreground">{DAY_NAMES[h.day_of_week]}</span>
                    <span>{h.is_closed ? "Closed" : `${formatTime(h.open_time)} – ${formatTime(h.close_time)}`}</span>
                  </li>
                ))}
                {hours.length === 0 && <li className="text-muted-foreground">Hours not published yet.</li>}
              </ul>
            </GlassPanel>
          </div>
        </div>
      </section>
    </>
  );
}
