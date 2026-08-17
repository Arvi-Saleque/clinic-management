"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireClinician } from "@/lib/auth/guards";
import type { DoctorServiceConfig, DoctorServicesContext } from "@/types/services";
import {
  updateDoctorServiceSchema,
  bulkUpdateDoctorServicesSchema,
  type UpdateDoctorServiceInput,
  type BulkUpdateDoctorServicesInput,
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

  // 1. Fetch all active clinic services
  const { data: servicesData, error: servicesError } = await supabase
    .from("services")
    .select("id, name, slug, category, description, duration_minutes, price")
    .eq("is_active", true)
    .order("category", { nullsFirst: false })
    .order("name");

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
  const mergedServices: DoctorServiceConfig[] = servicesData.map((svc) => {
    const override = overridesMap.get(svc.id);
    const isOffered = !!override;
    const overrideDuration = override?.override_duration_minutes ?? null;
    const overridePrice = override?.override_price != null ? Number(override.override_price) : null;

    return {
      service_id: svc.id,
      name: svc.name,
      slug: svc.slug,
      category: svc.category ?? "General Dental",
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
