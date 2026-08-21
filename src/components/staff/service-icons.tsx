import {
  Activity,
  AlertCircle,
  Baby,
  CalendarCheck,
  Crown,
  Scissors,
  Smile,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Standard Tooth SVG Icon
 */
export function ToothIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-5", className)}
      {...props}
    >
      <path d="M7 3C4.2 3 2 5.2 2 8c0 2.8 1.5 5 2 7.5.5 2.5 1 5.5 2.5 5.5s2-2.5 3-5c1-2.5 5-2.5 6 0 1 2.5 1.5 5 3 5s2-3 2.5-5.5c.5-2.5 2-4.7 2-7.5 0-2.8-2.2-5-5-5-2.5 0-3.5 1.5-5 1.5S9.5 3 7 3Z" />
    </svg>
  );
}

/**
 * Veneer / Aesthetic Tooth SVG Icon
 */
export function VeneerToothIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-5", className)}
      {...props}
    >
      <path d="M7 3.5C4.5 3.5 2.5 5.5 2.5 8c0 2.5 1.5 4.5 2 7 .5 2.5 1 5 2.5 5s2-2.5 3-5c1-2.5 5-2.5 6 0 1 2.5 1.5 5 3 5s2-2.5 2.5-5c.5-2.5 2-4.5 2-7 0-2.5-2-4.5-4.5-4.5-2.5 0-3.5 1.5-5 1.5S9.5 3.5 7 3.5Z" />
      <path d="M9 7.5c1.5-.5 4.5-.5 6 0" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * Dental Tooth with Hygiene / Clean Shield SVG
 */
export function HygieneToothIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-5", className)}
      {...props}
    >
      <path d="M6.5 4C4.5 4 3 5.8 3 8c0 2.4 1.2 4.2 1.8 6.5.4 2 .8 4.5 2.2 4.5 1.2 0 1.6-2 2.5-4.2" />
      <path d="M17.5 4c2 0 3.5 1.8 3.5 4 0 2.4-1.2 4.2-1.8 6.5-.4 2-.8 4.5-2.2 4.5-1.2 0-1.6-2-2.5-4.2" />
      <path d="M12 2v4m-2-2h4" strokeWidth="1.75" />
      <path d="M8 11.5c2.5-1 5.5-1 8 0" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * Dental Aligners / Arch SVG
 */
export function AlignersIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-5", className)}
      {...props}
    >
      <path d="M4 17C4 10.5 7.5 6 12 6s8 4.5 8 11" />
      <path d="M7 16.5C7 12 9 9 12 9s5 3 5 7.5" strokeWidth="1.5" strokeDasharray="2 2" />
      <circle cx="4" cy="17" r="1.5" fill="currentColor" />
      <circle cx="20" cy="17" r="1.5" fill="currentColor" />
    </svg>
  );
}

/**
 * Dental Implant Screw SVG
 */
export function ImplantIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-5", className)}
      {...props}
    >
      <rect x="7" y="3" width="10" height="5" rx="1.5" />
      <path d="M9 8v10l3 3 3-3V8" />
      <path d="M8 11h8m-7 3h6m-5 3h4" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * Dental Gum Therapy SVG
 */
export function GumTherapyIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-5", className)}
      {...props}
    >
      <path d="M7 3C4.2 3 2 5.2 2 8c0 2.8 1.5 5 2 7.5.5 2.5 1 5.5 2.5 5.5s2-2.5 3-5c1-2.5 5-2.5 6 0 1 2.5 1.5 5 3 5s2-3 2.5-5.5c.5-2.5 2-4.7 2-7.5 0-2.8-2.2-5-5-5-2.5 0-3.5 1.5-5 1.5S9.5 3 7 3Z" />
      <path d="M2 13c3 2 6 2 10 0 4-2 7-2 10 0" strokeWidth="1.75" />
    </svg>
  );
}

