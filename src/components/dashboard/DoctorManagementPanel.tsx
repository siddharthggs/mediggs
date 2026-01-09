// FILE: src/components/dashboard/DoctorManagementPanel.tsx
/// ANCHOR: DoctorManagementPanel
import { FormEvent, useEffect, useState } from 'react';
import { invoke } from '../../api/ipcClient';

interface Doctor {
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
}

const DoctorManagementPanel = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    phone: '',
    email: '',
    address: '',
    commissionPercent: 0,
    isActive: true
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const result = await invoke('ipc.doctor.list', { search: search || undefined });
      setDoctors(result);
    } catch (error) {
      console.error('Error loading doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, [search]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name) {
      alert('Doctor name is required');
      return;
    }
    setLoading(true);
    try {
      if (editingId) {
        await invoke('ipc.doctor.update', { id: editingId, data: form });
      } else {
        await invoke('ipc.doctor.create', form);
      }
      setForm({
        name: '',
        code: '',
        phone: '',
        email: '',
        address: '',
        commissionPercent: 0,
        isActive: true
      });
      setEditingId(null);
      await loadDoctors();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save doctor');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (doctor: Doctor) => {
    setForm({
      name: doctor.name,
      code: doctor.code || '',
      phone: doctor.phone || '',
      email: doctor.email || '',
      address: doctor.address || '',
      commissionPercent: doctor.commissionPercent,
      isActive: doctor.isActive
    });
    setEditingId(doctor.id);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this doctor? This action cannot be undone.')) return;
    try {
      await invoke('ipc.doctor.delete', { id });
      await loadDoctors();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete doctor');
    }
  };

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Doctor Management</h2>
          <p>Manage doctors and their commission rates</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="Search doctors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '0.5rem', minWidth: '200px' }}
          />
          <button onClick={loadDoctors} disabled={loading}>
            Refresh
          </button>
        </div>
      </header>
      <div className="panel__body">
        <form onSubmit={handleSubmit} style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div>
              <label>Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="Doctor Name"
              />
            </div>
            <div>
              <label>Code</label>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="Doctor Code"
              />
            </div>
            <div>
              <label>Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone Number"
              />
            </div>
            <div>
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email"
              />
            </div>
            <div>
              <label>Commission %</label>
              <input
                type="number"
                value={form.commissionPercent}
                onChange={(e) => setForm({ ...form, commissionPercent: Number(e.target.value) })}
                min={0}
                max={100}
                step={0.01}
                placeholder="Commission Percentage"
              />
            </div>
            <div>
              <label>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                Active
              </label>
            </div>
            <div style={{ gridColumn: 'span 3' }}>
              <label>Address</label>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                rows={2}
                placeholder="Address"
              />
            </div>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editingId ? 'Update' : 'Create'} Doctor
            </button>
            {editingId && (
              <button type="button" onClick={() => {
                setEditingId(null);
                setForm({
                  name: '',
                  code: '',
                  phone: '',
                  email: '',
                  address: '',
                  commissionPercent: 0,
                  isActive: true
                });
              }}>
                Cancel
              </button>
            )}
          </div>
        </form>

        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Commission %</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctors.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty">
                  {loading ? 'Loading...' : 'No doctors found'}
                </td>
              </tr>
            ) : (
              doctors.map((doctor) => (
                <tr key={doctor.id}>
                  <td>{doctor.name}</td>
                  <td>{doctor.code || '-'}</td>
                  <td>{doctor.phone || '-'}</td>
                  <td>{doctor.email || '-'}</td>
                  <td>{doctor.commissionPercent.toFixed(2)}%</td>
                  <td>
                    <span className={`badge ${doctor.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {doctor.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                      <button
                        onClick={() => handleEdit(doctor)}
                        className="btn btn-outline btn-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(doctor.id)}
                        className="btn btn-danger btn-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default DoctorManagementPanel;

