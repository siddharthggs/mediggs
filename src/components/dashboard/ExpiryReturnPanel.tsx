// FILE: src/components/dashboard/ExpiryReturnPanel.tsx
/// ANCHOR: ExpiryReturnPanel
import { FormEvent, useEffect, useState } from 'react';
import { invoke } from '../../api/ipcClient';

interface Batch {
  id: number;
  batchNumber: string;
  productName: string;
  expiryDate: string;
  quantity: number;
}

interface Supplier {
  id: number;
  name: string;
}

const ExpiryReturnPanel = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    returnNumber: '',
    returnDate: new Date().toISOString().substring(0, 10),
    supplierId: 0,
    batchId: 0,
    quantity: 0,
    lossAmount: 0,
    notes: ''
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [batchList, supplierList] = await Promise.all([
          invoke('ipc.batch.list', undefined),
          invoke('ipc.supplier.list', undefined)
        ]);
        // Transform batch list to include product names
        const batchesWithProducts = await Promise.all(
          (batchList as any[]).map(async (batch: any) => {
            try {
              const product = await invoke('ipc.product.get', { id: batch.productId });
              return {
                id: batch.id,
                batchNumber: batch.batchNumber,
                productName: (product as any).name || 'Unknown',
                expiryDate: batch.expiryDate,
                quantity: batch.quantity
              };
            } catch (error) {
              return {
                id: batch.id,
                batchNumber: batch.batchNumber,
                productName: 'Unknown',
                expiryDate: batch.expiryDate,
                quantity: batch.quantity
              };
            }
          })
        );
        setBatches(batchesWithProducts);
        setSuppliers(supplierList);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.returnNumber || !form.batchId || !form.quantity) {
      alert('Return number, batch, and quantity are required');
      return;
    }
    if (form.quantity <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }
    setLoading(true);
    try {
      await invoke('ipc.expiryReturn.create', {
        returnNumber: form.returnNumber,
        returnDate: form.returnDate,
        supplierId: form.supplierId > 0 ? form.supplierId : undefined,
        batchId: form.batchId,
        quantity: form.quantity,
        lossAmount: form.lossAmount,
        notes: form.notes || undefined
      });
      alert('Expiry return recorded successfully!');
      setForm({
        returnNumber: '',
        returnDate: new Date().toISOString().substring(0, 10),
        supplierId: 0,
        batchId: 0,
        quantity: 0,
        lossAmount: 0,
        notes: ''
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create expiry return');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Expiry Return Stock Entry</h2>
          <p>Record expired stock returns and mark losses</p>
        </div>
      </header>
      <div className="panel__body">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <div>
              <label>Return Number *</label>
              <input
                value={form.returnNumber}
                onChange={(e) => setForm({ ...form, returnNumber: e.target.value })}
                required
                placeholder="Return Number"
              />
            </div>
            <div>
              <label>Return Date *</label>
              <input
                type="date"
                value={form.returnDate}
                onChange={(e) => setForm({ ...form, returnDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label>Supplier (Optional)</label>
              <select
                value={form.supplierId}
                onChange={(e) => setForm({ ...form, supplierId: Number(e.target.value) })}
              >
                <option value={0}>Select Supplier</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Batch *</label>
              <select
                value={form.batchId}
                onChange={(e) => setForm({ ...form, batchId: Number(e.target.value) })}
                required
              >
                <option value={0}>Select Batch</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.batchNumber} - {b.productName} (Qty: {b.quantity}, Exp: {new Date(b.expiryDate).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Quantity *</label>
              <input
                type="number"
                value={form.quantity || ''}
                onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                required
                min={1}
                placeholder="Quantity to return"
              />
            </div>
            <div>
              <label>Loss Amount *</label>
              <input
                type="number"
                value={form.lossAmount || ''}
                onChange={(e) => setForm({ ...form, lossAmount: Number(e.target.value) })}
                required
                min={0}
                step={0.01}
                placeholder="Loss Amount"
              />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label>Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                placeholder="Notes (optional)"
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Record Expiry Return'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default ExpiryReturnPanel;

