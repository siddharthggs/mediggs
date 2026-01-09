// FILE: src/components/dashboard/ExpiryManagementEnhanced.tsx
/// ANCHOR: ExpiryManagementEnhanced
import { useEffect, useState, useMemo } from 'react';
import type { ExpiringBatchDTO, ExpiryAlertRequest } from '@shared/ipc';
import { invoke } from '../../api/ipcClient';

interface Category {
  id: number;
  name: string;
}

const ExpiryManagementEnhanced = ({ globalSearch }: { globalSearch?: string }) => {
  const [batches, setBatches] = useState<ExpiringBatchDTO[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [filters, setFilters] = useState<ExpiryAlertRequest>({
    daysAhead: 90,
    includeExpired: false
  });
  const [loading, setLoading] = useState(false);
  const [groupBy, setGroupBy] = useState<'none' | 'manufacturer' | 'category'>('none');

  const loadData = async () => {
    setLoading(true);
    try {
      const [batchData, categoryList, productList] = await Promise.all([
        invoke('ipc.stock.expiring', filters),
        invoke('ipc.category.list', undefined),
        invoke('ipc.product.list', { page: 1, pageSize: 10000 }).then(r => 'products' in r ? r.products : [])
      ]);
      
      setBatches(batchData);
      setCategories(categoryList);
      
      // Extract unique manufacturers
      const uniqueManufacturers = Array.from(new Set(
        (productList as any[])
          .map(p => p.manufacturer)
          .filter((m): m is string => !!m)
      )).sort();
      setManufacturers(uniqueManufacturers);
    } catch (error) {
      console.error('Error loading expiry data:', error);
      alert('Failed to load expiry data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters.daysAhead, filters.includeExpired, filters.categoryId, filters.manufacturer]);

  const filteredBatches = useMemo(() => {
    let filtered = batches;
    
    if (globalSearch) {
      const searchLower = globalSearch.toLowerCase();
      filtered = filtered.filter(b =>
        b.productName.toLowerCase().includes(searchLower) ||
        b.sku.toLowerCase().includes(searchLower) ||
        b.batchNumber.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [batches, globalSearch]);

  const groupedBatches = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All': filteredBatches };
    }
    
    const groups: Record<string, ExpiringBatchDTO[]> = {};
    filteredBatches.forEach(batch => {
      const key = groupBy === 'manufacturer' 
        ? batch.manufacturer || 'Unknown'
        : batch.category || 'Unknown';
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(batch);
    });
    
    return groups;
  }, [filteredBatches, groupBy]);

  const getAlertLevel = (days: number): 'critical' | 'warning' | 'info' => {
    if (days < 0) return 'critical';
    if (days <= 30) return 'warning';
    return 'info';
  };

  const getAlertColor = (level: 'critical' | 'warning' | 'info'): string => {
    switch (level) {
      case 'critical': return '#dc2626';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
    }
  };

  const getAlertBg = (level: 'critical' | 'warning' | 'info'): string => {
    switch (level) {
      case 'critical': return '#fee2e2';
      case 'warning': return '#fef3c7';
      case 'info': return '#dbeafe';
    }
  };

  const exportToPDF = () => {
    // Simple HTML export for now - can be enhanced with proper PDF generation
    const html = `
      <html>
        <head><title>Expiry Report</title></head>
        <body>
          <h1>Expiry Report - ${new Date().toLocaleDateString()}</h1>
          <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%;">
            <tr>
              <th>Product</th>
              <th>Batch No</th>
              <th>Expiry Date</th>
              <th>Qty</th>
              <th>Days Left</th>
              <th>Godown</th>
            </tr>
            ${filteredBatches.map(b => {
              const level = getAlertLevel(b.daysUntilExpiry);
              return `
                <tr style="background-color: ${getAlertBg(level)}">
                  <td>${b.productName}</td>
                  <td>${b.batchNumber}</td>
                  <td>${new Date(b.expiryDate).toLocaleDateString()}</td>
                  <td>${b.quantity}</td>
                  <td style="color: ${getAlertColor(level)}; font-weight: bold;">
                    ${b.daysUntilExpiry < 0 ? `Expired ${Math.abs(b.daysUntilExpiry)} days ago` : `${b.daysUntilExpiry} days`}
                  </td>
                  <td>${b.godownName || 'Unassigned'}</td>
                </tr>
              `;
            }).join('')}
          </table>
        </body>
      </html>
    `;
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url);
    if (w) {
      w.onload = () => w.print();
    }
  };

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Expiry Management</h2>
          <p>Track and manage product expiry dates</p>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '0.5rem'
          }}
        >
          <button onClick={exportToPDF} disabled={loading}>
            📄 Export PDF
          </button>
          <button onClick={loadData} disabled={loading}>
            🔄 Refresh
          </button>
        </div>
      </header>
      <div className="panel__body">
        {/* Filters */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.75rem',
            marginBottom: '1rem',
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '6px'
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                marginBottom: '0.25rem'
              }}
            >
              Days Ahead
            </label>
            <input
              type="number"
              min={1}
              max={365}
              value={filters.daysAhead || 90}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  daysAhead: Number(e.target.value)
                }))
              }
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                marginBottom: '0.25rem'
              }}
            >
              Category
            </label>
            <select
              value={filters.categoryId || ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  categoryId: e.target.value ? Number(e.target.value) : undefined
                }))
              }
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                marginBottom: '0.25rem'
              }}
            >
              Manufacturer
            </label>
            <select
              value={filters.manufacturer || ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  manufacturer: e.target.value || undefined
                }))
              }
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            >
              <option value="">All Manufacturers</option>
              {manufacturers.map((mfg) => (
                <option key={mfg} value={mfg}>
                  {mfg}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '1.5rem'
              }}
            >
              <input
                type="checkbox"
                checked={filters.includeExpired || false}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    includeExpired: e.target.checked
                  }))
                }
              />
              <span style={{ fontSize: '0.875rem' }}>Include Expired</span>
            </label>
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                marginBottom: '0.25rem'
              }}
            >
              Group By
            </label>
            <select
              value={groupBy}
              onChange={(e) =>
                setGroupBy(e.target.value as 'none' | 'manufacturer' | 'category')
              }
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            >
              <option value="none">No Grouping</option>
              <option value="manufacturer">Manufacturer</option>
              <option value="category">Category</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading expiry data...</div>
        ) : filteredBatches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            No batches expiring in the selected period
          </div>
        ) : (
          <div>
            {Object.entries(groupedBatches).map(([groupName, groupBatches]) => (
              <div key={groupName} style={{ marginBottom: '2rem' }}>
                {groupBy !== 'none' && (
                  <h3 style={{ 
                    margin: '0 0 1rem 0', 
                    fontSize: '1rem', 
                    fontWeight: 600,
                    padding: '0.5rem',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '4px'
                  }}>
                    {groupName} ({groupBatches.length})
                  </h3>
                )}
                <div className="table-wrapper" style={{ overflowX: 'auto' }}>
                  <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>SKU</th>
                        <th>Batch No</th>
                        <th>Expiry Date</th>
                        <th style={{ textAlign: 'right' }}>Qty</th>
                        <th>Days Left</th>
                        <th>Godown</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupBatches.map((batch) => {
                        const level = getAlertLevel(batch.daysUntilExpiry);
                        return (
                          <tr
                            key={batch.id}
                            style={{
                              backgroundColor: level === 'critical' ? '#fee2e2' :
                                            level === 'warning' ? '#fef3c7' : 'transparent'
                            }}
                          >
                            <td><strong>{batch.productName}</strong></td>
                            <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{batch.sku}</td>
                            <td>{batch.batchNumber}</td>
                            <td>{new Date(batch.expiryDate).toLocaleDateString('en-IN')}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{batch.quantity}</td>
                            <td>
                              <span
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '0.25rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  backgroundColor: getAlertBg(level),
                                  color: getAlertColor(level)
                                }}
                              >
                                {batch.daysUntilExpiry < 0
                                  ? `Expired ${Math.abs(batch.daysUntilExpiry)} days ago`
                                  : batch.daysUntilExpiry === 0
                                    ? 'Expires today'
                                    : `${batch.daysUntilExpiry} days`}
                              </span>
                            </td>
                            <td>{batch.godownName || 'Unassigned'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ExpiryManagementEnhanced;

