// FILE: electron/src/printers/printService.ts
/// ANCHOR: PrintService
import { BrowserWindow } from 'electron';
import type { PurchaseInvoiceDTO, SalesInvoiceDTO } from '../../../shared/ipc';
import { buildPurchaseHtml } from './purchasePrintTemplate';
import { buildSalesHtml } from './salesPrintTemplate';

export const printHtml = async (
  window: BrowserWindow,
  options: Electron.WebContentsPrintOptions = {}
) => {
  await window.webContents.print(options);
};

export const printPurchaseInvoice = async (
  window: BrowserWindow,
  invoice: PurchaseInvoiceDTO
) => {
  const html = buildPurchaseHtml(invoice);
  const printView = new BrowserWindow({ show: false });
  await printView.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  await printView.webContents.print({});
  printView.close();
};

export const printSalesInvoice = async (
  window: BrowserWindow,
  invoice: SalesInvoiceDTO
) => {
  const html = buildSalesHtml(invoice);
  const printView = new BrowserWindow({ show: false });
  await printView.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  await printView.webContents.print({});
  printView.close();
};

