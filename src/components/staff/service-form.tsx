"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  Clock,
  FileText,
  Globe,
  LayoutGrid,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ServiceFormContext } from "@/types/services";
import { saveServiceFormAction } from "@/lib/server/doctor-services";
import {
  SERVICE_ICON_OPTIONS,
  ServiceIcon,
  getServiceDefaultIcon,
} from "@/components/staff/service-icons";
import { cn } from "@/lib/utils";

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120];

interface ServiceFormProps {
  mode: "create" | "edit";
  context: ServiceFormContext;
}

export function ServiceForm({ mode, context }: ServiceFormProps) {
  const router = useRouter();
  const { practitioner, service } = context;

  // Form states
  const [name, setName] = React.useState(service?.name ?? "");
  const [iconKey, setIconKey] = React.useState<string>(
    service?.icon_key || getServiceDefaultIcon(service?.name, "General"),
  );
  const [description, setDescription] = React.useState(service?.description ?? "");
  const [duration, setDuration] = React.useState<number>(
    service?.override_duration_minutes ?? service?.clinic_duration_minutes ?? 30,
  );
  const [fee, setFee] = React.useState<string>(
    service?.override_price != null
      ? service.override_price.toString()
      : service?.clinic_price != null
        ? service.clinic_price.toString()
        : "50.00",
  );
  const [showOnWebsite, setShowOnWebsite] = React.useState<boolean>(
    service?.show_on_website ?? true,
  );

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Service name is required");
      return;
    }

    const feeNum = parseFloat(fee);
    if (isNaN(feeNum) || feeNum < 0) {
      toast.error("Please enter a valid procedure fee");
      return;
    }

    if (!duration || duration < 5 || duration > 480) {
      toast.error("Duration must be between 5 and 480 minutes");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await saveServiceFormAction({
        serviceId: mode === "edit" ? service?.service_id : undefined,
        name: name.trim(),
        iconKey: iconKey || getServiceDefaultIcon(name.trim(), "General"),
        description: description.trim() || undefined,
        durationMinutes: duration,
        price: feeNum,
        showOnWebsite,
        practitionerId: practitioner?.id,
      });

      if (res.success) {
        toast.success(
          mode === "create"
            ? `Successfully created "${name.trim()}"`
            : `Successfully updated "${name.trim()}"`,
        );
        router.push(
          practitioner
            ? `/clinical/services?practitioner=${practitioner.id}`
            : "/clinical/services",
        );
      } else {
        toast.error(res.error ?? "Failed to save service");
      }
    } catch {
      toast.error("An unexpected error occurred while saving");
    } finally {
      setIsSubmitting(false);
    }
  };

  const backUrl = practitioner
    ? `/clinical/services?practitioner=${practitioner.id}`
    : "/clinical/services";

  return (
    <div className="space-y-6 w-full max-w-[1440px] pb-16">
      {/* 1. Header & Navigation */}
      <div className="border-b border-border/60 pb-5">
        <Link
          href={backUrl}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mb-2.5"
        >
          <ArrowLeft className="size-3.5" />
          Back to Services
        </Link>
        <h1 className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          {mode === "create" ? "Add Procedure" : "Edit Procedure"}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          {mode === "create"
            ? "Create a centralized procedure for the clinic. It will be enabled for your profile."
            : "Update centralized procedure details, appointment duration, and fees."}
        </p>
      </div>

      {/* 2. Main Form Workspace */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Details (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Card 1: Service Details */}
            <Card className="p-5 sm:p-6 rounded-3xl border border-border/80 bg-card shadow-xs space-y-5">
              <div className="flex items-start gap-3 border-b border-border/60 pb-3.5">
                <div className="size-9 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-2xs">
                  <FileText className="size-4.5" />
                </div>
                <div>
                  <h2 className="font-heading text-base font-extrabold text-foreground">
                    Procedure Identity
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Basic treatment title and patient-facing description.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Service Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="service-name" className="text-xs font-bold text-foreground">
                    Procedure Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="service-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Professional Teeth Whitening"
                    required
                    className="h-10 text-xs rounded-2xl bg-muted/20 border-border/80 focus-visible:bg-card shadow-2xs font-medium"
                  />
                </div>

                {/* Service Icon Picker */}
                <div className="space-y-1.5 pt-1">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-foreground">
                      Procedure Icon <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Choose an icon that best represents this clinical procedure.
                    </p>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5 pt-1">
                    {SERVICE_ICON_OPTIONS.map((opt) => {
                      const isSelected = iconKey === opt.key;
                      const IconComponent = opt.icon;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setIconKey(opt.key)}
                          className={cn(
                            "flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border transition-all cursor-pointer",
                            isSelected
                              ? "bg-[#0B3B36] text-white border-[#0B3B36] shadow-md shadow-[#0B3B36]/20 scale-105"
                              : "bg-muted/20 border-border/70 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                          )}
                        >
                          <IconComponent className="size-5" />
                          <span className="text-[10px] font-bold truncate max-w-full text-center">
                            {opt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Short Description */}
                <div className="space-y-1.5 pt-1">
                  <Label htmlFor="service-description" className="text-xs font-bold text-foreground">
                    Short Description (Optional)
                  </Label>
                  <textarea
                    id="service-description"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide patient-friendly instructions or a brief summary of what this procedure involves..."
                    className="w-full rounded-2xl border border-border/80 bg-muted/20 p-3 text-xs focus-visible:bg-card focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs font-medium leading-relaxed resize-none"
                  />
                </div>
              </div>
            </Card>

            {/* Card 2: Schedule & Pricing */}
            <Card className="p-5 sm:p-6 rounded-3xl border border-border/80 bg-card shadow-xs space-y-5">
              <div className="flex items-start gap-3 border-b border-border/60 pb-3.5">
                <div className="size-9 rounded-2xl bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 flex items-center justify-center shrink-0 border border-blue-200/60 shadow-2xs">
                  <CalendarClock className="size-4.5" />
                </div>
                <div>
                  <h2 className="font-heading text-base font-extrabold text-foreground">
                    Duration &amp; Pricing
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Slot interval and default fee for this procedure.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Duration */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-foreground flex items-center justify-between">
                    <span>Duration (Minutes) *</span>
                    <span className="text-primary font-bold font-mono">{duration} mins</span>
                  </Label>

                  {/* Preset Pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {DURATION_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setDuration(preset)}
                        className={cn(
                          "px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                          duration === preset
                            ? "bg-[#0B3B36] text-white border-[#0B3B36] shadow-2xs"
                            : "border-border/70 bg-muted/20 text-muted-foreground hover:bg-muted/40",
                        )}
                      >
                        {preset}m
                      </button>
                    ))}
                  </div>

                  <Input
                    type="number"
                    min={5}
                    max={480}
                    step={5}
                    value={duration || ""}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    placeholder="e.g. 45"
                    className="h-10 text-xs font-mono font-bold rounded-2xl bg-muted/20 border-border/80 focus-visible:bg-card shadow-2xs"
                    required
                  />
                </div>

                {/* Fee */}
                <div className="space-y-2">
                  <Label htmlFor="service-fee" className="text-xs font-bold text-foreground">
                    Fee / Price (€) *
                  </Label>
                  <div className="relative pt-6">
                    <span className="pointer-events-none absolute left-3.5 top-[38px] text-xs font-bold text-muted-foreground font-mono">
                      €
                    </span>
                    <Input
                      id="service-fee"
                      type="number"
                      min={0}
                      step={1}
                      value={fee}
                      onChange={(e) => setFee(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      placeholder="0.00"
                      className="h-10 rounded-2xl pl-8 text-xs font-mono font-bold bg-muted/20 border-border/80 focus-visible:bg-card shadow-2xs"
                      required
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Card 3: Online Booking Settings */}
            <Card className="p-5 sm:p-6 rounded-3xl border border-border/80 bg-card shadow-xs">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-foreground">
                    <Globe className="size-3.5 text-primary" />
                    <span>Display in Online Booking</span>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-md">
                    Allow patients to discover and book this procedure through the patient self-booking portal.
                  </p>
                </div>
                <Switch
                  checked={showOnWebsite}
                  onCheckedChange={setShowOnWebsite}
                  className="data-[state=checked]:bg-emerald-700 cursor-pointer"
                />
              </div>
            </Card>
          </div>

          {/* Right Column: Sticky Action & Preview Panel (4 cols) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
            {/* Live Preview Card */}
            <Card className="p-5 rounded-3xl border border-border/80 bg-card shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <LayoutGrid className="size-4 text-primary" />
                <span className="font-heading text-xs font-black uppercase tracking-wider text-foreground">
                  Live Preview
                </span>
              </div>

              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-3 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#0B3B36]/10 text-[#0B3B36] border border-emerald-500/20 shadow-2xs">
                    <ServiceIcon iconKey={iconKey} className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-heading text-sm font-extrabold text-foreground truncate">
                      {name || "Untitled Procedure"}
                    </h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                      {description || "No description provided."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs font-semibold">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="size-3" />
                    {duration} mins
                  </span>
                  <span className="font-mono font-black text-foreground">
                    €{parseFloat(fee || "0").toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Action Card */}
            <Card className="p-5 rounded-3xl border border-border/80 bg-card shadow-xs space-y-3">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 gap-2 rounded-2xl bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white font-bold text-xs shadow-md shadow-[#0B3B36]/20 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Saving Procedure...</span>
                  </>
                ) : (
                  <>
                    <Check className="size-4 stroke-[2.5]" />
                    <span>{mode === "create" ? "Create Procedure" : "Save Changes"}</span>
                  </>
                )}
              </Button>

              <ButtonLink
                href={backUrl}
                variant="outline"
                className="w-full h-10 rounded-2xl text-xs font-bold border-border/80 hover:bg-muted/40 cursor-pointer"
              >
                Cancel
              </ButtonLink>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
