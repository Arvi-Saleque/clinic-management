"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireClinician } from "@/lib/auth/guards";
import type { CategoryItem, DoctorServiceConfig, DoctorServicesContext, ServiceFormContext } from "@/types/services";
import { getServiceDefaultIcon } from "@/components/staff/service-icons";
import {
  updateDoctorServiceSchema,
  bulkUpdateDoctorServicesSchema,
  createDoctorServiceSchema,
  serviceFormSchema,
  type UpdateDoctorServiceInput,
  type BulkUpdateDoctorServicesInput,
  type CreateDoctorServiceInput,
  type ServiceFormInput,
} from "@/lib/validation/doctor-services";

/**
 * Resolves the authorized practitioner for service configuration.
 * For dentists, this is strictly their own linked practitioner profile.
 * For owner_admin, it resolves requestedId if it belongs to their organization.
 */
async function resolveAuthorizedPractitioner(requestedId?: string) {
  const profile = await requireClinician();
  const supabase = await createClient();

  if (profile.role === "dentist") {
    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id, title, branch_id, profiles:profile_id(full_name)")
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (!practitioner) return { profile, practitioner: null, allPractitioners: [], canSelectPractitioner: false };

    // Format safely
    const fullName = (practitioner.profiles as unknown as { full_name: string } | null)?.full_name ?? profile.full_name;
    const formatted = {
      id: practitioner.id,
      title: practitioner.title,
      full_name: fullName,
      branch_id: practitioner.branch_id,
    };

    return {
      profile,
      practitioner: formatted,
      allPractitioners: [formatted],
      canSelectPractitioner: false,
    };
  }

  // Owner / Admin role: fetch all active bookable practitioners in the organization
  const { data: practitioners } = await supabase
    .from("practitioners")
    .select("id, title, branch_id, profiles:profile_id(full_name)")
    .order("id");

  const formattedList = (practitioners ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    full_name: (p.profiles as unknown as { full_name: string } | null)?.full_name ?? "Doctor",
    branch_id: p.branch_id,
  }));

  const activePractitioner =
    formattedList.find((p) => p.id === requestedId) ?? formattedList[0] ?? null;

  return {
    profile,
    practitioner: activePractitioner,
    allPractitioners: formattedList,
    canSelectPractitioner: true,
  };
}

export async function getDoctorServicesContext(requestedPractitionerId?: string): Promise<DoctorServicesContext> {
  const { practitioner, allPractitioners, canSelectPractitioner } =
    await resolveAuthorizedPractitioner(requestedPractitionerId);

  if (!practitioner) {
    return {
      practitioner: null,
      allPractitioners,
      canSelectPractitioner,
      services: [],
    };
  }

  const supabase = await createClient();

  // 1. Fetch all active centralized clinic services in organization
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let servicesData: any[] | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let servicesError: any = null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resWithIcon = await (supabase as any)
      .from("services")
      .select("id, name, slug, description, duration_minutes, price, icon_key, show_on_website, category_id, service_categories(name)")
      .eq("is_active", true)
      .order("name");

    if (resWithIcon.error && resWithIcon.error.message?.includes("icon_key")) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resFallback = await (supabase as any)
        .from("services")
        .select("id, name, slug, description, duration_minutes, price, show_on_website, category_id, service_categories(name)")
        .eq("is_active", true)
        .order("name");
      servicesData = resFallback.data;
      servicesError = resFallback.error;
    } else {
      servicesData = resWithIcon.data;
      servicesError = resWithIcon.error;
    }
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resFallback = await (supabase as any)
      .from("services")
      .select("id, name, slug, description, duration_minutes, price, show_on_website, category_id, service_categories(name)")
      .eq("is_active", true)
      .order("name");
    servicesData = resFallback.data;
    servicesError = resFallback.error;
  }

  if (servicesError || !servicesData) {
    console.error("Error fetching clinic services:", servicesError);
    return {
      practitioner,
      allPractitioners,
      canSelectPractitioner,
      services: [],
    };
  }

  // 2. Fetch practitioner's configured services (Turned ON services)
  const { data: overridesData, error: overridesError } = await supabase
    .from("practitioner_services")
    .select("service_id, override_duration_minutes, override_price")
    .eq("practitioner_id", practitioner.id);

  if (overridesError) {
    console.error("Error fetching practitioner service overrides:", overridesError);
  }

  const overridesMap = new Map(
    (overridesData ?? []).map((row) => [row.service_id, row]),
  );

  // 3. Merge centralized services with this practitioner's offerings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mergedServices: DoctorServiceConfig[] = servicesData.map((svc: any) => {
    const override = overridesMap.get(svc.id);
    const isOffered = !!override;
    const overrideDuration = override?.override_duration_minutes ?? null;
    const overridePrice = override?.override_price != null ? Number(override.override_price) : null;
    const iconKey = svc.icon_key ?? getServiceDefaultIcon(svc.name, "General");

    return {
      service_id: svc.id,
      name: svc.name,
      slug: svc.slug,
      category_id: svc.category_id ?? null,
      category: svc.service_categories?.name || "General Dentistry",
      icon_key: iconKey,
      description: svc.description,
      clinic_duration_minutes: svc.duration_minutes,
      clinic_price: Number(svc.price),
      is_offered: isOffered,
      override_duration_minutes: overrideDuration,
      effective_duration_minutes: overrideDuration ?? svc.duration_minutes,
      override_price: overridePrice,
      effective_price: overridePrice ?? Number(svc.price),
    };
  });

  return {
    practitioner,
    allPractitioners,
    canSelectPractitioner,
    services: mergedServices,
  };
}

