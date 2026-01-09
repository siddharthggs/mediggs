-- CreateTable
CREATE TABLE "CompanyInfo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyName" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "gstNumber" TEXT,
    "dlNumber1" TEXT,
    "dlNumber2" TEXT,
    "fssaiNumber" TEXT,
    "cinPan" TEXT,
    "logoPath" TEXT,
    "signPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "CompanyInfo_companyName_idx" ON "CompanyInfo"("companyName");
