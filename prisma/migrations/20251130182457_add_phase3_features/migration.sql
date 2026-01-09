-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN "dlNo2" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "fullAddress" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "locality" TEXT;

-- CreateTable
CREATE TABLE "Payment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "salesInvoiceId" INTEGER,
    "purchaseInvoiceId" INTEGER,
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
    CONSTRAINT "Payment_salesInvoiceId_fkey" FOREIGN KEY ("salesInvoiceId") REFERENCES "SalesInvoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Payment_purchaseInvoiceId_fkey" FOREIGN KEY ("purchaseInvoiceId") REFERENCES "PurchaseInvoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER,
    "entity" TEXT,
    "entityId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MR" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "commissionPercent" DECIMAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Doctor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "commissionPercent" DECIMAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Subcategory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "categoryId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Subcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Company" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StorageType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ExpiryReturn" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "returnNumber" TEXT NOT NULL,
    "returnDate" DATETIME NOT NULL,
    "supplierId" INTEGER,
    "batchId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "lossAmount" DECIMAL NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExpiryReturn_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ExpiryReturn_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hsnCode" TEXT NOT NULL,
    "packSize" TEXT,
    "manufacturer" TEXT,
    "drugCategory" TEXT,
    "drugGroup" TEXT,
    "drugContent" TEXT,
    "unitOfMeasure" TEXT,
    "purchasePack" TEXT,
    "stripQuantity" INTEGER,
    "barcode" TEXT,
    "stripCode" TEXT,
    "itemCode" TEXT,
    "categoryId" INTEGER,
    "subcategoryId" INTEGER,
    "companyId" INTEGER,
    "scheduleId" INTEGER,
    "storageTypeId" INTEGER,
    "gstRate" DECIMAL NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "maxStock" INTEGER,
    "isBatchManaged" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Product_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Product_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Product_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Product_storageTypeId_fkey" FOREIGN KEY ("storageTypeId") REFERENCES "StorageType" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("createdAt", "gstRate", "hsnCode", "id", "isBatchManaged", "manufacturer", "maxStock", "minStock", "name", "packSize", "sku", "updatedAt") SELECT "createdAt", "gstRate", "hsnCode", "id", "isBatchManaged", "manufacturer", "maxStock", "minStock", "name", "packSize", "sku", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
CREATE INDEX "Product_name_idx" ON "Product"("name");
CREATE INDEX "Product_manufacturer_idx" ON "Product"("manufacturer");
CREATE INDEX "Product_drugCategory_idx" ON "Product"("drugCategory");
CREATE INDEX "Product_drugGroup_idx" ON "Product"("drugGroup");
CREATE INDEX "Product_barcode_idx" ON "Product"("barcode");
CREATE INDEX "Product_stripCode_idx" ON "Product"("stripCode");
CREATE INDEX "Product_itemCode_idx" ON "Product"("itemCode");
CREATE INDEX "Product_sku_idx" ON "Product"("sku");
CREATE TABLE "new_PurchaseInvoice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceNumber" TEXT NOT NULL,
    "supplierId" INTEGER,
    "supplierName" TEXT NOT NULL,
    "invoiceDate" DATETIME NOT NULL,
    "totalAmount" DECIMAL NOT NULL,
    "totalTax" DECIMAL NOT NULL,
    "paidAmount" DECIMAL NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PurchaseInvoice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PurchaseInvoice" ("createdAt", "id", "invoiceDate", "invoiceNumber", "notes", "receivedAt", "supplierId", "supplierName", "totalAmount", "totalTax", "updatedAt") SELECT "createdAt", "id", "invoiceDate", "invoiceNumber", "notes", "receivedAt", "supplierId", "supplierName", "totalAmount", "totalTax", "updatedAt" FROM "PurchaseInvoice";
DROP TABLE "PurchaseInvoice";
ALTER TABLE "new_PurchaseInvoice" RENAME TO "PurchaseInvoice";
CREATE INDEX "idx_purchase_invoice_number" ON "PurchaseInvoice"("invoiceNumber");
CREATE INDEX "PurchaseInvoice_paymentStatus_idx" ON "PurchaseInvoice"("paymentStatus");
CREATE INDEX "PurchaseInvoice_supplierId_idx" ON "PurchaseInvoice"("supplierId");
CREATE TABLE "new_SalesInvoice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceNumber" TEXT NOT NULL,
    "challanNumber" TEXT,
    "orderNumber" TEXT,
    "customerId" INTEGER NOT NULL,
    "mrId" INTEGER,
    "doctorId" INTEGER,
    "invoiceDate" DATETIME NOT NULL,
    "dueDate" DATETIME,
    "billingType" TEXT NOT NULL DEFAULT 'CASH',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "totalAmount" DECIMAL NOT NULL,
    "totalTax" DECIMAL NOT NULL,
    "roundOff" DECIMAL NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "notes" TEXT,
    CONSTRAINT "SalesInvoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesInvoice_mrId_fkey" FOREIGN KEY ("mrId") REFERENCES "MR" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SalesInvoice_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SalesInvoice" ("challanNumber", "createdAt", "customerId", "dueDate", "id", "invoiceDate", "invoiceNumber", "notes", "orderNumber", "paymentStatus", "roundOff", "status", "totalAmount", "totalTax", "updatedAt") SELECT "challanNumber", "createdAt", "customerId", "dueDate", "id", "invoiceDate", "invoiceNumber", "notes", "orderNumber", "paymentStatus", "roundOff", "status", "totalAmount", "totalTax", "updatedAt" FROM "SalesInvoice";
