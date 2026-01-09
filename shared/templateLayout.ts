// FILE: shared/templateLayout.ts
// Shared types for visual bill template layout JSON

export type TemplatePageSize = 'A4' | 'THERMAL_80MM';

export interface TemplateMargins {
  top: number; // in mm
  right: number; // in mm
  bottom: number; // in mm
  left: number; // in mm
}

export interface BillLayoutMeta {
  templateType: 'A4' | 'THERMAL_3INCH';
  pageSize: TemplatePageSize;
  margins: TemplateMargins;
  lineHeight: number;
  fontFamily: string;
  baseFontSize: number;
}

export type BlockType =
  | 'companyHeader'
  | 'customerDetails'
  | 'invoiceMeta'
  | 'itemsTable'
  | 'taxSummary'
  | 'totals'
  | 'footer';

export interface BaseBlockDefinition {
  id: string;
  type: BlockType;
  order: number;
  visible: boolean;
}

export interface CompanyHeaderBlock extends BaseBlockDefinition {
  type: 'companyHeader';
  props: {
    align: 'left' | 'center' | 'right';
    showLogo: boolean;
    showDLNumbers: boolean;
    showFssai: boolean;
    fontSize?: number;
  };
}

export interface CustomerDetailsBlock extends BaseBlockDefinition {
  type: 'customerDetails';
  props: {
    title: string;
    showAddress: boolean;
    showGstin: boolean;
    showDlNumbers: boolean;
  };
}

export interface InvoiceMetaBlock extends BaseBlockDefinition {
  type: 'invoiceMeta';
  props: {
    showBillNumber: boolean;
    showBillDate: boolean;
    showDueDate: boolean;
    showChallan: boolean;
    showOrderNumber: boolean;
  };
}

export interface ItemsTableColumnDefinition {
  id: string;
  label: string;
  binding: string; // e.g. "this.productName"
  visible: boolean;
  width?: number; // percentage
  align?: 'left' | 'center' | 'right';
}

export interface ItemsTableBlock extends BaseBlockDefinition {
  type: 'itemsTable';
  props: {
    columns: ItemsTableColumnDefinition[];
    showTotalsRow: boolean;
    quantityDisplayMode: 'STRIP_TABLET' | 'SINGLE';
  };
}

export interface TaxSummaryBlock extends BaseBlockDefinition {
  type: 'taxSummary';
  props: {
    showGstSummary: boolean;
  };
}

export interface TotalsBlock extends BaseBlockDefinition {
  type: 'totals';
  props: {
    showSubtotal: boolean;
    showDiscount: boolean;
    showTax: boolean;
    showRoundOff: boolean;
    showGrandTotal: boolean;
  };
}

export interface FooterBlock extends BaseBlockDefinition {
  type: 'footer';
  props: {
    termsText?: string;
    showSignatureArea: boolean;
  };
}

export type BlockDefinition =
  | CompanyHeaderBlock
  | CustomerDetailsBlock
  | InvoiceMetaBlock
  | ItemsTableBlock
  | TaxSummaryBlock
  | TotalsBlock
  | FooterBlock;

export interface BillLayoutDefinition {
  meta: BillLayoutMeta;
  blocks: BlockDefinition[];
}