export interface ServiceIconOption {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const SERVICE_ICON_OPTIONS: ServiceIconOption[] = [
  {
    key: "tooth",
    label: "Tooth",
    description: "Restorative, fillings, bonding",
    icon: ToothIcon,
  },
  {
    key: "veneer",
    label: "Veneer",
    description: "Cosmetic veneers, aesthetic smile",
    icon: VeneerToothIcon,
  },
  {
    key: "laser-whitening",
    label: "Laser Whitening",
    description: "Teeth bleaching, stain removal",
    icon: Sun,
  },
  {
    key: "hygiene",
    label: "Hygiene",
    description: "Teeth cleaning, scaling, polishing",
    icon: HygieneToothIcon,
  },
  {
    key: "check-up",
    label: "Check-up",
    description: "Oral exam, diagnostics, routine consult",
    icon: CalendarCheck,
  },
  {
    key: "crown",
    label: "Crown",
    description: "Prosthodontics, caps, bridges, onlays",
    icon: Crown,
  },
  {
    key: "implant",
    label: "Implant",
    description: "Dental implants, screw-retained teeth",
    icon: ImplantIcon,
  },
  {
    key: "root-canal",
    label: "Root Canal",
    description: "Endodontic nerve treatment, pulp therapy",
    icon: Activity,
  },
  {
    key: "surgery",
    label: "Surgery",
    description: "Wisdom teeth, extractions, minor surgery",
    icon: Scissors,
  },
  {
    key: "pediatric",
    label: "Pediatric",
    description: "Children dentistry, sealants, fluoride",
    icon: Baby,
  },
  {
    key: "aligners",
    label: "Aligners",
    description: "Orthodontics, clear aligners, braces",
    icon: AlignersIcon,
  },
  {
    key: "smile-design",
    label: "Smile Design",
    description: "Full smile makeover, cosmetic alignment",
    icon: Smile,
  },
  {
    key: "gum-therapy",
    label: "Gum Therapy",
    description: "Periodontal deep scaling, gum treatment",
    icon: GumTherapyIcon,
  },
  {
    key: "emergency",
    label: "Emergency",
    description: "Urgent toothache relief, trauma, pain",
    icon: AlertCircle,
  },
];

/**
 * Intelligent default icon matcher from service name and category
 */
export function getServiceDefaultIcon(name?: string | null, category?: string | null): string {
  const text = `${name || ""} ${category || ""}`.toLowerCase();

  if (text.includes("whiten") || text.includes("bleach") || text.includes("laser")) {
    return "laser-whitening";
  }
  if (text.includes("veneer") || text.includes("aesthetic") || text.includes("cosmetic")) {
    return "veneer";
  }
  if (text.includes("clean") || text.includes("hygiene") || text.includes("polishing") || text.includes("scale") || text.includes("scaling")) {
    return "hygiene";
  }
  if (text.includes("check") || text.includes("consult") || text.includes("exam") || text.includes("evaluation") || text.includes("chart")) {
    return "check-up";
  }
  if (text.includes("crown") || text.includes("bridge") || text.includes("prostho") || text.includes("cap")) {
    return "crown";
  }
  if (text.includes("root") || text.includes("canal") || text.includes("endo") || text.includes("nerve") || text.includes("pulp")) {
    return "root-canal";
  }
  if (text.includes("surgery") || text.includes("extract") || text.includes("wisdom") || text.includes("surgical")) {
    return "surgery";
  }
  if (text.includes("implant")) {
    return "implant";
  }
  if (text.includes("child") || text.includes("pediatric") || text.includes("kid") || text.includes("sealant")) {
    return "pediatric";
  }
  if (text.includes("aligner") || text.includes("brace") || text.includes("invisalign")) {
    return "aligners";
  }
  if (text.includes("smile") || text.includes("ortho") || text.includes("makeover")) {
    return "smile-design";
  }
  if (text.includes("emergency") || text.includes("urgent") || text.includes("pain") || text.includes("trauma")) {
    return "emergency";
  }
  if (text.includes("gum") || text.includes("perio") || text.includes("fluoride") || text.includes("irrigation")) {
    return "gum-therapy";
  }
  if (text.includes("fill") || text.includes("composite") || text.includes("restorat") || text.includes("inlay") || text.includes("tooth")) {
    return "tooth";
  }

  return "tooth";
}

/**
 * ServiceIcon component
 */
export function ServiceIcon({
  iconKey,
  name,
  category,
  className,
}: {
  iconKey?: string | null;
  name?: string | null;
  category?: string | null;
  className?: string;
}) {
  let resolvedKey = iconKey || getServiceDefaultIcon(name, category);
  
  // Legacy aliases support
  if (resolvedKey === "sparkle-tooth") resolvedKey = "veneer";
  if (resolvedKey === "whitening") resolvedKey = "laser-whitening";
  if (resolvedKey === "cleaning") resolvedKey = "hygiene";
  if (resolvedKey === "checkup") resolvedKey = "check-up";
  if (resolvedKey === "children") resolvedKey = "pediatric";
  if (resolvedKey === "smile") resolvedKey = "smile-design";
  if (resolvedKey === "droplets") resolvedKey = "gum-therapy";

  const found = SERVICE_ICON_OPTIONS.find((opt) => opt.key === resolvedKey);
  const IconComponent = found ? found.icon : ToothIcon;

  return <IconComponent className={cn("size-5", className)} />;
}
