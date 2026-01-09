// FILE: src/components/dashboard/SalesEntryPanel.tsx
/// ANCHOR: SalesEntryPanel
import { FormEvent, useEffect, useState } from 'react';
import type {
  CreateSalesRequest,
  CustomerDTO,
  ProductDTO,
  SalesInvoiceDTO
} from '@shared/ipc';
import { invoke } from '../../api/ipcClient';
import { useToast } from '../../utils/toast';
import { safeInvoke } from '../../utils/safeInvoke';
import { forceRecoverUI } from '../../utils/forceRecover';

interface MR {
  id: number;
  name: string;
  code?: string;
}

interface Doctor {
  id: number;
  name: string;
  code?: string;
}

const SalesEntryPanel = () => {
  const { showError, showSuccess } = useToast();
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [customers, setCustomers] = useState<CustomerDTO[]>([]);
  const [mrs, setMRs] = useState<MR[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [invoices, setInvoices] = useState<SalesInvoiceDTO[]>([]);
  const [form, setForm] = useState({
    invoiceNumber: '', // FIX: Will be auto-generated, user cannot edit
    invoiceDate: new Date().toISOString().substring(0, 10),
    customerId: 0,
    mrId: 0,
    doctorId: 0,
    paymentMethod: 'CASH' as 'CASH' | 'CREDIT' | 'CHALLAN' | 'BANK_TRANSFER' | 'UPI',
    receiptNumber: '',
    transactionId: '',
    challanNumber: '',
  });
  const [items, setItems] = useState([{
    productId: 0,
    batchId: 0,
    quantity: 1,
    soldInStrips: false,
    salePrice: 0,
    taxPercent: 0,
    discountPercent: 0
  }]);
  const [productSearch, setProductSearch] = useState(['']);
  const [loading, setLoading] = useState(false);

  const loadMasters = async () => {
    try {
      // FIX: Use safeInvoke to prevent UI freezing on errors
      const [productResponse, customerList, salesList, mrList, doctorList] = await Promise.all([
        safeInvoke('ipc.product.list', { page: 1, pageSize: 1000 }),
        safeInvoke('ipc.customer.list', undefined),
        safeInvoke('ipc.sales.list', undefined),
        safeInvoke('ipc.mr.list', undefined),
        safeInvoke('ipc.doctor.list', undefined)
      ]);
      
      // Handle responses - check for errors
      if (productResponse.success && productResponse.data) {
        const productList = 'products' in productResponse.data ? productResponse.data.products : productResponse.data;
        setProducts(Array.isArray(productList) ? productList : []);
      } else {
        showError(productResponse.error || 'Failed to load products');
      }
      
      if (customerList.success && customerList.data) {
        setCustomers(customerList.data);
      }
      if (salesList.success && salesList.data) {
        setInvoices(salesList.data);
      }
      if (mrList.success && mrList.data) {
        setMRs(mrList.data);
      }
      if (doctorList.success && doctorList.data) {
        setDoctors(doctorList.data);
      }
    } catch (error) {
      console.error('Error loading masters:', error);
      showError('Failed to load data. Please try again.');
    }
  };

  useEffect(() => {
    loadMasters().catch(console.error);
  }, []);

  const updateItem = (index: number, field: string, value: number | boolean) => {
    setItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
    setProductSearch((prev) => {
      const newSearch = [...prev];
      newSearch[index] = '';
      return newSearch;
    });
  };

  const handleProductSearch = async (index: number, query: string) => {
    setProductSearch((prev) => {
      const newSearch = [...prev];
      newSearch[index] = query;
      return newSearch;
    });

    if (query.length >= 2) {
      try {
        const result = await invoke('ipc.search.barcode', { code: query });
        if (result.found && result.product) {
          const product = products.find(p => p.id === result.product!.id);
          if (product) {
            updateItem(index, 'productId', product.id);
            updateItem(index, 'taxPercent', product.gstRate);
            if (result.batch) {
              updateItem(index, 'batchId', result.batch.id);
              updateItem(index, 'salePrice', result.batch.mrp);
            } else if (product.batches && product.batches.length > 0) {
              // Auto-select first batch if only one exists
              const batch = product.batches[0];
              updateItem(index, 'batchId', batch.id);
              updateItem(index, 'salePrice', batch.mrp);
            }
            // Auto-detect strip quantity
            if (product.stripQuantity && product.stripQuantity > 1) {
              updateItem(index, 'soldInStrips', true);
            }
          }
        }
      } catch (error) {
        // Fallback to regular product search
        const product = products.find(p =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.sku.toLowerCase().includes(query.toLowerCase()) ||
          p.barcode?.toLowerCase().includes(query.toLowerCase()) ||
          p.stripCode?.toLowerCase().includes(query.toLowerCase()) ||
          p.itemCode?.toLowerCase().includes(query.toLowerCase())
        );
        if (product) {
          updateItem(index, 'productId', product.id);
          updateItem(index, 'taxPercent', product.gstRate);
          if (product.batches && product.batches.length === 1) {
            const batch = product.batches[0];
            updateItem(index, 'batchId', batch.id);
            updateItem(index, 'salePrice', batch.mrp);
          }
        }
      }
    }
  };

  const addItemRow = () => {
    setItems((prev) => [...prev, {
      productId: 0,
      batchId: 0,
      quantity: 1,
      soldInStrips: false,
      salePrice: 0,
      taxPercent: 0,
      discountPercent: 0
    }]);
    setProductSearch((prev) => [...prev, '']);
  };

  const removeItemRow = (index: number) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const isItemFilled = (item: typeof items[0]) =>
    item.productId > 0 && item.quantity > 0 && item.salePrice > 0;

  const validItems = items.some(isItemFilled);

  const calculateItemTotal = (item: typeof items[0]) => {
    const product = products.find(p => p.id === item.productId);
    if (!product) return 0;
    const base = item.salePrice * item.quantity;
    const discount = base * (item.discountPercent / 100);
    const taxable = base - discount;
    const tax = taxable * (item.taxPercent / 100);
    return taxable + tax;
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.salePrice * item.quantity), 0);
    const totalDiscount = items.reduce((sum, item) => {
      const base = item.salePrice * item.quantity;
      return sum + (base * (item.discountPercent / 100));
    }, 0);
    const totalTax = items.reduce((sum, item) => {
      const base = item.salePrice * item.quantity;
      const discount = base * (item.discountPercent / 100);
      const taxable = base - discount;
      return sum + (taxable * (item.taxPercent / 100));
    }, 0);
    const grandTotal = subtotal - totalDiscount + totalTax;
    return { subtotal, totalDiscount, totalTax, grandTotal };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // FIX: Local validation - show error but don't freeze UI
    if (!form.customerId || !validItems) {
      showError('Please select a customer and add at least one valid line item.');
      return;
    }
    
    setLoading(true);
    try {
      const totals = calculateTotals();
      // Map payment method to billing type: BANK_TRANSFER and UPI are treated as CASH
      const billingType: 'CASH' | 'CREDIT' | 'CHALLAN' = 
        form.paymentMethod === 'BANK_TRANSFER' || form.paymentMethod === 'UPI' 
          ? 'CASH' 
          : form.paymentMethod as 'CASH' | 'CREDIT' | 'CHALLAN';
      
      const filledItems = items.filter(isItemFilled);

      // FIX: Validate payment method fields locally
      if (form.paymentMethod === 'BANK_TRANSFER' && !form.receiptNumber.trim()) {
        showError('Receipt Number is required for Bank Transfer');
        setLoading(false);
        return;
      }
      if (form.paymentMethod === 'UPI' && !form.transactionId.trim()) {
        showError('Transaction ID is required for UPI');
        setLoading(false);
        return;
      }

      const payload: CreateSalesRequest = {
        invoiceNumber: '', // FIX: Empty string - backend will auto-generate
        invoiceDate: form.invoiceDate,
        customerId: form.customerId,
        mrId: form.mrId > 0 ? form.mrId : undefined,
        doctorId: form.doctorId > 0 ? form.doctorId : undefined,
        billingType,
        challanNumber: form.challanNumber || undefined,
        items: filledItems.map((item) => {
          const product = products.find(p => p.id === item.productId);
          return {
            productId: item.productId,
            batchId: item.batchId > 0 ? item.batchId : undefined,
            quantity: Number(item.quantity),
            soldInStrips: item.soldInStrips,
            stripQuantity: product?.stripQuantity ?? undefined,
            salePrice: Number(item.salePrice),
            taxPercent: Number(item.taxPercent),
            discountPercent: Number(item.discountPercent)
          };
        })
      };
      
      // FIX: Use safeInvoke - never throws, always returns structured response
      const result = await safeInvoke('ipc.sales.create', payload);
      
      if (!result.success) {
        showError(result.error || 'Failed to create sales invoice');
        // FIX: Keep form editable - don't reset on error
        return;
      }
      
      const invoice = result.data!;
      
      // Create payment record if payment method is Bank Transfer or UPI
      if (form.paymentMethod === 'BANK_TRANSFER' || form.paymentMethod === 'UPI') {
        const paymentResult = await safeInvoke('ipc.payment.create', {
          salesInvoiceId: invoice.id,
          amount: totals.grandTotal,
          paymentDate: form.invoiceDate,
          paymentMethod: form.paymentMethod,
          referenceNumber: form.paymentMethod === 'BANK_TRANSFER' ? form.receiptNumber : form.transactionId,
          notes: form.paymentMethod === 'BANK_TRANSFER' 
            ? `Bank Transfer - Receipt No: ${form.receiptNumber}`
            : `UPI - Transaction ID: ${form.transactionId}`
        });
        
        if (!paymentResult.success) {
          showError(paymentResult.error || 'Invoice created but payment record failed');
          // Continue - invoice is created, payment can be added later
        }
      }
      
      // Only reset form on success
      showSuccess(`Invoice ${invoice.invoiceNumber} created successfully`);
      setForm({
        invoiceNumber: '',
        invoiceDate: new Date().toISOString().substring(0, 10),
        customerId: 0,
        mrId: 0,
        doctorId: 0,
        paymentMethod: 'CASH' as 'CASH' | 'CREDIT' | 'CHALLAN' | 'BANK_TRANSFER' | 'UPI',
        receiptNumber: '',
        transactionId: '',
        challanNumber: '',
      });
      setItems([{
        productId: 0,
        batchId: 0,
        quantity: 1,
        soldInStrips: false,
        salePrice: 0,
        taxPercent: 0,
        discountPercent: 0
      }]);
      setProductSearch(['']);
      await loadMasters();
    } catch (error) {
      // FIX: Catch any unexpected errors - should not happen with safeInvoke
      console.error('Unexpected error in handleSubmit:', error);
      showError(error instanceof Error ? error.message : 'Failed to create sales invoice');
      // FIX: Immediately recover UI to prevent input lock
      forceRecoverUI();
      // FIX: Keep form editable - don't reset on error
    } finally {
      // FIX: Always release loading state
      setLoading(false);
      // FIX: Ensure UI is recovered even if error occurred
      forceRecoverUI();
    }
  };

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Sales Invoice</h2>
          <p>Ultra-fast billing with auto-fill and smart search</p>
        </div>
      </header>
      <div className="panel__body">
        <form className="purchase-form" onSubmit={handleSubmit}>
          <div className="purchase-form__meta" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              placeholder="Auto-generated"
              value="Auto-generated"
              readOnly
              disabled
              style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
              title="Invoice number is automatically generated"
            />
            <select
              value={form.customerId}
              onChange={(event) =>
                setForm({ ...form, customerId: Number(event.target.value) })
              }
              required
            >
              <option value={0}>Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={form.invoiceDate}
              onChange={(event) =>
                setForm({ ...form, invoiceDate: event.target.value })
              }
              required
            />
            <select
              value={form.paymentMethod}
              onChange={(event) => {
                const newMethod = event.target.value as 'CASH' | 'CREDIT' | 'CHALLAN' | 'BANK_TRANSFER' | 'UPI';
                setForm({ 
                  ...form, 
                  paymentMethod: newMethod,
                  receiptNumber: '',
                  transactionId: '',
                  challanNumber: ''
                });
              }}
            >
              <option value="CASH">Cash</option>
              <option value="CREDIT">Credit</option>
              <option value="CHALLAN">Challan</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="UPI">UPI</option>
            </select>
            {form.paymentMethod === 'CHALLAN' && (
              <input
                placeholder="Challan Number"
                value={form.challanNumber}
                onChange={(event) =>
                  setForm({ ...form, challanNumber: event.target.value })
                }
              />
            )}
            {form.paymentMethod === 'BANK_TRANSFER' && (
              <input
                placeholder="Receipt No *"
                value={form.receiptNumber}
                onChange={(event) =>
                  setForm({ ...form, receiptNumber: event.target.value })
                }
                required
              />
            )}
            {form.paymentMethod === 'UPI' && (
              <input
                placeholder="Transaction ID *"
                value={form.transactionId}
                onChange={(event) =>
                  setForm({ ...form, transactionId: event.target.value })
                }
                required
              />
            )}
          </div>
          <div className="purchase-form__items">
            {items.map((item, index) => {
              const product = products.find(p => p.id === item.productId);
              const batches = product?.batches || [];
              const itemTotal = calculateItemTotal(item);
              return (
                <div
                  key={index}
                  className="purchase-form__items-row"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: '0.75rem'
                  }}
                >
                  <div
                    className="field"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                      gridColumn: '1 / -1'
                    }}
                  >
                    <label>Product</label>
                    <input
                      type="text"
                      placeholder="Search product (name/barcode/strip code/item code)"
                      value={productSearch[index] || ''}
                      onChange={(e) => handleProductSearch(index, e.target.value)}
                      onFocus={() => {
                        if (!productSearch[index] && product) {
                          setProductSearch((prev) => {
                            const newSearch = [...prev];
                            newSearch[index] = product.name;
                            return newSearch;
                          });
                        }
                      }}
                      style={{ marginBottom: '0.25rem' }}
                    />
                    <select
                      value={item.productId}
                      onChange={async (event) => {
                        const productId = Number(event.target.value);
                        if (productId <= 0) {
                          updateItem(index, 'productId', 0);
                          return;
                        }
                        
                        try {
                          // Backend-driven autofill: fetch product with FEFO batches
                          const product = await invoke('ipc.product.get', { id: productId });
                          
                          updateItem(index, 'productId', productId);
                          updateItem(index, 'taxPercent', product.gstRate);
                          
                          // Auto-select first FEFO batch (earliest expiry, non-expired)
                          if (product.batches && product.batches.length > 0) {
                            const fefoBatch = product.batches[0]; // Already sorted by expiry (FEFO)
                            updateItem(index, 'batchId', fefoBatch.id);
                            updateItem(index, 'salePrice', fefoBatch.mrp);
                          } else if (product.isBatchManaged) {
                            // No batches available - warn user
                            alert(`No available batches for ${product.name}. Please check stock.`);
                            updateItem(index, 'batchId', 0);
                          }
                          
                          // Auto-detect strip quantity
                          if (product.stripQuantity && product.stripQuantity > 1) {
                            updateItem(index, 'soldInStrips', true);
                          }
                          
                          // Set default MRP/PTR if no batch selected
                          if (!product.batches || product.batches.length === 0) {
                            // Use product defaults if available (would need to extend ProductDTO)
                            // For now, keep existing salePrice
                          }
                        } catch (error) {
                          console.error('Error loading product details:', error);
                          alert(error instanceof Error ? error.message : 'Failed to load product details');
                          updateItem(index, 'productId', 0);
                        }
                      }}
                      required
                    >
                      <option value={0}>Select Product</option>
                      {products.map((p) => (
                        <option value={p.id} key={p.id}>
                          {p.name} ({p.sku}){' '}
                          {p.manufacturer ? `- ${p.manufacturer}` : ''}
                        </option>
                      ))}
                    </select>
                    {product && batches.length > 0 && (
                      <select
                        value={item.batchId}
                        onChange={(event) => {
                          const batchId = Number(event.target.value);
                          const batch = batches.find((b) => b.id === batchId);
                          updateItem(index, 'batchId', batchId);
                          if (batch) {
                            updateItem(index, 'salePrice', batch.mrp);
                          }
                        }}
                      >
                        <option value={0}>Auto-select (FEFO)</option>
                        {batches.map((batch) => (
                          <option key={batch.id} value={batch.id}>
                            {batch.batchNumber} - Qty: {batch.quantity} - Exp:{' '}
                            {new Date(batch.expiryDate).toLocaleDateString()} -
                            MRP: {batch.mrp}
                          </option>
                        ))}
                      </select>
                    )}
                    {product && product.stripQuantity && product.stripQuantity > 1 && (
                      <label style={{ fontSize: '0.9em' }}>
                        <input
                          type="checkbox"
                          checked={item.soldInStrips}
                          onChange={(e) =>
                            updateItem(index, 'soldInStrips', e.target.checked)
                          }
                        />
                        Sell in Strips ({product.stripQuantity} tablets/strip)
                      </label>
                    )}
                  </div>
                  <div className="field">
                    <label>Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity || ''}
                      onChange={(event) =>
                        updateItem(index, 'quantity', Number(event.target.value))
                      }
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Price</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.salePrice || ''}
                      onChange={(event) =>
                        updateItem(index, 'salePrice', Number(event.target.value))
                      }
                      required
                    />
                  </div>
                  <div className="field">
                    <label>GST%</label>
                    <input
                      type="number"
                      min={0}
                      step="0.1"
                      value={item.taxPercent || ''}
                      onChange={(event) =>
                        updateItem(index, 'taxPercent', Number(event.target.value))
                      }
                    />
                  </div>
                  <div className="field">
                    <label>Disc%</label>
                    <input
                      type="number"
                      min={0}
                      step="0.1"
                      value={item.discountPercent || ''}
                      onChange={(event) =>
                        updateItem(
                          index,
                          'discountPercent',
                          Number(event.target.value)
                        )
                      }
                    />
                  </div>
                  <div className="field" style={{ gridColumn: 'span 2' }}>
                    <label>Total</label>
                    <div style={{ fontWeight: 'bold' }}>
                      ₹{itemTotal.toFixed(2)}
                    </div>
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(index)}
                      className="link-btn"
                      style={{ color: 'red' }}
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
            <button type="button" className="link-btn" onClick={addItemRow}>
              + Add line
            </button>
          </div>
          {(() => {
            const totals = calculateTotals();
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
                  <strong>Subtotal:</strong> ₹{totals.subtotal.toFixed(2)}
                </div>
                <div>
                  <strong>Total Discount:</strong> ₹{totals.totalDiscount.toFixed(2)}
                </div>
                <div>
                  <strong>Total Tax:</strong> ₹{totals.totalTax.toFixed(2)}
                </div>
                <div>
                  <strong>Grand Total:</strong> ₹{totals.grandTotal.toFixed(2)}
                </div>
              </div>
            );
          })()}
          <button
            className="purchase-form__submit"
            type="submit"
            disabled={loading || !validItems}
          >
            {loading ? 'Saving…' : 'Save Invoice'}
          </button>
        </form>
        <div className="purchase-history">
          <h3>Recent Sales</h3>
          <ul>
            {invoices.length === 0 ? (
              <li className="empty">No sales yet</li>
            ) : (
              invoices.map((invoice) => (
                <li key={invoice.id}>
                  <strong>{invoice.invoiceNumber}</strong>
                  <span>{invoice.customerName}</span>
                  <span>
                    {new Date(invoice.invoiceDate).toLocaleDateString()}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default SalesEntryPanel;
