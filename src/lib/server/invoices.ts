"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireClinician, requireStaff } from "@/lib/auth/guards";
import { getUser } from "@/lib/auth/session";
import { createInvoiceSchema, recordPaymentSchema } from "@/lib/validation/invoice";
import { formatCurrency } from "@/lib/utils";

export type InvoiceActionState = { error: string | null };

function firstIssue(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Invalid input";
}

/** Clinician / Admin only. Builds subtotal/total from line items and inserts invoice + invoice_items in one go. */
export async function createInvoiceAction(
  _prev: InvoiceActionState,
  formData: FormData,
): Promise<InvoiceActionState> {
  const profile = await requireClinician();

  const rawItems = JSON.parse(String(formData.get("items") ?? "[]"));
  const parsed = createInvoiceSchema.safeParse({
    patientId: formData.get("patientId"),
    dueDate: formData.get("dueDate") || undefined,
    discountAmount: formData.get("discountAmount") || 0,
    taxAmount: formData.get("taxAmount") || 0,
    notes: formData.get("notes") || undefined,
    items: rawItems,
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const input = parsed.data;

  const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const total = Math.max(0, subtotal + input.taxAmount - input.discountAmount);

  const supabase = await createClient();
  const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      organization_id: profile.organization_id!,
      patient_id: input.patientId,
      invoice_number: invoiceNumber,
      due_date: input.dueDate || null,
      status: "issued",
      subtotal,
      tax_amount: input.taxAmount,
      discount_amount: input.discountAmount,
      total,
      notes: input.notes || null,
      created_by_staff_id: profile.id,
    })
    .select("id")
    .single();

  if (invoiceError || !invoice) return { error: "Could not create the invoice. Please try again." };

  const { error: itemsError } = await supabase.from("invoice_items").insert(
    input.items.map((item) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      line_total: item.quantity * item.unitPrice,
    })),
  );
  if (itemsError) return { error: "Invoice created, but line items failed to save." };

  redirect(`/billing/invoices/${invoice.id}`);
}

