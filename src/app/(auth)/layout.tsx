import Link from "next/link";
import { Stethoscope } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-muted/30 px-4 py-12">
      <Link href="/" className="flex items-center gap-2 font-heading text-lg font-bold">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Stethoscope className="size-5" />
        </span>
        Clinic Care
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