export async function updateDoctorServiceAction(
  input: UpdateDoctorServiceInput & { practitionerId?: string },
): Promise<{ success: boolean; error: string | null }> {
  try {
    const parsed = updateDoctorServiceSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const { data } = parsed;
    const { practitioner } = await resolveAuthorizedPractitioner(input.practitionerId);

    if (!practitioner) {
      return { success: false, error: "Unauthorized: No valid practitioner profile found." };
    }

    const admin = createAdminClient();

    if (!data.isOffered) {
      // Doctor is turning OFF this service
      const { error: delError } = await admin
        .from("practitioner_services")
        .delete()
        .eq("practitioner_id", practitioner.id)
        .eq("service_id", data.serviceId);

      if (delError) return { success: false, error: delError.message };
    } else {
      // Doctor is turning ON this service with required duration & fee
      const payload = {
        practitioner_id: practitioner.id,
        service_id: data.serviceId,
        override_duration_minutes: data.overrideDurationMinutes ?? null,
        override_price: data.overridePrice ?? null,
      };

      const { error: upsertError } = await admin
        .from("practitioner_services")
        .upsert(payload, { onConflict: "practitioner_id,service_id" });

      if (upsertError) return { success: false, error: upsertError.message };
    }

    revalidatePath("/clinical/services");
    revalidatePath("/scheduler");
    return { success: true, error: null };
  } catch (err: unknown) {
    console.error("Failed to update doctor service:", err);
    return { success: false, error: err instanceof Error ? err.message : "Internal error updating service" };
  }
}

export async function bulkSaveDoctorServicesAction(
  input: BulkUpdateDoctorServicesInput,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const parsed = bulkUpdateDoctorServicesSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const { data } = parsed;
    const { practitioner } = await resolveAuthorizedPractitioner(data.practitionerId);

    if (!practitioner) {
      return { success: false, error: "Unauthorized: No valid practitioner profile found." };
    }

    const admin = createAdminClient();

    // 1. Partition into services to delete (not offered) and services to upsert (offered)
    const toDeleteIds: string[] = [];
    const toUpsertRows: {
      practitioner_id: string;
      service_id: string;
      override_duration_minutes: number | null;
      override_price: number | null;
    }[] = [];

    for (const svc of data.services) {
      if (!svc.isOffered) {
        toDeleteIds.push(svc.serviceId);
      } else {
        toUpsertRows.push({
          practitioner_id: practitioner.id,
          service_id: svc.serviceId,
          override_duration_minutes: svc.overrideDurationMinutes ?? null,
          override_price: svc.overridePrice ?? null,
        });
      }
    }

    // 2. Perform deletions
    if (toDeleteIds.length > 0) {
      const { error: delError } = await admin
        .from("practitioner_services")
        .delete()
        .eq("practitioner_id", practitioner.id)
        .in("service_id", toDeleteIds);

      if (delError) return { success: false, error: delError.message };
    }

    // 3. Perform upserts
    if (toUpsertRows.length > 0) {
      const { error: upsertError } = await admin
        .from("practitioner_services")
        .upsert(toUpsertRows, { onConflict: "practitioner_id,service_id" });

      if (upsertError) return { success: false, error: upsertError.message };
    }

    revalidatePath("/clinical/services");
    revalidatePath("/scheduler");
    return { success: true, error: null };
  } catch (err: unknown) {
    console.error("Failed to bulk save doctor services:", err);
    return { success: false, error: err instanceof Error ? err.message : "Internal error saving services" };
  }
}

