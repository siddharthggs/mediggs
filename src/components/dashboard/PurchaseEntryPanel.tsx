// FILE: src/components/dashboard/PurchaseEntryPanel.tsx
/// ANCHOR: PurchaseEntryPanel
import { FormEvent, useEffect, useMemo, useState } from 'react';
import type {
  CreatePurchaseRequest,
  ProductDTO,
  PurchaseInvoiceDTO,
  SupplierDTO
} from '@shared/ipc';
import { invoke } from '../../api/ipcClient';

const makeEmptyItem = () => ({
  productId: 0,
  batchNumber: '',
  expiryDate: '',
  quantity: 0,
  freeQuantity: 0,
  costPrice: 0,
  taxPercent: 0,
  mrp: 0
});

const PurchaseEntryPanel = () => {
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierDTO[]>([]);
  const [invoices, setInvoices] = useState<PurchaseInvoiceDTO[]>([]);
  const [items, setItems] = useState([makeEmptyItem()]);
  const [form, setForm] = useState({
    invoiceNumber: '',
    supplierId: 0,
    supplierName: '',
    invoiceDate: new Date().toISOString().substring(0, 10)
  });
  const [loading, setLoading] = useState(false);

  // Treat only non-empty rows as valid line items
  const isItemFilled = (item: ReturnType<typeof makeEmptyItem>) =>
    item.productId > 0 &&
    item.quantity > 0 &&
    !!item.batchNumber &&
    !!item.expiryDate;

  const validItems = useMemo(
    () => items.some(isItemFilled),
    [items]
  );

  const loadMasterData = async () => {
    const [productList, supplierList, purchaseHistory] = await Promise.all([
      invoke('ipc.product.list', { page: 1, pageSize: 1000 }).then(r => 'products' in r ? r.products : r),
      invoke('ipc.supplier.list', undefined),
      invoke('ipc.purchase.list', undefined)
    ]);
    // some IPC handlers return a wrapper { products: ProductDTO[], ... }
    // normalize to the raw arrays before setting state
    const productsArray: ProductDTO[] = Array.isArray(productList)
      ? productList
      : (productList as any).products ?? [];
    const suppliersArray: SupplierDTO[] = Array.isArray(supplierList)
      ? supplierList
      : (supplierList as any).suppliers ?? [];
    const invoicesArray: PurchaseInvoiceDTO[] = Array.isArray(purchaseHistory)
      ? purchaseHistory
      : (purchaseHistory as any).invoices ?? purchaseHistory ?? [];

    setProducts(productsArray);
    setSuppliers(suppliersArray);
    setInvoices(invoicesArray);
  };

  useEffect(() => {
    loadMasterData().catch(console.error);
  }, []);

  const updateItem = (index: number, field: string, value: string | number) => {
    setItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  };

  const addItemRow = () => setItems((prev) => [...prev, makeEmptyItem()]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validItems) {
      alert('Please add at least one valid line item before saving.');
      return;
    }
    setLoading(true);
    try {
      // Only send filled rows to backend
      const filledItems = items.filter(isItemFilled);

      const payload: CreatePurchaseRequest = {
        invoiceNumber: form.invoiceNumber,
        supplierId: form.supplierId > 0 ? form.supplierId : undefined,
        supplierName: form.supplierName || suppliers.find(s => s.id === form.supplierId)?.name || '',
        invoiceDate: form.invoiceDate,
        items: filledItems.map((item) => ({
          ...item,
          taxPercent: Number(item.taxPercent),
          quantity: Number(item.quantity),
          freeQuantity: Number(item.freeQuantity),
          costPrice: Number(item.costPrice),
          mrp: Number(item.mrp)
        }))
      };
      await invoke('ipc.purchase.create', payload);
      setForm({
        invoiceNumber: '',
        supplierId: 0,
        supplierName: '',
        invoiceDate: new Date().toISOString().substring(0, 10)
      });
      setItems([makeEmptyItem()]);
      await loadMasterData();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create purchase invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Purchase / GRN</h2>
          <p>Capture supplier invoices and update stock</p>
        </div>
      </header>
      <div className="panel__body">
        <form className="purchase-form" onSubmit={handleSubmit}>
          <div className="purchase-form__meta">
            <input
              placeholder="Invoice #"
              value={form.invoiceNumber}
              onChange={(event) =>
                setForm({ ...form, invoiceNumber: event.target.value })
              }
              required
            />
            <select
              value={form.supplierId}
              onChange={(event) => {
                const supplierId = Number(event.target.value);
                const supplier = suppliers.find(s => s.id === supplierId);
                setForm({ 
                  ...form, 
                  supplierId,
                  supplierName: supplier?.name || ''
                });
              }}
              required
            >
              <option value={0}>Select or enter supplier name</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
            {form.supplierId === 0 && (
              <input
                placeholder="New Supplier Name"
                value={form.supplierName}
                onChange={(event) =>
                  setForm({ ...form, supplierName: event.target.value })
                }
                required={form.supplierId === 0}
              />
            )}
            <input
              type="date"
              value={form.invoiceDate}
              onChange={(event) =>
                setForm({ ...form, invoiceDate: event.target.value })
              }
              required
            />
          </div>
          <div className="purchase-form__items">
            {items.map((item, index) => {
              const product = products.find(p => p.id === item.productId);
              const itemTotal = (item.costPrice * item.quantity) + ((item.costPrice * item.quantity) * (item.taxPercent / 100));
              return (
              <div key={index} className="purchase-form__items-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', alignItems: 'center' }}>
                <div className="field">
                  <label>Product</label>
                  <select
                    value={item.productId}
                    onChange={(e) => {
                      const productId = Number(e.target.value);
                      const product = products.find(p => p.id === productId);
                      updateItem(index, 'productId', productId);
                      if (product) {
                        updateItem(index, 'taxPercent', product.gstRate);
                        // Auto-fill MRP and cost price from latest batch if available
                        if (product.batches && product.batches.length > 0) {
                          const latestBatch = product.batches[0];
                          updateItem(index, 'mrp', latestBatch.mrp);
                          updateItem(index, 'costPrice', latestBatch.ptr);
                        }
                      }
                    }}
                    required
                  >
                    <option value={0}>Select product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku}) {product.manufacturer ? `- ${product.manufacturer}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Batch</label>
                  <input
                    type="text"
                    placeholder="Batch #"
                    value={item.batchNumber}
                    onChange={(e) => updateItem(index, 'batchNumber', e.target.value)}
                    required
                  />
                </div>

                <div className="field">
                  <label>Expiry</label>
                  <input
                    type="date"
                    value={item.expiryDate}
                    onChange={(e) => updateItem(index, 'expiryDate', e.target.value)}
                    required
                  />
                </div>

                <div className="field">
                  <label>Qty</label>
                  <input
                    type="number"
                    min="0"
                    value={item.quantity || ''}
                    onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                    required
                  />
                </div>

                <div className="field">
                  <label>Free</label>
                  <input
                    type="number"
                    min="0"
                    value={item.freeQuantity || ''}
                    onChange={(e) => updateItem(index, 'freeQuantity', Number(e.target.value))}
                  />
                </div>

                <div className="field">
                  <label>Cost</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.costPrice || ''}
                    onChange={(e) => updateItem(index, 'costPrice', Number(e.target.value))}
                    required
                  />
                </div>

                <div className="field">
                  <label>GST%</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={item.taxPercent || ''}
                    onChange={(e) => updateItem(index, 'taxPercent', Number(e.target.value))}
                    required
                  />
                </div>

                <div className="field">
                  <label>MRP</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.mrp || ''}
                    onChange={(e) => updateItem(index, 'mrp', Number(e.target.value))}
                    required
                  />
                </div>
              </div>
            ); })}
            <button type="button" className="link-btn" onClick={addItemRow}>
              + Add line
            </button>
          </div>
          {(() => {
            const subtotal = items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
            const totalFree = items.reduce((sum, item) => sum + item.freeQuantity, 0);
            const totalTax = items.reduce((sum, item) => {
              const base = item.costPrice * item.quantity;
              return sum + (base * (item.taxPercent / 100));
            }, 0);
            const grandTotal = subtotal + totalTax;
            return (
              <div
                className="card"
                style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '1rem'
                }}
              >
                <div>
                  <strong>Subtotal:</strong> ₹{subtotal.toFixed(2)}
                </div>
                <div>
                  <strong>Total Free Qty:</strong> {totalFree}
                </div>
                <div>
                  <strong>Total Tax:</strong> ₹{totalTax.toFixed(2)}
                </div>
                <div>
                  <strong>Grand Total:</strong> ₹{grandTotal.toFixed(2)}
                </div>
              </div>
            );
          })()}
          <button
            className="purchase-form__submit"
            type="submit"
            disabled={loading || !validItems}
            style={{ marginTop: '1rem' }}
          >
            {loading ? 'Saving...' : 'Save Purchase'}
          </button>
        </form>
        <div className="purchase-history">
          <h3>Recent Purchases</h3>
          <ul>
            {invoices.length === 0 ? (
              <li className="empty">No invoices yet</li>
            ) : (
              invoices.map((invoice) => (
                <li key={invoice.id}>
                  <strong>{invoice.invoiceNumber}</strong>
                  <span>{invoice.supplierName}</span>
                  <span>{new Date(invoice.invoiceDate).toLocaleDateString()}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default PurchaseEntryPanel;

