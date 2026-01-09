-- CreateTable
CREATE TABLE "Bill" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "billNumber" TEXT NOT NULL,
    "billType" TEXT NOT NULL,
    "billDate" DATETIME NOT NULL,
    "dueDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "billingType" TEXT,
    "customerId" INTEGER,
    "supplierId" INTEGER,
    "customerName" TEXT,
    "supplierName" TEXT,
    "customerGstin" TEXT,
    "supplierGstin" TEXT,
    "customerAddress" TEXT,
    "supplierAddress" TEXT,
    "customerPhone" TEXT,
    "supplierPhone" TEXT,
    "mrId" INTEGER,
    "doctorId" INTEGER,
    "subtotal" DECIMAL NOT NULL DEFAULT 0,
    "totalDiscount" DECIMAL NOT NULL DEFAULT 0,
    "totalTax" DECIMAL NOT NULL DEFAULT 0,
    "cgstTotal" DECIMAL NOT NULL DEFAULT 0,
    "sgstTotal" DECIMAL NOT NULL DEFAULT 0,
    "igstTotal" DECIMAL NOT NULL DEFAULT 0,
    "roundOff" DECIMAL NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL NOT NULL DEFAULT 0,
    "challanNumber" TEXT,
    "orderNumber" TEXT,
    "remarks" TEXT,
    "notes" TEXT,
    "templateId" INTEGER,
    "finalizedAt" DATETIME,
    "finalizedBy" INTEGER,
    "cancelledAt" DATETIME,
    "cancelledBy" INTEGER,
    "cancellationReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Bill_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Bill_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Bill_mrId_fkey" FOREIGN KEY ("mrId") REFERENCES "MR" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Bill_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Bill_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "BillTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Bill_finalizedBy_fkey" FOREIGN KEY ("finalizedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Bill_cancelledBy_fkey" FOREIGN KEY ("cancelledBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BillLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "billId" INTEGER NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "batchId" INTEGER,
    "productName" TEXT NOT NULL,
    "hsnCode" TEXT NOT NULL,
    "manufacturer" TEXT,
    "packSize" TEXT,
    "unitOfMeasure" TEXT,
    "batchNumber" TEXT,
    "expiryDate" DATETIME,
    "quantity" INTEGER NOT NULL,
    "freeQuantity" INTEGER NOT NULL DEFAULT 0,
    "soldInStrips" BOOLEAN NOT NULL DEFAULT false,
    "stripQuantity" INTEGER,
    "mrp" DECIMAL NOT NULL,
    "ptr" DECIMAL NOT NULL,
    "pts" DECIMAL,
    "rate" DECIMAL NOT NULL,
    "discountPercent" DECIMAL NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL NOT NULL DEFAULT 0,
    "taxPercent" DECIMAL NOT NULL,
    "cgstPercent" DECIMAL NOT NULL DEFAULT 0,
    "sgstPercent" DECIMAL NOT NULL DEFAULT 0,
    "igstPercent" DECIMAL NOT NULL DEFAULT 0,
    "cgstAmount" DECIMAL NOT NULL DEFAULT 0,
    "sgstAmount" DECIMAL NOT NULL DEFAULT 0,
    "igstAmount" DECIMAL NOT NULL DEFAULT 0,
    "taxableAmount" DECIMAL NOT NULL,
    "lineTotal" DECIMAL NOT NULL,
    "savingPercent" DECIMAL,
    "savingValue" DECIMAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BillLine_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BillLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BillLine_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BillTemplate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "templateType" TEXT NOT NULL DEFAULT 'A4',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "htmlContent" TEXT NOT NULL,
    "cssContent" TEXT NOT NULL,
    "placeholders" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdBy" INTEGER,
    "updatedBy" INTEGER,
    CONSTRAINT "BillTemplate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BillTemplate_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BillTemplateVersion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "templateId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "cssContent" TEXT NOT NULL,
    "changeNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER,
    CONSTRAINT "BillTemplateVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "BillTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BillTemplateVersion_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BillPayment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "billId" INTEGER NOT NULL,
    "amount" DECIMAL NOT NULL,
    "paymentDate" DATETIME NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'CASH',
    "referenceNumber" TEXT,
    "chequeNumber" TEXT,
    "bank" TEXT,
    "chequeIssueDate" DATETIME,
    "isCleared" BOOLEAN,
    "clearedDate" DATETIME,
    "bouncedDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BillPayment_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BillAuditVersion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "billId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "changesJson" TEXT,
    "performedBy" INTEGER,
    "performedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    CONSTRAINT "BillAuditVersion_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BillAuditVersion_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Bill_billNumber_key" ON "Bill"("billNumber");

-- CreateIndex
CREATE INDEX "Bill_billNumber_idx" ON "Bill"("billNumber");

-- CreateIndex
CREATE INDEX "Bill_billType_idx" ON "Bill"("billType");

-- CreateIndex
CREATE INDEX "Bill_billDate_idx" ON "Bill"("billDate");

-- CreateIndex
CREATE INDEX "Bill_status_idx" ON "Bill"("status");

-- CreateIndex
CREATE INDEX "Bill_paymentStatus_idx" ON "Bill"("paymentStatus");

-- CreateIndex
CREATE INDEX "Bill_customerId_idx" ON "Bill"("customerId");

-- CreateIndex
CREATE INDEX "Bill_supplierId_idx" ON "Bill"("supplierId");

-- CreateIndex
CREATE INDEX "Bill_templateId_idx" ON "Bill"("templateId");

-- CreateIndex
CREATE INDEX "BillLine_billId_idx" ON "BillLine"("billId");

-- CreateIndex
CREATE INDEX "BillLine_productId_idx" ON "BillLine"("productId");

-- CreateIndex
CREATE INDEX "BillLine_batchId_idx" ON "BillLine"("batchId");

-- CreateIndex
CREATE INDEX "BillTemplate_templateType_idx" ON "BillTemplate"("templateType");

-- CreateIndex
CREATE INDEX "BillTemplate_isDefault_idx" ON "BillTemplate"("isDefault");

-- CreateIndex
CREATE INDEX "BillTemplate_isActive_idx" ON "BillTemplate"("isActive");

-- CreateIndex
CREATE INDEX "BillTemplateVersion_templateId_idx" ON "BillTemplateVersion"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "BillTemplateVersion_templateId_version_key" ON "BillTemplateVersion"("templateId", "version");

-- CreateIndex
CREATE INDEX "BillPayment_billId_idx" ON "BillPayment"("billId");

-- CreateIndex
CREATE INDEX "BillPayment_paymentDate_idx" ON "BillPayment"("paymentDate");

-- CreateIndex
CREATE INDEX "BillPayment_paymentMethod_idx" ON "BillPayment"("paymentMethod");

-- CreateIndex
CREATE INDEX "BillAuditVersion_billId_idx" ON "BillAuditVersion"("billId");

-- CreateIndex
CREATE INDEX "BillAuditVersion_version_idx" ON "BillAuditVersion"("version");

-- CreateIndex
CREATE INDEX "BillAuditVersion_performedAt_idx" ON "BillAuditVersion"("performedAt");
