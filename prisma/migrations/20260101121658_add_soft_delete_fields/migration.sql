-- AlterTable
ALTER TABLE "Bill" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "Bill" ADD COLUMN "deletedBy" INTEGER;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "Product" ADD COLUMN "deletedBy" INTEGER;

-- AlterTable
ALTER TABLE "PurchaseInvoice" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "PurchaseInvoice" ADD COLUMN "deletedBy" INTEGER;

-- AlterTable
ALTER TABLE "SalesInvoice" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "SalesInvoice" ADD COLUMN "deletedBy" INTEGER;
