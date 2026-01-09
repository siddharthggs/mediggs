// FILE: electron/src/ipcHandlers/index.ts
/// ANCHOR: IpcHandlers
import { ipcMain } from 'electron';
import type { IpcMainInvokeEvent } from 'electron';
import type { IpcChannel, IpcChannelMap } from '../../../shared/ipc';
import { wrapIpcHandler, safeDbOperation, getUserFriendlyError } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { ensureDefaultAdmin, authenticateUser, getUserIdFromToken } from '../services/authService';
import { requirePermission, requireAdmin, hasPermission } from '../services/permissionService';
import {
  getStockSnapshot,
  getStockMovements,
  getExpiringBatches,
  getStockKPIs,
  getStockAlerts,
  getStockMovementChartData
} from '../services/stockService';
import { getDashboardSummary } from '../services/dashboardService';
import { listRoles } from '../services/userService';
import {
  getSalesReport,
  getPurchaseReport,
  getProfitLossReport
} from '../services/reportService';
import { exportBackup, importBackup, createBackup, listBackups, restoreBackup, verifyBackupIntegrity } from '../services/backupService';
import {
  queueEInvoice,
  listEInvoiceQueue,
  syncEInvoiceQueue
} from '../services/eInvoiceService';
import {
  getCompanyInfo,
  saveCompanyInfo
} from '../services/companyInfoService';
import {
  listGodowns,
  createGodown,
  updateGodown,
  deleteGodown
} from '../services/godownService';
import {
  listBatches,
  getBatchById,
  createBatch,
  updateBatch,
  deleteBatch
} from '../services/batchService';
import {
  createProduct,
  listProducts,
  getProductById,
  updateProduct,
  deleteProduct
} from '../services/productService';
import {
  listCustomers,
  createCustomer,
  getCustomerById,
  updateCustomer,
  deleteCustomer
} from '../services/customerService';
import {
  listSuppliers,
  createSupplier,
  getSupplierById,
  updateSupplier,
  deleteSupplier
} from '../services/supplierService';
import {
  listUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser
} from '../services/userService';
import {
  createScheme,
  listSchemes,
  updateScheme,
  deleteScheme
} from '../services/schemeService';
import {
  createPurchaseInvoice,
  listPurchaseInvoices,
  getPurchaseInvoiceById,
  deletePurchaseInvoice
} from '../services/invoiceService';
import {
  createSalesInvoice,
  listSalesInvoices,
  getSalesInvoiceById,
  deleteSalesInvoice
} from '../services/salesService';
import {
  createCreditNote,
  listCreditNotes,
  getCreditNoteById
} from '../services/creditNoteService';
import {
  createPayment,
  listPayments,
  updatePayment,
  markChequeCleared,
  markChequeBounced,
  deletePayment
} from '../services/paymentService';
import {
  listMRs,
  createMR,
  getMRById,
  updateMR,
  deleteMR
} from '../services/mrService';
import {
  listDoctors,
  createDoctor,
  getDoctorById,
  updateDoctor,
  deleteDoctor
} from '../services/doctorService';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  listCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  listSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  listStorageTypes,
  createStorageType,
  updateStorageType,
  deleteStorageType
} from '../services/categoryService';
import {
  globalSearch
} from '../services/globalSearchService';
import {
  searchByBarcode
} from '../services/barcodeSearchService';
import {
  createExpiryReturn,
  listExpiryReturns,
  getExpiryReturnById,
  getExpiryLossReport
} from '../services/expiryReturnService';
import {
  listNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
} from '../services/notificationService';
import { transferBatch } from '../services/batchTransferService';
import {
  getStockReport,
  getCustomerReport,
  getSupplierReport
} from '../services/reportService';
import { generateInvoicePDF } from '../services/pdfService';
import {
  importProducts,
  importCustomers,
  importSuppliers
} from '../services/importService';
import {
  checkLowStock,
  checkExpiringBatches,
  runAllChecks,
  cleanupOldNotifications
} from '../services/backgroundJobService';
import {
  createBill,
  updateBill,
  getBillById,
  listBills,
  finalizeBill,
  cancelBill,
  deleteBill
} from '../services/billService';
import {
  listBillTemplates,
  getBillTemplateById,
  createBillTemplate,
  updateBillTemplate,
  deleteBillTemplate,
  setDefaultBillTemplate,
  cloneBillTemplate,
  initializeDefaultTemplate
} from '../services/billTemplateService';
import { renderBillTemplate } from '../services/templateRenderer';
import { printBill, previewBill } from '../printers/billPrintService';
import {
  createBillPayment,
  listBillPayments,
  deleteBillPayment,
  markBillChequeCleared,
  markBillChequeBounced
} from '../services/billPaymentService';
import {
  listTemplatesHandler,
  loadTemplateHandler,
  saveTemplateHandler,
  renderTemplateHandler,
  printTemplateHandler
} from '../services/templateService';

type Handler<T extends IpcChannel> = (
  payload: IpcChannelMap[T]['request']
) => Promise<IpcChannelMap[T]['response']>;

