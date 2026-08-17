import { requireStaff } from "@/lib/auth/guards";
import { StaffShell } from "@/components/staff/staff-shell";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireStaff();

  return <StaffShell profile={profile}>{children}</StaffShell>;
}
