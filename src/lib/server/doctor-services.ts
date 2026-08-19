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

  // 1. Fetch all active clinic services in organization
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let servicesData: any[] | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let servicesError: any = null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resWithIcon = await (supabase as any)
      .from("services")
      .select("id, name, slug, category_id, description, duration_minutes, price, icon_key, service_categories:category_id(id, name, description)")
      .eq("is_active", true)
      .order("name");

    if (resWithIcon.error && resWithIcon.error.message?.includes("icon_key")) {
      // Fallback if icon_key migration not yet applied
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resFallback = await (supabase as any)
        .from("services")
        .select("id, name, slug, category_id, description, duration_minutes, price, service_categories:category_id(id, name, description)")
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
      .select("id, name, slug, category_id, description, duration_minutes, price, service_categories:category_id(id, name, description)")
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

  // 2. Fetch practitioner's configured services
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

  // 3. Merge services with practitioner configurations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mergedServices: DoctorServiceConfig[] = servicesData.map((svc: any) => {
    const override = overridesMap.get(svc.id);
    const isOffered = !!override;
    const overrideDuration = override?.override_duration_minutes ?? null;
    const overridePrice = override?.override_price != null ? Number(override.override_price) : null;
    const catName = svc.service_categories?.name ?? "General Dentistry";
    const iconKey = svc.icon_key ?? getServiceDefaultIcon(svc.name, catName);

    return {
      service_id: svc.id,
      name: svc.name,
      slug: svc.slug,
      category_id: svc.category_id ?? null,
      category: catName,
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

    const supabase = await createClient();

    if (!data.isOffered) {
      // Doctor is disabling this service
      const { error } = await supabase
        .from("practitioner_services")
        .delete()
        .eq("practitioner_id", practitioner.id)
        .eq("service_id", data.serviceId);

      if (error) {
        // If RLS blocks dentist write on client, fallback to admin client after verified authorization
        const admin = createAdminClient();
        const { error: adminError } = await admin
          .from("practitioner_services")
          .delete()
          .eq("practitioner_id", practitioner.id)
          .eq("service_id", data.serviceId);

        if (adminError) return { success: false, error: adminError.message };
      }
    } else {
      // Doctor is enabling/updating this service
      const payload = {
        practitioner_id: practitioner.id,
        service_id: data.serviceId,
        override_duration_minutes: data.overrideDurationMinutes ?? null,
        override_price: data.overridePrice ?? null,
      };

      const { error } = await supabase
        .from("practitioner_services")
        .upsert(payload, { onConflict: "practitioner_id,service_id" });

      if (error) {
        const admin = createAdminClient();
        const { error: adminError } = await admin
          .from("practitioner_services")
          .upsert(payload, { onConflict: "practitioner_id,service_id" });

        if (adminError) return { success: false, error: adminError.message };
      }
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

    // 3. Resolve category_id in service_categories
    let categoryId: string | null = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingCat } = await (admin as any)
        .from("service_categories")
        .select("id")
        .eq("organization_id", organizationId)
        .ilike("name", data.category.trim())
        .maybeSingle();

      if (existingCat?.id) {
        categoryId = existingCat.id;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: createdCat } = await (admin as any)
          .from("service_categories")
          .insert({
            organization_id: organizationId,
            name: data.category.trim(),
          })
          .select("id")
          .maybeSingle();
        if (createdCat?.id) categoryId = createdCat.id;
      }
    } catch {
      // Fallback
    }

    if (!categoryId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: defaultCat } = await (admin as any)
        .from("service_categories")
        .select("id")
        .eq("organization_id", organizationId)
        .ilike("name", "General Dentistry")
        .maybeSingle();
      if (defaultCat?.id) categoryId = defaultCat.id;
    }

    if (!categoryId) {
      return { success: false, error: "Please select a valid category." };
    }

    // 4. Create service record in organization catalog
    const insertData: Record<string, unknown> = {
      organization_id: organizationId,
      branch_id: practitioner.branch_id,
      name: data.name.trim(),
      slug: uniqueSlug,
      category_id: categoryId,
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

    // 5. Link into practitioner_services
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

    const resolvedIcon = data.iconKey || getServiceDefaultIcon(newService.name, data.category.trim());

    return {
      success: true,
      error: null,
      service: {
        service_id: newService.id,
        name: newService.name,
        slug: newService.slug,
        category_id: categoryId,
        category: data.category.trim(),
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

    // Safely remove the doctor-offering relationship without destroying global service/historical records
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

/**
 * Fetches all categories with accurate service counts for the clinician's organization
 */
export async function listCategoriesAction(): Promise<CategoryItem[]> {
  try {
    const profile = await requireClinician();
    const supabase = await createClient();
    const admin = createAdminClient();
    const orgId = profile.organization_id || "";

    // 1. Fetch active services in clinician's organization
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: servicesData } = await (supabase as any)
      .from("services")
      .select("id, category_id")
      .eq("organization_id", orgId)
      .eq("is_active", true);

    const countsMap = new Map<string, number>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (servicesData ?? []).forEach((s: any) => {
      if (s.category_id) {
        countsMap.set(s.category_id, (countsMap.get(s.category_id) ?? 0) + 1);
      }
    });

    // 2. Fetch categories from service_categories for this organization
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: dbCategories } = await (admin as any)
      .from("service_categories")
      .select("id, name, description")
      .eq("organization_id", orgId)
      .order("name");

    const categoryList: CategoryItem[] = [];
    const seenNames = new Set<string>();

    (dbCategories ?? []).forEach((c: { id: string; name: string; description?: string | null }) => {
      seenNames.add(c.name.toLowerCase());
      const count = countsMap.get(c.id) ?? 0;
      categoryList.push({
        id: c.id,
        name: c.name,
        description: c.description,
        serviceCount: count,
      });
    });

    const defaultCategories = [
      "Children",
      "Cosmetic",
      "Emergency",
      "Endodontics",
      "General",
      "General Dentistry",
      "Hygiene",
      "Orthodontics",
      "Prosthodontics",
      "Restorative",
      "Surgical",
    ];

    defaultCategories.forEach((catName) => {
      if (!seenNames.has(catName.toLowerCase())) {
        seenNames.add(catName.toLowerCase());
        categoryList.push({
          name: catName,
          serviceCount: 0,
        });
      }
    });

    return categoryList.sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error("Failed to list categories:", err);
    return [
      { name: "General Dentistry", serviceCount: 0 },
      { name: "Cosmetic Dentistry", serviceCount: 0 },
      { name: "Orthodontics", serviceCount: 0 },
      { name: "Restorative", serviceCount: 0 },
      { name: "Surgical", serviceCount: 0 },
    ];
  }
}

/**
 * Creates a new category within the clinician's organization
 */
export async function createCategoryAction(
  name: string,
  description?: string,
): Promise<{ success: boolean; error: string | null; category?: CategoryItem }> {
  try {
    const cleanName = name.trim();
    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: "Category name must be at least 2 characters" };
    }

    const profile = await requireClinician();
    const admin = createAdminClient();
    const orgId = profile.organization_id || "";

    // Check duplicate within organization
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (admin as any)
      .from("service_categories")
      .select("id, name")
      .eq("organization_id", orgId)
      .ilike("name", cleanName)
      .maybeSingle();

    if (existing) {
      return { success: false, error: `Category "${cleanName}" already exists in your clinic.` };
    }

    // Insert into service_categories table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newCat, error } = await (admin as any)
      .from("service_categories")
      .insert({
        organization_id: orgId,
        name: cleanName,
        description: description?.trim() || null,
      })
      .select()
      .maybeSingle();

    if (error && !error.message.includes("does not exist") && !error.message.includes("unique")) {
      return { success: false, error: error.message };
    }

    revalidatePath("/clinical/services");
    revalidatePath("/clinical/services/new");

    return {
      success: true,
      error: null,
      category: {
        id: newCat?.id,
        name: cleanName,
        description: description?.trim() || null,
        serviceCount: 0,
      },
    };
  } catch (err: unknown) {
    console.error("Failed to create category:", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to create category" };
  }
}