// Helper to extract userId from payload (if present) or token
const getUserId = (payload: any): number | null => {
  if (payload?.userId) return payload.userId;
  if (payload?.token) return getUserIdFromToken(payload.token);
  return null;
};

// Permission wrapper for handlers
const withPermission = <T extends IpcChannel>(
  channel: T,
  handler: Handler<T>,
  permission?: string,
  disposers?: Array<() => void>,
  timeout: number = 30000
) => {
  const wrapped = async (_event: IpcMainInvokeEvent, payload: unknown) => {
    try {
      const p = payload as any;

      // Extract userId
      const userId = getUserId(p);
      if (!userId && permission) {
        throw new Error('Authentication required');
      }

      // Check permission if specified
      if (permission && userId) {
        await requirePermission(userId, permission as any);
      }

      // Wrap handler with error handling and timeout
      const safeHandler = async (rawPayload: IpcChannelMap[T]['request']) => {
        // Ensure userId is available to the handler even if it was only present in the token
        const payloadWithUserId = (userId && !(rawPayload as any)?.userId)
          ? ({ ...(rawPayload as any), userId } as IpcChannelMap[T]['request'])
          : rawPayload;

        return await safeDbOperation(
          () => handler(payloadWithUserId),
          { operation: channel, userId: userId || undefined }
        );
      };

      return await wrapIpcHandler(safeHandler, channel, timeout)(
        _event,
        payload as IpcChannelMap[T]['request']
      );
    } catch (error) {
      logger.error(`[IPC Error] ${channel}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        payload: payload
      });
      const friendlyError = getUserFriendlyError(error);
      throw new Error(friendlyError);
    }
  };
  ipcMain.handle(channel, wrapped);
  if (disposers) {
    disposers.push(() => ipcMain.removeHandler(channel));
  }
};

const register = <T extends IpcChannel>(
  channel: T,
  handler: Handler<T>,
  disposers: Array<() => void>,
  timeout: number = 30000
) => {
  const wrapped = async (_event: IpcMainInvokeEvent, payload: unknown) => {
    try {
      // Wrap handler with error handling, timeout, and database safety
      const safeHandler = async (p: IpcChannelMap[T]['request']) => {
        return await safeDbOperation(
          () => handler(p),
          { operation: channel }
        );
      };

      return await wrapIpcHandler(safeHandler, channel, timeout)(
        _event,
        payload as IpcChannelMap[T]['request']
      );
    } catch (error) {
      logger.error(`[IPC Error] ${channel}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        payload: payload
      });
      const friendlyError = getUserFriendlyError(error);
      throw new Error(friendlyError);
    }
  };
  ipcMain.handle(channel, wrapped);
  disposers.push(() => ipcMain.removeHandler(channel));
};