/** Staff only (owner_admin/receptionist per RLS). Records a payment and bumps invoice status. */
export async function recordPaymentAction(
  invoiceId: string,
  _prev: InvoiceActionState,
  formData: FormData,
): Promise<InvoiceActionState> {
  const profile = await requireStaff();

  const parsed = recordPaymentSchema.safeParse({
    amount: formData.get("amount"),
    method: formData.get("method"),
    reference: formData.get("reference") || undefined,
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const input = parsed.data;

  const supabase = await createClient();

  let invoiceQuery = supabase
    .from("invoices")
    .select("total, status")
    .eq("id", invoiceId);

  if (profile.organization_id) {
    invoiceQuery = invoiceQuery.eq("organization_id", profile.organization_id);
  }

  const { data: invoice } = await invoiceQuery.single();
  if (!invoice) return { error: "Invoice not found or unauthorized." };
  if (invoice.status === "void") return { error: "Cannot record payment on a void invoice." };

  const { data: payments } = await supabase
    .from("payments")
    .select("amount")
    .eq("invoice_id", invoiceId);
  const currentPaid = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const currentBalance = Math.max(0, Number(invoice.total) - currentPaid);

  if (input.amount <= 0) {
    return { error: "Payment amount must be greater than zero." };
  }
  if (input.amount > currentBalance) {
    return {
      error: `Payment amount (${formatCurrency(input.amount)}) exceeds remaining balance (${formatCurrency(currentBalance)}).`,
    };
  }

  const { error: paymentError } = await supabase.from("payments").insert({
    invoice_id: invoiceId,
    amount: input.amount,
    method: input.method,
    reference: input.reference || null,
    recorded_by_staff_id: profile.id,
  });
  if (paymentError) return { error: paymentError.message };

  const totalPaid = currentPaid + input.amount;
  const nextStatus = totalPaid >= Number(invoice.total) ? "paid" : "partially_paid";

  let updateQuery = supabase.from("invoices").update({ status: nextStatus }).eq("id", invoiceId);
  if (profile.organization_id) {
    updateQuery = updateQuery.eq("organization_id", profile.organization_id);
  }
  await updateQuery;

  revalidatePath(`/billing/invoices/${invoiceId}`);
  revalidatePath("/billing/invoices");
  return { error: null };
}

/** Direct programmatic server action for modal payment submission */
export async function recordDirectPaymentAction(input: {
  invoiceId: string;
  amount: number;
  method: "cash" | "card" | "bank_transfer" | "other";
  reference?: string;
}): Promise<{ success: boolean; error: string | null }> {
  try {
    const profile = await requireStaff();
    const parsed = recordPaymentSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: firstIssue(parsed.error) };
    }

    const data = parsed.data;
    const supabase = await createClient();

    let invoiceQuery = supabase
      .from("invoices")
      .select("total, status")
      .eq("id", input.invoiceId);

    if (profile.organization_id) {
      invoiceQuery = invoiceQuery.eq("organization_id", profile.organization_id);
    }

    const { data: invoice } = await invoiceQuery.single();

    if (!invoice) return { success: false, error: "Invoice not found or unauthorized." };
    if (invoice.status === "void") return { success: false, error: "Cannot record payment on a void invoice." };

    const { data: payments } = await supabase
      .from("payments")
      .select("amount")
      .eq("invoice_id", input.invoiceId);
    const currentPaid = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
    const currentBalance = Math.max(0, Number(invoice.total) - currentPaid);

    if (data.amount <= 0) {
      return { success: false, error: "Payment amount must be greater than zero." };
    }
    if (data.amount > currentBalance + 0.001) {
      return {
        success: false,
        error: `Payment amount (${formatCurrency(data.amount)}) exceeds remaining balance (${formatCurrency(currentBalance)}).`,
      };
    }

    const { error: paymentError } = await supabase.from("payments").insert({
      invoice_id: input.invoiceId,
      amount: data.amount,
      method: data.method,
      reference: data.reference || null,
      recorded_by_staff_id: profile.id,
    });

    if (paymentError) return { success: false, error: paymentError.message };

    const totalPaid = currentPaid + data.amount;
    const nextStatus = totalPaid >= Number(invoice.total) ? "paid" : "partially_paid";

    let updateQuery = supabase.from("invoices").update({ status: nextStatus }).eq("id", input.invoiceId);
    if (profile.organization_id) {
      updateQuery = updateQuery.eq("organization_id", profile.organization_id);
    }
    await updateQuery;

    revalidatePath(`/billing/invoices/${input.invoiceId}`);
    revalidatePath("/billing/invoices");
    return { success: true, error: null };
  } catch (err) {
    console.error("Failed to record payment:", err);
    return { success: false, error: err instanceof Error ? err.message : "Internal error recording payment" };
  }
}

export async function getOwnPatientId() {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("patients").select("id").eq("profile_id", user.id).maybeSingle();
  return data?.id ?? null;
}

/** Finalizes a draft invoice and marks it as 'issued' (Outstanding). */
export async function issueDraftInvoiceAction(invoiceId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const profile = await requireStaff();
    const supabase = await createClient();

    let query = supabase
      .from("invoices")
      .update({ status: "issued" })
      .eq("id", invoiceId)
      .eq("status", "draft");

    if (profile.organization_id) {
      query = query.eq("organization_id", profile.organization_id);
    }

    const { error } = await query;
    if (error) return { success: false, error: error.message };

    revalidatePath("/billing/invoices");
    revalidatePath(`/billing/invoices/${invoiceId}`);
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to issue invoice." };
  }
}

export interface UpdateDraftInvoiceInput {
  invoiceId: string;
  items: Array<{ description: string; quantity: number; unitPrice: number }>;
  discountAmount?: number;
  taxAmount?: number;
  notes?: string | null;
  status: "draft" | "issued" | "partially_paid" | "paid";
  paidAmount?: number;
  paymentMethod?: "cash" | "card" | "bank_transfer" | "other";
  paymentReference?: string;
}

/**
 * Updates a Draft invoice with edited procedure items, discount, and settlement status.
 * If status is changed to Paid or Part Paid, records the payment.
 */
