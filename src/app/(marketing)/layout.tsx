import "@/styles/marketing-luxury.css";
import "@/styles/marketing-homepage-refinement.css";
import "@/styles/marketing-homepage-motion.css";
import "@/styles/marketing-public-pages-refinement.css";
import { LuxuryHeader } from "@/components/marketing/luxury-header";
import { LuxuryFooter } from "@/components/marketing/luxury-footer";
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
    ? {
        label: profile.full_name.split(" ")[0],
        href: profile.role === "patient" ? "/portal/dashboard" : "/dashboard",
      }
    : null;

  return (
    <div className="marketing-luxury-theme flex min-h-screen flex-col bg-[#273338] text-[#f1f5f9]">
      <LuxuryHeader
        phone={branch?.phone ?? "+44 (020) 7946 0000"}
        account={account}
        treatments={treatments}
      />
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      <LuxuryFooter branch={branch} treatments={treatments} />
      <MobileStickyBookingBar phone={branch?.phone ?? null} />
    </div>
  );
}
