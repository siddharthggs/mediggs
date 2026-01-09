// FILE: src/components/dashboard/CustomerPanel.tsx
/// ANCHOR: CustomerPanel
import { FormEvent, useEffect, useState } from 'react';
import type { CustomerDTO, CustomerInput } from '@shared/ipc';
import { invoke } from '../../api/ipcClient';

const initialForm: CustomerInput = {
  name: '',
  gstin: '',
  drugLicenseNumber: '',
  drugLicenseNumber2: '',
  panNumber: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  stateCode: '',
  postalCode: '',
  phone: '',
  email: ''
};

const CustomerPanel = () => {
  const [customers, setCustomers] = useState<CustomerDTO[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await invoke('ipc.customer.list', undefined);
      setCustomers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers().catch(console.error);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      await invoke('ipc.customer.create', {
        name: form.name,
        gstin: form.gstin || undefined,
        drugLicenseNumber: form.drugLicenseNumber || undefined,
        drugLicenseNumber2: form.drugLicenseNumber2 || undefined,
        panNumber: form.panNumber || undefined,
        addressLine1: form.addressLine1 || undefined,
        addressLine2: form.addressLine2 || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        stateCode: form.stateCode || undefined,
        postalCode: form.postalCode || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined
      });
      setForm(initialForm);
      await loadCustomers();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Customers</h2>
          <p>Manage sale parties & credit profiles</p>
        </div>
        <button
          type="button"
          onClick={loadCustomers}
          disabled={loading}
          className="btn btn-outline btn-sm"
        >
          Refresh
        </button>
      </header>
      <div className="panel__body supplier-panel">
        <form className="supplier-form" onSubmit={handleSubmit}>
          <input
            placeholder="Customer (Company Name) *"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
          <input
            placeholder="Address"
            value={form.addressLine1}
            onChange={(event) => setForm({ ...form, addressLine1: event.target.value })}
          />
          <input
            placeholder="GST No"
            value={form.gstin}
            onChange={(event) => setForm({ ...form, gstin: event.target.value })}
          />
          <input
            placeholder="Phone"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
          />
          <input
            placeholder="DL No"
            value={form.drugLicenseNumber}
            onChange={(event) => setForm({ ...form, drugLicenseNumber: event.target.value })}
          />
          <input
            placeholder="DL No 2"
            value={form.drugLicenseNumber2}
            onChange={(event) => setForm({ ...form, drugLicenseNumber2: event.target.value })}
          />
          <input
            placeholder="PAN No"
            value={form.panNumber}
            onChange={(event) => setForm({ ...form, panNumber: event.target.value })}
          />
          <input
            placeholder="State Code"
            value={form.stateCode}
            onChange={(event) => setForm({ ...form, stateCode: event.target.value })}
          />
          <input
            placeholder="State Name"
            value={form.state}
            onChange={(event) => setForm({ ...form, state: event.target.value })}
          />
          <input
            placeholder="Address Line 2"
            value={form.addressLine2}
            onChange={(event) => setForm({ ...form, addressLine2: event.target.value })}
          />
          <input
            placeholder="City"
            value={form.city}
            onChange={(event) => setForm({ ...form, city: event.target.value })}
          />
          <input
            placeholder="Postal Code"
            value={form.postalCode}
            onChange={(event) => setForm({ ...form, postalCode: event.target.value })}
          />
          <input
            placeholder="Email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
          <button type="submit" className="btn btn-primary">Add Customer</button>
        </form>
        <div className="supplier-list">
          {customers.length === 0 ? (
            <p className="empty">
              {loading ? 'Loading customers...' : 'No customers yet'}
            </p>
          ) : (
            <ul>
              {customers.map((customer) => (
                <li key={customer.id}>
                  <div>
                    <strong>{customer.name}</strong>
                    {customer.city ? <span>{customer.city}</span> : null}
                  </div>
                  <div>
                    {customer.gstin ? <span>{customer.gstin}</span> : null}
                    {customer.phone ? <span>{customer.phone}</span> : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};

export default CustomerPanel;


