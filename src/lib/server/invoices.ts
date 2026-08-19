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
