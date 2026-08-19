"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Clock,
  Loader2,
  Pencil,
  Plus,
  Search,
  Stethoscope,
  Tag,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { CategoryItem, DoctorServiceConfig, DoctorServicesContext } from "@/types/services";
import {
  deleteDoctorServiceAction,
  checkUpcomingAppointmentsAction,
  listCategoriesAction,
} from "@/lib/server/doctor-services";
import { CategoryManagerDialog } from "@/components/staff/category-manager-dialog";
import { ServiceIcon } from "@/components/staff/service-icons";

export function DoctorServicesManager({ context }: { context: DoctorServicesContext }) {
  const router = useRouter();
  const [services, setServices] = React.useState<DoctorServiceConfig[]>(context.services);
  const [selectedPractitionerId, setSelectedPractitionerId] = React.useState<string>(
    context.practitioner?.id ?? "",
  );
  const [searchQuery, setSearchQuery] = React.useState("");

  // Categories Modal
  const [categories, setCategories] = React.useState<CategoryItem[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = React.useState(false);

  // Load categories
  React.useEffect(() => {
    listCategoriesAction().then(setCategories).catch(() => {});
  }, []);

  // Delete modal state
  const [deletingService, setDeletingService] = React.useState<DoctorServiceConfig | null>(null);
  const [deleteStep, setDeleteStep] = React.useState<1 | 2>(1);
  const [deleteConfirmText, setDeleteConfirmText] = React.useState("");
  const [upcomingCount, setUpcomingCount] = React.useState<number>(0);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Doctor's offered services
  const offeredServices = React.useMemo(() => {
    return services.filter((s) => s.is_offered);
  }, [services]);

  // Filtered offered services
  const filteredOfferedServices = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return offeredServices;
    return offeredServices.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.category && s.category.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q)),
    );
  }, [offeredServices, searchQuery]);

  // Switch active practitioner (for Owner / Admin)
  const handlePractitionerSwitch = (newPractitionerId: string) => {
    setSelectedPractitionerId(newPractitionerId);
    router.push(`/clinical/services?practitioner=${newPractitionerId}`);
  };

  // Open Delete Confirmation 1
  const handleOpenDeleteModal = async (svc: DoctorServiceConfig) => {
    setDeletingService(svc);
    setDeleteStep(1);
    setDeleteConfirmText("");
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

  // Submit Delete Confirmation 2
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
        toast.success(`Removed "${deletingService.name}" from your offered services`);
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

  const isDeleteConfirmed =
    deletingService &&
    (deleteConfirmText.trim().toLowerCase() === deletingService.name.trim().toLowerCase() ||
      deleteConfirmText.trim().toUpperCase() === "DELETE");

  const newServiceUrl = selectedPractitionerId
    ? `/clinical/services/new?practitioner=${selectedPractitionerId}`
    : "/clinical/services/new";

  if (!context.practitioner) {
    return (
      <Card className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-border p-8 text-center bg-card">
        <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Stethoscope className="size-6" />
        </div>
        <h2 className="mt-4 font-heading text-base font-bold text-foreground">
          Practitioner Profile Required
        </h2>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          Your account is not linked to an active practitioner profile. Link your account in staff settings to configure your clinical services.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-[1600px]">
      {/* 1. Header with Title, Subtitle, and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Services &amp; Treatments
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Manage your treatments, appointment duration and fees.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {context.canSelectPractitioner && (
            <Select
              value={selectedPractitionerId}
              onValueChange={(val) => {
                if (val) handlePractitionerSwitch(val);
              }}
            >
              <SelectTrigger className="h-10 w-48 rounded-xl text-xs font-semibold bg-card border-border/80 shadow-2xs">
                <SelectValue placeholder="Select Doctor" />
              </SelectTrigger>
              <SelectContent>
                {context.allPractitioners.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.title ? `${p.title} ` : ""}{p.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            variant="outline"
            onClick={() => setIsCategoryModalOpen(true)}
            className="h-10 gap-2 rounded-xl px-4 text-xs font-semibold border-border/80 bg-card hover:bg-muted/50 text-foreground shadow-2xs transition-colors"
          >
            <Tag className="size-3.5 text-primary" />
            Manage Categories
          </Button>

          <ButtonLink
            href={newServiceUrl}
            className="h-10 gap-2 rounded-xl px-4 text-xs font-bold bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white shadow-xs transition-colors"
          >
            <Plus className="size-4" />
            Add Service
          </ButtonLink>
        </div>
      </div>

      {/* 2. Service List / Empty State */}
      {offeredServices.length === 0 ? (
        /* Empty State */
        <Card className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-8 text-center bg-card">
          <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <Stethoscope className="size-6" />
          </div>
          <h3 className="mt-3.5 font-heading text-sm font-bold text-foreground">
            No services added yet.
          </h3>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            Add the treatments you provide to make them available for appointments.
          </p>
          <ButtonLink
            href={newServiceUrl}
            className="mt-4 h-9.5 gap-2 rounded-xl px-4.5 text-xs font-bold bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white"
          >
            <Plus className="size-4" />
            Add Service
          </ButtonLink>
        </Card>
      ) : filteredOfferedServices.length === 0 ? (
        /* Search Empty State within table container */
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
          {/* Table Toolbar */}
          <div className="flex items-center justify-between border-b border-border/60 bg-card px-6 py-3.5">
            <div className="relative w-full max-w-xs sm:w-80">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services..."
                className="h-9.5 rounded-xl pl-9.5 pr-4 text-xs bg-muted/20 border-border/70 shadow-2xs focus-visible:ring-1"
              />
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              0 services
            </div>
          </div>
          <div className="flex min-h-48 flex-col items-center justify-center p-8 text-center">
            <p className="text-xs font-bold text-foreground">No services match &ldquo;{searchQuery}&rdquo;</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="mt-3 h-8.5 rounded-xl text-xs"
            >
              Clear search
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table (>= 1024px): Single Cohesive Card with Toolbar, Headers & Rows */}
          <div className="hidden lg:block overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
            {/* Table Toolbar */}
            <div className="flex items-center justify-between border-b border-border/60 bg-card px-6 py-3.5">
              <div className="relative w-80">
                <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search services..."
                  className="h-9.5 rounded-xl pl-9.5 pr-4 text-xs bg-muted/20 border-border/70 shadow-2xs focus-visible:ring-1"
                />
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                {filteredOfferedServices.length} {filteredOfferedServices.length === 1 ? "service" : "services"}
              </div>
            </div>

            {/* Column Header Row */}
            <div className="grid grid-cols-[4.2fr_1.6fr_1.4fr_1.4fr_100px] items-center gap-4 border-b border-border/60 bg-muted/25 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <div>SERVICE</div>
              <div>CATEGORY</div>
              <div>DURATION</div>
              <div>MY FEE</div>
              <div className="text-right">ACTIONS</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-border/40">
              {filteredOfferedServices.map((svc) => {
                const editUrl = selectedPractitionerId
                  ? `/clinical/services/${svc.service_id}/edit?practitioner=${selectedPractitionerId}`
                  : `/clinical/services/${svc.service_id}/edit`;

                return (
                  <div
                    key={svc.service_id}
                    className="grid grid-cols-[4.2fr_1.6fr_1.4fr_1.4fr_100px] items-center gap-4 px-6 py-4.5 transition-colors hover:bg-muted/20 min-h-[72px]"
                  >
                    {/* Service Icon, Name & Description (~42%) */}
                    <div className="flex items-center gap-3.5 min-w-0 pr-4">
                      <div className="size-11 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100/80 shadow-2xs">
                        <ServiceIcon
                          iconKey={svc.icon_key}
                          name={svc.name}
                          category={svc.category}
                          className="size-5 text-emerald-700"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={editUrl}
                          className="truncate font-heading text-sm font-semibold text-foreground hover:text-emerald-800 transition-colors block"
                        >
                          {svc.name}
                        </Link>
                        {svc.description && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                            {svc.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Category (~16%) */}
                    <div>
                      <span className="inline-flex items-center h-7 px-3 text-xs font-medium rounded-full bg-emerald-50/80 text-emerald-800 border border-emerald-200/60 capitalize">
                        {svc.category}
                      </span>
                    </div>

                    {/* Duration (~14%) */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <Clock className="size-3.5 text-muted-foreground/80" />
                      <span className="text-foreground">{svc.effective_duration_minutes} min</span>
                    </div>

                    {/* My Fee (~14%) */}
                    <div className="text-sm font-semibold text-foreground tabular-nums">
                      &#2547;{svc.effective_price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </div>

                    {/* Actions (Remaining ~100px) */}
                    <div className="flex items-center justify-end gap-1.5">
                      <ButtonLink
                        href={editUrl}
                        variant="ghost"
                        size="icon-sm"
                        title="Edit service"
                        className="size-9 rounded-xl border border-transparent text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200/80 transition-colors"
                      >
                        <Pencil className="size-4" />
                        <span className="sr-only">Edit service</span>
                      </ButtonLink>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleOpenDeleteModal(svc)}
                        title="Delete service"
                        className="size-9 rounded-xl border border-transparent text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Delete service</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile / Tablet View (< 1024px) */}
          <div className="space-y-3.5 lg:hidden">
            {/* Mobile Search & Count */}
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/70" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search services..."
                  className="h-9 rounded-xl pl-8.5 pr-3 text-xs bg-muted/20 border-border/70 shadow-2xs"
                />
              </div>
              <span className="text-xs text-muted-foreground font-medium shrink-0 pr-1">
                {filteredOfferedServices.length} {filteredOfferedServices.length === 1 ? "service" : "services"}
              </span>
            </div>

            {/* Mobile Cards */}
            <div className="grid gap-3">
              {filteredOfferedServices.map((svc) => {
                const editUrl = selectedPractitionerId
                  ? `/clinical/services/${svc.service_id}/edit?practitioner=${selectedPractitionerId}`
                  : `/clinical/services/${svc.service_id}/edit`;

                return (
                  <Card
                    key={svc.service_id}
                    className="rounded-2xl border border-border/80 p-4.5 bg-card shadow-xs transition-colors hover:border-emerald-500/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="size-11 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100/80 shadow-2xs">
                          <ServiceIcon
                            iconKey={svc.icon_key}
                            name={svc.name}
                            category={svc.category}
                            className="size-5 text-emerald-700"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={editUrl}
                            className="font-heading text-sm font-semibold text-foreground hover:text-emerald-800 transition-colors block"
                          >
                            {svc.name}
                          </Link>
                          <div className="mt-1">
                            <span className="inline-flex items-center h-6 px-2.5 text-[11px] font-medium rounded-full bg-emerald-50/80 text-emerald-800 border border-emerald-200/60 capitalize">
                              {svc.category}
                            </span>
                          </div>
                          {svc.description && (
                            <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
                              {svc.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <ButtonLink
                          href={editUrl}
                          variant="ghost"
                          size="icon-sm"
                          title="Edit service"
                          className="size-8.5 rounded-xl border border-border/50 text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200/80"
                        >
                          <Pencil className="size-3.5" />
                        </ButtonLink>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleOpenDeleteModal(svc)}
                          title="Delete service"
                          className="size-8.5 rounded-xl border border-border/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3.5 flex items-center justify-between border-t border-border/50 pt-2.5 text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                        <Clock className="size-3.5" />
                        <span className="text-foreground">{svc.effective_duration_minutes} min</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-muted-foreground mr-1.5">My Fee:</span>
                        <span className="font-semibold text-foreground tabular-nums">
                          &#2547;{svc.effective_price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ===================================================================
          MODAL: DELETE DOUBLE CONFIRMATION
          =================================================================== */}
      <Dialog open={!!deletingService} onOpenChange={(open) => !open && setDeletingService(null)}>
        <DialogContent className="sm:max-w-md">
          {deletingService && deleteStep === 1 && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                  <AlertTriangle className="size-5 shrink-0" />
                  <DialogTitle>Delete service?</DialogTitle>
                </div>
                <DialogDescription>
                  You are about to remove this treatment from your services.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2">
                <div className="rounded-xl border border-border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Treatment to remove:</p>
                  <p className="font-heading text-sm font-bold text-foreground mt-0.5">
                    &ldquo;{deletingService.name}&rdquo;
                  </p>
                </div>

                {upcomingCount > 0 ? (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                    <strong>Note:</strong> You have <strong>{upcomingCount} upcoming appointments</strong> for this treatment. Removing it will prevent new bookings, but existing scheduled visits remain intact.
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground leading-5">
                    This service will no longer be available for future bookings. Historical appointments, clinical records, and past invoices will remain completely intact.
                  </p>
                )}
              </div>

              <DialogFooter className="mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeletingService(null)}
                  className="h-9 rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => setDeleteStep(2)}
                  className="h-9 rounded-xl text-xs font-bold"
                >
                  Continue
                </Button>
              </DialogFooter>
            </>
          )}

          {deletingService && deleteStep === 2 && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="size-5 shrink-0" />
                  <DialogTitle>Confirm deletion</DialogTitle>
                </div>
                <DialogDescription>
                  To prevent accidental removal, confirm that you want to remove this service.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2">
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                  You are removing <strong>&ldquo;{deletingService.name}&rdquo;</strong> from your offered services.
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="delete-confirm" className="text-xs font-semibold">
                    Type <strong className="text-foreground">&ldquo;{deletingService.name}&rdquo;</strong> to confirm:
                  </Label>
                  <Input
                    id="delete-confirm"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type service name to confirm..."
                    autoFocus
                    className="h-9 text-xs rounded-xl border-destructive/40 focus-visible:ring-destructive/30"
                  />
                </div>
              </div>

              <DialogFooter className="mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeletingService(null)}
                  className="h-9 rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={!isDeleteConfirmed || isDeleting}
                  onClick={handleDeleteSubmit}
                  className="h-9 gap-1.5 rounded-xl text-xs font-bold"
                >
                  {isDeleting && <Loader2 className="size-3.5 animate-spin" />}
                  Delete Service
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Category Manager Dialog */}
      <CategoryManagerDialog
        open={isCategoryModalOpen}
        onOpenChange={setIsCategoryModalOpen}
        categories={categories}
        onCategoriesChange={setCategories}
      />
    </div>
  );
}
