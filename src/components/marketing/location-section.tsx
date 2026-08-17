import { Clock, Mail, MapPin, Phone } from "lucide-react";

import { ScrollReveal } from "@/components/motion";
import { CONTAINER } from "@/lib/layout";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatTime(time: string | null) {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = Number(h);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${m} ${period}`;
}

interface Branch {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
}
interface OpeningHour {
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}

export function LocationSection({ branch, hours }: { branch: Branch | null; hours: OpeningHour[] }) {
  const mapQuery = branch?.address ? encodeURIComponent(branch.address) : null;

  return (
    <section id="visit" className="w-full bg-background-subtle py-24 lg:py-32">
      <div className={CONTAINER}>
        <ScrollReveal className="max-w-lg">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Visit us</p>
          <h2 className="mt-3 font-serif text-display-section text-balance text-foreground">
            We&apos;d love to <span className="text-primary">welcome you.</span>
          </h2>
        </ScrollReveal>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
          <ScrollReveal className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            {mapQuery ? (
              <iframe
                title={`Map showing ${branch?.name ?? "our clinic"}`}
                src={`https://maps.google.com/maps?q=${mapQuery}&z=15&output=embed`}
                className="h-72 w-full border-0 sm:h-full sm:min-h-96"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="flex h-72 items-center justify-center text-sm text-text-muted sm:h-full sm:min-h-96">
                Map unavailable — address not yet published.
              </div>
            )}
          </ScrollReveal>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h3 className="font-serif text-lg text-foreground">{branch?.name ?? "Clinic Care"}</h3>
              <ul className="mt-4 space-y-3 text-sm">
                {branch?.address && (
                  <li className="flex items-start gap-2.5 text-text-secondary">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{branch.address}</span>
                  </li>
                )}
                {branch?.phone && (
                  <li className="flex items-center gap-2.5 text-text-secondary">
                    <Phone className="size-4 shrink-0 text-primary" />
                    <a href={`tel:${branch.phone}`} className="hover:text-foreground hover:underline">
                      {branch.phone}
                    </a>
                  </li>
                )}
                {branch?.email && (
                  <li className="flex items-center gap-2.5 text-text-secondary">
                    <Mail className="size-4 shrink-0 text-primary" />
                    <a href={`mailto:${branch.email}`} className="hover:text-foreground hover:underline">
                      {branch.email}
                    </a>
                  </li>
                )}
              </ul>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h3 className="flex items-center gap-2 font-serif text-lg text-foreground">
                <Clock className="size-4 text-primary" />
                Opening hours
              </h3>
              <ul className="mt-4 space-y-1.5 text-sm">
                {hours.map((h) => (
                  <li key={h.day_of_week} className="flex justify-between text-text-secondary">
                    <span>{DAY_NAMES[h.day_of_week]}</span>
                    <span className="text-foreground">
                      {h.is_closed ? "Closed" : `${formatTime(h.open_time)} – ${formatTime(h.close_time)}`}
                    </span>
                  </li>
                ))}
                {hours.length === 0 && <li className="text-text-muted">Hours not published yet.</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
