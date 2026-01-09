// FILE: src/components/dashboard/MRManagementPanel.tsx
/// ANCHOR: MRManagementPanel
import { FormEvent, useEffect, useState, useCallback } from 'react';
import { invoke } from '../../api/ipcClient';
import { safeInvoke } from '../../utils/safeInvoke';
import { useToast } from '../../utils/toast';

interface MR {
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

const MRManagementPanel = () => {
  const { showError, showSuccess } = useToast();
  const [mrs, setMRs] = useState<MR[]>([]);
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
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // FIX: Memoize loadMRs to prevent infinite loops
  const loadMRs = useCallback(async () => {
    setLoading(true);
    try {
      // FIX: Use safeInvoke to prevent UI freezing on errors
      const result = await safeInvoke('ipc.mr.list', { search: search || undefined });
      if (result.success && result.data) {
        setMRs(result.data);
      } else {
        showError(result.error || 'Failed to load MRs');
      }
    } catch (error) {
      console.error('Error loading MRs:', error);
      showError('Failed to load MRs');
    } finally {
      setLoading(false);
    }
  }, [search, showError]);

  useEffect(() => {
    loadMRs();
  }, [loadMRs]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name) {
      alert('MR name is required');
      return;
    }
    setLoading(true);
    try {
      if (editingId) {
        await invoke('ipc.mr.update', { id: editingId, data: form });
      } else {
        await invoke('ipc.mr.create', form);
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
      await loadMRs();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save MR');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (mr: MR) => {
    setForm({
      name: mr.name,
      code: mr.code || '',
      phone: mr.phone || '',
      email: mr.email || '',
      address: mr.address || '',
      commissionPercent: mr.commissionPercent,
      isActive: mr.isActive
    });
    setEditingId(mr.id);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this MR? This action cannot be undone.')) return;
    
    // FIX: Set loading state to prevent UI lock
    setDeletingId(id);
    
    // FIX: Close any modals/overlays immediately
    document.querySelectorAll('[role="dialog"]').forEach((el) => {
      (el as HTMLElement).style.display = 'none';
    });
    document.querySelectorAll('.backdrop, [class*="backdrop"]').forEach((el) => {
      (el as HTMLElement).remove();
    });
    
    // FIX: Restore focus immediately
    document.body.focus();
    
    try {
      // FIX: Use safeInvoke - never throws
      const result = await safeInvoke('ipc.mr.delete', { id });
      
      if (!result.success) {
        showError(result.error || 'Failed to delete MR');
        return;
      }
      
      showSuccess('MR deleted successfully');
      await loadMRs();
    } catch (error) {
      // FIX: Catch any unexpected errors
      console.error('Delete error:', error);
      showError(error instanceof Error ? error.message : 'Failed to delete MR');
    } finally {
      // FIX: Always release loading state, even on error
      setDeletingId(null);
      // FIX: Ensure focus is restored
      document.body.focus();
    }
  };

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>MR / Salesman Management</h2>
          <p>Manage Medical Representatives and Salesmen</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="Search MRs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '0.5rem', minWidth: '200px' }}
          />
          <button onClick={loadMRs} disabled={loading}>
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
                placeholder="MR Name"
              />
            </div>
            <div>
              <label>Code</label>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="MR Code"
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
              {loading ? 'Saving...' : editingId ? 'Update' : 'Create'} MR
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

        <table style={{ width: '100%' }}>
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
            {mrs.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty">
                  {loading ? 'Loading...' : 'No MRs found'}
                </td>
              </tr>
            ) : (
              mrs.map((mr) => (
                <tr key={mr.id}>
                  <td>{mr.name}</td>
                  <td>{mr.code || '-'}</td>
                  <td>{mr.phone || '-'}</td>
                  <td>{mr.email || '-'}</td>
                  <td>{mr.commissionPercent.toFixed(2)}%</td>
                  <td>{mr.isActive ? 'Active' : 'Inactive'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        onClick={() => handleEdit(mr)}
                        style={{ fontSize: '0.85em', padding: '0.25rem 0.5rem' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(mr.id)}
                        disabled={deletingId === mr.id}
                        style={{ fontSize: '0.85em', padding: '0.25rem 0.5rem', backgroundColor: deletingId === mr.id ? '#999' : '#dc2626', color: 'white', cursor: deletingId === mr.id ? 'not-allowed' : 'pointer' }}
                      >
                        {deletingId === mr.id ? 'Deleting...' : 'Delete'}
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

export default MRManagementPanel;