export async function updateDraftInvoiceAction(
  input: UpdateDraftInvoiceInput,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const profile = await requireStaff();
    const supabase = await createClient();

    // 1. Verify invoice is draft
    let invoiceQuery = supabase
      .from("invoices")
      .select("id, status, patient_id")
      .eq("id", input.invoiceId);

    if (profile.organization_id) {
      invoiceQuery = invoiceQuery.eq("organization_id", profile.organization_id);
    }

    const { data: inv, error: invError } = await invoiceQuery.single();
    if (invError || !inv) {
      return { success: false, error: "Invoice not found or unauthorized." };
    }

    if (inv.status !== "draft") {
      return { success: false, error: "Only Draft invoices can be edited." };
    }

    const items = input.items.filter((item) => item.description.trim().length > 0);
    if (items.length === 0) {
      return { success: false, error: "At least one item line is required." };
    }

    const subtotal = items.reduce(
      (sum, item) => sum + Math.max(1, Number(item.quantity || 1)) * Math.max(0, Number(item.unitPrice || 0)),
      0,
    );
    const discountAmount = Math.max(0, Number(input.discountAmount || 0));
    const taxAmount = Math.max(0, Number(input.taxAmount || 0));
    const total = Math.max(0, subtotal + taxAmount - discountAmount);

    // 2. Update Invoice
    let updateQuery = supabase
      .from("invoices")
      .update({
        subtotal,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        total,
        status: input.status,
        notes: input.notes ?? null,
      })
      .eq("id", input.invoiceId);

    if (profile.organization_id) {
      updateQuery = updateQuery.eq("organization_id", profile.organization_id);
    }

    const { error: updateError } = await updateQuery;
    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // 3. Delete old items and insert updated items
    await supabase.from("invoice_items").delete().eq("invoice_id", input.invoiceId);

    const { error: insertItemsError } = await supabase.from("invoice_items").insert(
      items.map((item) => ({
        invoice_id: input.invoiceId,
        description: item.description.trim(),
        quantity: Math.max(1, Number(item.quantity || 1)),
        unit_price: Math.max(0, Number(item.unitPrice || 0)),
        line_total: Math.max(1, Number(item.quantity || 1)) * Math.max(0, Number(item.unitPrice || 0)),
      })),
    );

    if (insertItemsError) {
      console.error("Failed to insert updated invoice items:", insertItemsError);
    }

    // 4. If Paid or Part Paid, record payment
    const paymentAmount =
      input.status === "paid"
        ? total
        : input.status === "partially_paid"
          ? Math.min(total, Math.max(0, Number(input.paidAmount || 0)))
          : 0;

    if (paymentAmount > 0) {
      const { error: payError } = await supabase.from("payments").insert({
        invoice_id: input.invoiceId,
        amount: paymentAmount,
        method: input.paymentMethod || "card",
        reference: input.paymentReference || (input.status === "paid" ? "Paid in full at checkout" : "Deposit recorded"),
        recorded_by_staff_id: profile.id,
      });

      if (payError) {
        console.error("Failed to record payment:", payError);
      }
    }

    revalidatePath("/billing/invoices");
    revalidatePath(`/billing/invoices/${input.invoiceId}`);
    revalidatePath(`/patients/${inv.patient_id}`);

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to update invoice." };
  }
}

export interface CreateInstantEncounterInvoiceInput {
  patientId: string;
  encounterId?: string | null;
  appointmentId?: string | null;
  procedureName: string;
  unitPrice: number;
  quantity?: number;
  discountAmount?: number;
  taxAmount?: number;
  notes?: string | null;
  status: "draft" | "issued" | "partially_paid" | "paid";
  paidAmount?: number;
  paymentMethod?: "cash" | "card" | "bank_transfer" | "other";
  paymentReference?: string;
}

/**
 * Creates an instant invoice directly from consultation sign-off.
 * Supports "draft" (skipped to front-desk), "issued" (outstanding), "partially_paid", or "paid".
 */
