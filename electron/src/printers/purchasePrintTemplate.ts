// FILE: electron/src/printers/purchasePrintTemplate.ts
/// ANCHOR: PurchasePrintTemplate
import type { PurchaseInvoiceDTO } from '../../../shared/ipc';

export const buildPurchaseHtml = (invoice: PurchaseInvoiceDTO) => {
  const rows = invoice.items
    .map(
      (item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item.productName}</td>
          <td>${item.batchNumber ?? '-'}</td>
          <td>${item.quantity}</td>
          <td>${item.freeQuantity}</td>
          <td>${item.costPrice.toFixed(2)}</td>
          <td>${item.taxPercent.toFixed(2)}</td>
          <td>${item.lineTotal.toFixed(2)}</td>
        </tr>`
    )
    .join('');

  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
          h1 { margin-bottom: 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #cbd5f5; padding: 6px; font-size: 12px; text-align: left; }
          th { background: #f8fafc; }
          .totals { margin-top: 16px; text-align: right; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Goods Receipt Note</h1>
        <p>
          Invoice #: ${invoice.invoiceNumber}<br/>
          Supplier: ${invoice.supplierName}<br/>
          Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}
        </p>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Product</th>
              <th>Batch</th>
              <th>Qty</th>
              <th>Free</th>
              <th>Cost</th>
              <th>GST%</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p class="totals">Grand Total: ₹${invoice.totalAmount.toFixed(2)}</p>
      </body>
    </html>
  `;
};