DROP TABLE "SalesInvoice";
ALTER TABLE "new_SalesInvoice" RENAME TO "SalesInvoice";
CREATE UNIQUE INDEX "SalesInvoice_invoiceNumber_key" ON "SalesInvoice"("invoiceNumber");
CREATE INDEX "SalesInvoice_invoiceDate_idx" ON "SalesInvoice"("invoiceDate");
CREATE INDEX "SalesInvoice_paymentStatus_idx" ON "SalesInvoice"("paymentStatus");
CREATE INDEX "SalesInvoice_customerId_idx" ON "SalesInvoice"("customerId");
CREATE INDEX "SalesInvoice_mrId_idx" ON "SalesInvoice"("mrId");
CREATE INDEX "SalesInvoice_doctorId_idx" ON "SalesInvoice"("doctorId");
CREATE INDEX "SalesInvoice_billingType_idx" ON "SalesInvoice"("billingType");
CREATE TABLE "new_SalesItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "salesInvoiceId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "batchId" INTEGER,
    "quantity" INTEGER NOT NULL,
    "soldInStrips" BOOLEAN NOT NULL DEFAULT false,
    "stripQuantity" INTEGER,
    "freeQuantity" INTEGER NOT NULL DEFAULT 0,
    "mrp" DECIMAL NOT NULL,
    "salePrice" DECIMAL NOT NULL,
    "taxPercent" DECIMAL NOT NULL,
    "discountPercent" DECIMAL NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SalesItem_salesInvoiceId_fkey" FOREIGN KEY ("salesInvoiceId") REFERENCES "SalesInvoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SalesItem" ("batchId", "createdAt", "discountPercent", "freeQuantity", "id", "lineTotal", "mrp", "productId", "quantity", "salePrice", "salesInvoiceId", "taxPercent") SELECT "batchId", "createdAt", "discountPercent", "freeQuantity", "id", "lineTotal", "mrp", "productId", "quantity", "salePrice", "salesInvoiceId", "taxPercent" FROM "SalesItem";
DROP TABLE "SalesItem";
ALTER TABLE "new_SalesItem" RENAME TO "SalesItem";
CREATE INDEX "SalesItem_productId_idx" ON "SalesItem"("productId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Payment_salesInvoiceId_idx" ON "Payment"("salesInvoiceId");

-- CreateIndex
CREATE INDEX "Payment_purchaseInvoiceId_idx" ON "Payment"("purchaseInvoiceId");

-- CreateIndex
CREATE INDEX "Payment_paymentDate_idx" ON "Payment"("paymentDate");

-- CreateIndex
CREATE INDEX "Payment_paymentMethod_idx" ON "Payment"("paymentMethod");

-- CreateIndex
CREATE INDEX "Payment_isCleared_idx" ON "Payment"("isCleared");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_type_createdAt_idx" ON "Notification"("type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MR_code_key" ON "MR"("code");

-- CreateIndex
CREATE INDEX "MR_name_idx" ON "MR"("name");

-- CreateIndex
CREATE INDEX "MR_code_idx" ON "MR"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_code_key" ON "Doctor"("code");

-- CreateIndex
CREATE INDEX "Doctor_name_idx" ON "Doctor"("name");

-- CreateIndex
CREATE INDEX "Doctor_code_idx" ON "Doctor"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "Category_name_idx" ON "Category"("name");

-- CreateIndex
CREATE INDEX "Subcategory_name_idx" ON "Subcategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Subcategory_categoryId_name_key" ON "Subcategory"("categoryId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");

-- CreateIndex
CREATE INDEX "Company_name_idx" ON "Company"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Schedule_name_key" ON "Schedule"("name");

-- CreateIndex
CREATE INDEX "Schedule_name_idx" ON "Schedule"("name");

-- CreateIndex
CREATE UNIQUE INDEX "StorageType_name_key" ON "StorageType"("name");

-- CreateIndex
CREATE INDEX "StorageType_name_idx" ON "StorageType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ExpiryReturn_returnNumber_key" ON "ExpiryReturn"("returnNumber");

-- CreateIndex
CREATE INDEX "ExpiryReturn_returnDate_idx" ON "ExpiryReturn"("returnDate");

-- CreateIndex
CREATE INDEX "ExpiryReturn_supplierId_idx" ON "ExpiryReturn"("supplierId");

-- CreateIndex
CREATE INDEX "ExpiryReturn_batchId_idx" ON "ExpiryReturn"("batchId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Supplier_gstin_idx" ON "Supplier"("gstin");
