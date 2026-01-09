-- Add performance indexes for frequently queried fields

-- Batch indexes for FEFO and stock queries
CREATE INDEX IF NOT EXISTS "Batch_productId_expiryDate_idx" ON "Batch"("productId", "expiryDate");
CREATE INDEX IF NOT EXISTS "Batch_productId_quantity_idx" ON "Batch"("productId", "quantity");
CREATE INDEX IF NOT EXISTS "Batch_deletedAt_idx" ON "Batch"("deletedAt");

-- StockLedger indexes for batch and movement type queries
CREATE INDEX IF NOT EXISTS "StockLedger_batchId_createdAt_idx" ON "StockLedger"("batchId", "createdAt");
CREATE INDEX IF NOT EXISTS "StockLedger_movementType_createdAt_idx" ON "StockLedger"("movementType", "createdAt");

-- Product indexes for soft delete and batch management
CREATE INDEX IF NOT EXISTS "Product_deletedAt_idx" ON "Product"("deletedAt");
CREATE INDEX IF NOT EXISTS "Product_isBatchManaged_idx" ON "Product"("isBatchManaged");

-- SalesInvoice indexes for soft delete and date+status queries
CREATE INDEX IF NOT EXISTS "SalesInvoice_deletedAt_idx" ON "SalesInvoice"("deletedAt");
CREATE INDEX IF NOT EXISTS "SalesInvoice_invoiceDate_paymentStatus_idx" ON "SalesInvoice"("invoiceDate", "paymentStatus");

-- Bill indexes for soft delete and composite queries
CREATE INDEX IF NOT EXISTS "Bill_deletedAt_idx" ON "Bill"("deletedAt");
CREATE INDEX IF NOT EXISTS "Bill_billDate_status_idx" ON "Bill"("billDate", "status");
CREATE INDEX IF NOT EXISTS "Bill_status_paymentStatus_idx" ON "Bill"("status", "paymentStatus");

