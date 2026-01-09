// FILE: shared/ipc.ts
/// ANCHOR: SharedIpcTypes
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  displayName: string;
  role: string;
}

export interface CreateProductRequest {
  sku: string;
  name: string;
  hsnCode: string;
  manufacturer?: string;
  drugCategory?: string;
  drugGroup?: string;
  drugContent?: string;
  unitOfMeasure?: string; // pcs, box, strip, tablet, bottle, ml, gm, kg, etc.
  purchasePack?: string;
  stripQuantity?: number; // Tablets per strip
  barcode?: string;
  stripCode?: string;
  itemCode?: string;
  categoryId?: number;
  subcategoryId?: number;
  companyId?: number;
  scheduleId?: number;
  storageTypeId?: number;
  packSize?: string;
  gstRate: number;
  minStock?: number;
  maxStock?: number;
  isBatchManaged?: boolean;
  // For product creation page - initial batch data
  initialBatch?: {
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    mrp: number;
    ptr: number;
    pts: number;
    freeQuantity?: number;
    discount?: number;
    godownId?: number;
  };
}

export interface BatchDTO {
  id: number;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  mrp: number;
  ptr: number;
  pts: number;
}

export interface ProductDTO {
  id: number;
  sku: string;
  name: string;
  hsnCode: string;
  manufacturer?: string | null;
  drugCategory?: string | null;
  drugGroup?: string | null;
  drugContent?: string | null;
  unitOfMeasure?: string | null;
  purchasePack?: string | null;
  stripQuantity?: number | null;
  barcode?: string | null;
  stripCode?: string | null;
  itemCode?: string | null;
  categoryName?: string | null;
  subcategoryName?: string | null;
  companyName?: string | null;
  scheduleName?: string | null;
  storageTypeName?: string | null;
  packSize?: string | null;
  gstRate: number;
  minStock: number;
  maxStock?: number | null;
  isBatchManaged: boolean;
  batches?: BatchDTO[];
  createdAt: string;
}