export const registerIpcHandlers = async () => {
  const disposers: Array<() => void> = [];

  try {
    console.log('Starting IPC handler registration...');
    await ensureDefaultAdmin();
    console.log('Default admin ensured');
  } catch (error) {
    console.error('Failed to ensure default admin:', error);
    throw error;
  }

  register('ipc.auth.login', authenticateUser, disposers);
  
  // Security handlers
  register('ipc.security.getSettings', async () => {
    const { getSecuritySettings } = await import('../services/securityService');
    return getSecuritySettings();
  }, disposers);
  register('ipc.security.updateSettings', async (settings) => {
    const { updateSecuritySettings } = await import('../services/securityService');
    return updateSecuritySettings(settings);
  }, disposers);
  register('ipc.security.trackActivity', async ({ userId }) => {
    const { trackSessionActivity } = await import('../services/securityService');
    trackSessionActivity(userId);
    return { success: true };
  }, disposers);
  register('ipc.security.checkSession', async ({ userId }) => {
    const { isSessionValid, getSessionInfo } = await import('../services/securityService');
    const valid = isSessionValid(userId);
    const info = getSessionInfo(userId);
    // IPC type expects `info` to be optional rather than nullable
    return info ? { valid, info } : { valid };
  }, disposers);
  register('ipc.security.clearSession', async ({ userId }) => {
    const { clearSession } = await import('../services/securityService');
    clearSession(userId);
    return { success: true };
  }, disposers);
  
  // Diagnostics handlers
  register('ipc.diagnostics.getInfo', async () => {
    const { getDiagnosticInfo } = await import('../services/diagnosticsService');
    return getDiagnosticInfo();
  }, disposers);
  register('ipc.diagnostics.exportLogs', async ({ outputPath }) => {
    const { exportLogs } = await import('../services/diagnosticsService');
    return { filePath: await exportLogs(outputPath) };
  }, disposers);
  register('ipc.diagnostics.exportDBSnapshot', async ({ outputPath }) => {
    const { exportDBSnapshot } = await import('../services/diagnosticsService');
    return { filePath: await exportDBSnapshot(outputPath) };
  }, disposers);
  register('ipc.diagnostics.getHealth', async () => {
    const { getSystemHealth } = await import('../services/diagnosticsService');
    return getSystemHealth();
  }, disposers);
  register('ipc.diagnostics.validateDB', async () => {
    const { validateDatabaseIntegrity } = await import('../services/diagnosticsService');
    return validateDatabaseIntegrity();
  }, disposers);
  register('ipc.diagnostics.getReport', async () => {
    const { getDiagnosticReport } = await import('../services/diagnosticsService');
    return getDiagnosticReport();
  }, disposers);
  register('ipc.diagnostics.isSafeMode', async () => {
    const { isSafeMode } = await import('../services/diagnosticsService');
    return { safeMode: isSafeMode() };
  }, disposers);
  register('ipc.diagnostics.isReadOnly', async () => {
    const { isReadOnlyMode } = await import('../services/diagnosticsService');
    return { readOnly: isReadOnlyMode() };
  }, disposers);
  
  // Migration handlers
  register('ipc.migration.getVersion', async () => {
    const { getCurrentSchemaVersion } = await import('../services/migrationService');
    return { version: await getCurrentSchemaVersion() };
  }, disposers);
  register('ipc.migration.getStatus', async () => {
    const { getMigrationStatus } = await import('../services/migrationService');
    // Pass empty array for now - migrations should be defined elsewhere
    return getMigrationStatus([]);
  }, disposers);
  register('ipc.migration.run', async ({ migrations }) => {
    const { runMigrations } = await import('../services/migrationService');
    return runMigrations(migrations || []);
  }, disposers);
  register('ipc.migration.validate', async ({ requiredVersion, migrations }) => {
    const { validateSchemaCompatibility } = await import('../services/migrationService');
    return validateSchemaCompatibility(requiredVersion, migrations || []);
  }, disposers);
  register('ipc.migration.getApplied', async () => {
    const { getAppliedMigrations } = await import('../services/migrationService');
    return getAppliedMigrations();
  }, disposers);
  withPermission('ipc.product.create', createProduct, 'products.create', disposers);
  register('ipc.product.list', listProducts, disposers); // View - all authenticated users
  register('ipc.product.get', ({ id }) => getProductById(id), disposers); // View - all authenticated users
  withPermission('ipc.product.update', ({ id, data }) => updateProduct(id, data), 'products.update', disposers);
  withPermission('ipc.product.delete', async ({ id, userId, reason }) => {
    if (!userId) {
      throw new Error('User ID is required for deletion');
    }
    return deleteProduct(id, userId, reason);
  }, 'products.delete', disposers);
  register('ipc.stock.snapshot', (payload) => getStockSnapshot(payload), disposers);
  register('ipc.stock.kpis', () => getStockKPIs(), disposers);
  register('ipc.stock.alerts', () => getStockAlerts(), disposers);
  register(
    'ipc.stock.movements',
    (payload) => getStockMovements(payload),
    disposers
  );
  register(
    'ipc.stock.movementChart',
    ({ fromDate, toDate }) => getStockMovementChartData(fromDate, toDate),
    disposers
  );
  register(
    'ipc.stock.expiring',
    (payload) => getExpiringBatches(payload),
    disposers
  );
  register('ipc.dashboard.summary', getDashboardSummary, disposers);
  register('ipc.user.list', listUsers, disposers);
  withPermission('ipc.user.create', createUser, 'users.create', disposers);
  withPermission('ipc.user.get', ({ id }) => getUserById(id), 'users.view', disposers);
  withPermission('ipc.user.update', ({ id, data }) => updateUser(id, data), 'users.update', disposers);
  withPermission('ipc.user.delete', ({ id }) => deleteUser(id), 'users.delete', disposers);
  register('ipc.role.list', listRoles, disposers);
  register('ipc.report.sales', getSalesReport, disposers);
  register('ipc.report.purchase', getPurchaseReport, disposers);
  register('ipc.report.profitloss', getProfitLossReport, disposers);
  register(
    'ipc.supplier.list',
    (payload) => listSuppliers(payload?.search),
    disposers
  );
  register('ipc.supplier.create', createSupplier, disposers);
  register('ipc.supplier.get', ({ id }) => getSupplierById(id), disposers);
  register('ipc.supplier.update', ({ id, data }) => updateSupplier(id, data), disposers);
  register('ipc.supplier.delete', ({ id }) => deleteSupplier(id), disposers);
  register('ipc.purchase.create', createPurchaseInvoice, disposers);
  register('ipc.purchase.list', listPurchaseInvoices, disposers);
  register('ipc.purchase.get', ({ id }) => getPurchaseInvoiceById(id), disposers);
  withPermission('ipc.purchase.delete', async ({ id, userId, reason, force }) => {
    if (!userId) {
      throw new Error('User ID is required for deletion');
    }
    // Only ADMIN can force delete paid invoices
    if (force) {
      await requireAdmin(userId, 'Only ADMIN can force delete paid invoices');
    }
    return deletePurchaseInvoice(id, userId, reason, force);
  }, 'bills.delete', disposers);
  register('ipc.sales.create', createSalesInvoice, disposers);
  register('ipc.sales.list', listSalesInvoices, disposers);
  register('ipc.sales.get', ({ id }) => getSalesInvoiceById(id), disposers);
  withPermission('ipc.sales.delete', async ({ id, userId, reason, force }) => {
    if (!userId) {
      throw new Error('User ID is required for deletion');
    }
    // Only ADMIN can force delete finalized invoices
    if (force) {
      await requireAdmin(userId, 'Only ADMIN can force delete finalized invoices');
    }
    return deleteSalesInvoice(id, userId, reason, force);
  }, 'bills.delete', disposers);
  register(
    'ipc.customer.list',
    (payload) => listCustomers(payload?.search),
    disposers
  );
  register('ipc.customer.create', createCustomer, disposers);
  register('ipc.customer.get', ({ id }) => getCustomerById(id), disposers);
  register('ipc.customer.update', ({ id, data }) => updateCustomer(id, data), disposers);
  register('ipc.customer.delete', ({ id }) => deleteCustomer(id), disposers);
  // Enhanced backup handlers
  register('ipc.backup.export', async () => {
    const result = await exportBackup();
    if (!result.success || !result.filePath) {
      throw new Error(result.error || 'Backup export failed');
    }
    return { filePath: result.filePath };
  }, disposers);

  register('ipc.backup.import', async ({ filePath }) => {
    await importBackup(filePath);
    return { filePath };
  }, disposers);

  register('ipc.backup.create', async () => {
    const result = await createBackup();
    return result;
  }, disposers, 120000); // 2 minute timeout for backup creation

  register('ipc.backup.list', async () => {
    return listBackups();
  }, disposers, 30000);

  register('ipc.backup.restore', async ({ filePath, validateBeforeRestore }) => {
    return restoreBackup(filePath, { validateBeforeRestore });
  }, disposers, 300000); // 5 minute timeout for restore

  register('ipc.backup.verify', async ({ filePath }) => {
    return verifyBackupIntegrity(filePath);
  }, disposers, 60000); // 60s timeout for backup verification
  
  // Draft management handlers
  register('ipc.draft.autoSave', async ({ billId, payload, userId }) => {
    const { autoSaveDraft } = await import('../services/draftService');
    return autoSaveDraft(billId, payload, userId);
  }, disposers);

  register('ipc.draft.getRecoverable', async ({ userId }) => {
    const { getRecoverableDrafts } = await import('../services/draftService');
    return getRecoverableDrafts(userId);
  }, disposers);

  register('ipc.draft.cleanup', async () => {
    const { cleanupOldDrafts } = await import('../services/draftService');
    const count = await cleanupOldDrafts();
    return { success: true, count };
  }, disposers);
  register('ipc.einvoice.queue', queueEInvoice, disposers);
  register('ipc.einvoice.list', listEInvoiceQueue, disposers);
  register('ipc.einvoice.sync', syncEInvoiceQueue, disposers);
  register('ipc.creditnote.create', createCreditNote, disposers);
  register('ipc.creditnote.list', listCreditNotes, disposers);
  register('ipc.creditnote.get', ({ id }) => getCreditNoteById(id), disposers);
  register('ipc.scheme.create', createScheme, disposers);
  register('ipc.scheme.list', listSchemes, disposers);
  register('ipc.scheme.update', ({ id, data }) => updateScheme(id, data), disposers);
  register('ipc.scheme.delete', ({ id }) => deleteScheme(id), disposers);
  register('ipc.godown.list', listGodowns, disposers);
  register('ipc.godown.create', createGodown, disposers);
  register('ipc.godown.update', ({ id, data }) => updateGodown(id, data), disposers);
  register('ipc.godown.delete', ({ id }) => deleteGodown(id), disposers);
  register('ipc.batch.list', (payload) => listBatches(payload?.productId), disposers);
  register('ipc.batch.get', ({ id }) => getBatchById(id), disposers);
  register('ipc.batch.create', createBatch, disposers);
  register('ipc.batch.update', ({ id, data }) => updateBatch(id, data), disposers);
  register('ipc.batch.delete', ({ id }) => deleteBatch(id), disposers);
  register('ipc.batch.transfer', transferBatch, disposers);
  withPermission('ipc.payment.create', createPayment, 'payments.create', disposers);
  register('ipc.payment.list', (payload) => listPayments(payload), disposers); // View - all authenticated users
  withPermission('ipc.payment.update', ({ id, data }) => updatePayment(id, data), 'payments.update', disposers);
  withPermission('ipc.payment.markChequeCleared', ({ id }) => markChequeCleared(id), 'payments.update', disposers);
  withPermission('ipc.payment.markChequeBounced', ({ id }) => markChequeBounced(id), 'payments.update', disposers);
  withPermission('ipc.payment.delete', ({ id }) => deletePayment(id), 'payments.delete', disposers);
  register('ipc.mr.list', (payload) => listMRs(payload?.search), disposers);
  register('ipc.mr.create', createMR, disposers);
  register('ipc.mr.get', ({ id }) => getMRById(id), disposers);
  register('ipc.mr.update', ({ id, data }) => updateMR(id, data), disposers);
  register('ipc.mr.delete', ({ id }) => deleteMR(id), disposers);
  register('ipc.doctor.list', (payload) => listDoctors(payload?.search), disposers);
  register('ipc.doctor.create', createDoctor, disposers);
  register('ipc.doctor.get', ({ id }) => getDoctorById(id), disposers);
  register('ipc.doctor.update', ({ id, data }) => updateDoctor(id, data), disposers);
  register('ipc.doctor.delete', ({ id }) => deleteDoctor(id), disposers);
  register('ipc.category.list', () => listCategories(), disposers);
  register('ipc.category.create', createCategory, disposers);
  register('ipc.category.update', ({ id, data }) => updateCategory(id, data), disposers);
  register('ipc.category.delete', ({ id }) => deleteCategory(id), disposers);
  register('ipc.subcategory.list', (payload) => listSubcategories(payload?.categoryId), disposers);
  register('ipc.subcategory.create', createSubcategory, disposers);
  register('ipc.subcategory.update', ({ id, data }) => updateSubcategory(id, data), disposers);
  register('ipc.subcategory.delete', ({ id }) => deleteSubcategory(id), disposers);
  register('ipc.company.list', () => listCompanies(), disposers);
  register('ipc.company.create', createCompany, disposers);
  register('ipc.company.update', ({ id, data }) => updateCompany(id, data), disposers);
  register('ipc.company.delete', ({ id }) => deleteCompany(id), disposers);
  register('ipc.schedule.list', () => listSchedules(), disposers);
  register('ipc.schedule.create', createSchedule, disposers);
  register('ipc.schedule.update', ({ id, data }) => updateSchedule(id, data), disposers);
  register('ipc.schedule.delete', ({ id }) => deleteSchedule(id), disposers);
  register('ipc.scheduleH1.getRegister', async (filters) => {
    const { getScheduleH1Register } = await import('../services/scheduleH1RegisterService');
    return getScheduleH1Register(filters);
  }, disposers);
  register('ipc.scheduleH1.exportCSV', async ({ filters, outputPath }) => {
    const { exportScheduleH1RegisterCSV } = await import('../services/scheduleH1RegisterService');
    return { filePath: await exportScheduleH1RegisterCSV(filters, outputPath) };
  }, disposers, 60000);
  register('ipc.scheduleH1.exportPDF', async ({ filters, outputPath }) => {
    const { exportScheduleH1RegisterPDF } = await import('../services/scheduleH1RegisterService');
    return { filePath: await exportScheduleH1RegisterPDF(filters, outputPath) };
  }, disposers, 60000);
  
  // GSTR-1 Export handlers
  register('ipc.gst.exportGSTR1JSON', async ({ filters, outputPath }) => {
    const { exportGSTR1JSON } = await import('../services/gstr1ExportService');
    return { filePath: await exportGSTR1JSON(filters, outputPath) };
  }, disposers, 60000);
  register('ipc.gst.exportGSTR1Excel', async ({ filters, outputPath }) => {
    const { exportGSTR1Excel } = await import('../services/gstr1ExportService');
    return { filePath: await exportGSTR1Excel(filters, outputPath) };
  }, disposers, 60000);
  
  // Audit Export handlers
  register('ipc.audit.exportCSV', async ({ filters, outputPath }) => {
    const { exportAuditLogCSV } = await import('../services/auditExportService');
    return { filePath: await exportAuditLogCSV(filters, outputPath) };
  }, disposers, 60000);
  register('ipc.audit.exportJSON', async ({ filters, outputPath }) => {
    const { exportAuditLogJSON } = await import('../services/auditExportService');
    return { filePath: await exportAuditLogJSON(filters, outputPath) };
  }, disposers, 60000);
  register('ipc.storageType.list', () => listStorageTypes(), disposers);
  register('ipc.storageType.create', createStorageType, disposers);
  register('ipc.storageType.update', ({ id, data }) => updateStorageType(id, data), disposers);
  register('ipc.storageType.delete', ({ id }) => deleteStorageType(id), disposers);
  register('ipc.search.global', globalSearch, disposers);
  register('ipc.search.barcode', ({ code }) => searchByBarcode(code), disposers);
  register('ipc.expiryReturn.create', createExpiryReturn, disposers);
  register('ipc.expiryReturn.list', (payload) => listExpiryReturns(payload), disposers);
  register('ipc.expiryReturn.get', ({ id }) => getExpiryReturnById(id), disposers);
  register('ipc.expiryReturn.report', (payload) => getExpiryLossReport(payload), disposers);
  register('ipc.notification.list', (payload) => listNotifications(payload), disposers);
  register('ipc.notification.markRead', ({ id }) => markAsRead(id), disposers);
  register('ipc.notification.markAllRead', async (payload) => {
    const count = await markAllAsRead(payload?.userId);
    return { count };
  }, disposers);
  register('ipc.notification.unreadCount', async (payload) => {
    const count = await getUnreadCount(payload?.userId);
    return { count } as { count: number };
  }, disposers);
  register('ipc.report.stock', () => getStockReport(), disposers);
  register('ipc.report.customer', () => getCustomerReport(), disposers);
  register('ipc.report.supplier', () => getSupplierReport(), disposers);
  register('ipc.pdf.generate', ({ invoiceId, invoiceType, outputPath }) => generateInvoicePDF({ invoiceId, invoiceType, outputPath }).then(filePath => ({ filePath })), disposers);
  register('ipc.import.products', ({ rows }) => importProducts(rows), disposers);
  register('ipc.import.customers', ({ rows }) => importCustomers(rows), disposers);
  register('ipc.import.suppliers', ({ rows }) => importSuppliers(rows), disposers);
  register('ipc.job.checkLowStock', () => checkLowStock(), disposers);
  register('ipc.job.checkExpiringBatches', (payload) => checkExpiringBatches(payload?.daysAhead), disposers);
  register('ipc.job.runAllChecks', () => runAllChecks(), disposers);
  register('ipc.job.cleanupNotifications', () => cleanupOldNotifications(), disposers);

  // Billing System Handlers
  withPermission('ipc.bill.create', createBill, 'bills.create', disposers);
  withPermission('ipc.bill.update', ({ id, data, userId }) => updateBill(id, data, userId), 'bills.update', disposers);
  register('ipc.bill.get', ({ id }) => getBillById(id), disposers); // View - all authenticated users
  register('ipc.bill.list', (payload) => listBills(payload), disposers); // View - all authenticated users
  withPermission('ipc.bill.finalize', ({ id, userId }) => finalizeBill(id, userId), 'bills.finalize', disposers);
  withPermission('ipc.bill.cancel', ({ id, reason, userId }) => cancelBill(id, reason, userId), 'bills.cancel', disposers);
  withPermission('ipc.bill.delete', async ({ id, userId, reason, force }) => {
    if (!userId) {
      throw new Error('User ID is required for deletion');
    }
    // Only ADMIN can force delete finalized bills
    if (force) {
      await requireAdmin(userId, 'Only ADMIN can force delete finalized bills');
    }
    return deleteBill(id, userId, reason, force);
  }, 'bills.delete', disposers);
  register('ipc.bill.print', async ({ id, templateId, outputPath }) => {
    const filePath = await printBill({
      billId: id,
      templateId,
      outputPath,
      printToPDF: true
    });
    return { filePath };
  }, disposers, 60000); // 60s timeout for print operations
  register('ipc.bill.printToPrinter', async ({ id, templateId, silent }) => {
    await printBill({
      billId: id,
      templateId,
      printToPDF: false,
      silent: silent ?? false
    });
    return { success: true };
  }, disposers, 60000);
  register('ipc.bill.preview', async ({ id, templateId }) => {
    const html = await previewBill(id, templateId);
    return { html };
  }, disposers, 30000);
  register('ipc.billTemplate.list', (payload) => listBillTemplates(payload), disposers);
  register('ipc.billTemplate.get', ({ id }) => getBillTemplateById(id), disposers);
  register('ipc.billTemplate.clone', ({ id, name, userId }) => cloneBillTemplate(id, name, userId), disposers);
  register('ipc.billTemplate.validate', async ({ htmlContent, cssContent }) => {
    const { validateTemplate } = await import('../services/templateValidationService');
    return validateTemplate(htmlContent, cssContent);
  }, disposers);
  register('ipc.billTemplate.isSystem', async ({ templateId }) => {
    const { isSystemTemplate } = await import('../services/templateValidationService');
    return { isSystem: await isSystemTemplate(templateId) };
  }, disposers);
  register('ipc.billTemplate.getVersions', async ({ templateId }) => {
    const { getTemplateVersions } = await import('../services/templateValidationService');
    return getTemplateVersions(templateId);
  }, disposers);
  register('ipc.billTemplate.restoreVersion', async ({ templateId, version, userId }) => {
    const { restoreTemplateVersion } = await import('../services/templateValidationService');
    await restoreTemplateVersion(templateId, version, userId);
    return { success: true };
  }, disposers);
  register('ipc.billTemplate.create', createBillTemplate, disposers);
  register('ipc.billTemplate.update', ({ id, data }) => updateBillTemplate(id, data), disposers);
  register('ipc.billTemplate.delete', ({ id }) => deleteBillTemplate(id), disposers);
  register('ipc.billTemplate.setDefault', ({ id }) => setDefaultBillTemplate(id), disposers);
  register('ipc.billTemplate.render', ({ templateId, billId }) => renderBillTemplate(templateId, billId).then(html => ({ html })), disposers, 30000); // 30s for template rendering
  register('ipc.billPayment.create', createBillPayment, disposers);
  register('ipc.billPayment.list', (payload) => listBillPayments(payload?.billId), disposers);
  register('ipc.billPayment.delete', ({ id }) => deleteBillPayment(id), disposers);
  register('ipc.billPayment.markChequeCleared', ({ id }) => markBillChequeCleared(id), disposers);
  register('ipc.billPayment.markChequeBounced', ({ id }) => markBillChequeBounced(id), disposers);
  
  // Outstanding & Aging handlers
  register('ipc.outstanding.getBills', async (filters) => {
    const { getOutstandingBills } = await import('../services/outstandingService');
    const bills = await getOutstandingBills(filters);
    return bills.map(bill => ({
      billId: bill.billId,
      billNumber: bill.billNumber,
      billDate: bill.billDate,
      customerName: bill.customerName,
      supplierName: bill.supplierName,
      totalAmount: bill.totalAmount,
      paidAmount: bill.paidAmount,
      outstanding: bill.outstanding,
      daysOverdue: bill.daysOverdue,
      aging: {
        current: bill.aging.current,
        days30: bill.aging.days30,
        days60: bill.aging.days60,
        days90: bill.aging.days90,
        // Map 90+ bucket from existing 90-day bucket
        days90Plus: bill.aging.days90
      }
    }));
  }, disposers);

  register('ipc.outstanding.getCustomers', async (filters) => {
    const { getCustomerOutstanding } = await import('../services/outstandingService');
    const customers = await getCustomerOutstanding(filters);
    return customers.map(customer => ({
      customerId: customer.customerId,
      customerName: customer.customerName,
      totalOutstanding: customer.totalOutstanding,
      bills: customer.bills.map(bill => ({
        billId: bill.billId,
        billNumber: bill.billNumber,
        outstanding: bill.outstanding,
        daysOverdue: bill.daysOverdue
      })),
      aging: {
        current: customer.aging.current,
        days30: customer.aging.days30,
        days60: customer.aging.days60,
        days90: customer.aging.days90,
        days90Plus: customer.aging.days90
      }
    }));
  }, disposers);

  register('ipc.outstanding.getSuppliers', async (filters) => {
    const { getSupplierOutstanding } = await import('../services/outstandingService');
    const suppliers = await getSupplierOutstanding(filters);
    return suppliers.map(supplier => ({
      supplierId: supplier.supplierId,
      supplierName: supplier.supplierName,
      totalOutstanding: supplier.totalOutstanding,
      bills: supplier.bills.map(bill => ({
        billId: bill.billId,
        billNumber: bill.billNumber,
        outstanding: bill.outstanding,
        daysOverdue: bill.daysOverdue
      })),
      aging: {
        current: supplier.aging.current,
        days30: supplier.aging.days30,
        days60: supplier.aging.days60,
        days90: supplier.aging.days90,
        days90Plus: supplier.aging.days90
      }
    }));
  }, disposers);

  register('ipc.outstanding.reconcileBill', async ({ billId }) => {
    const { reconcileBillOutstanding } = await import('../services/outstandingService');
    return reconcileBillOutstanding(billId);
  }, disposers);

  register('ipc.outstanding.autoReconcile', async () => {
    const { autoReconcileAllBills } = await import('../services/outstandingService');
    return autoReconcileAllBills();
  }, disposers);

  register('ipc.outstanding.validate', async ({ billId }) => {
    const { validateOutstanding } = await import('../services/outstandingService');
    const result = await validateOutstanding(billId);
    return {
      consistent: result.valid,
      errors: result.error ? [result.error] : []
    };
  }, disposers);
  
  // Profit & Margin handlers
  register('ipc.profit.getBillMargin', async ({ billId }) => {
    const { calculateBillProfitMargin } = await import('../services/profitMarginService');
    const margin = await calculateBillProfitMargin(billId);
    return {
      billId: margin.billId,
      billNumber: margin.billNumber,
      totalAmount: margin.totalAmount,
      totalCost: margin.totalCost,
      totalGST: margin.totalGST,
      totalDiscount: margin.totalDiscount,
      grossProfit: margin.grossProfit,
      netProfit: margin.netProfit,
      profitMargin: margin.profitMargin,
      lines: margin.lines.map((line, index) => ({
        lineNumber: index + 1,
        productName: line.productName,
        costPrice: line.costPrice,
        sellingPrice: line.sellingPrice,
        quantity: line.quantity,
        profit: line.netProfit,
        margin: line.profitMargin
      }))
    };
  }, disposers);

  register('ipc.profit.getProductMargin', async (filters) => {
    const { calculateProductProfitMargin } = await import('../services/profitMarginService');
    const products = await calculateProductProfitMargin(filters);
    return products.map(product => ({
      productId: product.productId,
      productName: product.productName,
      totalSales: product.totalSales,
      totalCost: product.totalCost,
      grossProfit: product.totalProfit,
      netProfit: product.totalProfit,
      profitMargin: product.profitMargin,
      // Quantity is not tracked in the aggregated structure; approximate as 0 for now
      quantity: 0
    }));
  }, disposers);

  register('ipc.profit.getCompanyMargin', async (filters) => {
    const { calculateCompanyProfitMargin } = await import('../services/profitMarginService');
    const companies = await calculateCompanyProfitMargin(filters);
    return companies.map(company => ({
      companyId: company.companyId,
      companyName: company.companyName,
      totalSales: company.totalSales,
      totalCost: company.totalCost,
      grossProfit: company.totalProfit,
      netProfit: company.totalProfit,
      profitMargin: company.profitMargin
    }));
  }, disposers);

  register('ipc.profit.getComprehensiveReport', async (filters) => {
    const { getComprehensiveProfitReport } = await import('../services/profitMarginService');
    return getComprehensiveProfitReport(filters);
  }, disposers, 90000); // 90s timeout for comprehensive reports

  register('ipc.profit.getExpiryLossImpact', async (filters) => {
    const { getExpiryLossImpact } = await import('../services/profitMarginService');
    return getExpiryLossImpact(filters);
  }, disposers);
  
  // Validation & Consistency handlers
  register('ipc.validation.validateBill', async ({ billData, excludeBillId, userId }) => {
    const { validateBill } = await import('../services/validationService');
    return validateBill(billData, excludeBillId, userId);
  }, disposers);

  register('ipc.validation.getBillSummary', async ({ billId }) => {
    const { getBillValidationSummary } = await import('../services/validationService');
    const summary = await getBillValidationSummary(billId);
    return {
      warnings: summary.warnings.map(w => ({
        type: w.type,
        severity: w.severity,
        message: w.message,
        overridden: false
      }))
    };
  }, disposers);

  register('ipc.validation.override', async ({ billId, warningType, reason, userId }) => {
    const { overrideValidationWarning } = await import('../services/validationService');
    await overrideValidationWarning(billId, warningType as any, reason, userId);
    return { success: true };
  }, disposers);
  register('ipc.consistency.scan', async () => {
    const { runConsistencyScan } = await import('../services/consistencyScannerService');
    return runConsistencyScan();
  }, disposers, 120000); // 2 minute timeout for full consistency scan
  withPermission('ipc.consistency.fixIssue', async ({ issue, userId }) => {
    const { fixConsistencyIssue } = await import('../services/consistencyScannerService');
    return fixConsistencyIssue(issue, userId);
  }, 'consistency.fix', disposers);
  withPermission('ipc.consistency.autoFix', async ({ userId }) => {
    const { autoFixAllIssues } = await import('../services/consistencyScannerService');
    return autoFixAllIssues(userId);
  }, 'consistency.fix', disposers);
  
  // Business Reports handlers (longer timeout for complex reports)
  register('ipc.report.mrPerformance', async (filters) => {
    const { getMRPerformanceReport } = await import('../services/mrPerformanceService');
    return getMRPerformanceReport(filters);
  }, disposers, 60000); // 60s timeout for complex reports

  register('ipc.report.doctorROI', async (filters) => {
    const { getDoctorROIReport } = await import('../services/doctorROIService');
    return getDoctorROIReport(filters);
  }, disposers, 60000);

  register('ipc.report.outstandingAging', async (filters) => {
    const { getOutstandingBills } = await import('../services/outstandingService');
    const bills = await getOutstandingBills(filters);
    return bills.map(bill => ({
      billId: bill.billId,
      billNumber: bill.billNumber,
      billDate: bill.billDate,
      customerName: bill.customerName,
      supplierName: bill.supplierName,
      totalAmount: bill.totalAmount,
      paidAmount: bill.paidAmount,
      outstanding: bill.outstanding,
      daysOverdue: bill.daysOverdue,
      aging: {
        current: bill.aging.current,
        days30: bill.aging.days30,
        days60: bill.aging.days60,
        days90: bill.aging.days90,
        days90Plus: bill.aging.days90
      }
    }));
  }, disposers, 60000);

  register('ipc.report.deadStock', async (filters) => {
    const { getDeadStock } = await import('../services/deadStockService');
    return getDeadStock(filters);
  }, disposers, 60000);

  register('ipc.report.expiryLoss', async (filters) => {
    const { getExpiryLossAccounting } = await import('../services/deadStockService');
    const report = await getExpiryLossAccounting(filters);
    return {
      totalLoss: report.totalLossAmount,
      byProduct: report.byProduct,
      bySupplier: report.bySupplier
    };
  }, disposers, 60000);

  register('ipc.report.companyMargin', async (filters) => {
    const { calculateCompanyProfitMargin } = await import('../services/profitMarginService');
    const companies = await calculateCompanyProfitMargin(filters);
    return companies.map(company => ({
      companyId: company.companyId,
      companyName: company.companyName,
      totalSales: company.totalSales,
      totalCost: company.totalCost,
      grossProfit: company.totalProfit,
      netProfit: company.totalProfit,
      profitMargin: company.profitMargin
    }));
  }, disposers, 60000);
  register('ipc.report.purchaseVsSales', async (filters) => {
    const { getPurchaseVsSalesVariance } = await import('../services/reportService');
    return getPurchaseVsSalesVariance(filters);
  }, disposers, 60000);
  register('ipc.companyInfo.get', () => getCompanyInfo(), disposers);
  register('ipc.companyInfo.save', saveCompanyInfo, disposers);

  // Template handlers
  register('templates:list', listTemplatesHandler, disposers);
  register('templates:load', loadTemplateHandler, disposers);
  register('templates:save', saveTemplateHandler, disposers);
  register('templates:render', renderTemplateHandler, disposers);
  register('templates:print', printTemplateHandler, disposers);
  
  // User info handlers (alias for companyInfo)
  register('userInfo:get', () => getCompanyInfo(), disposers);
  register('userInfo:set', saveCompanyInfo, disposers);

  // Initialize all templates from disk on startup
  try {
    console.log('Initializing templates from disk...');
    const { initializeTemplatesFromDisk } = await import('../services/templateInitializationService');
    const result = await initializeTemplatesFromDisk();
    console.log(`Templates initialized: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`);
    if (result.errors.length > 0) {
      console.warn('Template initialization errors:', result.errors);
    }
  } catch (error) {
    console.error('Failed to initialize templates:', error);
    // Don't throw here - template initialization shouldn't block startup
  }

  console.log('All IPC handlers registered successfully');
  return () => disposers.forEach((dispose) => dispose());
};