/**
 * Renames an existing category across all services in the clinician's organization
 */
export async function renameCategoryAction(
  oldName: string,
  newName: string,
  description?: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const cleanOld = oldName.trim();
    const cleanNew = newName.trim();

    if (!cleanNew || cleanNew.length < 2) {
      return { success: false, error: "New category name must be at least 2 characters" };
    }

    const profile = await requireClinician();
    const admin = createAdminClient();
    const orgId = profile.organization_id || "";

    // 1. Update in service_categories table for this org
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any)
        .from("service_categories")
        .update({
          name: cleanNew,
          description: description?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("organization_id", orgId)
        .eq("name", cleanOld);
    } catch {
      // Ignored if table doesn't exist
    }

    revalidatePath("/clinical/services");
    revalidatePath("/clinical/services/new");
    revalidatePath("/services");

    return { success: true, error: null };
  } catch (err: unknown) {
    console.error("Failed to rename category:", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to rename category" };
  }
}

/**
 * Deletes a category if 0 services in this organization use it
 */
export async function deleteCategoryAction(
  categoryName: string,
): Promise<{ success: boolean; error: string | null; serviceCount?: number }> {
  try {
    const cleanName = categoryName.trim();
    const profile = await requireClinician();
    const admin = createAdminClient();
    const orgId = profile.organization_id || "";

    // Find category row in this org if exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: catRecord } = await (admin as any)
      .from("service_categories")
      .select("id, name")
      .eq("organization_id", orgId)
      .eq("name", cleanName)
      .maybeSingle();

    // Check active services in this org
    let count = 0;
    if (catRecord?.id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: fkCount } = await (admin as any)
        .from("services")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .eq("is_active", true)
        .eq("category_id", catRecord.id);
      count = fkCount ?? 0;
    }

    if (count > 0) {
      return {
        success: false,
        error: `This category contains ${count} service${count === 1 ? "" : "s"}. Reassign those services before deleting it.`,
        serviceCount: count,
      };
    }

    // If 0 services, safely delete from service_categories
    try {
      if (catRecord?.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (admin as any)
          .from("service_categories")
          .delete()
          .eq("id", catRecord.id)
          .eq("organization_id", orgId);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (admin as any)
          .from("service_categories")
          .delete()
          .eq("name", cleanName)
          .eq("organization_id", orgId);
      }
    } catch {
      // Ignored if table doesn't exist
    }

    revalidatePath("/clinical/services");
    revalidatePath("/clinical/services/new");

    return { success: true, error: null, serviceCount: 0 };
  } catch (err: unknown) {
    console.error("Failed to delete category:", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to delete category" };
  }
}

