"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Banknote,
  Check,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DoctorServiceConfig, DoctorServicesContext } from "@/types/services";
import { updateDoctorServiceAction, bulkSaveDoctorServicesAction } from "@/lib/server/doctor-services";
import { cn } from "@/lib/utils";

interface ServiceItemState extends DoctorServiceConfig {
  isDirty?: boolean;
  isSaving?: boolean;
}

export function DoctorServicesManager({ context }: { context: DoctorServicesContext }) {
  const router = useRouter();
  const [services, setServices] = React.useState<ServiceItemState[]>(context.services);
  const [selectedPractitionerId, setSelectedPractitionerId] = React.useState<string>(
    context.practitioner?.id ?? "",
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [filterOfferedOnly, setFilterOfferedOnly] = React.useState<"all" | "offered" | "unoffered">("all");
  const [isBulkSaving, setIsBulkSaving] = React.useState(false);

  // Extract unique categories
  const categories = React.useMemo(() => {
    const set = new Set<string>();
    for (const svc of context.services) {
      if (svc.category) set.add(svc.category);
    }
    return ["all", ...Array.from(set).sort()];
  }, [context.services]);

  // Statistics
  const totalCount = services.length;
  const offeredCount = services.filter((s) => s.is_offered).length;
  const customDurationCount = services.filter((s) => s.is_offered && s.override_duration_minutes != null).length;
  const customPriceCount = services.filter((s) => s.is_offered && s.override_price != null).length;
  const dirtyCount = services.filter((s) => s.isDirty).length;

  // Filtered services
  const filteredServices = React.useMemo(() => {
    return services.filter((svc) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        svc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        svc.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (svc.description && svc.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === "all" || svc.category === selectedCategory;

      const matchesOffered =
        filterOfferedOnly === "all" ||
        (filterOfferedOnly === "offered" && svc.is_offered) ||
        (filterOfferedOnly === "unoffered" && !svc.is_offered);

      return matchesSearch && matchesCategory && matchesOffered;
    });
  }, [services, searchQuery, selectedCategory, filterOfferedOnly]);

  // Handle single service toggle
  const handleToggle = async (serviceId: string, isOffered: boolean) => {
    // Optimistic update
    setServices((prev) =>
      prev.map((s) => {
        if (s.service_id === serviceId) {
          return { ...s, is_offered: isOffered, isSaving: true };
        }
        return s;
      }),
    );

    const targetService = services.find((s) => s.service_id === serviceId);

    const res = await updateDoctorServiceAction({
      serviceId,
      isOffered,
      overrideDurationMinutes: targetService?.override_duration_minutes,
      overridePrice: targetService?.override_price,
      practitionerId: selectedPractitionerId,
    });

    setServices((prev) =>
      prev.map((s) => {
        if (s.service_id === serviceId) {
          return { ...s, isSaving: false, isDirty: false };
        }
        return s;
      }),
    );

    if (res.success) {
      toast.success(
        isOffered
          ? `Added "${targetService?.name}" to offered services`
          : `Removed "${targetService?.name}" from offered services`,
      );
    } else {
      toast.error(res.error ?? "Failed to update service status");
      // Rollback
      setServices((prev) =>
        prev.map((s) => {
          if (s.service_id === serviceId) {
            return { ...s, is_offered: !isOffered };
          }
          return s;
        }),
      );
    }
  };

  // Handle custom duration change
  const handleDurationChange = (serviceId: string, durationStr: string) => {
    const val = durationStr.trim() === "" ? null : parseInt(durationStr, 10);
    if (val !== null && (isNaN(val) || val < 1 || val > 480)) {
      return;
    }

    setServices((prev) =>
      prev.map((s) => {
        if (s.service_id === serviceId) {
          return {
            ...s,
            override_duration_minutes: val,
            effective_duration_minutes: val ?? s.clinic_duration_minutes,
            isDirty: true,
          };
        }
        return s;
      }),
    );
  };

  // Handle custom fee change
  const handlePriceChange = (serviceId: string, priceStr: string) => {
    const val = priceStr.trim() === "" ? null : parseFloat(priceStr);
    if (val !== null && (isNaN(val) || val < 0 || val > 1000000)) {
      return;
    }

    setServices((prev) =>
      prev.map((s) => {
        if (s.service_id === serviceId) {
          return {
            ...s,
            override_price: val,
            effective_price: val ?? s.clinic_price,
            isDirty: true,
          };
        }
        return s;
      }),
    );
  };

  // Save single service item changes
  const handleSaveItem = async (svc: ServiceItemState) => {
    setServices((prev) =>
      prev.map((s) => (s.service_id === svc.service_id ? { ...s, isSaving: true } : s)),
    );

    const res = await updateDoctorServiceAction({
      serviceId: svc.service_id,
      isOffered: svc.is_offered,
      overrideDurationMinutes: svc.override_duration_minutes,
      overridePrice: svc.override_price,
      practitionerId: selectedPractitionerId,
    });

    setServices((prev) =>
      prev.map((s) =>
        s.service_id === svc.service_id ? { ...s, isSaving: false, isDirty: false } : s,
      ),
    );

    if (res.success) {
      toast.success(`Updated settings for "${svc.name}"`);
    } else {
      toast.error(res.error ?? "Failed to save settings");
    }
  };

  // Reset duration to clinic default
  const handleResetDuration = (serviceId: string) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.service_id === serviceId) {
          return {
            ...s,
            override_duration_minutes: null,
            effective_duration_minutes: s.clinic_duration_minutes,
            isDirty: true,
          };
        }
        return s;
      }),
    );
  };

  // Reset fee to clinic default
  const handleResetPrice = (serviceId: string) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.service_id === serviceId) {
          return {
            ...s,
            override_price: null,
            effective_price: s.clinic_price,
            isDirty: true,
          };
        }
        return s;
      }),
    );
  };

  // Bulk save all pending changes
  const handleBulkSave = async () => {
    setIsBulkSaving(true);
    const dirtyServices = services.filter((s) => s.isDirty);

    const res = await bulkSaveDoctorServicesAction({
      practitionerId: selectedPractitionerId,
      services: services.map((s) => ({
        serviceId: s.service_id,
        isOffered: s.is_offered,
        overrideDurationMinutes: s.override_duration_minutes,
        overridePrice: s.override_price,
      })),
    });

    setIsBulkSaving(false);

    if (res.success) {
      setServices((prev) => prev.map((s) => ({ ...s, isDirty: false })));
      toast.success(`Saved all changes (${dirtyServices.length} modified)`);
    } else {
      toast.error(res.error ?? "Failed to save changes");
    }
  };

  // Switch active practitioner (for Owner Admin)
  const handlePractitionerSwitch = (newPractitionerId: string) => {
    setSelectedPractitionerId(newPractitionerId);
    router.push(`/clinical/services?practitioner=${newPractitionerId}`);
  };

  if (!context.practitioner) {
    return (
      <Card className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-border p-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Stethoscope className="size-6" />
        </div>
        <h2 className="mt-4 font-heading text-lg font-extrabold">Practitioner Profile Required</h2>
        <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
          Your account is not linked to an active practitioner profile. Link your account in staff settings to configure your clinical services.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header & Controls */}
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            <Stethoscope className="size-3.5" />
            Practitioner service roster
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-[-0.035em]">
            Services & Treatments
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Configure which clinical treatments you personally offer and tailor your consultation durations and custom fees.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {context.canSelectPractitioner && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground">Practitioner:</span>
              <Select
                value={selectedPractitionerId}
                onValueChange={(val) => {
                  if (val) handlePractitionerSwitch(val);
                }}
              >
                <SelectTrigger className="h-11 w-56 rounded-xl font-semibold">
                  <SelectValue placeholder="Select Doctor" />
                </SelectTrigger>
                <SelectContent>
                  {context.allPractitioners.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title ? `${p.title} ` : ""}{p.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {dirtyCount > 0 && (
            <Button
              size="lg"
              onClick={handleBulkSave}
              disabled={isBulkSaving}
              className="h-11 gap-2 rounded-xl px-5 font-bold shadow-lg shadow-primary/20"
            >
              {isBulkSaving ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Save all changes ({dirtyCount})
            </Button>
          )}
        </div>
      </div>

      {/* 2. Key Metrics Bar */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Stethoscope className="size-5" />
          </span>
          <div>
            <p className="font-heading text-2xl font-extrabold">{totalCount}</p>
            <p className="text-[11px] font-semibold text-muted-foreground">Total clinic catalog</p>
          </div>
        </article>

        <article className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <span className="flex size-11 items-center justify-center rounded-xl bg-success/10 text-success">
            <CheckCircle2 className="size-5" />
          </span>
          <div>
            <p className="font-heading text-2xl font-extrabold">{offeredCount}</p>
            <p className="text-[11px] font-semibold text-muted-foreground">Offered by this doctor</p>
          </div>
        </article>

        <article className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <span className="flex size-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-300">
            <Clock className="size-5" />
          </span>
          <div>
            <p className="font-heading text-2xl font-extrabold">{customDurationCount}</p>
            <p className="text-[11px] font-semibold text-muted-foreground">Custom durations</p>
          </div>
        </article>

        <article className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            <Banknote className="size-5" />
          </span>
          <div>
            <p className="font-heading text-2xl font-extrabold">{customPriceCount}</p>
            <p className="text-[11px] font-semibold text-muted-foreground">Custom fee overrides</p>
          </div>
        </article>
      </section>

      {/* 3. Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-48 flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search treatments or categories…"
              className="h-10 rounded-xl pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-colors",
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {cat === "all" ? "All categories" : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-border pt-2 sm:border-t-0 sm:pt-0">
          <Select
            value={filterOfferedOnly}
            onValueChange={(val) => {
              if (val) setFilterOfferedOnly(val as "all" | "offered" | "unoffered");
            }}
          >
            <SelectTrigger className="h-10 w-36 rounded-xl text-xs font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="offered">Offered only</SelectItem>
              <SelectItem value="unoffered">Not offered</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4. Services Table / Cards */}
      {filteredServices.length === 0 ? (
        <Card className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-border p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Filter className="size-5" />
          </div>
          <p className="mt-3 text-sm font-extrabold">No matching services found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try adjusting your search query or category filters.
          </p>
          {(searchQuery || selectedCategory !== "all" || filterOfferedOnly !== "all") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setFilterOfferedOnly("all");
              }}
              className="mt-4 rounded-xl text-xs font-bold"
            >
              Reset filters
            </Button>
          )}
        </Card>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
          {/* Table Header (Desktop) */}
          <div className="hidden grid-cols-[1.4fr_1fr_1fr_1fr_110px_90px] items-center gap-3 bg-muted/40 px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground lg:grid">
            <div>Service & category</div>
            <div>Clinic baseline</div>
            <div>Custom duration</div>
            <div>My custom fee</div>
            <div className="text-center">Status</div>
            <div className="text-right">Action</div>
          </div>

          {/* Service Rows */}
          {filteredServices.map((svc) => {
            const hasCustomDuration = svc.override_duration_minutes != null;
            const hasCustomPrice = svc.override_price != null;

            return (
              <div
                key={svc.service_id}
                className={cn(
                  "flex flex-col gap-4 p-5 transition-colors sm:p-6 lg:grid lg:grid-cols-[1.4fr_1fr_1fr_1fr_110px_90px] lg:items-center",
                  !svc.is_offered && "opacity-75 bg-muted/10",
                  svc.isDirty && "bg-primary-soft/10",
                )}
              >
                {/* 1. Name & Category */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-heading text-sm font-extrabold text-foreground">
                      {svc.name}
                    </span>
                    <Badge variant="outline" className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold capitalize text-muted-foreground">
                      {svc.category}
                    </Badge>
                  </div>
                  {svc.description && (
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      {svc.description}
                    </p>
                  )}
                </div>

                {/* 2. Clinic Default Baseline */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground lg:block">
                  <span className="font-semibold text-foreground/80 lg:hidden">Clinic default:</span>
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <Clock className="size-3.5 text-muted-foreground" />
                      {svc.clinic_duration_minutes}m
                    </span>
                    <span>&middot;</span>
                    <span className="inline-flex items-center gap-0.5 font-semibold text-foreground/80">
                      &#2547;{svc.clinic_price.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 3. Custom Duration Control */}
                <div>
                  <div className="flex items-center gap-1.5">
                    <div className="relative w-28">
                      <Input
                        type="number"
                        min={5}
                        max={480}
                        step={5}
                        disabled={!svc.is_offered || svc.isSaving}
                        value={svc.override_duration_minutes ?? ""}
                        placeholder={`${svc.clinic_duration_minutes}`}
                        onChange={(e) => handleDurationChange(svc.service_id, e.target.value)}
                        className={cn(
                          "h-9 rounded-xl pr-8 text-xs font-bold transition-all",
                          hasCustomDuration
                            ? "border-primary/50 bg-primary-soft/30 text-primary focus:ring-primary/20"
                            : "bg-muted/30 text-muted-foreground",
                          !svc.is_offered && "opacity-40 cursor-not-allowed",
                        )}
                      />
                      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">
                        min
                      </span>
                    </div>

                    {hasCustomDuration && svc.is_offered && (
                      <button
                        type="button"
                        onClick={() => handleResetDuration(svc.service_id)}
                        title="Reset to clinic standard duration"
                        className="rounded-lg p-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <RefreshCw className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 4. Custom Fee Control */}
                <div>
                  <div className="flex items-center gap-1.5">
                    <div className="relative w-28">
                      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                        &#2547;
                      </span>
                      <Input
                        type="number"
                        min={0}
                        max={1000000}
                        step={100}
                        disabled={!svc.is_offered || svc.isSaving}
                        value={svc.override_price ?? ""}
                        placeholder={`${svc.clinic_price}`}
                        onChange={(e) => handlePriceChange(svc.service_id, e.target.value)}
                        className={cn(
                          "h-9 rounded-xl pl-6 text-xs font-bold transition-all",
                          hasCustomPrice
                            ? "border-primary/50 bg-primary-soft/30 text-primary focus:ring-primary/20"
                            : "bg-muted/30 text-muted-foreground",
                          !svc.is_offered && "opacity-40 cursor-not-allowed",
                        )}
                      />
                    </div>

                    {hasCustomPrice && svc.is_offered && (
                      <button
                        type="button"
                        onClick={() => handleResetPrice(svc.service_id)}
                        title="Reset to clinic default price"
                        className="rounded-lg p-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <RefreshCw className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 5. Offer Status Toggle */}
                <div className="flex items-center justify-between lg:justify-center">
                  <span className="text-xs font-semibold text-muted-foreground lg:hidden">
                    Offer service:
                  </span>
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`switch-${svc.service_id}`}
                      checked={svc.is_offered}
                      disabled={svc.isSaving}
                      onCheckedChange={(checked) => handleToggle(svc.service_id, checked)}
                    />
                    <span
                      className={cn(
                        "text-[11px] font-bold",
                        svc.is_offered ? "text-success" : "text-muted-foreground",
                      )}
                    >
                      {svc.is_offered ? "Offered" : "Off"}
                    </span>
                  </div>
                </div>

                {/* 6. Row Action / Save State */}
                <div className="flex items-center justify-end">
                  {svc.isSaving ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                      <RefreshCw className="size-3.5 animate-spin" />
                      Saving
                    </span>
                  ) : svc.isDirty ? (
                    <Button
                      size="sm"
                      onClick={() => handleSaveItem(svc)}
                      className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-bold"
                    >
                      <Check className="size-3.5" />
                      Save
                    </Button>
                  ) : (
                    <span className="text-[11px] font-semibold text-muted-foreground/60">
                      Synced
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Clinical Advisory Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-primary/15 bg-primary-soft/50 p-4">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="text-xs leading-5 text-muted-foreground">
          <strong className="text-foreground">How custom duration & fee overrides work:</strong> When a patient books with you online or staff schedules an appointment, the system automatically uses your personalized appointment duration and custom procedure fee. If left blank, appointments default to the clinic standard duration and baseline fee.
        </div>
      </div>
    </div>
  );
}
