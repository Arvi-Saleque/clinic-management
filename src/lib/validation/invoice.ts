import { z } from "zod";

export const invoiceItemSchema = z.object({
  description: z.string().trim().min(1, "Description is required"),
  quantity: z.coerce.number().positive("Must be greater than 0"),
  unitPrice: z.coerce.number().min(0, "Cannot be negative"),
});
export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;

export const createInvoiceSchema = z.object({
  patientId: z.string().uuid("Select a patient"),
  dueDate: z.string().optional(),
  discountAmount: z.coerce.number().min(0).default(0),
  taxAmount: z.coerce.number().min(0).default(0),
  notes: z.string().trim().optional(),
  items: z.array(invoiceItemSchema).min(1, "Add at least one line item"),
});
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const recordPaymentSchema = z.object({
  amount: z.coerce.number().positive("Enter a valid amount"),
  method: z.enum(["cash", "card", "bank_transfer", "other"]),
  reference: z.string().trim().optional(),
});
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
