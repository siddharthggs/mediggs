// FILE: src/components/dashboard/SupplierPanel.tsx
/// ANCHOR: SupplierPanel
import { FormEvent, useEffect, useState } from 'react';
import type { SupplierDTO, SupplierInput } from '@shared/ipc';
import { invoke } from '../../api/ipcClient';

const initialForm: SupplierInput = {
  name: '',
  gstin: '',
  drugLicenseNumber: '',
  dlNo2: '',
  fullAddress: '',
  addressLine1: '',
  addressLine2: '',
  locality: '',
  city: '',
  state: '',
  postalCode: '',
  phone: '',
  email: '',
  openingBalance: 0
};

const SupplierPanel = () => {
  const [suppliers, setSuppliers] = useState<SupplierDTO[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const data = await invoke('ipc.supplier.list', undefined);
      setSuppliers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers().catch(console.error);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      await invoke('ipc.supplier.create', form);
      setForm(initialForm);
      await loadSuppliers();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create supplier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Suppliers</h2>
          <p>Manage purchase parties & GST details</p>
        </div>
        <button
          type="button"
          onClick={loadSuppliers}
          disabled={loading}
          className="btn btn-outline btn-sm"
        >
          Refresh
        </button>
      </header>
      <div className="panel__body supplier-panel">
        <form
          className="supplier-form"
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <div>
              <label>Supplier Name *</label>
              <input
                placeholder="Supplier name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
              />
            </div>
            <div>
              <label>GSTIN</label>
              <input
                placeholder="GSTIN"
                value={form.gstin || ''}
                onChange={(event) => setForm({ ...form, gstin: event.target.value })}
              />
            </div>
            <div>
              <label>Drug License No. 1</label>
              <input
                placeholder="Drug License Number"
                value={form.drugLicenseNumber || ''}
                onChange={(event) => setForm({ ...form, drugLicenseNumber: event.target.value })}
              />
            </div>
            <div>
              <label>Drug License No. 2</label>
              <input
                placeholder="DL No. 2"
                value={form.dlNo2 || ''}
                onChange={(event) => setForm({ ...form, dlNo2: event.target.value })}
              />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label>Full Address</label>
              <textarea
                placeholder="Full Address"
                value={form.fullAddress || ''}
                onChange={(event) => setForm({ ...form, fullAddress: event.target.value })}
                rows={2}
              />
            </div>
            <div>
              <label>Address Line 1</label>
              <input
                placeholder="Address Line 1"
                value={form.addressLine1 || ''}
                onChange={(event) => setForm({ ...form, addressLine1: event.target.value })}
              />
            </div>
            <div>
              <label>Address Line 2</label>
              <input
                placeholder="Address Line 2"
                value={form.addressLine2 || ''}
                onChange={(event) => setForm({ ...form, addressLine2: event.target.value })}
              />
            </div>
            <div>
              <label>Locality</label>
              <input
                placeholder="Locality"
                value={form.locality || ''}
                onChange={(event) => setForm({ ...form, locality: event.target.value })}
              />
            </div>
            <div>
              <label>City</label>
              <input
                placeholder="City"
                value={form.city || ''}
                onChange={(event) => setForm({ ...form, city: event.target.value })}
              />
            </div>
            <div>
              <label>State</label>
              <input
                placeholder="State"
                value={form.state || ''}
                onChange={(event) => setForm({ ...form, state: event.target.value })}
              />
            </div>
            <div>
              <label>Postal Code</label>
              <input
                placeholder="Postal Code"
                value={form.postalCode || ''}
                onChange={(event) => setForm({ ...form, postalCode: event.target.value })}
              />
            </div>
            <div>
              <label>Phone</label>
              <input
                placeholder="Phone"
                value={form.phone || ''}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </div>
            <div>
              <label>Email</label>
              <input
                type="email"
                placeholder="Email"
                value={form.email || ''}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </div>
            <div>
              <label>Opening Balance</label>
              <input
                type="number"
                placeholder="Opening Balance"
                value={form.openingBalance || 0}
                onChange={(event) => setForm({ ...form, openingBalance: Number(event.target.value) })}
                min={0}
                step={0.01}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Saving...' : 'Add Supplier'}
          </button>
        </form>
        <div className="supplier-list" style={{ marginTop: '1rem' }}>
          <table className="table table--compact">
            <thead>
              <tr>
                <th>Name</th>
                <th>GSTIN</th>
                <th>DL No. 1</th>
                <th>DL No. 2</th>
                <th>City</th>
                <th>Phone</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty">
                    {loading ? 'Loading suppliers...' : 'No suppliers yet'}
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td>{supplier.name}</td>
                    <td>{supplier.gstin || '-'}</td>
                    <td>{supplier.drugLicenseNumber || '-'}</td>
                    <td>{supplier.dlNo2 || '-'}</td>
                    <td>{supplier.city || '-'}</td>
                    <td>{supplier.phone || '-'}</td>
                    <td>{supplier.email || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default SupplierPanel;

