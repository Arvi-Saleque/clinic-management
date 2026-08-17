import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { MobileStickyBookingBar } from "@/components/marketing/mobile-sticky-booking-bar";
import { getClinicInfo, listPublicServices } from "@/lib/server/marketing";
import { getProfile } from "@/lib/auth/session";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [services, { branch }, profile] = await Promise.all([
    listPublicServices(),
    getClinicInfo(),
    getProfile(),
  ]);
  const treatments = services.map((s) => ({ href: `/services/${s.slug}`, label: s.name }));
  const account = profile
    ? { label: profile.full_name.split(" ")[0], href: profile.role === "patient" ? "/portal/dashboard" : "/dashboard" }
    : null;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader treatments={treatments} account={account} />
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      <SiteFooter branch={branch} treatments={treatments} />
      <MobileStickyBookingBar phone={branch?.phone ?? null} />
    </div>
  );
}