export interface ProductListRequest {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'sku' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface StockSnapshotEntry {
  productId: number;
  sku: string;
  name: string;
  minStock: number;
  totalQuantity: number;
  godownBreakup: Array<{
    godownId: number | null;
    godownName: string;
    quantity: number;
  }>;
  manufacturer?: string;
  category?: string;
  unitOfMeasure?: string;
  packSize?: string;
  stockValue?: number;
}

export interface StockKPIs {
  totalSKUs: number;
  totalStockValue: number;
  lowStockCount: number;
  expiringSoonCount: number;
  expiredCount: number;
}

export interface StockAlertEntry {
  productId: number;
  productName: string;
  sku: string;
  currentQty: number;
  reorderLevel: number;
  suggestedOrderQty: number;
  supplierId?: number;
  supplierName?: string;
  category?: string;
  manufacturer?: string;
  unitOfMeasure?: string;
}

export interface StockAlertsResponse {
  lowStock: StockAlertEntry[];
  outOfStock: StockAlertEntry[];
  overstock: StockAlertEntry[];
  reorderRequired: StockAlertEntry[];
}

export interface StockMovementChartData {
  date: string;
  in: number;
  out: number;
}

export interface SupplierInput {
  name: string;
  gstin?: string;
  drugLicenseNumber?: string; // DL No. 1
  dlNo2?: string; // DL No. 2
  fullAddress?: string;
  addressLine1?: string;
  addressLine2?: string;
  locality?: string;
  city?: string;
  state?: string;
  postalCode?: string; // Pincode
  phone?: string;
  email?: string;
  openingBalance?: number;
}

export interface SupplierDTO {
  id: number;
  name: string;
  gstin?: string;
  drugLicenseNumber?: string;
  dlNo2?: string;
  fullAddress?: string;
  addressLine1?: string;
  addressLine2?: string;
  locality?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  openingBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseItemInput {
  productId: number;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  freeQuantity?: number;
  costPrice: number;
  taxPercent: number;
  discountPercent?: number;
  mrp: number;
  ptr?: number;
  pts?: number;
  godownId?: number;
}

export interface CreatePurchaseRequest {
  invoiceNumber: string;
  invoiceDate: string;
  supplierId?: number;
  supplierName: string;
  notes?: string;
  items: PurchaseItemInput[];
}

export interface PurchaseLineDTO {
  id: number;
  productId: number;
  productName: string;
  batchNumber?: string | null;
  quantity: number;
  freeQuantity: number;
  costPrice: number;
  taxPercent: number;
  discountPercent: number;
  lineTotal: number;
}

export interface PurchaseInvoiceDTO {
  id: number;
  invoiceNumber: string;
  supplierName: string;
  supplierId?: number;
  invoiceDate: string;
  totalAmount: number;
  totalTax: number;
  notes?: string;
  items: PurchaseLineDTO[];
}

export interface CustomerInput {
  name: string;
  gstin?: string;
  drugLicenseNumber?: string;
  drugLicenseNumber2?: string;
  panNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  stateCode?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  creditLimit?: number;
}

export interface CustomerDTO {
  id: number;
  name: string;
  gstin?: string;
  drugLicenseNumber?: string;
  drugLicenseNumber2?: string;
  panNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  stateCode?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  createdAt: string;
}

export interface SalesItemInput {
  productId: number;
  batchId?: number; // Optional - if provided, use this batch; otherwise auto-allocate
  quantity: number; // Quantity in base unit (tablets if strip quantity exists)
  soldInStrips?: boolean; // If true, quantity is in strips; if false, quantity is in tablets/base unit
  stripQuantity?: number; // Override product strip quantity if needed
  salePrice: number;
  taxPercent: number;
  discountPercent?: number;
}

export interface CreateSalesRequest {
  invoiceNumber: string;
  invoiceDate: string;
  customerId: number;
  mrId?: number; // Salesman/MR ID
  doctorId?: number; // Doctor ID for commission
  billingType?: 'CASH' | 'CREDIT' | 'CHALLAN'; // Default: CASH
  challanNumber?: string;
  orderNumber?: string;
  notes?: string;
  items: SalesItemInput[];
}

export interface SalesLineDTO {
  id: number;
  productId: number;
  productName: string;
  batchNumber?: string | null;
  quantity: number;
  mrp: number;
  salePrice: number;
  taxPercent: number;
  discountPercent: number;
  lineTotal: number;
}

export interface SalesInvoiceDTO {
  id: number;
  invoiceNumber: string;
  customerId: number;
  customerName: string;
  mrId?: number;
  mrName?: string;
  doctorId?: number;
  doctorName?: string;
  invoiceDate: string;
  billingType: string;
  challanNumber?: string;
  orderNumber?: string;
  totalAmount: number;
  totalTax: number;
  roundOff: number;
  paidAmount: number;
  paymentStatus: string;
  notes?: string;
  items: SalesLineDTO[];
}

export type EInvoiceStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface EInvoiceQueueDTO {
  id: number;
  salesInvoiceId: number;
  invoiceNumber: string;
  status: EInvoiceStatus;
  lastAttemptAt?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface EInvoiceQueueRequest {
  salesInvoiceId: number;
}

export interface EInvoiceSyncResult {
  synced: number;
  failed: number;
}

export interface BackupExportResponse {
  filePath: string;
}

export interface BackupImportRequest {
  filePath: string;
}

export interface CreditNoteItemInput {
  salesItemId: number;
  quantity: number;
  reason?: string;
}

export interface CreateCreditNoteRequest {
  creditNoteNumber: string;
  salesInvoiceId: number;
  creditDate: string;
  items: CreditNoteItemInput[];
  notes?: string;
}

export interface CreditNoteDTO {
  id: number;
  creditNoteNumber: string;
  salesInvoiceId: number;
  salesInvoiceNumber: string;
  creditDate: string;
  totalAmount: number;
  notes?: string;
  createdAt: string;
}

export interface SchemeItemInput {
  productId: number;
  purchaseQuantity: number;
  bonusQuantity: number;
  bonusProductId?: number;
}

export interface CreateSchemeRequest {
  name: string;
  description?: string;
  validFrom: string;
  validTo: string;
  items: SchemeItemInput[];
}

export interface SchemeItemDTO {
  id: number;
  productId: number;
  productName: string;
  purchaseQuantity: number;
  bonusQuantity: number;
  bonusProductId?: number;
  bonusProductName?: string;
}

export interface SchemeDTO {
  id: number;
  name: string;
  description?: string;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  items: SchemeItemDTO[];
  createdAt: string;
}

export interface GodownInput {
  name: string;
  location?: string;
  isDefault?: boolean;
}

export interface GodownDTO {
  id: number;
  name: string;
  location?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface StockMovementDTO {
  id: number;
  productId: number;
  productName: string;
  batchId?: number;
  batchNumber?: string;
  godownId?: number;
  godownName?: string;
  movementType: string;
  reference: string;
  quantityChange: number;
  balanceAfter: number;
  narration?: string;
  createdAt: string;
}

export interface StockMovementRequest {
  productId?: number;
  movementType?: string;
  limit?: number;
  fromDate?: string;
  toDate?: string;
  batchId?: number;
}

export interface ExpiringBatchDTO {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  daysUntilExpiry: number;
  godownId?: number;
  godownName?: string;
  manufacturer?: string;
  category?: string;
}

export interface ExpiryAlertRequest {
  daysAhead?: number;
  includeExpired?: boolean;
  categoryId?: number;
  manufacturer?: string;
}

export interface DashboardSummaryDTO {
  todaySales: {
    count: number;
    totalAmount: number;
  };
  todayPurchases: {
    count: number;
    totalAmount: number;
  };
  lowStockCount: number;
  expiringBatchesCount: number;
  totalProducts: number;
  totalCustomers: number;
  totalSuppliers: number;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export interface UserDTO {
  id: number;
  username: string;
  roleName: string;
  createdAt: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  roleId: number;
}

export interface RoleDTO {
  id: number;
  name: string;
  description?: string;
}

export interface ReportDateRange {
  fromDate: string;
  toDate: string;
}

export interface SalesReportDTO {
  totalInvoices: number;
  totalAmount: number;
  totalTax: number;
  totalDiscount: number;
  netAmount: number;
  byCustomer: Array<{
    customerId: number;
    customerName: string;
    invoiceCount: number;
    totalAmount: number;
  }>;
  byProduct: Array<{
    productId: number;
    productName: string;
    quantity: number;
    totalAmount: number;
  }>;
}

export interface PurchaseReportDTO {
  totalInvoices: number;
  totalAmount: number;
  totalTax: number;
  netAmount: number;
  bySupplier: Array<{
    supplierId: number;
    supplierName: string;
    invoiceCount: number;
    totalAmount: number;
  }>;
  byProduct: Array<{
    productId: number;
    productName: string;
    quantity: number;
    totalAmount: number;
  }>;
}

export interface ProfitLossReportDTO {
  totalSales: number;
  totalPurchases: number;
  grossProfit: number;
  grossProfitMargin: number;
  period: {
    fromDate: string;
    toDate: string;
  };
}

export interface CreatePaymentRequest {
  salesInvoiceId?: number;
  purchaseInvoiceId?: number;
  amount: number;
  paymentDate: string;
  paymentMethod: string; // CASH | CHEQUE | NEFT | UPI | RTGS | BANK_TRANSFER | CARD
  referenceNumber?: string;
  chequeNumber?: string;
  bank?: string;
  chequeIssueDate?: string;
  notes?: string;
}

export interface PaymentDTO {
  id: number;
  salesInvoiceId?: number;
  purchaseInvoiceId?: number;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber?: string;
  chequeNumber?: string;
  bank?: string;
  chequeIssueDate?: string;
  isCleared?: boolean | null;
  clearedDate?: string;
  bouncedDate?: string;
  notes?: string;
  createdAt: string;
}

export interface CompanyInfoDTO {
  id: number;
  companyName: string;
  address?: string;
  phone?: string;
  email?: string;
  gstNumber?: string;
  dlNumber1?: string;
  dlNumber2?: string;
  fssaiNumber?: string;
  cinPan?: string;
  logoPath?: string;
  signPath?: string;
  state?: string;
  stateCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveCompanyInfoRequest {
  companyName: string;
  address?: string;
  phone?: string;
  email?: string;
  gstNumber?: string;
  dlNumber1?: string;
  dlNumber2?: string;
  fssaiNumber?: string;
  cinPan?: string;
  logoPath?: string;
  signPath?: string;
  state?: string;
  stateCode?: string;
}

export type IpcChannelMap = {
  'ipc.auth.login': {
    request: LoginRequest;
    response: LoginResponse;
  };
  'ipc.product.create': {
    request: CreateProductRequest;
    response: ProductDTO;
  };
  'ipc.product.list': {
    request: ProductListRequest | undefined;
    response: {
      products: ProductDTO[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  };
  'ipc.product.get': {
    request: { id: number };
    response: ProductDTO;
  };
  'ipc.product.update': {
    request: { id: number; data: Partial<CreateProductRequest> };
    response: ProductDTO;
  };
  'ipc.product.delete': {
    request: { id: number; userId?: number; reason?: string };
    response: void;
  };
  'ipc.stock.snapshot': {
    request: {
      search?: string;
      categoryId?: number;
      manufacturer?: string;
      godownId?: number;
      minStock?: number;
      maxStock?: number;
    } | undefined;
    response: StockSnapshotEntry[];
  };
  'ipc.stock.kpis': {
    request: void;
    response: StockKPIs;
  };
  'ipc.stock.alerts': {
    request: void;
    response: StockAlertsResponse;
  };
  'ipc.stock.movementChart': {
    request: { fromDate: string; toDate: string };
    response: StockMovementChartData[];
  };
  'ipc.supplier.list': {
    request: { search?: string } | undefined;
    response: SupplierDTO[];
  };
  'ipc.supplier.create': {
    request: SupplierInput;
    response: SupplierDTO;
  };
  'ipc.supplier.get': {
    request: { id: number };
    response: SupplierDTO;
  };
  'ipc.supplier.update': {
    request: { id: number; data: Partial<SupplierInput> };
    response: SupplierDTO;
  };
  'ipc.supplier.delete': {
    request: { id: number };
    response: void;
  };
  'ipc.purchase.create': {
    request: CreatePurchaseRequest;
    response: PurchaseInvoiceDTO;
  };
  'ipc.purchase.list': {
    request: void;
    response: PurchaseInvoiceDTO[];
  };
  'ipc.purchase.get': {
    request: { id: number };
    response: PurchaseInvoiceDTO;
  };
  'ipc.customer.list': {
    request: { search?: string } | undefined;
    response: CustomerDTO[];
  };
  'ipc.customer.create': {
    request: CustomerInput;
    response: CustomerDTO;
  };
  'ipc.customer.get': {
    request: { id: number };
    response: CustomerDTO;
  };
  'ipc.customer.update': {
    request: { id: number; data: Partial<CustomerInput> };
    response: CustomerDTO;
  };
  'ipc.customer.delete': {
    request: { id: number };
    response: void;
  };
  'ipc.sales.create': {
    request: CreateSalesRequest;
    response: SalesInvoiceDTO;
  };
  'ipc.sales.list': {
    request: void;
    response: SalesInvoiceDTO[];
  };
  'ipc.sales.get': {
    request: { id: number };
    response: SalesInvoiceDTO;
  };
  'ipc.backup.export': {
    request: void;
    response: BackupExportResponse;
  };
  'ipc.backup.import': {
    request: BackupImportRequest;
    response: BackupExportResponse;
  };
  'ipc.einvoice.queue': {
    request: EInvoiceQueueRequest;
    response: EInvoiceQueueDTO;
  };
  'ipc.einvoice.list': {
    request: void;
    response: EInvoiceQueueDTO[];
  };
  'ipc.einvoice.sync': {
    request: void;
    response: EInvoiceSyncResult;
  };
  'ipc.creditnote.create': {
    request: CreateCreditNoteRequest;
    response: CreditNoteDTO;
  };
  'ipc.creditnote.list': {
    request: void;
    response: CreditNoteDTO[];
  };
  'ipc.creditnote.get': {
    request: { id: number };
    response: CreditNoteDTO;
  };
  'ipc.scheme.create': {
    request: CreateSchemeRequest;
    response: SchemeDTO;
  };
  'ipc.scheme.list': {
    request: void;
    response: SchemeDTO[];
  };
  'ipc.scheme.update': {
    request: { id: number; data: Partial<CreateSchemeRequest> & { isActive?: boolean } };
    response: SchemeDTO;
  };
  'ipc.scheme.delete': {
    request: { id: number };
    response: void;
  };
  'ipc.godown.list': {
    request: void;
    response: GodownDTO[];
  };
  'ipc.godown.create': {
    request: GodownInput;
    response: GodownDTO;
  };
  'ipc.godown.update': {
    request: { id: number; data: Partial<GodownInput> };
    response: GodownDTO;
  };
  'ipc.godown.delete': {
    request: { id: number };
    response: void;
  };
  'ipc.stock.movements': {
    request: StockMovementRequest | undefined;
    response: StockMovementDTO[];
  };
  'ipc.stock.expiring': {
    request: ExpiryAlertRequest | undefined;
    response: ExpiringBatchDTO[];
  };
  'ipc.dashboard.summary': {
    request: void;
    response: DashboardSummaryDTO;
  };
  'ipc.user.list': {
    request: void;
    response: UserDTO[];
  };
  'ipc.user.create': {
    request: CreateUserRequest;
    response: UserDTO;
  };
  'ipc.user.get': {
    request: { id: number };
    response: UserDTO;
  };
  'ipc.user.update': {
    request: { id: number; data: Partial<CreateUserRequest> & { fullName?: string; isActive?: boolean } };
    response: UserDTO;
  };
  'ipc.user.delete': {
    request: { id: number };
    response: void;
  };
  'ipc.role.list': {
    request: void;
    response: RoleDTO[];
  };
  'ipc.report.sales': {
    request: ReportDateRange;
    response: SalesReportDTO;
  };
  'ipc.report.purchase': {
    request: ReportDateRange;
    response: PurchaseReportDTO;
  };
  'ipc.report.profitloss': {
    request: ReportDateRange;
    response: ProfitLossReportDTO;
  };
  'ipc.batch.list': {
    request: { productId?: number } | undefined;
    response: Array<{
      id: number;
      productId: number;
      productName: string;
      godownId?: number;
      godownName?: string;
      batchNumber: string;
      expiryDate: string;
      mrp: number;
      ptr: number;
      pts: number;
      taxPercent: number;
      quantity: number;
      createdAt: string;
      updatedAt: string;
    }>;
  };
  'ipc.batch.get': {
    request: { id: number };
    response: {
      id: number;
      productId: number;
      productName: string;
      godownId?: number;
      godownName?: string;
      batchNumber: string;
      expiryDate: string;
      mrp: number;
      ptr: number;
      pts: number;
      taxPercent: number;
      quantity: number;
      createdAt: string;
      updatedAt: string;
    };
  };
  'ipc.batch.create': {
    request: {
      productId: number;
      batchNumber: string;
      expiryDate: string;
      mrp: number;
      ptr: number;
      pts: number;
      taxPercent: number;
      quantity: number;
      godownId?: number;
    };
    response: {
      id: number;
      productId: number;
      productName: string;
      godownId?: number;
      godownName?: string;
      batchNumber: string;
      expiryDate: string;
      mrp: number;
      ptr: number;
      pts: number;
      taxPercent: number;
      quantity: number;
      createdAt: string;
      updatedAt: string;
    };
  };
  'ipc.batch.update': {
    request: {
      id: number;
      data: {
        batchNumber?: string;
        expiryDate?: string;
        mrp?: number;
        ptr?: number;
        pts?: number;
        taxPercent?: number;
        quantity?: number;
        godownId?: number;
      };
    };
    response: {
      id: number;
      productId: number;
      productName: string;
      godownId?: number;
      godownName?: string;
      batchNumber: string;
      expiryDate: string;
      mrp: number;
      ptr: number;
      pts: number;
      taxPercent: number;
      quantity: number;
      createdAt: string;
      updatedAt: string;
    };
  };
  'ipc.batch.delete': {
    request: { id: number };
    response: void;
  };
  'ipc.batch.transfer': {
    request: {
      batchId: number;
      fromGodownId?: number;
      toGodownId: number;
      quantity: number;
      notes?: string;
    };
    response: {
      id: number;
      batchId: number;
      batchNumber: string;
      productName: string;
      fromGodownId?: number;
      fromGodownName?: string;
      toGodownId: number;
      toGodownName: string;
      quantity: number;
      notes?: string;
      createdAt: string;
    };
  };
  'ipc.payment.create': {
    request: CreatePaymentRequest;
    response: PaymentDTO;
  };
  'ipc.payment.list': {
    request: {
      salesInvoiceId?: number;
      purchaseInvoiceId?: number;
      fromDate?: string;
      toDate?: string;
    } | undefined;
    response: PaymentDTO[];
  };
  'ipc.payment.delete': {
    request: { id: number };
    response: void;
  };
  'ipc.notification.list': {
    request: {
      userId?: number;
      type?: 'LOW_STOCK' | 'EXPIRY' | 'SYSTEM' | 'SUCCESS' | 'ERROR';
      isRead?: boolean;
      limit?: number;
    } | undefined;
    response: Array<{
      id: number;
      type: string;
      title: string;
      message: string;
      isRead: boolean;
      userId?: number;
      entity?: string;
      entityId?: number;
      createdAt: string;
    }>;
  };
  'ipc.notification.markRead': {
    request: { id: number };
    response: {
      id: number;
      type: string;
      title: string;
      message: string;
      isRead: boolean;
      userId?: number;
      entity?: string;
      entityId?: number;
      createdAt: string;
    };
  };
  'ipc.notification.markAllRead': {
    request: { userId?: number } | undefined;
    response: { count: number };
  };
  'ipc.notification.unreadCount': {
    request: { userId?: number } | undefined;
    response: { count: number };
  };
  'ipc.report.stock': {
    request: void;
    response: {
      totalProducts: number;
      totalValue: number;
      lowStockCount: number;
      expiredBatchesCount: number;
      nearExpiryBatchesCount: number;
      byProduct: Array<{
        productId: number;
        productName: string;
        sku: string;
        totalQuantity: number;
        totalValue: number;
        batches: Array<{
          batchId: number;
          batchNumber: string;
          expiryDate: string;
          quantity: number;
          godownName?: string;
          daysUntilExpiry: number;
        }>;
      }>;
      byGodown: Array<{
        godownId: number | null;
        godownName: string;
        totalValue: number;
        productCount: number;
      }>;
    };
  };
  'ipc.report.customer': {
    request: void;
    response: {
      totalCustomers: number;
      totalOutstanding: number;
      topCustomers: Array<{
        customerId: number;
        customerName: string;
        totalSales: number;
        totalPaid: number;
        outstanding: number;
        invoiceCount: number;
      }>;
    };
  };
  'ipc.report.supplier': {
    request: void;
    response: {
      totalSuppliers: number;
      totalOutstanding: number;
      topSuppliers: Array<{
        supplierId: number;
        supplierName: string;
        totalPurchases: number;
        totalPaid: number;
        outstanding: number;
        invoiceCount: number;
      }>;
    };
  };
  'ipc.pdf.generate': {
    request: {
      invoiceId: number;
      invoiceType: 'sales' | 'purchase' | 'creditnote';
      outputPath?: string;
    };
    response: { filePath: string };
  };
  'ipc.import.products': {
    request: {
      rows: Array<{
        sku: string;
        name: string;
        hsnCode: string;
        manufacturer?: string;
        packSize?: string;
        gstRate: number;
        minStock?: number;
        maxStock?: number;
        isBatchManaged?: boolean;
      }>;
    };
    response: {
      success: number;
      failed: number;
      errors: Array<{ row: number; error: string }>;
    };
  };
  'ipc.import.customers': {
    request: {
      rows: Array<{
        name: string;
        gstin?: string;
        drugLicenseNumber?: string;
        addressLine1?: string;
        addressLine2?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        phone?: string;
        email?: string;
        creditLimit?: number;
      }>;
    };
    response: {
      success: number;
      failed: number;
      errors: Array<{ row: number; error: string }>;
    };
  };
  'ipc.import.suppliers': {
    request: {
      rows: Array<{
        name: string;
        gstin?: string;
        drugLicenseNumber?: string;
        addressLine1?: string;
        addressLine2?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        phone?: string;
        email?: string;
        openingBalance?: number;
      }>;
    };
    response: {
      success: number;
      failed: number;
      errors: Array<{ row: number; error: string }>;
    };
  };
  'ipc.job.checkLowStock': {
    request: void;
    response: {
      success: boolean;
      message: string;
      itemsProcessed: number;
    };
  };
  'ipc.job.checkExpiringBatches': {
    request: { daysAhead?: number } | undefined;
    response: {
      success: boolean;
      message: string;
      itemsProcessed: number;
    };
  };
  'ipc.job.runAllChecks': {
    request: void;
    response: {
      lowStock: {
        success: boolean;
        message: string;
        itemsProcessed: number;
      };
      expiringBatches: {
        success: boolean;
        message: string;
        itemsProcessed: number;
      };
    };
  };
  'ipc.job.cleanupNotifications': {
    request: void;
    response: {
      success: boolean;
      message: string;
      itemsProcessed: number;
    };
  };
  'ipc.payment.update': {
    request: { id: number; data: Partial<CreatePaymentRequest> };
    response: PaymentDTO;
  };
  'ipc.payment.markChequeCleared': {
    request: { id: number };
    response: PaymentDTO;
  };
  'ipc.payment.markChequeBounced': {
    request: { id: number };
    response: PaymentDTO;
  };
  'ipc.mr.list': {
    request: { search?: string } | undefined;
    response: Array<{
      id: number;
      name: string;
      code?: string;
      phone?: string;
      email?: string;
      address?: string;
      commissionPercent: number;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    }>;
  };
  'ipc.mr.create': {
    request: {
      name: string;
      code?: string;
      phone?: string;
      email?: string;
      address?: string;
      commissionPercent?: number;
      isActive?: boolean;
    };
    response: {
      id: number;
      name: string;
      code?: string;
      phone?: string;
      email?: string;
      address?: string;
      commissionPercent: number;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    };
  };
  'ipc.mr.get': {
    request: { id: number };
    response: {
      id: number;
      name: string;
      code?: string;
      phone?: string;
      email?: string;
      address?: string;
      commissionPercent: number;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    };
  };
  'ipc.mr.update': {
    request: {
      id: number;
      data: Partial<{
        name: string;
        code?: string;
        phone?: string;
        email?: string;
        address?: string;
        commissionPercent?: number;
        isActive?: boolean;
      }>;
    };
    response: {
      id: number;
      name: string;
      code?: string;
      phone?: string;
      email?: string;
      address?: string;
      commissionPercent: number;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    };
  };
  'ipc.mr.delete': {
    request: { id: number };
    response: void;
  };
  'ipc.doctor.list': {
    request: { search?: string } | undefined;
    response: Array<{
      id: number;
      name: string;
      code?: string;
      phone?: string;
      email?: string;
      address?: string;
      commissionPercent: number;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    }>;
  };
  'ipc.doctor.create': {
    request: {
      name: string;
      code?: string;
      phone?: string;
      email?: string;
      address?: string;
      commissionPercent?: number;
      isActive?: boolean;
    };
    response: {
      id: number;
      name: string;
      code?: string;
      phone?: string;
      email?: string;
      address?: string;
      commissionPercent: number;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    };
  };
  'ipc.doctor.get': {
    request: { id: number };
    response: {
      id: number;
      name: string;
      code?: string;
      phone?: string;
      email?: string;
      address?: string;
      commissionPercent: number;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    };
  };
  'ipc.doctor.update': {
    request: {
      id: number;
      data: Partial<{
        name: string;
        code?: string;
        phone?: string;
        email?: string;
        address?: string;
        commissionPercent?: number;
        isActive?: boolean;
      }>;
    };
    response: {
      id: number;
      name: string;
      code?: string;
      phone?: string;
      email?: string;
      address?: string;
      commissionPercent: number;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    };
  };
  'ipc.doctor.delete': {
    request: { id: number };
    response: void;
  };
  'ipc.category.list': {
    request: void;
    response: Array<{
      id: number;
      name: string;
      description?: string;
      createdAt: string;
      updatedAt: string;
    }>;
  };
  'ipc.category.create': {
    request: { name: string; description?: string };
    response: {
      id: number;
      name: string;
      description?: string;
      createdAt: string;
      updatedAt: string;
    };
  };
  'ipc.category.update': {
    request: { id: number; data: { name?: string; description?: string } };
    response: {
      id: number;
      name: string;
      description?: string;
      createdAt: string;
      updatedAt: string;
    };
  };
  'ipc.category.delete': {
    request: { id: number };
    response: void;
  };
  'ipc.subcategory.list': {
    request: { categoryId?: number } | undefined;
    response: Array<{
      id: number;
      categoryId: number;
      categoryName: string;
      name: string;
      description?: string;
      createdAt: string;
      updatedAt: string;
    }>;
  };
  'ipc.subcategory.create': {
    request: { categoryId: number; name: string; description?: string };
    response: {
      id: number;
      categoryId: number;
      categoryName: string;
      name: string;
      description?: string;
      createdAt: string;
      updatedAt: string;
    };
  };
  'ipc.subcategory.update': {
    request: {
      id: number;
      data: { categoryId?: number; name?: string; description?: string };
    };
    response: {
      id: number;
      categoryId: number;
      categoryName: string;
      name: string;
      description?: string;
      createdAt: string;
      updatedAt: string;
    };
  };
  'ipc.subcategory.delete': {
    request: { id: number };
    response: void;
  };
  'ipc.company.list': {
    request: void;
    response: Array<{
      id: number;
      name: string;
      description?: string;
      createdAt: string;
      updatedAt: string;
    }>;
  };
  'ipc.company.create': {
    request: { name: string; description?: string };
    response: {
      id: number;
      name: string;
      description?: string;
      createdAt: string;
      updatedAt: string;
    };
  };
  'ipc.company.update': {
    request: { id: number; data: { name?: string; description?: string } };
    response: {
      id: number;
      name: string;
      description?: string;
      createdAt: string;
      updatedAt: string;
    };
  };
  'ipc.company.delete': {
    request: { id: number };
    response: void;
  };
  'ipc.schedule.list': {
    request: void;
    response: Array<{
      id: number;
      name: string;
      description?: string;
      createdAt: string;
      updatedAt: string;
    }>;
  };
  'ipc.schedule.create': {
    request: { name: string; description?: string };
    response: {
      id: number;
      name: string;
      description?: string;
      createdAt: string;
      updatedAt: string;
    };
  };
  'ipc.schedule.update': {
    request: { id: number; data: { name?: string; description?: string } };
    response: {
      id: number;
      name: string;
      description?: string;
      createdAt: string;
      updatedAt: string;
    };
  };
  'ipc.schedule.delete': {
    request: { id: number };
    response: void;
  };
  'ipc.scheduleH1.getRegister': {
    request: {
      fromDate: string;
      toDate: string;
      customerId?: number;
      doctorId?: number;
      productId?: number;
    };
    response: Array<{
      date: string;
      invoiceNumber: string;
      customerName: string;
      customerAddress: string;
      customerDL: string | null;
      doctorName: string | null;
      doctorDL: string | null;
      patientName: string | null;
      productName: string;
      batchNumber: string;
      quantity: number;
      unit: string;
      schedule: string;
    }>;
  };
  'ipc.scheduleH1.exportCSV': {
    request: {
      filters: {
        fromDate: string;
        toDate: string;
        customerId?: number;
        doctorId?: number;
        productId?: number;
      };
      outputPath?: string;
    };
    response: { filePath: string };
  };
  'ipc.scheduleH1.exportPDF': {
    request: {
      filters: {
        fromDate: string;
        toDate: string;
        customerId?: number;
        doctorId?: number;
        productId?: number;
      };
      outputPath?: string;
    };
    response: { filePath: string };
  };
  'ipc.gst.exportGSTR1JSON': {
    request: {
      filters: {
        fromDate: string;
        toDate: string;
        gstin?: string;
      };
      outputPath?: string;
    };
    response: { filePath: string };
  };
  'ipc.gst.exportGSTR1Excel': {
    request: {
      filters: {
        fromDate: string;
        toDate: string;
        gstin?: string;
      };
      outputPath?: string;
    };
    response: { filePath: string };
  };
  'ipc.audit.exportCSV': {
    request: {
      filters: {
        fromDate?: string;
        toDate?: string;
        entity?: string;
        entityId?: number;
        userId?: number;
        action?: string;
      };
      outputPath?: string;
    };
    response: { filePath: string };
  };
  'ipc.audit.exportJSON': {
    request: {
      filters: {
        fromDate?: string;
        toDate?: string;
        entity?: string;
        entityId?: number;
        userId?: number;
        action?: string;
      };
      outputPath?: string;
    };
    response: { filePath: string };
  };
  'ipc.storageType.list': {
    request: void;
    response: Array<{
      id: number;
      name: string;
      description?: string;
      createdAt: string;
      updatedAt: string;
    }>;
  };
  'ipc.storageType.create': {
    request: { name: string; description?: string };
    response: {
      id: number;
      name: string;
      description?: string;
      createdAt: string;
      updatedAt: string;
    };
  };
  'ipc.storageType.update': {
    request: { id: number; data: { name?: string; description?: string } };
    response: {
      id: number;
      name: string;
      description?: string;
      createdAt: string;
      updatedAt: string;
    };
  };
  'ipc.storageType.delete': {
    request: { id: number };
    response: void;
  };
  'ipc.search.global': {
    request: {
      query: string;
      page?: number;
      pageSize?: number;
      filters?: {
        entityTypes?: string[];
      };
    };
    response: {
      products: Array<{
        id: number;
        name: string;
        sku: string;
        manufacturer?: string;
        drugCategory?: string;
        drugGroup?: string;
        barcode?: string;
        stripCode?: string;
        itemCode?: string;
      }>;
      customers: Array<{
        id: number;
        name: string;
        gstin?: string;
        phone?: string;
      }>;
      suppliers: Array<{
        id: number;
        name: string;
        gstin?: string;
        phone?: string;
      }>;
      batches: Array<{
        id: number;
        batchNumber: string;
        productName: string;
        expiryDate: string;
      }>;
      invoices: Array<{
        id: number;
        invoiceNumber: string;
        type: 'sales' | 'purchase';
        date: string;
      }>;
      mrs: Array<{
        id: number;
        name: string;
        code?: string;
      }>;
      doctors: Array<{
        id: number;
        name: string;
        code?: string;
      }>;
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  };
  'ipc.search.barcode': {
    request: { code: string };
    response: {
      product?: {
        id: number;
        name: string;
        sku: string;
        manufacturer?: string;
        drugCategory?: string;
        drugGroup?: string;
        unitOfMeasure?: string;
        purchasePack?: string;
        stripQuantity?: number;
        gstRate: number;
        batches?: Array<{
          id: number;
          batchNumber: string;
          expiryDate: string;
          quantity: number;
          mrp: number;
          ptr: number;
          pts: number;
        }>;
      };
      batch?: {
        id: number;
        batchNumber: string;
        productId: number;
        productName: string;
        expiryDate: string;
        quantity: number;
        mrp: number;
        ptr: number;
        pts: number;
      };
      found: boolean;
      searchType: 'barcode' | 'stripCode' | 'itemCode' | 'sku' | 'notFound';
    };
  };
  'ipc.expiryReturn.create': {
    request: {
      returnNumber: string;
      returnDate: string;
      supplierId?: number;
      batchId: number;
      quantity: number;
      lossAmount: number;
      notes?: string;
    };
    response: {
      id: number;
      returnNumber: string;
      returnDate: string;
      supplierId?: number;
      supplierName?: string;
      batchId: number;
      batchNumber: string;
      productId: number;
      productName: string;
      quantity: number;
      lossAmount: number;
      notes?: string;
      createdAt: string;
      updatedAt: string;
    };
  };
  'ipc.expiryReturn.list': {
    request: {
      fromDate?: string;
      toDate?: string;
      supplierId?: number;
      batchId?: number;
    } | undefined;
    response: Array<{
      id: number;
      returnNumber: string;
      returnDate: string;
      supplierId?: number;
      supplierName?: string;
      batchId: number;
      batchNumber: string;
      productId: number;
      productName: string;
      quantity: number;
      lossAmount: number;
      notes?: string;
      createdAt: string;
      updatedAt: string;
    }>;
  };
  'ipc.expiryReturn.get': {
    request: { id: number };
    response: {
      id: number;
      returnNumber: string;
      returnDate: string;
      supplierId?: number;
      supplierName?: string;
      batchId: number;
      batchNumber: string;
      productId: number;
      productName: string;
      quantity: number;
      lossAmount: number;
      notes?: string;
      createdAt: string;
      updatedAt: string;
    };
  };
  'ipc.expiryReturn.report': {
    request: {
      fromDate?: string;
      toDate?: string;
      supplierId?: number;
    } | undefined;
    response: {
      totalReturns: number;
      totalQuantity: number;
      totalLossAmount: number;
      bySupplier: Array<{
        supplierId: number;
        supplierName: string;
        returnCount: number;
        totalQuantity: number;
        totalLossAmount: number;
      }>;
      byProduct: Array<{
        productId: number;
        productName: string;
        returnCount: number;
        totalQuantity: number;
        totalLossAmount: number;
      }>;
    };
  };
  // Billing System IPC Types
  'ipc.bill.create': {
    request: CreateBillRequest;
    response: BillDTO;
  };
  'ipc.bill.get': {
    request: { id: number };
    response: BillDTO;
  };
  'ipc.bill.list': {
    request: {
      billType?: 'SALES' | 'PURCHASE' | 'CREDIT_NOTE';
      status?: 'DRAFT' | 'FINALIZED' | 'CANCELLED';
      customerId?: number;
      supplierId?: number;
      fromDate?: string;
      toDate?: string;
      page?: number;
      pageSize?: number;
    } | undefined;
    response: {
      bills: BillDTO[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  };
  'ipc.bill.finalize': {
    request: { id: number; userId?: number };
    response: BillDTO;
  };
  'ipc.bill.cancel': {
    request: { id: number; reason?: string; userId?: number };
    response: BillDTO;
  };
  'ipc.bill.update': {
    request: { id: number; data: Partial<CreateBillRequest>; userId?: number };
    response: BillDTO;
  };
  'ipc.bill.delete': {
    request: { id: number; userId?: number; reason?: string; force?: boolean };
    response: void;
  };
  'ipc.sales.delete': {
    request: { id: number; userId?: number; reason?: string; force?: boolean };
    response: void;
  };
  'ipc.purchase.delete': {
    request: { id: number; userId?: number; reason?: string; force?: boolean };
    response: void;
  };
  'ipc.bill.print': {
    request: { id: number; templateId?: number; outputPath?: string };
    response: { filePath: string };
  };
  'ipc.bill.printToPrinter': {
    request: { id: number; templateId?: number; silent?: boolean };
    response: { success: boolean };
  };
  'ipc.bill.preview': {
    request: { id: number; templateId?: number };
    response: { html: string };
  };
  'ipc.billTemplate.list': {
    request: { templateType?: 'A4' | 'THERMAL_3INCH' } | undefined;
    response: BillTemplateDTO[];
  };
  'ipc.billTemplate.get': {
    request: { id: number };
    response: BillTemplateDTO;
  };
  'ipc.billTemplate.create': {
    request: CreateBillTemplateRequest;
    response: BillTemplateDTO;
  };
  'ipc.billTemplate.update': {
    request: { id: number; data: Partial<CreateBillTemplateRequest> };
    response: BillTemplateDTO;
  };
  'ipc.billTemplate.delete': {
    request: { id: number };
    response: void;
  };
  'ipc.billTemplate.setDefault': {
    request: { id: number };
    response: BillTemplateDTO;
  };
  'ipc.billTemplate.clone': {
    request: { id: number; name: string; userId?: number };
    response: BillTemplateDTO;
  };
  'ipc.billTemplate.render': {
    request: { templateId: number; billId: number };
    response: { html: string };
  };
  'ipc.billPayment.create': {
    request: CreateBillPaymentRequest;
    response: BillPaymentDTO;
  };
  'ipc.billPayment.list': {
    request: { billId?: number } | undefined;
    response: BillPaymentDTO[];
  };
  'ipc.billPayment.delete': {
    request: { id: number };
    response: void;
  };
  'ipc.billPayment.markChequeCleared': {
    request: { id: number };
    response: BillPaymentDTO;
  };
  'ipc.billPayment.markChequeBounced': {
    request: { id: number };
    response: BillPaymentDTO;
  };
  'ipc.companyInfo.get': {
    request: void;
    response: CompanyInfoDTO | null;
  };
  'ipc.companyInfo.save': {
    request: SaveCompanyInfoRequest;
    response: CompanyInfoDTO;
  };
  'templates:list': {
    request: void;
    response: Array<{
      name: string;
      path: string;
      size: number;
      modified: string;
    }>;
  };
  'templates:load': {
    request: { name: string };
    response: {
      html: string;
      css?: string;
      warnings?: string[];
    };
  };
  'templates:save': {
    request: { name: string; html: string };
    response: { success: boolean; message: string };
  };
  'templates:render': {
    request: {
      templateName?: string;
      billId?: number;
      sample?: boolean;
    };
    response: {
      html: string;
      warnings: string[];
    };
  };
  'templates:print': {
    request: {
      templateName?: string;
      billId?: number;
      sample?: boolean;
      silent?: boolean;
    };
    response: { success: boolean };
  };
  'userInfo:get': {
    request: void;
    response: CompanyInfoDTO | null;
  };
  'userInfo:set': {
    request: SaveCompanyInfoRequest;
    response: CompanyInfoDTO;
  };
  'ipc.draft.autoSave': {
    request: { billId: number; payload: Partial<CreateBillRequest>; userId: number };
    response: BillDTO;
  };
  'ipc.draft.getRecoverable': {
    request: { userId: number };
    response: BillDTO[];
  };
  'ipc.draft.cleanup': {
    request: void;
    response: { success: boolean; count: number };
  };
  'ipc.backup.create': {
    request: void;
    response: { success: boolean; filePath?: string; error?: string };
  };
  'ipc.backup.list': {
    request: void;
    response: Array<{ filePath: string; timestamp: string; fileSize: number; createdAt: string; isValid: boolean }>;
  };
  'ipc.backup.restore': {
    request: { filePath: string; validateBeforeRestore?: boolean };
    response: { success: boolean; error?: string };
  };
  'ipc.backup.verify': {
    request: { filePath: string };
    response: { valid: boolean; error?: string };
  };
  'ipc.outstanding.getBills': {
    request: { billType?: 'SALES' | 'PURCHASE'; customerId?: number; supplierId?: number; includePaid?: boolean } | undefined;
    response: Array<{ billId: number; billNumber: string; billDate: Date; customerName?: string; supplierName?: string; totalAmount: number; paidAmount: number; outstanding: number; daysOverdue: number; aging: { current: number; days30: number; days60: number; days90: number; days90Plus: number } }>;
  };
  'ipc.outstanding.getCustomers': {
    request: { customerId?: number; includePaid?: boolean } | undefined;
    response: Array<{ customerId: number; customerName: string; totalOutstanding: number; bills: Array<{ billId: number; billNumber: string; outstanding: number; daysOverdue: number }>; aging: { current: number; days30: number; days60: number; days90: number; days90Plus: number } }>;
  };
  'ipc.outstanding.getSuppliers': {
    request: { supplierId?: number; includePaid?: boolean } | undefined;
    response: Array<{ supplierId: number; supplierName: string; totalOutstanding: number; bills: Array<{ billId: number; billNumber: string; outstanding: number; daysOverdue: number }>; aging: { current: number; days30: number; days60: number; days90: number; days90Plus: number } }>;
  };
  'ipc.outstanding.reconcileBill': {
    request: { billId: number };
    response: { oldOutstanding: number; newOutstanding: number };
  };
  'ipc.outstanding.autoReconcile': {
    request: void;
    response: { reconciled: number; errors: string[] };
  };
  'ipc.outstanding.validate': {
    request: { billId: number };
    response: { consistent: boolean; errors: string[] };
  };
  'ipc.profit.getBillMargin': {
    request: { billId: number };
    response: { billId: number; billNumber: string; totalAmount: number; totalCost: number; totalGST: number; totalDiscount: number; grossProfit: number; netProfit: number; profitMargin: number; lines: Array<{ lineNumber: number; productName: string; costPrice: number; sellingPrice: number; quantity: number; profit: number; margin: number }> };
  };
  'ipc.profit.getProductMargin': {
    request: { productId?: number; fromDate?: string; toDate?: string } | undefined;
    response: Array<{ productId: number; productName: string; totalSales: number; totalCost: number; grossProfit: number; netProfit: number; profitMargin: number; quantity: number }>;
  };
  'ipc.profit.getCompanyMargin': {
    request: { companyId?: number; fromDate?: string; toDate?: string } | undefined;
    response: Array<{ companyId: number; companyName: string; totalSales: number; totalCost: number; grossProfit: number; netProfit: number; profitMargin: number }>;
  };
  'ipc.profit.getComprehensiveReport': {
    request: { fromDate?: string; toDate?: string; productId?: number; companyId?: number } | undefined;
    response: { summary: { totalSales: number; totalCost: number; totalGST: number; totalDiscount: number; totalExpiryLoss: number; grossProfit: number; netProfit: number; profitMargin: number }; byBill: Array<any>; byProduct: Array<any>; byCompany: Array<any>; expiryLossImpact: { totalExpiryLoss: number; impactOnProfit: number } };
  };
  'ipc.profit.getExpiryLossImpact': {
    request: { fromDate?: string; toDate?: string; productId?: number } | undefined;
    response: { totalExpiryLoss: number; impactOnProfit: number; byProduct: Array<{ productId: number; productName: string; expiryLoss: number; impactOnProfit: number }> };
  };
  'ipc.validation.validateBill': {
    request: { billData: any; excludeBillId?: number; userId?: number };
    response: { warnings: Array<{ type: string; severity: string; message: string; suggestedValue?: any }> };
  };
  'ipc.validation.getBillSummary': {
    request: { billId: number };
    response: { warnings: Array<{ type: string; severity: string; message: string; overridden: boolean }> };
  };
  'ipc.validation.override': {
    request: { billId: number; warningType: string; reason: string; userId: number };
    response: { success: boolean };
  };
  'ipc.consistency.scan': {
    request: void;
    response: { totalIssues: number; criticalIssues: number; fixableIssues: number; issues: Array<any>; summary: { stockMismatches: number; orphanBatches: number; paymentMismatches: number; ledgerInconsistencies: number; orphanPayments: number } };
  };
  'ipc.consistency.fixIssue': {
    request: { issue: any; userId?: number };
    response: { success: boolean; message: string; error?: string };
  };
  'ipc.consistency.autoFix': {
    request: { userId?: number };
    response: { totalFixed: number; totalFailed: number; results: Array<{ issue: any; success: boolean; message: string }> };
  };
  'ipc.report.mrPerformance': {
    request: { fromDate?: string; toDate?: string; mrId?: number } | undefined;
    response: { summary: { totalMRs: number; totalBills: number; totalSales: number; averageSalesPerMR: number }; byMR: Array<{ mrId: number; mrName: string; mrCode?: string; billCount: number; totalSales: number; averageBillValue: number; totalQuantity: number; uniqueCustomers: number; uniqueProducts: number }> };
  };
  'ipc.report.doctorROI': {
    request: { fromDate?: string; toDate?: string; doctorId?: number } | undefined;
    response: { summary: { totalDoctors: number; totalBills: number; totalSales: number; averageSalesPerDoctor: number; totalPrescriptionValue: number }; byDoctor: Array<{ doctorId: number; doctorName: string; doctorCode?: string; billCount: number; totalSales: number; averageBillValue: number; totalQuantity: number; uniqueProducts: number; prescriptionValue: number }> };
  };
  'ipc.report.outstandingAging': {
    request: { billType?: 'SALES' | 'PURCHASE'; customerId?: number; supplierId?: number; includePaid?: boolean } | undefined;
    response: Array<{ billId: number; billNumber: string; billDate: Date; customerName?: string; supplierName?: string; totalAmount: number; paidAmount: number; outstanding: number; daysOverdue: number; aging: { current: number; days30: number; days60: number; days90: number; days90Plus: number } }>;
  };
  'ipc.report.deadStock': {
    request: { minDays?: number; godownId?: number } | undefined;
    response: { deadStock: Array<any>; slowMoving: Array<any>; totalDeadStockValue: number; totalSlowMovingValue: number };
  };
  'ipc.report.expiryLoss': {
    request: { fromDate?: string; toDate?: string; supplierId?: number; productId?: number } | undefined;
    response: { totalLoss: number; byProduct: Array<any>; bySupplier: Array<any> };
  };
  'ipc.report.companyMargin': {
    request: { companyId?: number; fromDate?: string; toDate?: string } | undefined;
    response: Array<{ companyId: number; companyName: string; totalSales: number; totalCost: number; grossProfit: number; netProfit: number; profitMargin: number }>;
  };
  'ipc.report.purchaseVsSales': {
    request: { fromDate?: string; toDate?: string; productId?: number; companyId?: number } | undefined;
    response: { summary: { totalPurchaseValue: number; totalSalesValue: number; variance: number; variancePercent: number }; byProduct: Array<any>; byCompany: Array<any> };
  };
  'ipc.security.getSettings': {
    request: void;
    response: { dbEncryptionEnabled: boolean; autoLockEnabled: boolean; autoLockTimeoutMinutes: number; sessionTimeoutMinutes: number; loginAttemptLimit: number; loginAttemptWindowMinutes: number };
  };
  'ipc.security.updateSettings': {
    request: Partial<{ dbEncryptionEnabled: boolean; autoLockEnabled: boolean; autoLockTimeoutMinutes: number; sessionTimeoutMinutes: number; loginAttemptLimit: number; loginAttemptWindowMinutes: number }>;
    response: { dbEncryptionEnabled: boolean; autoLockEnabled: boolean; autoLockTimeoutMinutes: number; sessionTimeoutMinutes: number; loginAttemptLimit: number; loginAttemptWindowMinutes: number };
  };
  'ipc.security.trackActivity': {
    request: { userId: number };
    response: { success: boolean };
  };
  'ipc.security.checkSession': {
    request: { userId: number };
    response: { valid: boolean; info?: { isActive: boolean; loginTime?: Date; lastActivity?: Date; idleMinutes?: number } };
  };
  'ipc.security.clearSession': {
    request: { userId: number };
    response: { success: boolean };
  };
  'ipc.diagnostics.getInfo': {
    request: void;
    response: { appVersion: string; electronVersion: string; nodeVersion: string; platform: string; arch: string; dbPath: string; dbSize: number; dbExists: boolean; timestamp: string };
  };
  'ipc.diagnostics.exportLogs': {
    request: { outputPath: string };
    response: { filePath: string };
  };
  'ipc.diagnostics.exportDBSnapshot': {
    request: { outputPath: string };
    response: { filePath: string };
  };
  'ipc.diagnostics.getHealth': {
    request: void;
    response: { status: 'healthy' | 'degraded' | 'critical'; issues: string[]; warnings: string[]; database: { connected: boolean; size: number; lastBackup?: string }; disk: { freeSpace: number; totalSpace: number; usagePercent: number } };
  };
  'ipc.diagnostics.validateDB': {
    request: void;
    response: { valid: boolean; errors: string[]; warnings: string[] };
  };
  'ipc.diagnostics.getReport': {
    request: void;
    response: { info: any; health: any; integrity: any };
  };
  'ipc.diagnostics.isSafeMode': {
    request: void;
    response: { safeMode: boolean };
  };
  'ipc.diagnostics.isReadOnly': {
    request: void;
    response: { readOnly: boolean };
  };
  'ipc.migration.getVersion': {
    request: void;
    response: { version: string | null };
  };
  'ipc.migration.getStatus': {
    request: void;
    response: { currentVersion: string | null; pendingMigrations: Array<any>; appliedMigrations: string[] };
  };
  'ipc.migration.run': {
    request: { migrations?: Array<any> };
    response: { applied: number; skipped: number; errors: string[] };
  };
  'ipc.migration.validate': {
    request: { requiredVersion: string; migrations?: Array<any> };
    response: { compatible: boolean; currentVersion: string | null; requiredVersion: string; message: string };
  };
  'ipc.migration.getApplied': {
    request: void;
    response: Array<{ version: string; name: string; appliedAt: Date }>;
  };
  'ipc.billTemplate.validate': {
    request: { htmlContent: string; cssContent: string };
    response: { valid: boolean; errors: string[]; warnings: string[]; missingFields: string[] };
  };
  'ipc.billTemplate.isSystem': {
    request: { templateId: number };
    response: { isSystem: boolean };
  };
  'ipc.billTemplate.getVersions': {
    request: { templateId: number };
    response: Array<{ version: number; createdAt: Date; createdBy: number | null; createdByUser: string | null; changeNotes: string | null }>;
  };
  'ipc.billTemplate.restoreVersion': {
    request: { templateId: number; version: number; userId: number };
    response: { success: boolean };
  };
};

export type IpcChannel = keyof IpcChannelMap;

export type IpcInvoke = <T extends IpcChannel>(
  channel: T,
  payload: IpcChannelMap[T]['request']
) => Promise<IpcChannelMap[T]['response']>;

export interface ElectronBridge {
  invoke: IpcInvoke;
}

// Billing System Types
export interface BillLineInput {
  lineNumber: number;
  productId: number;
  batchId?: number;
  quantity: number;
  freeQuantity?: number;
  soldInStrips?: boolean;
  stripQuantity?: number;
  rate: number;
  discountPercent?: number;
  taxPercent: number;
}

export interface CreateBillRequest {
  billNumber?: string; // Auto-generated if not provided
  billType: 'SALES' | 'PURCHASE' | 'CREDIT_NOTE';
  billDate: string;
  dueDate?: string;
  billingType?: 'CASH' | 'CREDIT' | 'CHALLAN';
  customerId?: number;
  supplierId?: number;
  customerName?: string;
  supplierName?: string;
  customerGstin?: string;
  supplierGstin?: string;
  customerAddress?: string;
  supplierAddress?: string;
  customerPhone?: string;
  supplierPhone?: string;
  mrId?: number;
  doctorId?: number;
  challanNumber?: string;
  orderNumber?: string;
  remarks?: string;
  notes?: string;
  templateId?: number;
  lines: BillLineInput[];
}

export interface BillLineDTO {
  id: number;
  lineNumber: number;
  productId: number;
  batchId?: number;
  productName: string;
  hsnCode: string;
  manufacturer?: string;
  packSize?: string;
  unitOfMeasure?: string;
  batchNumber?: string;
  expiryDate?: string;
  quantity: number;
  freeQuantity: number;
  soldInStrips: boolean;
  stripQuantity?: number;
  mrp: number;
  ptr: number;
  pts?: number;
  rate: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  cgstPercent: number;
  sgstPercent: number;
  igstPercent: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxableAmount: number;
  lineTotal: number;
  savingPercent?: number;
  savingValue?: number;
}

export interface BillDTO {
  id: number;
  billNumber: string;
  billType: string;
  billDate: string;
  dueDate?: string;
  status: string;
  paymentStatus: string;
  billingType?: string;
  customerId?: number;
  supplierId?: number;
  customerName?: string;
  supplierName?: string;
  customerGstin?: string;
  supplierGstin?: string;
  customerAddress?: string;
  supplierAddress?: string;
  customerPhone?: string;
  supplierPhone?: string;
  mrId?: number;
  mrName?: string;
  doctorId?: number;
  doctorName?: string;
  challanNumber?: string;
  orderNumber?: string;
  remarks?: string;
  notes?: string;
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  roundOff: number;
  totalAmount: number;
  paidAmount: number;
  templateId?: number;
  finalizedAt?: string;
  finalizedBy?: number;
  cancelledAt?: string;
  cancelledBy?: number;
  cancellationReason?: string;
  lines: BillLineDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateBillTemplateRequest {
  name: string;
  description?: string;
  templateType: 'A4' | 'THERMAL_3INCH';
  htmlContent: string;
  cssContent: string;
  placeholders?: string[];
  isDefault?: boolean;
  // Visual layout definition (for VISUAL mode templates)
  layoutJson?: any;
  editorMode?: 'VISUAL' | 'ADVANCED' | 'LEGACY';
  generatedHtml?: string;
}

export interface BillTemplateDTO {
  id: number;
  name: string;
  description?: string;
  templateType: string;
  isDefault: boolean;
  version: number;
  htmlContent: string;
  cssContent: string;
  placeholders?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
  updatedBy?: number;
  // Visual layout fields (may be undefined for legacy/advanced-only templates)
  layoutJson?: any;
  generatedHtml?: string;
  editorMode?: 'VISUAL' | 'ADVANCED' | 'LEGACY';
}

export interface CreateBillPaymentRequest {
  billId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber?: string;
  chequeNumber?: string;
  bank?: string;
  chequeIssueDate?: string;
  notes?: string;
}

export interface BillPaymentDTO {
  id: number;
  billId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber?: string;
  chequeNumber?: string;
  bank?: string;
  chequeIssueDate?: string;
  isCleared?: boolean;
  clearedDate?: string;
  bouncedDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

