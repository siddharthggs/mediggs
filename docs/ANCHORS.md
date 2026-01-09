// FILE: docs/ANCHORS.md
/// ANCHOR: AnchorsIndex
# Anchors Index (`/// ANCHOR:`)

Anchors are stable tags used to navigate major modules in the monorepo. When refactoring, update this file so tooling and humans can quickly locate responsibilities.

## Root & Tooling
- `RootTsConfig` – `tsconfig.json`
- `ViteConfig` – `vite.config.ts`
- `ProjectBlueprint` – `PROJECT_BLUEPRINT.md`

## Electron (Backend)
- `ElectronMain` – `electron/main.ts`
- `ElectronPreload` – `electron/preload.ts`
- `ElectronConstants` – `electron/src/constants.ts`
- `PrismaClientFactory` – `electron/src/db/prismaClient.ts`
- `ElectronMigrationsGuide` – `electron/src/db/migrations_readme.md`

### Services
- `AuthService` – `electron/src/services/authService.ts`
- `ProductService` – `electron/src/services/productService.ts`
- `StockService` – `electron/src/services/stockService.ts`
- `InvoiceService` – `electron/src/services/invoiceService.ts` (purchases / GRN)
- `SupplierService` – `electron/src/services/supplierService.ts`
- `CustomerService` – `electron/src/services/customerService.ts`
- `SalesService` – `electron/src/services/salesService.ts`
- `BackupService` – `electron/src/services/backupService.ts`
- `AuditService` – `electron/src/services/auditService.ts`
- `EInvoiceService` – `electron/src/services/eInvoiceService.ts`

### IPC & Printing
- `IpcHandlers` – `electron/src/ipcHandlers/index.ts`
- `PrintService` – `electron/src/printers/printService.ts`
- `PurchasePrintTemplate` – `electron/src/printers/purchasePrintTemplate.ts`

## Shared Types
- `SharedIpcTypes` – `shared/ipc.ts`

## Renderer (React)
- `RendererEntry` – `src/main.tsx`
- `AppShell` – `src/App.tsx`
- `RendererIpcClient` – `src/api/ipcClient.ts`
- `AuthStore` – `src/stores/authStore.ts`
- `StockStore` – `src/stores/stockStore.ts`
- `RendererGlobals` – `src/types/global.d.ts`

### Layout & Pages
- `AppLayout` – `src/components/layout/AppLayout.tsx`
- `LoginPage` – `src/pages/Login.tsx`
- `DashboardPage` – `src/pages/Dashboard.tsx`

### Dashboard Panels
- `ProductListPanel` – `src/components/dashboard/ProductListPanel.tsx`
- `StockSnapshotPanel` – `src/components/dashboard/StockSnapshotPanel.tsx`
- `StockAlertsPanel` – `src/components/dashboard/StockAlertsPanel.tsx`
- `SupplierPanel` – `src/components/dashboard/SupplierPanel.tsx`
- `CustomerPanel` – `src/components/dashboard/CustomerPanel.tsx`
- `PurchaseEntryPanel` – `src/components/dashboard/PurchaseEntryPanel.tsx`
- `SalesEntryPanel` – `src/components/dashboard/SalesEntryPanel.tsx`
- `BackupPanel` – `src/components/dashboard/BackupPanel.tsx`
- `EInvoiceQueuePanel` – `src/components/dashboard/EInvoiceQueuePanel.tsx`

### Styles
- `GlobalStyles` – `src/styles/global.css`


