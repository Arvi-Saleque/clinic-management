"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  Clock,
  Coins,
  Loader2,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Stethoscope,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DoctorServiceConfig, DoctorServicesContext } from "@/types/services";
import {
  updateDoctorServiceAction,
  deleteDoctorServiceAction,
  checkUpcomingAppointmentsAction,
} from "@/lib/server/doctor-services";
import { ServiceIcon } from "@/components/staff/service-icons";
import { TablePagination } from "@/components/shared/table-pagination";
import { useTablePagination } from "@/lib/hooks/use-table-pagination";
import { cn } from "@/lib/utils";

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120];

export function DoctorServicesManager({ context }: { context: DoctorServicesContext }) {
  const router = useRouter();
  const [services, setServices] = React.useState<DoctorServiceConfig[]>(context.services);
  const [selectedPractitionerId, setSelectedPractitionerId] = React.useState<string>(
    context.practitioner?.id ?? "",
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "offered" | "not_offered">("all");

  // Offering Config Modal (when turning ON or editing fee/duration)
  const [configuringService, setConfiguringService] = React.useState<DoctorServiceConfig | null>(null);
  const [configDuration, setConfigDuration] = React.useState<string>("30");
  const [configPrice, setConfigPrice] = React.useState<string>("");
  const [isSavingConfig, setIsSavingConfig] = React.useState(false);

  // Delete / Remove State
  const [deletingService, setDeletingService] = React.useState<DoctorServiceConfig | null>(null);
  const [upcomingCount, setUpcomingCount] = React.useState<number>(0);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Sync services if context changes
  React.useEffect(() => {
    setServices(context.services);
  }, [context.services]);

  // Counts
  const offeredCount = React.useMemo(() => services.filter((s) => s.is_offered).length, [services]);
  const notOfferedCount = React.useMemo(() => services.filter((s) => !s.is_offered).length, [services]);

  // Filtered services
  const filteredServices = React.useMemo(() => {
    let result = services;

    if (statusFilter === "offered") {
      result = result.filter((s) => s.is_offered);
    } else if (statusFilter === "not_offered") {
      result = result.filter((s) => !s.is_offered);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [services, statusFilter, searchQuery]);

  // Standard Modern Pagination
  const pagination = useTablePagination(filteredServices, {
    initialPageSize: 10,
  });

  // Switch active practitioner (for Owner / Admin)
  const handlePractitionerSwitch = (newPractitionerId: string) => {
    setSelectedPractitionerId(newPractitionerId);
    router.push(`/clinical/services?practitioner=${newPractitionerId}`);
  };

  // Toggle Turn ON / Turn OFF
  const handleToggle = async (svc: DoctorServiceConfig, nextChecked: boolean) => {
    if (nextChecked) {
      // Open modal to configure duration and fee
      setConfiguringService(svc);
      const defaultDur = svc.override_duration_minutes ?? svc.clinic_duration_minutes ?? 30;
      const defaultPrice = svc.override_price ?? svc.clinic_price;
      setConfigDuration(defaultDur ? defaultDur.toString() : "30");
      setConfigPrice(defaultPrice != null && defaultPrice > 0 ? defaultPrice.toString() : "");
    } else {
      // Turn OFF directly
      try {
        const res = await updateDoctorServiceAction({
          serviceId: svc.service_id,
          isOffered: false,
          practitionerId: selectedPractitionerId,
        });

        if (res.success) {
          setServices((prev) =>
            prev.map((s) =>
              s.service_id === svc.service_id
                ? {
                    ...s,
                    is_offered: false,
                    override_duration_minutes: null,
                    override_price: null,
                  }
                : s,
            ),
          );
          toast.success(`"${svc.name}" is now turned off for your profile.`);
        } else {
          toast.error(res.error ?? "Failed to turn off service");
        }
      } catch {
        toast.error("Failed to update service status");
      }
    }
  };

  // Save Offering Configuration (Turn ON or Update Duration/Fee)
  const handleSaveOfferingConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!configuringService) return;

    const durNum = parseInt(configDuration, 10);
    if (!durNum || isNaN(durNum) || durNum < 5 || durNum > 480) {
      toast.error("Please enter a valid duration between 5 and 480 minutes");
      return;
    }

    const priceNum = parseFloat(configPrice);
    if (configPrice.trim() === "" || isNaN(priceNum) || priceNum < 0) {
      toast.error("Please enter a valid fee/price");
      return;
    }

    setIsSavingConfig(true);
    try {
      const res = await updateDoctorServiceAction({
        serviceId: configuringService.service_id,
        isOffered: true,
        overrideDurationMinutes: durNum,
        overridePrice: priceNum,
        practitionerId: selectedPractitionerId,
      });

      if (res.success) {
        setServices((prev) =>
          prev.map((s) =>
            s.service_id === configuringService.service_id
              ? {
                  ...s,
                  is_offered: true,
                  override_duration_minutes: durNum,
                  effective_duration_minutes: durNum,
                  override_price: priceNum,
                  effective_price: priceNum,
                }
              : s,
          ),
        );
        toast.success(`"${configuringService.name}" is now active in your services!`);
        setConfiguringService(null);
      } else {
        toast.error(res.error ?? "Failed to save configuration");
      }
    } catch {
      toast.error("Failed to save service configuration");
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Delete / Remove Service Offering
  const handleOpenDeleteModal = async (svc: DoctorServiceConfig) => {
    setDeletingService(svc);
    setUpcomingCount(0);

    try {
      const res = await checkUpcomingAppointmentsAction({
        practitionerId: selectedPractitionerId,
        serviceId: svc.service_id,
      });
      setUpcomingCount(res.upcomingCount);
    } catch {
      // Non-blocking
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingService) return;

    setIsDeleting(true);
    try {
      const res = await deleteDoctorServiceAction({
        serviceId: deletingService.service_id,
        practitionerId: selectedPractitionerId,
      });

      if (res.success) {
        setServices((prev) =>
          prev.map((s) =>
            s.service_id === deletingService.service_id
              ? { ...s, is_offered: false, override_duration_minutes: null, override_price: null }
              : s,
          ),
        );
        toast.success(`Turned off "${deletingService.name}" from your offered services`);
        setDeletingService(null);
      } else {
        toast.error(res.error ?? "Failed to remove service");
      }
    } catch {
      toast.error("Failed to remove service");
    } finally {
      setIsDeleting(false);
    }
  };

  const newServiceUrl = selectedPractitionerId
    ? `/clinical/services/new?practitioner=${selectedPractitionerId}`
    : "/clinical/services/new";

  if (!context.practitioner) {
    return (
      <Card className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-border/80 p-8 text-center bg-card shadow-sm">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/40 text-muted-foreground">
          <Stethoscope className="size-7" />
        </div>
        <h2 className="mt-4 font-heading text-lg font-extrabold text-foreground">
          Practitioner Profile Required
        </h2>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          Your account is not linked to an active practitioner profile. Link your account in staff settings to configure your clinical services.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-[1600px] pb-16">
      {/* ── 1. Header & Primary Actions ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1 text-primary font-bold">
              <Stethoscope className="size-3.5" />
              Centralized Services
            </span>
            <span>&middot;</span>
            <span>Clinic Treatment Catalog</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Services &amp; Treatments
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Turn ON the procedures you offer, set your custom duration and fees, or add new treatments to the clinic catalog.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {context.canSelectPractitioner && context.allPractitioners && context.allPractitioners.length > 1 && (
            <Select
              value={selectedPractitionerId}
              onValueChange={(val) => {
                if (val) handlePractitionerSwitch(val);
              }}
            >
              <SelectTrigger className="h-10 rounded-2xl border-border/80 bg-card text-xs font-bold px-3.5 shadow-2xs">
                <SelectValue placeholder="Select Doctor" />
              </SelectTrigger>
              <SelectContent>
                {context.allPractitioners.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs font-semibold">
                    {p.title ? `${p.title} ` : ""}{p.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <ButtonLink
            href={newServiceUrl}
            className="h-10 gap-2 rounded-2xl bg-[#0B3B36] hover:bg-[#0B3B36]/90 px-5 text-xs font-bold text-white shadow-md shadow-[#0B3B36]/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>Add Procedure</span>
          </ButtonLink>
        </div>
      </div>

      {/* ── 2. Filter Pills & Search Bar ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-2 sm:p-3 rounded-2xl border border-border/80 shadow-2xs">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer",
              statusFilter === "all"
                ? "bg-[#0B3B36] text-white shadow-2xs"
                : "text-muted-foreground hover:bg-muted/40",
            )}
          >
            All Services ({services.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("offered")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer",
              statusFilter === "offered"
                ? "bg-emerald-700 text-white shadow-2xs"
                : "text-muted-foreground hover:bg-muted/40",
            )}
          >
            Offered by You ({offeredCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("not_offered")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer",
              statusFilter === "not_offered"
                ? "bg-muted text-foreground border border-border/70 shadow-2xs"
                : "text-muted-foreground hover:bg-muted/40",
            )}
          >
            Not Offered ({notOfferedCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search procedure name..."
            className="h-9 rounded-xl pl-9 pr-8 text-xs bg-muted/20 border-border/70 focus-visible:bg-card shadow-2xs font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── 3. Centralized Services Table ── */}
      {services.length === 0 ? (
        <Card className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 p-8 text-center bg-card shadow-sm">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <Stethoscope className="size-7" />
          </div>
          <h3 className="mt-4 font-heading text-lg font-extrabold text-foreground">
            No Treatments in Clinic Catalog
          </h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            Get started by adding your first centralized clinical procedure. It will be available for all doctors to turn on.
          </p>
          <ButtonLink
            href={newServiceUrl}
            className="mt-5 h-10 gap-2 rounded-2xl bg-[#0B3B36] hover:bg-[#0B3B36]/90 px-5 text-xs font-bold text-white shadow-md shadow-[#0B3B36]/20"
          >
            <Plus className="size-4" />
            Add First Treatment
          </ButtonLink>
        </Card>
      ) : filteredServices.length === 0 ? (
        <div className="rounded-3xl border border-border/80 bg-card p-12 text-center shadow-xs">
          <p className="text-sm font-extrabold text-foreground font-heading">No matching procedures found</p>
          <p className="text-xs text-muted-foreground mt-1">Try adjusting your status filter or search keyword.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
            }}
            className="mt-4 h-8.5 rounded-xl text-xs font-bold cursor-pointer"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-xs">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/25 border-b border-border/70">
                <TableRow className="hover:bg-muted/25 border-border/60">
                  <TableHead className="h-12 px-6 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground min-w-[280px]">
                    TREATMENT / SERVICE
                  </TableHead>
                  <TableHead className="h-12 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground w-48">
                    YOUR OFFERING STATUS
                  </TableHead>
                  <TableHead className="h-12 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground w-36">
                    DURATION
                  </TableHead>
                  <TableHead className="h-12 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground w-36">
                    YOUR FEE
                  </TableHead>
                  <TableHead className="h-12 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground text-right pr-6 w-36">
                    ACTIONS
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/40">
                {pagination.paginatedItems.map((svc) => {
                  const isOffered = svc.is_offered;
                  const duration = svc.override_duration_minutes ?? svc.effective_duration_minutes;
                  const price = svc.override_price ?? svc.effective_price;

                  return (
                    <TableRow
                      key={svc.service_id}
                      className={cn(
                        "group h-[76px] transition-colors",
                        isOffered ? "hover:bg-muted/15" : "hover:bg-muted/10 opacity-75 hover:opacity-100",
                      )}
                    >
                      {/* 1. Treatment / Service Name & Icon */}
                      <TableCell className="px-6">
                        <div className="flex items-center gap-3.5">
                          <div
                            className={cn(
                              "flex size-10 shrink-0 items-center justify-center rounded-2xl border shadow-2xs transition-colors",
                              isOffered
                                ? "bg-[#0B3B36]/10 text-[#0B3B36] border-emerald-500/20 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : "bg-muted/40 text-muted-foreground border-border/70",
                            )}
                          >
                            <ServiceIcon iconKey={svc.icon_key} className="size-5" />
                          </div>
                          <div className="min-w-0 max-w-[320px]">
                            <span className="block font-heading text-sm font-extrabold text-foreground truncate">
                              {svc.name}
                            </span>
                            {svc.description ? (
                              <p className="mt-0.5 truncate text-[11px] text-muted-foreground font-medium">
                                {svc.description}
                              </p>
                            ) : (
                              <p className="mt-0.5 text-[11px] text-muted-foreground/60 italic">
                                Centralized clinical procedure
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* 2. Offering Status & Toggle Switch */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={isOffered}
                            onCheckedChange={(val) => handleToggle(svc, val)}
                            className="data-[state=checked]:bg-emerald-700 cursor-pointer"
                            aria-label={`Toggle offering for ${svc.name}`}
                          />
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider border shadow-2xs",
                              isOffered
                                ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : "border-border bg-muted/30 text-muted-foreground",
                            )}
                          >
                            {isOffered ? "Turned ON" : "Turned OFF"}
                          </Badge>
                        </div>
                      </TableCell>

                      {/* 3. Duration */}
                      <TableCell>
                        {isOffered ? (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                            <Clock className="size-3.5 text-muted-foreground" />
                            <span>{duration} mins</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/50 font-mono">—</span>
                        )}
                      </TableCell>

                      {/* 4. Fee / Price */}
                      <TableCell>
                        {isOffered ? (
                          <div className="flex items-center gap-1 text-xs font-black text-foreground font-mono">
                            <span className="text-muted-foreground text-[11px]">€</span>
                            <span>{Number(price).toFixed(2)}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/50 font-mono">—</span>
                        )}
                      </TableCell>

                      {/* 5. Actions */}
                      <TableCell className="pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isOffered ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setConfiguringService(svc);
                                const curDur = svc.override_duration_minutes ?? svc.clinic_duration_minutes ?? 30;
                                const curPrice = svc.override_price ?? svc.clinic_price;
                                setConfigDuration(curDur ? curDur.toString() : "30");
                                setConfigPrice(curPrice != null && curPrice > 0 ? curPrice.toString() : "");
                              }}
                              className="h-8 gap-1.5 rounded-xl px-2.5 text-xs font-bold border-border/80 hover:bg-[#0B3B36] hover:text-white hover:border-[#0B3B36] transition-all cursor-pointer shadow-2xs"
                            >
                              <SlidersHorizontal className="size-3" />
                              <span>Edit Fee</span>
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggle(svc, true)}
                              className="h-8 gap-1.5 rounded-xl px-2.5 text-xs font-bold border-emerald-500/30 text-emerald-800 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-700 hover:text-white transition-all cursor-pointer shadow-2xs"
                            >
                              <Plus className="size-3" />
                              <span>Turn ON</span>
                            </Button>
                          )}

                          <Link
                            href={`/clinical/services/${svc.service_id}/edit?practitioner=${selectedPractitionerId}`}
                            className="inline-flex size-8 items-center justify-center rounded-xl border border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition shadow-2xs"
                            title="Edit Centralized Service Details"
                          >
                            <Pencil className="size-3.5" />
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Bar */}
          <TablePagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            onPageChange={pagination.onPageChange}
            onPageSizeChange={pagination.onPageSizeChange}
            itemLabel="procedures"
          />
        </div>
      )}

      {/* ── 4. Configure Procedure Offering Modal ── */}
      {configuringService && (
        <Dialog open={!!configuringService} onOpenChange={(open) => !open && setConfiguringService(null)}>
          <DialogContent className="sm:max-w-md rounded-3xl border-border/80 bg-card p-6 shadow-xl">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-[#0B3B36]/10 text-[#0B3B36] dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-500/20 shadow-2xs">
                  <ServiceIcon iconKey={configuringService.icon_key} className="size-6" />
                </div>
                <div>
                  <DialogTitle className="font-heading text-lg font-extrabold text-foreground">
                    Configure Offering
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground font-medium">
                    {configuringService.name}
                  </p>
                </div>
              </div>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                Set your procedure duration and fee in Euro (€). Patients booking with you will see these specific parameters.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveOfferingConfig} className="space-y-4 pt-2">
              {/* Duration Field */}
              <div className="space-y-2">
                <Label className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center justify-between">
                  <span>Procedure Duration (Minutes) *</span>
                  <span className="text-primary font-bold font-mono">{configDuration || "0"} mins</span>
                </Label>

                {/* Preset Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {DURATION_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setConfigDuration(preset.toString())}
                      className={cn(
                        "px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                        configDuration === preset.toString()
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
                  value={configDuration}
                  onChange={(e) => setConfigDuration(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  placeholder="e.g. 30"
                  className="h-10 rounded-2xl text-xs font-mono font-bold bg-muted/20 border-border/80 focus-visible:bg-card shadow-2xs"
                  required
                />
              </div>

              {/* Fee / Price Field */}
              <div className="space-y-2">
                <Label className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                  Your Fee / Price (€) *
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground font-mono">
                    €
                  </span>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={configPrice}
                    onChange={(e) => setConfigPrice(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder="0.00"
                    className="h-10 rounded-2xl pl-8 text-xs font-mono font-bold bg-muted/20 border-border/80 focus-visible:bg-card shadow-2xs"
                    required
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 pt-3 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfiguringService(null)}
                  disabled={isSavingConfig}
                  className="h-10 rounded-2xl text-xs font-bold px-4 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingConfig}
                  className="h-10 rounded-2xl bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white font-bold text-xs px-5 shadow-2xs gap-2 cursor-pointer"
                >
                  {isSavingConfig && <Loader2 className="size-3.5 animate-spin" />}
                  <span>{configuringService.is_offered ? "Save Changes" : "Turn ON Procedure"}</span>
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ── 5. Delete Confirmation Modal ── */}
      {deletingService && (
        <Dialog open={!!deletingService} onOpenChange={(open) => !open && setDeletingService(null)}>
          <DialogContent className="sm:max-w-md rounded-3xl border-border/80 bg-card p-6 shadow-xl">
            <DialogHeader>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200/50 mb-2">
                <AlertTriangle className="size-6" />
              </div>
              <DialogTitle className="font-heading text-lg font-extrabold text-foreground">
                Turn Off Procedure?
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                Turning off <strong>&ldquo;{deletingService.name}&rdquo;</strong> means patients will no longer be able to book this procedure with you.
                {upcomingCount > 0 && (
                  <span className="block mt-2 text-amber-800 dark:text-amber-300 font-semibold">
                    Note: You currently have {upcomingCount} upcoming appointment{upcomingCount === 1 ? "" : "s"} booked for this procedure.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="gap-2 pt-3 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeletingService(null)}
                disabled={isDeleting}
                className="h-10 rounded-2xl text-xs font-bold px-4 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteSubmit}
                disabled={isDeleting}
                className="h-10 rounded-2xl font-bold text-xs px-5 shadow-2xs gap-2 cursor-pointer"
              >
                {isDeleting && <Loader2 className="size-3.5 animate-spin" />}
                <span>Turn OFF Procedure</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