export async function createDoctorServiceAction(
  input: CreateDoctorServiceInput,
): Promise<{ success: boolean; error: string | null; service?: DoctorServiceConfig }> {
  try {
    const parsed = createDoctorServiceSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const { data } = parsed;
    const { profile, practitioner } = await resolveAuthorizedPractitioner(input.practitionerId);

    if (!practitioner) {
      return { success: false, error: "Unauthorized: No valid practitioner profile found." };
    }

    const admin = createAdminClient();

    // 1. Get branch and organization context
    const { data: branchData } = await admin
      .from("branches")
      .select("id, organization_id")
      .eq("id", practitioner.branch_id)
      .single();

    const organizationId = branchData?.organization_id ?? (profile as unknown as { organization_id?: string })?.organization_id;
    if (!organizationId) {
      return { success: false, error: "Organization context not found." };
    }

    // 2. Generate slug from name
    const baseSlug = data.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const uniqueSlug = `${baseSlug || "service"}-${Date.now().toString(36)}`;

    // 3. Create centralized service record in organization catalog (NO category)
    const insertData: Record<string, unknown> = {
      organization_id: organizationId,
      branch_id: practitioner.branch_id,
      name: data.name.trim(),
      slug: uniqueSlug,
      icon_key: data.iconKey || "tooth",
      description: data.description?.trim() || null,
      duration_minutes: data.durationMinutes,
      price: data.price,
      is_active: true,
      show_on_website: true,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let { data: newService, error: serviceError } = await (admin as any)
      .from("services")
      .insert(insertData)
      .select()
      .single();

    if (serviceError && serviceError.message?.includes("icon_key")) {
      delete insertData.icon_key;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const retryRes = await (admin as any)
        .from("services")
        .insert(insertData)
        .select()
        .single();
      newService = retryRes.data;
      serviceError = retryRes.error;
    }

    if (serviceError || !newService) {
      return { success: false, error: serviceError?.message ?? "Failed to create service" };
    }

    // 4. Link into practitioner_services ONLY for the creating doctor (turned ON for this doctor, OFF for all other doctors)
    const { error: linkError } = await admin
      .from("practitioner_services")
      .insert({
        practitioner_id: practitioner.id,
        service_id: newService.id,
        override_duration_minutes: data.durationMinutes,
        override_price: data.price,
      });

    if (linkError) {
      return { success: false, error: linkError.message };
    }

    revalidatePath("/clinical/services");
    revalidatePath("/scheduler");

    const resolvedIcon = data.iconKey || getServiceDefaultIcon(newService.name, "General");

    return {
      success: true,
      error: null,
      service: {
        service_id: newService.id,
        name: newService.name,
        slug: newService.slug,
        icon_key: resolvedIcon,
        description: newService.description,
        clinic_duration_minutes: newService.duration_minutes,
        clinic_price: Number(newService.price),
        is_offered: true,
        override_duration_minutes: data.durationMinutes,
        effective_duration_minutes: data.durationMinutes,
        override_price: data.price,
        effective_price: data.price,
      },
    };
  } catch (err: unknown) {
    console.error("Failed to create doctor service:", err);
    return { success: false, error: err instanceof Error ? err.message : "Internal error creating service" };
  }
}

export async function deleteDoctorServiceAction(
  input: { practitionerId?: string; serviceId: string },
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { practitioner } = await resolveAuthorizedPractitioner(input.practitionerId);

    if (!practitioner) {
      return { success: false, error: "Unauthorized: No valid practitioner profile found." };
    }

    const admin = createAdminClient();

    // Safely remove the doctor-offering relationship (turns OFF for this doctor)
    const { error: delError } = await admin
      .from("practitioner_services")
      .delete()
      .eq("practitioner_id", practitioner.id)
      .eq("service_id", input.serviceId);

    if (delError) {
      return { success: false, error: delError.message };
    }

    revalidatePath("/clinical/services");
    revalidatePath("/scheduler");
    return { success: true, error: null };
  } catch (err: unknown) {
    console.error("Failed to remove doctor service:", err);
    return { success: false, error: err instanceof Error ? err.message : "Internal error removing service" };
  }
}

