// FILE: src/components/dashboard/StockAlertsEnhanced.tsx
/// ANCHOR: StockAlertsEnhanced
import { useEffect, useState, useMemo } from 'react';
import type { StockAlertsResponse } from '@shared/ipc';
import { invoke } from '../../api/ipcClient';

const StockAlertsEnhanced = ({ globalSearch }: { globalSearch?: string }) => {
  const [alerts, setAlerts] = useState<StockAlertsResponse>({
    lowStock: [],
    outOfStock: [],
    overstock: [],
    reorderRequired: []
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'low' | 'out' | 'over' | 'reorder'>('low');

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await invoke('ipc.stock.alerts', undefined);
      setAlerts(data);
    } catch (error) {
      console.error('Error loading stock alerts:', error);
      alert('Failed to load stock alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const filteredAlerts = useMemo(() => {
    const alertsMap = {
      low: alerts.lowStock,
      out: alerts.outOfStock,
      over: alerts.overstock,
      reorder: alerts.reorderRequired
    };
    
    const list = alertsMap[activeTab];
    if (!globalSearch) return list;
    
    const searchLower = globalSearch.toLowerCase();
    return list.filter(item =>
      item.productName.toLowerCase().includes(searchLower) ||
      item.sku.toLowerCase().includes(searchLower) ||
      item.manufacturer?.toLowerCase().includes(searchLower) ||
      item.category?.toLowerCase().includes(searchLower)
    );
  }, [alerts, activeTab, globalSearch]);

  const tabs = [
    { id: 'low' as const, label: 'Low Stock', count: alerts.lowStock.length, color: '#f59e0b' },
    { id: 'out' as const, label: 'Out of Stock', count: alerts.outOfStock.length, color: '#ef4444' },
    { id: 'over' as const, label: 'Overstock', count: alerts.overstock.length, color: '#8b5cf6' },
    { id: 'reorder' as const, label: 'Reorder Required', count: alerts.reorderRequired.length, color: '#3b82f6' }
  ];

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Stock Alerts</h2>
          <p>Monitor inventory levels and reorder requirements</p>
        </div>
        <button onClick={loadAlerts} disabled={loading}>
          🔄 Refresh
        </button>
      </header>
      <div className="panel__body">
        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            borderBottom: '2px solid #e5e7eb',
            marginBottom: '1rem'
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.75rem 1rem',
                border: 'none',
                background: 'none',
                borderBottom:
                  activeTab === tab.id
                    ? `3px solid ${tab.color}`
                    : '3px solid transparent',
                color: activeTab === tab.id ? tab.color : '#64748b',
                fontWeight: activeTab === tab.id ? 600 : 400,
                cursor: 'pointer',
                position: 'relative',
                marginBottom: '-2px'
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  style={{
                    marginLeft: '0.5rem',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    backgroundColor: tab.color,
                    color: '#fff',
                    fontWeight: 600
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading alerts...</div>
        ) : filteredAlerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            {activeTab === 'low' && 'All products are above reorder level'}
            {activeTab === 'out' && 'No products are out of stock'}
            {activeTab === 'over' && 'No overstock items detected'}
            {activeTab === 'reorder' && 'No reorder alerts'}
          </div>
        ) : (
          <div className="table-wrapper" style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th style={{ textAlign: 'right' }}>Current Qty</th>
                  <th style={{ textAlign: 'right' }}>Reorder Level</th>
                  <th style={{ textAlign: 'right' }}>Suggested Order Qty</th>
                  <th>Supplier</th>
                  <th>Category</th>
                  <th>Manufacturer</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map((item) => (
                  <tr
                    key={item.productId}
                    style={{
                      backgroundColor: item.currentQty === 0 ? '#fee2e2' : 
                                     item.currentQty <= item.reorderLevel ? '#fef3c7' : 
                                     activeTab === 'over' ? '#f3e8ff' : 'transparent'
                    }}
                  >
                    <td><strong>{item.productName}</strong></td>
                    <td>{item.sku}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      {item.currentQty} {item.unitOfMeasure || ''}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {item.reorderLevel > 0 ? `${item.reorderLevel} ${item.unitOfMeasure || ''}` : '-'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#3b82f6' }}>
                      {item.suggestedOrderQty > 0 ? `${item.suggestedOrderQty} ${item.unitOfMeasure || ''}` : '-'}
                    </td>
                    <td>{item.supplierName || '-'}</td>
                    <td>{item.category || '-'}</td>
                    <td>{item.manufacturer || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default StockAlertsEnhanced;

