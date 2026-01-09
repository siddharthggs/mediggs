// FILE: electron/src/printers/salesPrintTemplate.ts
/// ANCHOR: SalesPrintTemplate
import type { SalesInvoiceDTO } from '../../../shared/ipc';

export const buildSalesHtml = (invoice: SalesInvoiceDTO) => {
  const rows = invoice.items
    .map(
      (item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item.productName}</td>
          <td>${item.batchNumber ?? '-'}</td>
          <td>${item.quantity}</td>
          <td>${item.mrp.toFixed(2)}</td>
          <td>${item.salePrice.toFixed(2)}</td>
          <td>${item.taxPercent.toFixed(2)}</td>
          <td>${item.discountPercent.toFixed(2)}</td>
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
        <h1>Tax Invoice</h1>
        <p>
          Invoice #: ${invoice.invoiceNumber}<br/>
          Customer: ${invoice.customerName}<br/>
          Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}
        </p>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Product</th>
              <th>Batch</th>
              <th>Qty</th>
              <th>MRP</th>
              <th>Price</th>
              <th>GST%</th>
              <th>Disc%</th>
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