export async function checkUpcomingAppointmentsAction(
  input: { practitionerId?: string; serviceId: string },
): Promise<{ upcomingCount: number; error: string | null }> {
  try {
    const { practitioner } = await resolveAuthorizedPractitioner(input.practitionerId);
    if (!practitioner) {
      return { upcomingCount: 0, error: "Unauthorized" };
    }

    const admin = createAdminClient();
    const today = new Date().toISOString().split("T")[0];

    const { count, error } = await admin
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("practitioner_id", practitioner.id)
      .eq("service_id", input.serviceId)
      .gte("appointment_date", today)
      .not("status", "in", "(cancelled,completed,no_show)");

    if (error) {
      return { upcomingCount: 0, error: error.message };
    }

    return { upcomingCount: count ?? 0, error: null };
  } catch (err: unknown) {
    return { upcomingCount: 0, error: err instanceof Error ? err.message : "Failed to check appointments" };
  }
}

export async function getNewServiceContext(requestedPractitionerId?: string): Promise<ServiceFormContext> {
  const { profile, practitioner, allPractitioners, canSelectPractitioner } =
    await resolveAuthorizedPractitioner(requestedPractitionerId);

  return {
    practitioner,
    allPractitioners,
    canSelectPractitioner,
    userRole: profile.role,
  };
}

export async function getSingleServiceContext(
  serviceId: string,
  requestedPractitionerId?: string,
): Promise<ServiceFormContext & { serviceNotFound?: boolean }> {
  const { profile, practitioner, allPractitioners, canSelectPractitioner } =
    await resolveAuthorizedPractitioner(requestedPractitionerId);

  const supabase = await createClient();

  // 1. Fetch the centralized service
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rawSvc: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let svcError: any = null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resWithIcon = await (supabase as any)
      .from("services")
      .select("id, name, slug, icon_key, description, duration_minutes, price, show_on_website")
      .eq("id", serviceId)
      .single();

    if (resWithIcon.error && resWithIcon.error.message?.includes("icon_key")) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resFallback = await (supabase as any)
        .from("services")
        .select("id, name, slug, description, duration_minutes, price, show_on_website")
        .eq("id", serviceId)
        .single();
      rawSvc = resFallback.data;
      svcError = resFallback.error;
    } else {
      rawSvc = resWithIcon.data;
      svcError = resWithIcon.error;
    }
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resFallback = await (supabase as any)
      .from("services")
      .select("id, name, slug, description, duration_minutes, price, show_on_website")
      .eq("id", serviceId)
      .single();
    rawSvc = resFallback.data;
    svcError = resFallback.error;
  }

  const svc = rawSvc as {
    id: string;
    name: string;
    slug: string;
    icon_key?: string | null;
    description: string | null;
    duration_minutes: number;
    price: number;
    show_on_website: boolean;
  } | null;

  if (svcError || !svc) {
    return {
      practitioner,
      allPractitioners,
      canSelectPractitioner,
      serviceNotFound: true,
      userRole: profile.role,
    };
  }

  // 2. Fetch practitioner's override if exists
  let overrideDuration: number | null = null;
  let overridePrice: number | null = null;
  let isOffered = false;

  if (practitioner) {
    const { data: override } = await supabase
      .from("practitioner_services")
      .select("override_duration_minutes, override_price")
      .eq("practitioner_id", practitioner.id)
      .eq("service_id", serviceId)
      .maybeSingle();

    if (override) {
      isOffered = true;
      overrideDuration = override.override_duration_minutes;
      overridePrice = override.override_price != null ? Number(override.override_price) : null;
    }
  }

  const iconKey = svc.icon_key ?? getServiceDefaultIcon(svc.name, "General");

  return {
    practitioner,
    allPractitioners,
    canSelectPractitioner,
    service: {
      service_id: svc.id,
      name: svc.name,
      slug: svc.slug,
      icon_key: iconKey,
      description: svc.description,
      clinic_duration_minutes: svc.duration_minutes,
      clinic_price: Number(svc.price),
      is_offered: isOffered,
      override_duration_minutes: overrideDuration,
      effective_duration_minutes: overrideDuration ?? svc.duration_minutes,
      override_price: overridePrice,
      effective_price: overridePrice ?? Number(svc.price),
      show_on_website: svc.show_on_website ?? true,
    },
    userRole: profile.role,
  };
}