export async function createInstantEncounterInvoiceAction(
  input: CreateInstantEncounterInvoiceInput,
): Promise<{ success: boolean; invoiceId?: string; invoiceNumber?: string; status?: string; error: string | null }> {
  try {
    const profile = await requireStaff();
    if (!profile.organization_id) {
      return { success: false, error: "Missing organization profile." };
    }

    const quantity = Math.max(1, Number(input.quantity ?? 1));
    const unitPrice = Math.max(0, Number(input.unitPrice ?? 0));
    const discountAmount = Math.max(0, Number(input.discountAmount ?? 0));
    const taxAmount = Math.max(0, Number(input.taxAmount ?? 0));
    const subtotal = quantity * unitPrice;
    const total = Math.max(0, subtotal + taxAmount - discountAmount);

    const supabase = await createClient();
    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
    const today = new Date().toISOString().slice(0, 10);

    // 1. Insert Invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        organization_id: profile.organization_id,
        patient_id: input.patientId,
        invoice_number: invoiceNumber,
        issue_date: today,
        due_date: today,
        status: input.status,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total,
        notes: input.notes || (input.status === "draft" ? "Created from clinical consultation (Pending front-desk checkout)" : "Created at clinical consultation"),
        created_by_staff_id: profile.id,
      })
      .select("id")
      .single();

    if (invoiceError || !invoice) {
      console.error("Failed to create invoice:", invoiceError);
      return { success: false, error: invoiceError?.message ?? "Could not generate invoice." };
    }

    // 2. Insert Invoice Item Line
    const { error: itemError } = await supabase.from("invoice_items").insert({
      invoice_id: invoice.id,
      description: input.procedureName || "Clinical Consultation & Treatment",
      quantity,
      unit_price: unitPrice,
      line_total: subtotal,
    });

    if (itemError) {
      console.error("Failed to insert invoice items:", itemError);
    }

    // 3. If Paid or Part-Paid, record initial payment
    const paymentAmount =
      input.status === "paid"
        ? total
        : input.status === "partially_paid"
          ? Math.min(total, Math.max(0, Number(input.paidAmount ?? 0)))
          : 0;

    if (paymentAmount > 0) {
      const { error: payError } = await supabase.from("payments").insert({
        invoice_id: invoice.id,
        amount: paymentAmount,
        method: input.paymentMethod || "card",
        reference: input.paymentReference || (input.status === "paid" ? "Paid chairside at consultation" : "Partial deposit at consultation"),
        recorded_by_staff_id: profile.id,
      });

      if (payError) {
        console.error("Failed to record payment:", payError);
      }
    }

    revalidatePath("/billing/invoices");
    revalidatePath(`/patients/${input.patientId}`);
    if (input.encounterId) {
      revalidatePath(`/clinical/encounters/${input.encounterId}`);
    }

    return {
      success: true,
      invoiceId: invoice.id,
      invoiceNumber,
      status: input.status,
      error: null,
    };
  } catch (err) {
    console.error("createInstantEncounterInvoiceAction error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create invoice.",
    };
  }
}

/**
 * Marks an invoice as Void (cancelled/invalidated with audit trail preserved).
 */
export async function voidInvoiceAction(input: {
  invoiceId: string;
  reason?: string;
}): Promise<{ success: boolean; error: string | null }> {
  try {
    const profile = await requireStaff();
    const supabase = await createClient();

    let query = supabase
      .from("invoices")
      .select("id, status, invoice_number, patient_id")
      .eq("id", input.invoiceId);

    if (profile.organization_id) {
      query = query.eq("organization_id", profile.organization_id);
    }

    const { data: invoice } = await query.single();
    if (!invoice) return { success: false, error: "Invoice not found or unauthorized." };
    if (invoice.status === "void") return { success: false, error: "Invoice is already void." };

    let updateQuery = supabase
      .from("invoices")
      .update({
        status: "void",
        notes: input.reason ? `VOIDED: ${input.reason}` : "Invoice voided by clinic staff.",
      })
      .eq("id", input.invoiceId);

    if (profile.organization_id) {
      updateQuery = updateQuery.eq("organization_id", profile.organization_id);
    }

    const { error: updateError } = await updateQuery;
    if (updateError) return { success: false, error: updateError.message };

    revalidatePath("/billing/invoices");
    revalidatePath(`/billing/invoices/${input.invoiceId}`);
    revalidatePath(`/patients/${invoice.patient_id}`);

    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to void invoice.",
    };
  }
}