export async function getNewServiceContext(requestedPractitionerId?: string): Promise<ServiceFormContext> {
  const { profile, practitioner, allPractitioners, canSelectPractitioner } =
    await resolveAuthorizedPractitioner(requestedPractitionerId);

  const categories = await listCategoriesAction();

  return {
    practitioner,
    allPractitioners,
    canSelectPractitioner,
    categories,
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

  // 1. Fetch the service
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rawSvc: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let svcError: any = null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resWithIcon = await (supabase as any)
      .from("services")
      .select("id, name, slug, category_id, icon_key, description, duration_minutes, price, show_on_website, service_categories:category_id(id, name, description)")
      .eq("id", serviceId)
      .single();

    if (resWithIcon.error && resWithIcon.error.message?.includes("icon_key")) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resFallback = await (supabase as any)
        .from("services")
        .select("id, name, slug, category_id, description, duration_minutes, price, show_on_website, service_categories:category_id(id, name, description)")
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
      .select("id, name, slug, category_id, description, duration_minutes, price, show_on_website, service_categories:category_id(id, name, description)")
      .eq("id", serviceId)
      .single();
    rawSvc = resFallback.data;
    svcError = resFallback.error;
  }

  const svc = rawSvc as {
    id: string;
    name: string;
    slug: string;
    category_id?: string | null;
    icon_key?: string | null;
    description: string | null;
    duration_minutes: number;
    price: number;
    show_on_website: boolean;
    service_categories?: { id: string; name: string; description?: string | null } | null;
  } | null;

  if (svcError || !svc) {
    return {
      practitioner,
      allPractitioners,
      canSelectPractitioner,
      categories: [],
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

  // 3. Fetch all categories
  const categories = await listCategoriesAction();
  const catName = svc.service_categories?.name ?? "General Dentistry";
  const iconKey = svc.icon_key ?? getServiceDefaultIcon(svc.name, catName);

  return {
    practitioner,
    allPractitioners,
    canSelectPractitioner,
    categories,
    service: {
      service_id: svc.id,
      name: svc.name,
      slug: svc.slug,
      category_id: svc.category_id ?? null,
      category: catName,
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

    // Resolve or establish category_id in service_categories
    let finalCategoryId: string | null = null;
    if (data.categoryId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: catById } = await (admin as any)
        .from("service_categories")
        .select("id")
        .eq("id", data.categoryId)
        .eq("organization_id", organizationId)
        .maybeSingle();
      if (catById?.id) finalCategoryId = catById.id;
    }

    if (!finalCategoryId && data.category) {
      const cleanName = data.category.trim();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: catByName } = await (admin as any)
        .from("service_categories")
        .select("id")
        .eq("organization_id", organizationId)
        .ilike("name", cleanName)
        .maybeSingle();

      if (catByName?.id) {
        finalCategoryId = catByName.id;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: newCat } = await (admin as any)
          .from("service_categories")
          .insert({
            organization_id: organizationId,
            name: cleanName,
          })
          .select("id")
          .maybeSingle();
        if (newCat?.id) finalCategoryId = newCat.id;
      }
    }

    if (!finalCategoryId) {
      // Fallback to General Dentistry
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: defaultCat } = await (admin as any)
        .from("service_categories")
        .select("id")
        .eq("organization_id", organizationId)
        .ilike("name", "General Dentistry")
        .maybeSingle();
      if (defaultCat?.id) finalCategoryId = defaultCat.id;
    }

    if (!finalCategoryId) {
      return { success: false, error: "Please select a valid service category." };
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

      // 2. Update service details (NO legacy category column!)
      const updateData: Record<string, unknown> = {
        name: data.name.trim(),
        category_id: finalCategoryId,
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
        category_id: finalCategoryId,
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

// Canonical named action exports
export const listServiceCategories = listCategoriesAction;
export const createServiceCategory = createCategoryAction;
export const updateServiceCategory = renameCategoryAction;
export const deleteServiceCategory = deleteCategoryAction;
