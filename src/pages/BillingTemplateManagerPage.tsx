// FILE: src/pages/BillingTemplateManagerPage.tsx
/// ANCHOR: BillingTemplateManagerPage
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import type { BillTemplateDTO } from '@shared/ipc';
import { invoke } from '../api/ipcClient';

const BillingTemplateManagerPage = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<BillTemplateDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const result = await invoke('ipc.billTemplate.list', undefined);
      const templateArray = Array.isArray(result) ? result : [];
      setTemplates(templateArray);
    } catch (error) {
      console.error('Error loading templates:', error);
      alert('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleSetDefault = async (id: number) => {
    try {
      await invoke('ipc.billTemplate.setDefault', { id });
      await loadTemplates();
      alert('Default template updated successfully');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to set default template');
    }
  };

  const handleClone = async (id: number) => {
    const name = prompt('Enter a name for the cloned template:');
    if (!name) return;

    try {
      await invoke('ipc.billTemplate.clone', { id, name });
      await loadTemplates();
      alert('Template cloned successfully');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to clone template');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await invoke('ipc.billTemplate.delete', { id });
      await loadTemplates();
      alert('Template deleted successfully');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete template');
    }
  };

  const handlePreview = async (templateId: number) => {
    // Find a recent bill to preview with
    try {
      const billsResult = await invoke('ipc.bill.list', { page: 1, pageSize: 1 });
      if (billsResult && 'bills' in billsResult && billsResult.bills.length > 0) {
        const billId = billsResult.bills[0].id;
        // Use IPC to get preview HTML directly
        const result = await invoke('ipc.bill.preview', { 
          id: billId,
          templateId: templateId 
        });
        
        const previewWindow = window.open('', '_blank');
        if (previewWindow) {
          previewWindow.document.write(result.html);
          previewWindow.document.close();
        }
      } else {
        alert('No bills found. Please create a bill first to preview templates.');
      }
    } catch (error) {
      console.error('Preview error:', error);
      alert(error instanceof Error ? error.message : 'Failed to load preview');
    }
  };

  return (
    <AppLayout>
      <div className="page-container">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Bill Templates</h2>
            <p>Manage invoice templates and layouts</p>
          </div>
          <button
            onClick={() => navigate('/billing/templates/editor')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              border: 'none',
              background: '#2563eb',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            + Create Template
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading templates...</div>
        ) : templates.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', background: '#fff', borderRadius: '8px' }}>
            <p>No templates found. Create your first template to get started.</p>
            <button
              onClick={() => navigate('/billing/templates/editor')}
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                border: 'none',
                background: '#2563eb',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Create Template
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {templates.map(template => (
              <div
                key={template.id}
                style={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0 }}>{template.name}</h3>
                    {template.isDefault && (
                      <span
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: '#10b981',
                          color: '#fff',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        Default
                      </span>
                    )}
                    <span
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: '#f3f4f6',
                        color: '#374151',
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                      }}
                    >
                      {template.templateType}
                    </span>
                  </div>
                  {template.description && (
                    <p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
                      {template.description}
                    </p>
                  )}
                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                    Version {template.version} • Created {new Date(template.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handlePreview(template.id)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      background: '#fff',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => navigate(`/billing/templates/editor?id=${template.id}`)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      background: '#fff',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Edit
                  </button>
                  {!template.isDefault && (
                    <button
                      onClick={() => handleSetDefault(template.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        background: '#fff',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => handleClone(template.id)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      background: '#fff',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Duplicate
                  </button>
                  {!template.isDefault && (
                    <button
                      onClick={() => handleDelete(template.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        border: '1px solid #dc2626',
                        background: '#fff',
                        color: '#dc2626',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default BillingTemplateManagerPage;

