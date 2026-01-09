// FILE: src/components/templates/VisualBillTemplateBuilder.tsx
/// ANCHOR: VisualBillTemplateBuilder

import { useMemo } from 'react';
import type { BillLayoutDefinition, BlockDefinition } from '@shared/templateLayout';

export interface VisualBillTemplateBuilderProps {
  layout: BillLayoutDefinition | null;
  onChange: (next: BillLayoutDefinition | null) => void;
  templateType: 'A4' | 'THERMAL_3INCH';
}

const createDefaultLayout = (templateType: 'A4' | 'THERMAL_3INCH'): BillLayoutDefinition => ({
  meta: {
    templateType,
    pageSize: templateType === 'A4' ? 'A4' : 'THERMAL_80MM',
    margins: { top: 10, right: 10, bottom: 10, left: 10 },
    lineHeight: 1.2,
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    baseFontSize: 11,
  },
  blocks: [
    { id: 'company', type: 'companyHeader', order: 1, visible: true, props: { align: 'center', showLogo: false, showDLNumbers: true, showFssai: true } },
    { id: 'customer', type: 'customerDetails', order: 2, visible: true, props: { title: 'Bill To', showAddress: true, showGstin: true, showDlNumbers: true } },
    { id: 'meta', type: 'invoiceMeta', order: 3, visible: true, props: { showBillNumber: true, showBillDate: true, showDueDate: true, showChallan: true, showOrderNumber: true } },
    {
      id: 'items',
      type: 'itemsTable',
      order: 4,
      visible: true,
      props: {
        columns: [
          { id: 'sr', label: 'Sr', binding: 'lineNumber', visible: true },
          { id: 'hsn', label: 'HSN', binding: 'hsnCode', visible: true },
          { id: 'product', label: 'Product', binding: 'productName', visible: true },
          { id: 'batch', label: 'Batch', binding: 'batchNumber', visible: true },
          { id: 'exp', label: 'Exp', binding: 'expiryDate', visible: true },
          { id: 'qty', label: 'Qty', binding: 'quantity', visible: true },
          { id: 'rate', label: 'Rate', binding: 'rate', visible: true },
          { id: 'gst', label: 'GST %', binding: 'taxPercent', visible: true },
          { id: 'amount', label: 'Amount', binding: 'lineTotal', visible: true },
        ],
        showTotalsRow: true,
        quantityDisplayMode: 'SINGLE',
      },
    },
    { id: 'totals', type: 'totals', order: 5, visible: true, props: { showSubtotal: true, showDiscount: true, showTax: true, showRoundOff: true, showGrandTotal: true } },
    { id: 'footer', type: 'footer', order: 6, visible: true, props: { termsText: 'Subject to jurisdiction. E. & O.E.', showSignatureArea: true } },
  ] as BlockDefinition[],
});

const VisualBillTemplateBuilder = ({ layout, onChange, templateType }: VisualBillTemplateBuilderProps) => {
  const effectiveLayout = useMemo(() => layout ?? createDefaultLayout(templateType), [layout, templateType]);

  const handleReset = () => {
    onChange(createDefaultLayout(templateType));
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 260px', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
      {/* Left: Block palette */}
      <div className="card" style={{ alignSelf: 'stretch' }}>
        <div className="card-header">
          <h4 className="card-title">Blocks</h4>
          <p className="card-subtitle">High-level sections of the invoice</p>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {effectiveLayout.blocks
            .slice()
            .sort((a, b) => a.order - b.order)
            .map(block => (
              <div
                key={block.id}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border-subtle)',
                  background: block.visible ? 'var(--color-bg-secondary)' : 'var(--color-bg-elevated)',
                  fontSize: '0.875rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>{block.type}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>#{block.order}</span>
              </div>
            ))}
          <button type="button" onClick={handleReset} className="btn btn-xs btn-outline" style={{ marginTop: '0.5rem' }}>
            Reset to default layout
          </button>
        </div>
      </div>

      {/* Center: Preview placeholder */}
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Layout Preview</h4>
          <p className="card-subtitle">Structure preview (live HTML preview is shown on the right in the main editor)</p>
        </div>
        <div className="card-body" style={{ minHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', fontSize: '0.875rem' }}>
          Visual layout builder skeleton. Drag & drop and field pickers will be added here.
        </div>
      </div>

      {/* Right: Global settings placeholder */}
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Print Settings</h4>
          <p className="card-subtitle">Page size, margins and fonts (upcoming)</p>
        </div>
        <div className="card-body" style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <div><strong>Page size</strong>: {effectiveLayout.meta.pageSize}</div>
          </div>
          <div>
            This is an initial skeleton. Next iterations will let you adjust margins, fonts, and per-block styles, and wire smart field pickers.
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualBillTemplateBuilder;
