/**
 * Generates an official, standard UK Dental Clinic Invoice & Patient Statement HTML
 * and triggers immediate native browser printing via a clean print window/iframe.
 */

export interface PrintInvoicePayload {
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string | null;
  status: string;
  patientName: string;
  patientPhone?: string | null;
  patientRef?: string | null;
  subtotal: number;
  discountAmount: number;
  total: number;
  totalPaid: number;
  balance: number;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  payments?: Array<{
    date: string;
    method: string;
    amount: number;
  }>;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function generateUKInvoiceHtml(data: PrintInvoicePayload): string {
  const isPaid = data.balance <= 0.01;
  const statusLabel = isPaid ? "PAID IN FULL" : `OUTSTANDING: ${formatCurrency(data.balance)}`;
  const statusColor = isPaid ? "#065f46" : "#92400e";
  const statusBg = isPaid ? "#d1fae5" : "#fef3c7";
  const statusBorder = isPaid ? "#6ee7b7" : "#fde68a";

  const itemsRows = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">${item.description}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #475569; font-family: monospace;">${item.quantity}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #475569; font-family: monospace;">${formatCurrency(item.unitPrice)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #0f172a; font-family: monospace;">${formatCurrency(item.lineTotal)}</td>
      </tr>
    `,
    )
    .join("");

  const paymentsSection =
    data.payments && data.payments.length > 0
      ? `
      <div style="margin-top: 24px;">
        <h3 style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; margin: 0 0 8px 0;">
          Receipts &amp; Payments Schedule
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background-color: #f8fafc; border-bottom: 1px solid #cbd5e1; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #475569;">
              <th style="padding: 8px 12px; text-align: left;">Date Received</th>
              <th style="padding: 8px 12px; text-align: left;">Payment Method</th>
              <th style="padding: 8px 12px; text-align: right;">Amount Received</th>
            </tr>
          </thead>
          <tbody>
            ${data.payments
              .map(
                (p) => `
              <tr>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-family: monospace; color: #475569;">${p.date}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a; text-transform: capitalize;">${p.method.replace("_", " ")}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 800; color: #065f46; font-family: monospace;">${formatCurrency(p.amount)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `
      : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice Statement - ${data.invoiceNumber}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 20px;
      font-size: 12px;
      line-height: 1.5;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
  </style>
</head>
<body>
  <!-- Header & Clinic Brand -->
  <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 18px; margin-bottom: 20px;">
    <div>
      <h1 style="font-size: 20px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.02em; margin: 0; color: #0f172a;">
        Clinic Care Dental
      </h1>
      <p style="font-size: 11px; font-weight: 700; color: #0B3B36; margin: 2px 0 0 0;">
        Private Dental Practice
      </p>
      <p style="font-size: 10px; color: #64748b; margin: 6px 0 0 0; line-height: 1.45;">
        42 King Street, Manchester, M2 6BA, United Kingdom<br />
        Tel: +44 1632 960123 &bull; Email: accounts@cliniccare.example
      </p>
    </div>

    <div style="text-align: right;">
      <div style="display: inline-block; border: 2px solid #0f172a; padding: 4px 12px; border-radius: 6px; margin-bottom: 6px;">
        <span style="font-size: 11px; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; color: #0f172a;">
          INVOICE &bull; STATEMENT
        </span>
      </div>
      <div style="font-family: monospace; font-size: 14px; font-weight: 800; color: #0f172a;">${data.invoiceNumber}</div>
      <div style="font-size: 11px; color: #475569; margin-top: 2px;">
        Issue Date: <strong>${data.issueDate}</strong>
      </div>
      ${data.dueDate ? `<div style="font-size: 11px; color: #475569;">Due Date: <strong>${data.dueDate}</strong></div>` : ""}
    </div>
  </div>

  <!-- Patient & Settlement Meta Banner -->
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background-color: #f8fafc; padding: 14px 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
    <div>
      <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; display: block; margin-bottom: 2px;">
        Billed To Patient:
      </span>
      <div style="font-size: 14px; font-weight: 800; color: #0f172a;">${data.patientName}</div>
      ${data.patientPhone ? `<div style="font-size: 11px; color: #475569; margin-top: 2px;">Tel: ${data.patientPhone}</div>` : ""}
      ${data.patientRef ? `<div style="font-size: 10px; font-family: monospace; color: #64748b; margin-top: 2px;">Patient Ref: ${data.patientRef}</div>` : ""}
    </div>

    <div style="text-align: right; display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end;">
      <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b;">
        Settlement Status:
      </span>
      <div style="display: inline-block; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; background-color: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusBorder};">
        ${statusLabel}
      </div>
    </div>
  </div>

  <!-- Itemised Clinical Treatments Table -->
  <div style="margin-bottom: 20px;">
    <h3 style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; margin: 0 0 8px 0;">
      Itemised Clinical Treatments &amp; Dental Services
    </h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
      <thead>
        <tr style="background-color: #f8fafc; border-bottom: 1px solid #cbd5e1; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #475569;">
          <th style="padding: 10px 12px; text-align: left;">Description of Clinical Service</th>
          <th style="padding: 10px 12px; text-align: center; width: 60px;">Qty</th>
          <th style="padding: 10px 12px; text-align: right; width: 110px;">Unit Rate</th>
          <th style="padding: 10px 12px; text-align: right; width: 110px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>
  </div>

  <!-- Financial Calculation Summary Box -->
  <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
    <div style="width: 300px; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 14px; font-size: 12px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #475569;">
        <span>Subtotal:</span>
        <span style="font-family: monospace; font-weight: 600;">${formatCurrency(data.subtotal)}</span>
      </div>
      ${
        data.discountAmount > 0
          ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #065f46; font-weight: 600;">
          <span>Clinician Discount:</span>
          <span style="font-family: monospace;">-${formatCurrency(data.discountAmount)}</span>
        </div>
      `
          : ""
      }
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #64748b; font-size: 10px;">
        <span>VAT (Exempt - Healthcare):</span>
        <span style="font-family: monospace;">£0.00</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding-top: 6px; border-top: 1px solid #cbd5e1; font-weight: 800; font-size: 13px; color: #0f172a;">
        <span>Total Amount Due:</span>
        <span style="font-family: monospace;">${formatCurrency(data.total)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-top: 4px; font-weight: 700; color: #065f46;">
        <span>Total Paid to Date:</span>
        <span style="font-family: monospace;">${formatCurrency(data.totalPaid)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding-top: 6px; margin-top: 6px; border-top: 2px solid #0f172a; font-weight: 900; font-size: 14px; color: #0f172a;">
        <span>Balance Remaining:</span>
        <span style="font-family: monospace;">${formatCurrency(data.balance)}</span>
      </div>
    </div>
  </div>

  ${paymentsSection}

  <!-- Payment and patient-record information -->
  <div style="border-top: 2px solid #cbd5e1; padding-top: 14px; margin-top: 28px; font-size: 10px; color: #64748b; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; line-height: 1.45;">
    <div>
      <p style="font-weight: 800; text-transform: uppercase; color: #334155; margin: 0 0 4px 0;">Payment information:</p>
      <p style="margin: 0;">Use <strong>${data.invoiceNumber}</strong> as the payment reference.</p>
      <p style="margin: 0;">Contact reception for the practice&apos;s secure payment instructions.</p>
    </div>
    <div>
      <p style="font-weight: 800; text-transform: uppercase; color: #334155; margin: 0 0 4px 0;">Patient record:</p>
      <p style="margin: 0;">
        This statement contains personal information about dental care and should be stored securely.<br />
        Please contact the practice if any treatment, payment or patient detail is incorrect.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

export function printInvoiceStatement(payload: PrintInvoicePayload) {
  const html = generateUKInvoiceHtml(payload);

  // Use a hidden iframe for instant, reliable, cross-browser printing
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.visibility = "hidden";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();

    // Allow fonts and layout to settle then print
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error("Print invocation error:", err);
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }
    }, 150);
  }
}
