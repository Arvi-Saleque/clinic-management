import { requireStaff } from "@/lib/auth/guards";
import { StaffShell } from "@/components/staff/staff-shell";

export const dynamic = "force-dynamic";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireStaff();

  return <StaffShell profile={profile}>{children}</StaffShell>;
}
