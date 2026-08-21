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

import { TablePagination } from "@/components/shared/table-pagination";
import { useTablePagination } from "@/lib/hooks/use-table-pagination";

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

  // Delete State
  const [deletingService, setDeletingService] = React.useState<DoctorServiceConfig | null>(null);
  const [deleteStep, setDeleteStep] = React.useState<1 | 2>(1);
  const [deleteConfirmText, setDeleteConfirmText] = React.useState("");
  const [upcomingCount, setUpcomingCount] = React.useState<number>(0);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Doctor's offered services
  const offeredServices = React.useMemo(() => {
    return services.filter((s) => s.is_offered);
  }, [services]);

  // Filtered offered services by Search
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

  // Standard Modern Pagination
  const pagination = useTablePagination(filteredOfferedServices, {
    initialPageSize: 10,
  });

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
            s.service_id === deletingService.service_id ? { ...s, is_offered: false } : s,
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
      <Card className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-border/80 p-8 text-center bg-card/90 shadow-sm">
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
      {/* ============================================================= */}
      {/* 1. HEADER & PRIMARY ACTIONS                                   */}
      {/* ============================================================= */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1 text-primary font-bold">
              <Stethoscope className="size-3.5" />
              Clinical Portfolio
            </span>
            <span>&middot;</span>
            <span>Treatment Directory</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Services &amp; Treatments
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Manage your clinical procedures, procedure durations, custom fees, and booking visibility.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Practitioner Switcher for Admin/Owner */}
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

          <Button
            type="button"
            variant="outline"
            onClick={() => setIsCategoryModalOpen(true)}
            className="h-10 gap-2 rounded-2xl border-border/80 bg-card px-4 text-xs font-bold text-foreground shadow-2xs hover:bg-muted/40 cursor-pointer"
          >
            <Tag className="size-3.5 text-primary" />
            <span>Manage Sections</span>
          </Button>

          <ButtonLink
            href={newServiceUrl}
            className="h-10 gap-2 rounded-2xl bg-[#0B3B36] hover:bg-[#0B3B36]/90 px-5 text-xs font-bold text-white shadow-md shadow-[#0B3B36]/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>Add Procedure</span>
          </ButtonLink>
        </div>
      </div>

      {/* ============================================================= */}
      {/* 2. SERVICES TABLE CONTAINER                                   */}
      {/* ============================================================= */}
      {offeredServices.length === 0 ? (
        /* Empty State */
        <Card className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 p-8 text-center bg-card/90 shadow-sm">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <Stethoscope className="size-7" />
          </div>
          <h3 className="mt-4 font-heading text-lg font-extrabold text-foreground">
            No Treatments Offered Yet
          </h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            You haven&apos;t added any clinical services to your portfolio. Add treatments to make them available for appointments and online booking.
          </p>
          <ButtonLink
            href={newServiceUrl}
            className="mt-5 h-10 gap-2 rounded-2xl bg-[#0B3B36] hover:bg-[#0B3B36]/90 px-5 text-xs font-bold text-white shadow-md shadow-[#0B3B36]/20"
          >
            <Plus className="size-4" />
            Add First Treatment
          </ButtonLink>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xs shadow-xs">
          {/* Top Search & Count Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-border/60 p-4 sm:px-6">
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search treatments or categories..."
                className="h-9.5 rounded-2xl pl-9 text-xs bg-muted/25 border-border/70 focus-visible:bg-card shadow-2xs font-medium"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground self-end sm:self-center font-semibold">
              <span>
                Total <strong className="text-foreground">{filteredOfferedServices.length}</strong> {filteredOfferedServices.length === 1 ? "treatment" : "treatments"}
              </span>
            </div>
          </div>

          {filteredOfferedServices.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-xs font-bold text-foreground">No treatments match your search filter</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Try searching with a different term</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="mt-3 h-8.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                Clear search
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table View (>= 1024px) */}
              <div className="hidden lg:block">
                {/* Column Headers */}
                <div className="grid grid-cols-[4fr_1.8fr_1.4fr_1.4fr_110px] items-center gap-4 border-b border-border/60 bg-muted/25 px-6 py-3 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                  <div>SERVICE</div>
                  <div>CATEGORY</div>
                  <div>DURATION</div>
                  <div>MY FEE</div>
                  <div className="text-right">ACTIONS</div>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-border/40">
                  {pagination.paginatedItems.map((svc) => {
                    const editUrl = selectedPractitionerId
                      ? `/clinical/services/${svc.service_id}/edit?practitioner=${selectedPractitionerId}`
                      : `/clinical/services/${svc.service_id}/edit`;

                    return (
                      <div
                        key={svc.service_id}
                        className="grid grid-cols-[4fr_1.8fr_1.4fr_1.4fr_110px] items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/15 min-h-[72px]"
                      >
                        {/* Service Icon, Name & Description */}
                        <div className="flex items-center gap-3.5 min-w-0 pr-4">
                          <div className="size-11 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200/70 shadow-2xs">
                            <ServiceIcon
                              iconKey={svc.icon_key}
                              name={svc.name}
                              category={svc.category}
                              className="size-5.5 text-emerald-800 dark:text-emerald-300"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <Link
                              href={editUrl}
                              className="truncate font-heading text-sm font-extrabold text-foreground hover:text-primary transition-colors block"
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

                        {/* Category Tag */}
                        <div>
                          <span className="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-200/60 capitalize">
                            {svc.category || "General"}
                          </span>
                        </div>

                        {/* Duration */}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                          <Clock className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-foreground">{svc.effective_duration_minutes} min</span>
                        </div>

                        {/* Fee */}
                        <div className="text-sm font-black text-foreground tabular-nums">
                          €{svc.effective_price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-1.5">
                          <ButtonLink
                            href={editUrl}
                            variant="ghost"
                            size="icon-sm"
                            title="Edit service details"
                            className="size-8.5 rounded-xl border border-border/60 text-muted-foreground hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-300 transition-colors"
                          >
                            <Pencil className="size-3.5" />
                          </ButtonLink>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleOpenDeleteModal(svc)}
                            title="Delete service"
                            className="size-8.5 rounded-xl border border-border/60 text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors cursor-pointer"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mobile / Tablet Compact Rows (< 1024px) */}
              <div className="divide-y divide-border/50 lg:hidden">
                {pagination.paginatedItems.map((svc) => {
                  const editUrl = selectedPractitionerId
                    ? `/clinical/services/${svc.service_id}/edit?practitioner=${selectedPractitionerId}`
                    : `/clinical/services/${svc.service_id}/edit`;

                  return (
                    <div key={svc.service_id} className="p-4 space-y-3 hover:bg-muted/10 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="size-10 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200/70">
                            <ServiceIcon
                              iconKey={svc.icon_key}
                              name={svc.name}
                              category={svc.category}
                              className="size-5 text-emerald-800"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <Link href={editUrl} className="font-heading text-sm font-extrabold text-foreground block truncate">
                              {svc.name}
                            </Link>
                            <span className="inline-flex items-center px-2 py-0.5 mt-1 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200">
                              {svc.category || "General"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <ButtonLink href={editUrl} variant="ghost" size="icon-sm" className="size-8 rounded-xl border border-border/60">
                            <Pencil className="size-3.5" />
                          </ButtonLink>
                          <Button variant="ghost" size="icon-sm" onClick={() => handleOpenDeleteModal(svc)} className="size-8 rounded-xl border border-border/60 text-destructive hover:bg-destructive/10">
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
                        <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                          <Clock className="size-3.5 text-emerald-600" />
                          <span>{svc.effective_duration_minutes} min</span>
                        </div>
                        <div className="font-black text-foreground tabular-nums">
                          €{svc.effective_price.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Standard Modern Pagination */}
              <TablePagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                pageSize={pagination.pageSize}
                onPageChange={pagination.onPageChange}
                onPageSizeChange={pagination.onPageSizeChange}
                itemLabel="treatments"
              />
            </>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* 3. MODALS                                                     */}
      {/* ============================================================= */}
      {/* Manage Sections / Categories Dialog */}
      <CategoryManagerDialog
        open={isCategoryModalOpen}
        onOpenChange={setIsCategoryModalOpen}
        categories={categories}
        onCategoriesChange={setCategories}
      />

      {/* Delete Service Confirmation Dialog */}
      <Dialog open={!!deletingService} onOpenChange={(open) => !open && setDeletingService(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          {deletingService && deleteStep === 1 && (
            <>
              <DialogHeader className="space-y-2">
                <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-500">
                  <div className="size-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 flex items-center justify-center">
                    <AlertTriangle className="size-5 shrink-0" />
                  </div>
                  <DialogTitle className="font-heading text-lg font-black text-foreground">
                    Remove Service?
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                  Are you sure you want to remove &ldquo;<strong className="text-foreground">{deletingService.name}</strong>&rdquo; from your offered clinical services?
                </DialogDescription>
              </DialogHeader>

              {upcomingCount > 0 ? (
                <div className="rounded-2xl border border-amber-300 bg-amber-50/80 dark:bg-amber-950/50 p-4 text-xs text-amber-950 dark:text-amber-200 space-y-1.5 my-2">
                  <p className="font-extrabold flex items-center gap-1.5">
                    <AlertTriangle className="size-4 text-amber-700" />
                    Active Patient Bookings Warning
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    There are <strong>{upcomingCount}</strong> upcoming appointments scheduled for this service. Existing bookings will remain active, but new appointments cannot be scheduled for it.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-muted/20 p-3.5 text-xs text-muted-foreground my-2">
                  This procedure will be unlisted from your doctor profile and patient booking wizard.
                </div>
              )}

              <DialogFooter className="border-t border-border/60 pt-4 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeletingService(null)}
                  className="rounded-2xl h-10 px-4 text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setDeleteStep(2)}
                  className="rounded-2xl h-10 px-5 text-xs font-bold"
                >
                  Continue
                </Button>
              </DialogFooter>
            </>
          )}

          {deletingService && deleteStep === 2 && (
            <>
              <DialogHeader className="space-y-2">
                <div className="flex items-center gap-2.5 text-destructive">
                  <div className="size-10 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                    <Trash2 className="size-5 shrink-0" />
                  </div>
                  <DialogTitle className="font-heading text-lg font-black text-foreground">
                    Confirm Removal
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs text-muted-foreground">
                  To confirm, type &ldquo;<span className="font-bold text-foreground">{deletingService.name}</span>&rdquo; or &ldquo;<span className="font-bold text-foreground">DELETE</span>&rdquo; below:
                </DialogDescription>
              </DialogHeader>

              <div className="py-2">
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={`Type "${deletingService.name}" to confirm`}
                  autoFocus
                  className="h-10 rounded-xl text-xs bg-muted/20"
                />
              </div>

              <DialogFooter className="border-t border-border/60 pt-4 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteStep(1)}
                  className="rounded-2xl h-10 px-4 text-xs font-bold"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={!isDeleteConfirmed || isDeleting}
                  onClick={handleDeleteSubmit}
                  className="rounded-2xl h-10 px-5 text-xs font-bold gap-2"
                >
                  {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  Confirm &amp; Delete
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
