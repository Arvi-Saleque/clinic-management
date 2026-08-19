import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";

interface InvoiceDetailProps {
  invoice: {
    invoice_number: string;
    status: string;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total: number;
    issue_date: string;
    due_date: string | null;
    notes: string | null;
    patients: { first_name: string; last_name: string; phone: string | null } | null;
  };
  items: { id: string; description: string; quantity: number; unit_price: number; line_total: number }[];
  payments: { id: string; amount: number; method: string; paid_at: string; reference: string | null }[];
  children?: React.ReactNode;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  issued: "secondary",
  partially_paid: "secondary",
  paid: "default",
  void: "destructive",
};

export function InvoiceDetail({ invoice, items, payments, children }: InvoiceDetailProps) {
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = Number(invoice.total) - totalPaid;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>{invoice.invoice_number}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {invoice.patients ? `${invoice.patients.first_name} ${invoice.patients.last_name}` : ""} &middot;{" "}
              {invoice.issue_date}
              {invoice.due_date ? ` · Due ${invoice.due_date}` : ""}
            </p>
          </div>
          <Badge variant={STATUS_VARIANT[invoice.status] ?? "outline"} className="capitalize">
            {invoice.status.replace("_", " ")}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-3 font-medium">Description</th>
                  <th className="p-3 font-medium">Qty</th>
                  <th className="p-3 font-medium">Unit price</th>
                  <th className="p-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="p-3">{item.description}</td>
                    <td className="p-3">{item.quantity}</td>
                    <td className="p-3">{formatCurrency(item.unit_price)}</td>
                    <td className="p-3 text-right">{formatCurrency(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ml-auto max-w-xs space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {Number(invoice.tax_amount) > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span>{formatCurrency(invoice.tax_amount)}</span>
              </div>
            )}
            {Number(invoice.discount_amount) > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Discount</span>
                <span>-{formatCurrency(invoice.discount_amount)}</span>
              </div>
            )}
            <Separator className="my-1" />
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Paid</span>
              <span>{formatCurrency(totalPaid)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Balance</span>
              <span>{formatCurrency(balance)}</span>
            </div>
          </div>

          {invoice.notes && <p className="text-sm text-muted-foreground">{invoice.notes}</p>}
        </CardContent>
      </Card>

      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="flex justify-between text-sm">
                <span className="capitalize text-muted-foreground">
                  {p.method === "other" ? "Other" : p.method.replace("_", " ")} &middot; {new Date(p.paid_at).toLocaleDateString()}
                  {p.reference ? ` · ${p.reference}` : ""}
                </span>
                <span className="font-medium">{formatCurrency(p.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {children}
    </div>
  );
}
