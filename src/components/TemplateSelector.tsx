// FILE: src/components/TemplateSelector.tsx
/// ANCHOR: TemplateSelector
import { useEffect, useState } from 'react';
import { invoke } from '../api/ipcClient';

interface TemplateMetadata {
  name: string;
  path: string;
  size: number;
  modified: string;
}

interface TemplateSelectorProps {
  value?: string;
  onChange?: (templateName: string) => void;
  className?: string;
}

const TemplateSelector = ({ value, onChange, className }: TemplateSelectorProps) => {
  const [templates, setTemplates] = useState<TemplateMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(
    value || localStorage.getItem('billing:lastTemplate') || 'default-a4-bill.html'
  );

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (value !== undefined && value !== selectedTemplate) {
      setSelectedTemplate(value);
    }
  }, [value]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const templateList = await invoke('templates:list', undefined);
      console.log('Templates loaded:', templateList);
      
      if (!templateList || templateList.length === 0) {
        console.warn('No templates found. Make sure templates folder exists and contains .html files.');
        setTemplates([]);
        return;
      }
      
      setTemplates(templateList);
      
      // If no template selected, use default
      if (!selectedTemplate && templateList.length > 0) {
        const defaultTemplate = templateList.find(t => t.name === 'default-a4-bill.html');
        if (defaultTemplate) {
          setSelectedTemplate(defaultTemplate.name);
        } else {
          // Use first available template if default not found
          setSelectedTemplate(templateList[0].name);
        }
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (templateName: string) => {
    setSelectedTemplate(templateName);
    // Save to localStorage (electron-store access would need IPC handler)
    localStorage.setItem('billing:lastTemplate', templateName);
    onChange?.(templateName);
  };

  if (loading) {
    return (
      <select disabled className={className} style={{ padding: '0.5rem', borderRadius: '4px' }}>
        <option>Loading templates...</option>
      </select>
    );
  }

  if (templates.length === 0) {
    return (
      <select disabled className={className} style={{ padding: '0.5rem', borderRadius: '4px', color: '#ef4444' }}>
        <option>No templates available</option>
      </select>
    );
  }

  return (
    <select
      value={selectedTemplate}
      onChange={(e) => handleChange(e.target.value)}
      className={className}
      style={{
        padding: '0.5rem',
        borderRadius: '4px',
        border: '1px solid #d1d5db',
        background: '#fff',
        cursor: 'pointer',
        minWidth: '200px'
      }}
    >
      {templates.map((template) => (
        <option key={template.name} value={template.name}>
          {template.name.replace('.html', '')}
        </option>
      ))}
    </select>
  );
};

export default TemplateSelector;