export async function saveServiceFormAction(
  input: ServiceFormInput,
): Promise<{ success: boolean; error: string | null; serviceId?: string }> {
  try {
    const parsed = serviceFormSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const { data } = parsed;
    const { profile, practitioner } = await resolveAuthorizedPractitioner(input.practitionerId);

    if (!practitioner) {
      return { success: false, error: "Unauthorized: No valid practitioner profile found." };
    }

    const admin = createAdminClient();

    // Resolve organization ID
    const { data: branchData } = await admin
      .from("branches")
      .select("id, organization_id")
      .eq("id", practitioner.branch_id)
      .single();

    const organizationId = branchData?.organization_id ?? (profile as unknown as { organization_id?: string })?.organization_id;
    if (!organizationId) {
      return { success: false, error: "Organization context not found." };
    }

    if (data.serviceId) {
      // -------------------------------------------------------------
      // EDIT MODE
      // -------------------------------------------------------------
      // 1. Update practitioner-specific overrides
      const overridePayload = {
        practitioner_id: practitioner.id,
        service_id: data.serviceId,
        override_duration_minutes: data.durationMinutes,
        override_price: data.price,
      };

      const { error: overrideError } = await admin
        .from("practitioner_services")
        .upsert(overridePayload, { onConflict: "practitioner_id,service_id" });

      if (overrideError) {
        return { success: false, error: overrideError.message };
      }

      // 2. Update centralized service details
      const updateData: Record<string, unknown> = {
        name: data.name.trim(),
        icon_key: data.iconKey || "tooth",
        description: data.description?.trim() || null,
        duration_minutes: data.durationMinutes,
        price: data.price,
        show_on_website: data.showOnWebsite,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let { error: updateError } = await (admin as any)
        .from("services")
        .update(updateData)
        .eq("id", data.serviceId);

      if (updateError && updateError.message?.includes("icon_key")) {
        delete updateData.icon_key;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const retryRes = await (admin as any)
          .from("services")
          .update(updateData)
          .eq("id", data.serviceId);
        updateError = retryRes.error;
      }

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      revalidatePath("/clinical/services");
      revalidatePath(`/clinical/services/${data.serviceId}/edit`);
      revalidatePath("/scheduler");
      revalidatePath("/services");

      return { success: true, error: null, serviceId: data.serviceId };
    } else {
      // -------------------------------------------------------------
      // CREATE MODE
      // -------------------------------------------------------------
      const baseSlug = data.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const uniqueSlug = `${baseSlug || "service"}-${Date.now().toString(36)}`;

      const insertData: Record<string, unknown> = {
        organization_id: organizationId,
        branch_id: practitioner.branch_id,
        name: data.name.trim(),
        slug: uniqueSlug,
        icon_key: data.iconKey || "tooth",
        description: data.description?.trim() || null,
        duration_minutes: data.durationMinutes,
        price: data.price,
        is_active: true,
        show_on_website: data.showOnWebsite,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let { data: newService, error: serviceError } = await (admin as any)
        .from("services")
        .insert(insertData)
        .select()
        .single();

      if (serviceError && serviceError.message?.includes("icon_key")) {
        delete insertData.icon_key;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const retryRes = await (admin as any)
          .from("services")
          .insert(insertData)
          .select()
          .single();
        newService = retryRes.data;
        serviceError = retryRes.error;
      }

      if (serviceError || !newService) {
        return { success: false, error: serviceError?.message ?? "Failed to create service" };
      }

      // Link to creating practitioner only (turned ON for this doctor, OFF for others)
      const { error: linkError } = await admin
        .from("practitioner_services")
        .insert({
          practitioner_id: practitioner.id,
          service_id: newService.id,
          override_duration_minutes: data.durationMinutes,
          override_price: data.price,
        });

      if (linkError) {
        return { success: false, error: linkError.message };
      }

      revalidatePath("/clinical/services");
      revalidatePath("/scheduler");
      revalidatePath("/services");

      return { success: true, error: null, serviceId: newService.id };
    }
  } catch (err: unknown) {
    console.error("Failed to save service form:", err);
    return { success: false, error: err instanceof Error ? err.message : "Internal error saving service" };
  }
}

// Deprecated category stubs for backward compatibility
export async function listCategoriesAction(): Promise<CategoryItem[]> {
  return [];
}
export async function createCategoryAction(): Promise<{ success: boolean; error: string | null }> {
  return { success: false, error: "Categories have been deprecated." };
}
export async function renameCategoryAction(): Promise<{ success: boolean; error: string | null }> {
  return { success: false, error: "Categories have been deprecated." };
}
export async function deleteCategoryAction(): Promise<{ success: boolean; error: string | null }> {
  return { success: false, error: "Categories have been deprecated." };
}
