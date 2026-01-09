// FILE: electron/src/printers/billPrintService.ts
/// ANCHOR: BillPrintService
import { BrowserWindow, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { renderBillTemplate } from '../services/templateRenderer';
import { getBillById } from '../services/billService';
import { getDefaultBillTemplate, listBillTemplates } from '../services/billTemplateService';

export interface PrintBillOptions {
  billId: number;
  templateId?: number;
  outputPath?: string;
  silent?: boolean;
  printToPDF?: boolean;
}

export const printBill = async (options: PrintBillOptions): Promise<string> => {
  const { billId, templateId, outputPath, silent = false, printToPDF = true } = options;

  // Get bill and template
  const bill = await getBillById(billId);
  if (!bill) {
    throw new Error('Bill not found');
  }

  // Check GST compliance before printing
  const { canPrintBill } = await import('../services/gstComplianceService');
  const printCheck = await canPrintBill(billId);
  if (!printCheck.canPrint) {
    throw new Error(`Cannot print bill: ${printCheck.reason}`);
  }

  // Prioritize passed templateId, then bill's templateId, then default
  let finalTemplateId = templateId;
  if (!finalTemplateId && bill.templateId) {
    finalTemplateId = bill.templateId;
  }
  if (!finalTemplateId) {
    const defaultTemplate = await getDefaultBillTemplate('A4');
    if (!defaultTemplate) {
      // Fallback: get first available template
      const templates = await listBillTemplates({ templateType: 'A4' });
      if (templates.length === 0) {
        throw new Error('No template found');
      }
      finalTemplateId = templates[0].id;
    } else {
      finalTemplateId = defaultTemplate.id;
    }
  }

  // Render template
  const html = await renderBillTemplate(finalTemplateId, billId);

  if (printToPDF) {
    // Generate PDF using printToPDF
    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    try {
      // Load HTML
      await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate PDF
      const pdfPath = outputPath || path.join(
        app.getPath('documents'),
        'bills',
        `${bill.billNumber}-${Date.now()}.pdf`
      );

      // Ensure directory exists
      const pdfDir = path.dirname(pdfPath);
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      const pdfData = await printWindow.webContents.printToPDF({
        margins: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0
        },
        printBackground: true,
        landscape: false,
        pageSize: 'A4'
      });

      fs.writeFileSync(pdfPath, pdfData);
      return pdfPath;
    } finally {
      printWindow.close();
    }
  } else {
    // Print to printer
    const printWindow = new BrowserWindow({
      show: !silent,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    try {
      await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
      await new Promise(resolve => setTimeout(resolve, 500));

      await printWindow.webContents.print({
        silent,
        printBackground: true,
        margins: {
          marginType: 'none'
        }
      });

      // Return empty string for printer output
      return '';
    } finally {
      if (silent) {
        printWindow.close();
      }
    }
  }
};

export const previewBill = async (billId: number, templateId?: number): Promise<string> => {
  const bill = await getBillById(billId);
  if (!bill) {
    throw new Error('Bill not found');
  }

  // Check GST compliance before preview (warn but don't block)
  const { validateBillGSTCompliance } = await import('../services/gstComplianceService');
  const gstValidation = await validateBillGSTCompliance(billId);
  if (!gstValidation.compliant) {
    console.warn('GST compliance errors (preview allowed):', gstValidation.errors);
  }

  // Prioritize passed templateId, then bill's templateId, then default
  let finalTemplateId = templateId;
  if (!finalTemplateId && bill.templateId) {
    finalTemplateId = bill.templateId;
  }
  if (!finalTemplateId) {
    const defaultTemplate = await getDefaultBillTemplate('A4');
    if (!defaultTemplate) {
      const templates = await listBillTemplates({ templateType: 'A4' });
      if (templates.length === 0) {
        throw new Error('No template found');
      }
      finalTemplateId = templates[0].id;
    } else {
      finalTemplateId = defaultTemplate.id;
    }
  }

  return await renderBillTemplate(finalTemplateId, billId);
};

