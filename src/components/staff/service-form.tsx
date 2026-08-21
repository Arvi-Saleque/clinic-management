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
  LayoutGrid,
  Loader2,
  Plus,
  Sparkles,
  Stethoscope,
  Tag,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoryItem, ServiceFormContext } from "@/types/services";
import { saveServiceFormAction } from "@/lib/server/doctor-services";
import { CategoryManagerDialog } from "@/components/staff/category-manager-dialog";
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
  const { practitioner, categories: initialCategories, service } = context;

  const [categories, setCategories] = React.useState<CategoryItem[]>(initialCategories);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = React.useState(false);

  // Form states
  const [name, setName] = React.useState(service?.name ?? "");
  const [category, setCategory] = React.useState(
    service?.category ?? (initialCategories[0]?.name || "Children"),
  );
  const [iconKey, setIconKey] = React.useState<string>(
    service?.icon_key || getServiceDefaultIcon(service?.name, service?.category),
  );
  const [description, setDescription] = React.useState(service?.description ?? "");
  const [duration, setDuration] = React.useState<number>(
    service?.effective_duration_minutes ?? 30,
  );
  const [fee, setFee] = React.useState<string>(
    service?.effective_price != null ? service.effective_price.toString() : "80.00",
  );
  const [showOnWebsite, setShowOnWebsite] = React.useState<boolean>(
    service?.show_on_website ?? true,
  );

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleCategoriesUpdate = (updated: CategoryItem[]) => {
    setCategories(updated);
    if (updated.length > 0 && !updated.some((c) => c.name === category)) {
      setCategory(updated[0].name);
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Service name is required");
      return;
    }

    if (!category.trim()) {
      toast.error("Category is required");
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
      const selectedCat = categories.find(
        (c) => c.name.toLowerCase() === category.trim().toLowerCase(),
      );

      const res = await saveServiceFormAction({
        serviceId: mode === "edit" ? service?.service_id : undefined,
        name: name.trim(),
        category: category.trim(),
        categoryId: selectedCat?.id,
        iconKey: iconKey || getServiceDefaultIcon(name.trim(), category.trim()),
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
          Back to Services &amp; Treatments
        </Link>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {mode === "create" ? "Add Clinical Service" : "Edit Clinical Service"}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          {mode === "create"
            ? "Configure a new treatment offering, assigned category, appointment slot duration, and custom fees."
            : "Update treatment details, allocated duration, online patient visibility, and procedure fees."}
        </p>
      </div>

      {/* 2. Main Form Workspace */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Details (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Card 1: Service Details */}
            <Card className="p-6 rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xs shadow-xs space-y-5">
              <div className="flex items-start gap-3 border-b border-border/60 pb-3.5">
                <div className="size-9 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200/60">
                  <FileText className="size-4.5" />
                </div>
                <div>
                  <h2 className="font-heading text-base font-extrabold text-foreground">
                    Service Identity
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Treatment name, clinical category section, and descriptive details for patients.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Service Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="service-name" className="text-xs font-bold text-foreground">
                    Service Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="service-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Professional Laser Teeth Whitening"
                    required
                    className="h-10 text-xs rounded-xl bg-card border-border/80 focus-visible:ring-1"
                  />
                </div>

                {/* Category Selection */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="service-category" className="text-xs font-bold text-foreground">
                      Clinical Section / Category <span className="text-destructive">*</span>
                    </Label>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Tag className="size-3" /> Manage Sections
                    </button>
                  </div>
                  <Select value={category} onValueChange={(val) => val && setCategory(val)}>
                    <SelectTrigger id="service-category" className="h-10 text-xs rounded-xl font-medium bg-card border-border/80">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 rounded-2xl">
                      {categories.map((c) => (
                        <SelectItem key={c.name} value={c.name} className="text-xs">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Service Icon Picker */}
                <div className="space-y-1.5 pt-1">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-foreground">
                      Procedure Icon <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Select the medical icon that best represents this procedure in portals and booking steps.
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
                          title={`${opt.label}: ${opt.description}`}
                          className={cn(
                            "flex flex-col items-center justify-center gap-1.5 rounded-2xl p-2.5 transition-all text-center min-h-[74px] border cursor-pointer",
                            isSelected
                              ? "bg-emerald-50 text-emerald-950 border-2 border-emerald-600 shadow-2xs font-bold ring-2 ring-emerald-500/20 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-500"
                              : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40 border-border/70",
                          )}
                        >
                          <IconComponent className={cn("size-5", isSelected ? "text-emerald-800 dark:text-emerald-400" : "text-muted-foreground")} />
                          <span className="text-[10px] leading-tight truncate w-full">
                            {opt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Short Description */}
                <div className="space-y-1.5">
                  <Label htmlFor="service-desc" className="text-xs font-bold text-foreground">
                    Patient Description <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="service-desc"
                      value={description}
                      onChange={(e) => setDescription(e.target.value.slice(0, 160))}
                      maxLength={160}
                      placeholder="Briefly describe what this treatment entails and how it benefits your patient..."
                      className="h-10 text-xs rounded-xl bg-card border-border/80 pr-14"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground">
                      {description.length}/160
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Card 2: Appointment & Fee */}
            <Card className="p-6 rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xs shadow-xs space-y-5">
              <div className="flex items-start gap-3 border-b border-border/60 pb-3.5">
                <div className="size-9 rounded-2xl bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 flex items-center justify-center shrink-0 border border-teal-200/60">
                  <CalendarClock className="size-4.5" />
                </div>
                <div>
                  <h2 className="font-heading text-base font-extrabold text-foreground">
                    Duration &amp; Procedure Fee
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Appointment slot length, fee calculation, and online availability.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Duration */}
                  <div className="space-y-2">
                    <Label htmlFor="service-duration" className="text-xs font-bold text-foreground">
                      Slot Duration (minutes) <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Clock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/70" />
                      <Input
                        id="service-duration"
                        type="number"
                        min={5}
                        max={480}
                        step={5}
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value, 10) || 5)}
                        required
                        className="h-10 text-xs rounded-xl pl-9.5 pr-10 font-bold bg-card border-border/80"
                      />
                      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                        min
                      </span>
                    </div>

                    {/* Quick presets */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="text-[11px] font-medium text-muted-foreground mr-1">Presets:</span>
                      {DURATION_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setDuration(preset)}
                          className={cn(
                            "rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer",
                            duration === preset
                              ? "bg-[#0B3B36] text-white shadow-2xs"
                              : "bg-muted/40 text-muted-foreground hover:bg-muted/80 border border-border/60",
                          )}
                        >
                          {preset}m
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* My Fee */}
                  <div className="space-y-2">
                    <Label htmlFor="service-fee" className="text-xs font-bold text-foreground">
                      Procedure Fee (৳) <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                        ৳
                      </span>
                      <Input
                        id="service-fee"
                        type="number"
                        min={0}
                        step={10}
                        value={fee}
                        onChange={(e) => setFee(e.target.value)}
                        placeholder="80.00"
                        required
                        className="h-10 text-xs rounded-xl pl-8 font-bold bg-card border-border/80"
                      />
                    </div>
                  </div>
                </div>

                {/* Online Booking Switch */}
                <div className="flex items-center justify-between border-t border-border/60 pt-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="online-booking-switch" className="text-xs font-extrabold text-foreground cursor-pointer">
                      Patient Portal &amp; Online Booking Visibility
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Display this treatment in the patient booking wizard for self-scheduled appointments.
                    </p>
                  </div>
                  <Switch
                    id="online-booking-switch"
                    checked={showOnWebsite}
                    onCheckedChange={setShowOnWebsite}
                    className="data-[state=checked]:bg-[#0B3B36]"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Service Summary (4 cols) */}
          <div className="lg:col-span-4 sticky top-6">
            <Card className="p-6 rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xs shadow-xs space-y-5">
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <LayoutGrid className="size-4 text-primary" />
                <h2 className="font-heading text-xs font-extrabold uppercase tracking-wider text-foreground">
                  LIVE SERVICE PREVIEW
                </h2>
              </div>

              {/* Service Icon + Identity Banner */}
              <div className="flex items-center gap-3.5 rounded-2xl bg-muted/25 p-3.5 border border-border/60">
                <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200/70 shadow-2xs">
                  <ServiceIcon
                    iconKey={iconKey}
                    name={name}
                    category={category}
                    className="size-6 text-emerald-800 dark:text-emerald-300"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                    PROCEDURE
                  </span>
                  <p className="font-heading font-extrabold text-sm text-foreground truncate mt-0.5">
                    {name.trim() || "Teeth Whitening"}
                  </p>
                </div>
              </div>

              {/* Information List */}
              <div className="space-y-3.5 text-xs">
                {/* Category */}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Section</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-200 capitalize">
                    {category}
                  </span>
                </div>

                {/* Duration */}
                <div className="flex items-center justify-between border-t border-border/50 pt-3">
                  <span className="text-muted-foreground font-medium">Slot Duration</span>
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <Clock className="size-3.5 text-emerald-600" />
                    {duration} min
                  </span>
                </div>

                {/* My Fee */}
                <div className="flex items-center justify-between border-t border-border/50 pt-3">
                  <span className="text-muted-foreground font-medium">Procedure Fee</span>
                  <span className="font-black text-foreground text-base tabular-nums">
                    ৳ {parseFloat(fee || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Online Booking */}
                <div className="flex items-center justify-between border-t border-border/50 pt-3">
                  <span className="text-muted-foreground font-medium">Online Booking</span>
                  <span className={cn(
                    "font-bold flex items-center gap-1.5 text-xs",
                    showOnWebsite ? "text-emerald-800 dark:text-emerald-300" : "text-muted-foreground"
                  )}>
                    <span className={cn("size-2 rounded-full", showOnWebsite ? "bg-emerald-600" : "bg-muted-foreground")} />
                    {showOnWebsite ? "Active & Visible" : "Hidden"}
                  </span>
                </div>
              </div>

              {/* Automatic Tip Box */}
              <div className="flex items-start gap-2.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/70 p-3.5 text-xs text-emerald-950 dark:text-emerald-200 shadow-2xs">
                <Sparkles className="size-4 shrink-0 text-emerald-700 dark:text-emerald-400 mt-0.5" />
                <p className="text-[11px] leading-relaxed font-medium">
                  This summary card previews how your patients will see this treatment in their booking flow.
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* 3. Action Buttons Footer */}
        <div className="flex items-center justify-end gap-3 pt-8 border-t border-border/60 mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(backUrl)}
            className="h-10 rounded-2xl px-6 text-xs font-bold border-border/80 hover:bg-muted/50 transition-colors cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="h-10 gap-2 rounded-2xl px-7 text-xs font-black bg-[#0B3B36] hover:bg-[#075e5a] text-white shadow-md shadow-[#0B3B36]/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            {mode === "create" ? "Create Service" : "Save Changes"}
          </Button>
        </div>
      </form>

      {/* Reusable Category Manager Dialog */}
      <CategoryManagerDialog
        open={isCategoryModalOpen}
        onOpenChange={setIsCategoryModalOpen}
        categories={categories}
        onCategoriesChange={handleCategoriesUpdate}
        onCategorySelect={setCategory}
      />
    </div>
  );
}
