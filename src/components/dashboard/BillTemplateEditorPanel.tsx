// FILE: src/components/dashboard/BillTemplateEditorPanel.tsx
/// ANCHOR: BillTemplateEditorPanel
import { FormEvent, useEffect, useState } from 'react';
import type { BillTemplateDTO, CreateBillTemplateRequest } from '@shared/ipc';
import { invoke } from '../../api/ipcClient';
import type { BillLayoutDefinition } from '@shared/templateLayout';
import VisualBillTemplateBuilder from '../templates/VisualBillTemplateBuilder';

const BillTemplateEditorPanel = () => {
  const [templates, setTemplates] = useState<BillTemplateDTO[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<BillTemplateDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CreateBillTemplateRequest>({
    name: '',
    description: '',
    templateType: 'A4',
    htmlContent: '',
    cssContent: '',
    placeholders: [],
    isDefault: false,
    editorMode: 'VISUAL',
    layoutJson: undefined,
  });
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [layoutJson, setLayoutJson] = useState<BillLayoutDefinition | null>(null);
  const [advancedMode, setAdvancedMode] = useState(false);

  const loadTemplates = async () => {
    try {
      const list = await invoke('ipc.billTemplate.list', undefined);
      setTemplates(list);
      if (list.length > 0 && !selectedTemplate) {
        const defaultTemplate = list.find(t => t.isDefault) || list[0];
        setSelectedTemplate(defaultTemplate);
        setForm({
          name: defaultTemplate.name,
          description: defaultTemplate.description || '',
          templateType: defaultTemplate.templateType as 'A4' | 'THERMAL_3INCH',
          htmlContent: defaultTemplate.htmlContent,
          cssContent: defaultTemplate.cssContent,
          placeholders: defaultTemplate.placeholders || [],
          isDefault: defaultTemplate.isDefault,
          editorMode: (defaultTemplate.editorMode as any) || 'VISUAL',
          layoutJson: defaultTemplate.layoutJson as any,
          generatedHtml: defaultTemplate.generatedHtml,
        });
        setLayoutJson((defaultTemplate.layoutJson as any) || null);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      alert('Failed to load templates');
    }
  };

  useEffect(() => {
    loadTemplates().catch(console.error);
  }, []);

  const handleSelectTemplate = (template: BillTemplateDTO) => {
    setSelectedTemplate(template);
    setForm({
      name: template.name,
      description: template.description || '',
      templateType: template.templateType as 'A4' | 'THERMAL_3INCH',
      htmlContent: template.htmlContent,
      cssContent: template.cssContent,
      placeholders: template.placeholders || [],
      isDefault: template.isDefault,
      editorMode: (template.editorMode as any) || 'VISUAL',
      layoutJson: template.layoutJson as any,
      generatedHtml: template.generatedHtml,
    });
    setLayoutJson((template.layoutJson as any) || null);
    setAdvancedMode(false);
    setPreviewHtml('');
  };

  const handlePreview = async () => {
    if (!selectedTemplate) {
      alert('Please select a template first');
      return;
    }
    // For now, preview uses current html/css from form
    const html = form.htmlContent.replace(/\{\{cssContent\}\}/g, form.cssContent);
    setPreviewHtml(html);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name || !form.htmlContent || !form.cssContent) {
      alert('Name, HTML, and CSS are required');
      return;
    }

    setLoading(true);
    try {
      const payload: CreateBillTemplateRequest = {
        ...form,
        layoutJson: layoutJson || undefined,
      };

      if (selectedTemplate) {
        await invoke('ipc.billTemplate.update', {
          id: selectedTemplate.id,
          data: payload,
        });
        alert('Template updated successfully!');
      } else {
        await invoke('ipc.billTemplate.create', payload);
        alert('Template created successfully!');
      }
      await loadTemplates();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const handleClone = async () => {
    if (!selectedTemplate) {
      alert('Please select a template to clone');
      return;
    }

    const newName = prompt('Enter name for cloned template:', `${selectedTemplate.name} (Copy)`);
    if (!newName) return;

    try {
      await invoke('ipc.billTemplate.clone', {
        id: selectedTemplate.id,
        name: newName
      });
      alert('Template cloned successfully!');
      await loadTemplates();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to clone template');
    }
  };

  const handleSetDefault = async () => {
    if (!selectedTemplate) {
      alert('Please select a template');
      return;
    }

    try {
      await invoke('ipc.billTemplate.setDefault', { id: selectedTemplate.id });
      alert('Template set as default!');
      await loadTemplates();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to set default');
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplate) {
      alert('Please select a template');
      return;
    }

    if (!confirm(`Delete template "${selectedTemplate.name}"?`)) return;

    try {
      await invoke('ipc.billTemplate.delete', { id: selectedTemplate.id });
      alert('Template deleted!');
      setSelectedTemplate(null);
      await loadTemplates();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete template');
    }
  };

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Bill Template Editor</h2>
          <p>Create and edit bill templates with a visual builder (HTML/CSS for admins only)</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select
            value={selectedTemplate?.id ?? 0}
            onChange={(e) => {
              const template = templates.find(t => t.id === Number(e.target.value));
              if (template) handleSelectTemplate(template);
            }}
          >
            <option value={0}>Select template...</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} {t.isDefault ? '(Default)' : ''} - {t.templateType}
              </option>
            ))}
          </select>
          {selectedTemplate && (
            <>
              <button type="button" onClick={handleClone}>Clone</button>
              <button type="button" onClick={handleSetDefault} disabled={selectedTemplate.isDefault}>
                Set Default
              </button>
              <button type="button" onClick={handleDelete} style={{ backgroundColor: '#dc2626', color: 'white' }}>
                Delete
              </button>
            </>
          )}
        </div>
      </header>
      <div className="panel__body">
        <form onSubmit={handleSave}>
          <div className="form-grid form-grid--2cols" style={{ marginBottom: '1rem' }}>
            <div className="form-field">
              <label>Template Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="form-field">
              <label>Template Type</label>
              <select
                value={form.templateType}
                onChange={(e) => setForm(prev => ({
                  ...prev,
                  templateType: e.target.value as 'A4' | 'THERMAL_3INCH'
                }))}
              >
                <option value="A4">A4</option>
                <option value="THERMAL_3INCH">Thermal 3-inch</option>
              </select>
            </div>
            <div className="form-field form-field--full">
              <label>Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label>
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                />
                Set as Default
              </label>
            </div>
          </div>

          {/* Visual Builder (default) */}
          {selectedTemplate && selectedTemplate.editorMode === 'LEGACY' ? (
            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
              <div className="card-header">
                <h4 className="card-title">Legacy Template</h4>
                <p className="card-subtitle">This template was imported from disk and cannot be edited visually. Clone it to create a visual template.</p>
              </div>
            </div>
          ) : (
            <VisualBillTemplateBuilder
              layout={layoutJson}
              onChange={setLayoutJson}
              templateType={form.templateType}
            />
          )}

          {/* Advanced Mode - raw HTML/CSS, intended for admins only */}
          <div className="card" style={{ marginTop: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 className="card-title">Advanced Mode (HTML/CSS)</h4>
                <p className="card-subtitle">For expert users only. Incorrect HTML/CSS can break print layout.</p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <input
                  type="checkbox"
                  checked={advancedMode}
                  onChange={(e) => setAdvancedMode(e.target.checked)}
                />
                Enable Advanced Mode
              </label>
            </div>
            {advancedMode && (
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-xl)' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                      <label style={{ fontWeight: 600, fontSize: '0.9375rem' }}>HTML Template</label>
                      <small style={{ color: 'var(--color-text-tertiary)', fontSize: '0.8125rem' }}>Use {'{{placeholders}}'} for dynamic content</small>
                    </div>
                    <textarea
                      value={form.htmlContent}
                      onChange={(e) => setForm(prev => ({ ...prev, htmlContent: e.target.value }))}
                      style={{ width: '100%', height: '400px', fontFamily: '"SF Mono", "Monaco", "Cascadia Code", monospace', fontSize: '13px', background: 'var(--color-bg-dark)', color: '#e2e8f0' }}
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                      <label style={{ fontWeight: 600, fontSize: '0.9375rem' }}>CSS Styles</label>
                      <small style={{ color: 'var(--color-text-tertiary)', fontSize: '0.8125rem' }}>Styles for the template</small>
                    </div>
                    <textarea
                      value={form.cssContent}
                      onChange={(e) => setForm(prev => ({ ...prev, cssContent: e.target.value }))}
                      style={{ width: '100%', height: '400px', fontFamily: '"SF Mono", "Monaco", "Cascadia Code", monospace', fontSize: '13px', background: 'var(--color-bg-dark)', color: '#e2e8f0' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
            <button type="button" onClick={handlePreview} className="btn btn-outline">Preview</button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Saving...' : selectedTemplate ? 'Update Template' : 'Create Template'}
            </button>
          </div>
        </form>

        {previewHtml && (
          <div className="card" style={{ marginTop: 'var(--spacing-2xl)' }}>
            <div className="card-header">
              <h4 className="card-title">Preview</h4>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <iframe
                srcDoc={previewHtml}
                style={{ width: '100%', height: '600px', border: 'none', borderRadius: 'var(--radius-lg)' }}
                title="Template Preview"
              />
            </div>
          </div>
        )}

        <div className="card" style={{ marginTop: 'var(--spacing-2xl)' }}>
          <div className="card-header">
            <h4 className="card-title">Available Placeholders</h4>
            <p className="card-subtitle">Use these placeholders in your HTML template</p>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
              <div style={{ padding: 'var(--spacing-sm)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <code style={{ fontSize: '0.875rem', color: 'var(--color-primary)' }}>{'{{company.name}}'}</code>
              </div>
              <div style={{ padding: 'var(--spacing-sm)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <code style={{ fontSize: '0.875rem', color: 'var(--color-primary)' }}>{'{{company.address}}'}</code>
              </div>
              <div style={{ padding: 'var(--spacing-sm)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <code style={{ fontSize: '0.875rem', color: 'var(--color-primary)' }}>{'{{company.phone}}'}</code>
              </div>
              <div style={{ padding: 'var(--spacing-sm)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <code style={{ fontSize: '0.875rem', color: 'var(--color-primary)' }}>{'{{company.gstin}}'}</code>
              </div>
              <div style={{ padding: 'var(--spacing-sm)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <code style={{ fontSize: '0.875rem', color: 'var(--color-primary)' }}>{'{{bill.billNumber}}'}</code>
              </div>
              <div style={{ padding: 'var(--spacing-sm)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <code style={{ fontSize: '0.875rem', color: 'var(--color-primary)' }}>{'{{bill.billDate}}'}</code>
              </div>
              <div style={{ padding: 'var(--spacing-sm)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <code style={{ fontSize: '0.875rem', color: 'var(--color-primary)' }}>{'{{bill.customerName}}'}</code>
              </div>
              <div style={{ padding: 'var(--spacing-sm)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <code style={{ fontSize: '0.875rem', color: 'var(--color-primary)' }}>{'{{bill.totalAmount}}'}</code>
              </div>
              <div style={{ padding: 'var(--spacing-sm)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <code style={{ fontSize: '0.875rem', color: 'var(--color-primary)' }}>{'{{#each bill.lines}}'}</code>
              </div>
              <div style={{ padding: 'var(--spacing-sm)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <code style={{ fontSize: '0.875rem', color: 'var(--color-primary)' }}>{'{{this.productName}}'}</code>
              </div>
              <div style={{ padding: 'var(--spacing-sm)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <code style={{ fontSize: '0.875rem', color: 'var(--color-primary)' }}>{'{{this.quantity}}'}</code>
              </div>
              <div style={{ padding: 'var(--spacing-sm)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <code style={{ fontSize: '0.875rem', color: 'var(--color-primary)' }}>{'{{this.lineTotal}}'}</code>
              </div>
              <div style={{ padding: 'var(--spacing-sm)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <code style={{ fontSize: '0.875rem', color: 'var(--color-primary)' }}>{'{{/each}}'}</code>
              </div>
              <div style={{ padding: 'var(--spacing-sm)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <code style={{ fontSize: '0.875rem', color: 'var(--color-primary)' }}>{'{{cssContent}}'}</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BillTemplateEditorPanel;

