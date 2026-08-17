"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/guards";
import { getUser } from "@/lib/auth/session";
import { createInvoiceSchema, recordPaymentSchema } from "@/lib/validation/invoice";

export type InvoiceActionState = { error: string | null };

function firstIssue(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Invalid input";
}

/** Staff only. Builds subtotal/total from line items and inserts invoice + invoice_items in one go. */
export async function createInvoiceAction(
  _prev: InvoiceActionState,
  formData: FormData,
): Promise<InvoiceActionState> {
  const profile = await requireStaff();

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

  const { data: invoice } = await supabase
    .from("invoices")
    .select("total")
    .eq("id", invoiceId)
    .single();
  if (!invoice) return { error: "Invoice not found." };

  const { error: paymentError } = await supabase.from("payments").insert({
    invoice_id: invoiceId,
    amount: input.amount,
    method: input.method,
    reference: input.reference || null,
    recorded_by_staff_id: profile.id,
  });
  if (paymentError) return { error: paymentError.message };

  const { data: payments } = await supabase
    .from("payments")
    .select("amount")
    .eq("invoice_id", invoiceId);
  const totalPaid = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const nextStatus = totalPaid >= Number(invoice.total) ? "paid" : "partially_paid";

  await supabase.from("invoices").update({ status: nextStatus }).eq("id", invoiceId);

  revalidatePath(`/billing/invoices/${invoiceId}`);
  return { error: null };
}

export async function getOwnPatientId() {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("patients").select("id").eq("profile_id", user.id).maybeSingle();
  return data?.id ?? null;
}
