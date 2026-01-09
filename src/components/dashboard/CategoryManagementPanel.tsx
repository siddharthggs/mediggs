// FILE: src/components/dashboard/CategoryManagementPanel.tsx
/// ANCHOR: CategoryManagementPanel
import { FormEvent, useEffect, useState } from 'react';
import { invoke } from '../../api/ipcClient';
import { safeInvoke } from '../../utils/safeInvoke';
import { useToast } from '../../utils/toast';

interface Category {
  id: number;
  name: string;
  description?: string;
}

interface Subcategory {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  description?: string;
}

interface Company {
  id: number;
  name: string;
  description?: string;
}

interface Schedule {
  id: number;
  name: string;
  description?: string;
}

interface StorageType {
  id: number;
  name: string;
  description?: string;
}

const CategoryManagementPanel = () => {
  const { showError, showSuccess } = useToast();
  const [activeTab, setActiveTab] = useState<'category' | 'subcategory' | 'company' | 'schedule' | 'storageType'>('category');
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [storageTypes, setStorageTypes] = useState<StorageType[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    categoryId: 0
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, comps, scheds, sts] = await Promise.all([
        invoke('ipc.category.list', undefined),
        invoke('ipc.company.list', undefined),
        invoke('ipc.schedule.list', undefined),
        invoke('ipc.storageType.list', undefined)
      ]);
      setCategories(cats);
      setCompanies(comps);
      setSchedules(scheds);
      setStorageTypes(sts);
      if (activeTab === 'subcategory') {
        const subs = await invoke('ipc.subcategory.list', undefined);
        setSubcategories(subs);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name) {
      alert('Name is required');
      return;
    }
    setLoading(true);
    try {
      if (activeTab === 'category') {
        if (editingId) {
          await invoke('ipc.category.update', { id: editingId, data: form });
        } else {
          await invoke('ipc.category.create', form);
        }
      } else if (activeTab === 'subcategory') {
        if (!form.categoryId) {
          alert('Category is required');
          return;
        }
        if (editingId) {
          await invoke('ipc.subcategory.update', { id: editingId, data: form });
        } else {
          await invoke('ipc.subcategory.create', { categoryId: form.categoryId, name: form.name, description: form.description });
        }
      } else if (activeTab === 'company') {
        if (editingId) {
          await invoke('ipc.company.update', { id: editingId, data: form });
        } else {
          await invoke('ipc.company.create', form);
        }
      } else if (activeTab === 'schedule') {
        if (editingId) {
          await invoke('ipc.schedule.update', { id: editingId, data: form });
        } else {
          await invoke('ipc.schedule.create', form);
        }
      } else if (activeTab === 'storageType') {
        if (editingId) {
          await invoke('ipc.storageType.update', { id: editingId, data: form });
        } else {
          await invoke('ipc.storageType.create', form);
        }
      }
      setForm({ name: '', description: '', categoryId: 0 });
      setEditingId(null);
      await loadData();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: any) => {
    setForm({
      name: item.name,
      description: item.description || '',
      categoryId: item.categoryId || 0
    });
    setEditingId(item.id);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this item? This action cannot be undone.')) return;
    
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
      let result;
      if (activeTab === 'category') {
        result = await safeInvoke('ipc.category.delete', { id });
      } else if (activeTab === 'subcategory') {
        result = await safeInvoke('ipc.subcategory.delete', { id });
      } else if (activeTab === 'company') {
        result = await safeInvoke('ipc.company.delete', { id });
      } else if (activeTab === 'schedule') {
        result = await safeInvoke('ipc.schedule.delete', { id });
      } else if (activeTab === 'storageType') {
        result = await safeInvoke('ipc.storageType.delete', { id });
      } else {
        showError('Unknown tab type');
        return;
      }
      
      if (!result.success) {
        showError(result.error || 'Failed to delete');
        return;
      }
      
      showSuccess('Item deleted successfully');
      await loadData();
    } catch (error) {
      // FIX: Catch any unexpected errors
      console.error('Delete error:', error);
      showError(error instanceof Error ? error.message : 'Failed to delete');
    } finally {
      // FIX: Always release loading state, even on error
      setDeletingId(null);
      // FIX: Ensure focus is restored
      document.body.focus();
    }
  };

  const renderTable = () => {
    if (activeTab === 'category') {
      return (
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id}>
                <td>{cat.name}</td>
                <td>{cat.description || '-'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={() => handleEdit(cat)} style={{ fontSize: '0.85em', padding: '0.25rem 0.5rem' }}>Edit</button>
                    <button 
                      onClick={() => handleDelete(cat.id)} 
                      disabled={deletingId === cat.id}
                      style={{ fontSize: '0.85em', padding: '0.25rem 0.5rem', backgroundColor: deletingId === cat.id ? '#999' : '#dc2626', color: 'white', cursor: deletingId === cat.id ? 'not-allowed' : 'pointer' }}
                    >
                      {deletingId === cat.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else if (activeTab === 'subcategory') {
      return (
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Category</th>
              <th>Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subcategories.map(sub => (
              <tr key={sub.id}>
                <td>{sub.categoryName}</td>
                <td>{sub.name}</td>
                <td>{sub.description || '-'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={() => handleEdit(sub)} style={{ fontSize: '0.85em', padding: '0.25rem 0.5rem' }}>Edit</button>
                    <button 
                      onClick={() => handleDelete(sub.id)} 
                      disabled={deletingId === sub.id}
                      style={{ fontSize: '0.85em', padding: '0.25rem 0.5rem', backgroundColor: deletingId === sub.id ? '#999' : '#dc2626', color: 'white', cursor: deletingId === sub.id ? 'not-allowed' : 'pointer' }}
                    >
                      {deletingId === sub.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else if (activeTab === 'company') {
      return (
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {companies.map(comp => (
              <tr key={comp.id}>
                <td>{comp.name}</td>
                <td>{comp.description || '-'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={() => handleEdit(comp)} style={{ fontSize: '0.85em', padding: '0.25rem 0.5rem' }}>Edit</button>
                    <button 
                      onClick={() => handleDelete(comp.id)} 
                      disabled={deletingId === comp.id}
                      style={{ fontSize: '0.85em', padding: '0.25rem 0.5rem', backgroundColor: deletingId === comp.id ? '#999' : '#dc2626', color: 'white', cursor: deletingId === comp.id ? 'not-allowed' : 'pointer' }}
                    >
                      {deletingId === comp.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else if (activeTab === 'schedule') {
      return (
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map(sched => (
              <tr key={sched.id}>
                <td>{sched.name}</td>
                <td>{sched.description || '-'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={() => handleEdit(sched)} style={{ fontSize: '0.85em', padding: '0.25rem 0.5rem' }}>Edit</button>
                    <button 
                      onClick={() => handleDelete(sched.id)} 
                      disabled={deletingId === sched.id}
                      style={{ fontSize: '0.85em', padding: '0.25rem 0.5rem', backgroundColor: deletingId === sched.id ? '#999' : '#dc2626', color: 'white', cursor: deletingId === sched.id ? 'not-allowed' : 'pointer' }}
                    >
                      {deletingId === sched.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else if (activeTab === 'storageType') {
      return (
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {storageTypes.map(st => (
              <tr key={st.id}>
                <td>{st.name}</td>
                <td>{st.description || '-'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={() => handleEdit(st)} style={{ fontSize: '0.85em', padding: '0.25rem 0.5rem' }}>Edit</button>
                    <button 
                      onClick={() => handleDelete(st.id)} 
                      disabled={deletingId === st.id}
                      style={{ fontSize: '0.85em', padding: '0.25rem 0.5rem', backgroundColor: deletingId === st.id ? '#999' : '#dc2626', color: 'white', cursor: deletingId === st.id ? 'not-allowed' : 'pointer' }}
                    >
                      {deletingId === st.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    return null;
  };

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Category Management</h2>
          <p>Manage product categorization</p>
        </div>
        <button onClick={loadData} disabled={loading}>
          Refresh
        </button>
      </header>
      <div className="panel__body">
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>
          <button
            onClick={() => {
              setActiveTab('category');
              setForm({ name: '', description: '', categoryId: 0 });
              setEditingId(null);
            }}
            style={{ backgroundColor: activeTab === 'category' ? '#3b82f6' : 'transparent', color: activeTab === 'category' ? 'white' : 'inherit' }}
          >
            Categories
          </button>
          <button
            onClick={() => {
              setActiveTab('subcategory');
              setForm({ name: '', description: '', categoryId: 0 });
              setEditingId(null);
            }}
            style={{ backgroundColor: activeTab === 'subcategory' ? '#3b82f6' : 'transparent', color: activeTab === 'subcategory' ? 'white' : 'inherit' }}
          >
            Subcategories
          </button>
          <button
            onClick={() => {
              setActiveTab('company');
              setForm({ name: '', description: '', categoryId: 0 });
              setEditingId(null);
            }}
            style={{ backgroundColor: activeTab === 'company' ? '#3b82f6' : 'transparent', color: activeTab === 'company' ? 'white' : 'inherit' }}
          >
            Companies
          </button>
          <button
            onClick={() => {
              setActiveTab('schedule');
              setForm({ name: '', description: '', categoryId: 0 });
              setEditingId(null);
            }}
            style={{ backgroundColor: activeTab === 'schedule' ? '#3b82f6' : 'transparent', color: activeTab === 'schedule' ? 'white' : 'inherit' }}
          >
            Schedules
          </button>
          <button
            onClick={() => {
              setActiveTab('storageType');
              setForm({ name: '', description: '', categoryId: 0 });
              setEditingId(null);
            }}
            style={{ backgroundColor: activeTab === 'storageType' ? '#3b82f6' : 'transparent', color: activeTab === 'storageType' ? 'white' : 'inherit' }}
          >
            Storage Types
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: activeTab === 'subcategory' ? '1fr 1fr 1fr' : '1fr 1fr', gap: '1rem' }}>
            {activeTab === 'subcategory' && (
              <div>
                <label>Category *</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}
                  required
                >
                  <option value={0}>Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label>Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder={`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Name`}
              />
            </div>
            <div>
              <label>Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description (optional)"
              />
            </div>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editingId ? 'Update' : 'Create'} {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </button>
            {editingId && (
              <button type="button" onClick={() => {
                setEditingId(null);
                setForm({ name: '', description: '', categoryId: 0 });
              }}>
                Cancel
              </button>
            )}
          </div>
        </form>

        {renderTable()}
      </div>
    </section>
  );
};

export default CategoryManagementPanel;

