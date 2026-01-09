// FILE: src/components/dashboard/ExpiryPanel.tsx
/// ANCHOR: ExpiryPanel
import { useEffect, useState } from 'react';
import type { ExpiringBatchDTO, ExpiryAlertRequest } from '@shared/ipc';
import { invoke } from '../../api/ipcClient';

const ExpiryPanel = () => {
  const [batches, setBatches] = useState<ExpiringBatchDTO[]>([]);
  const [filters, setFilters] = useState<ExpiryAlertRequest>({
    daysAhead: 90,
    includeExpired: false
  });
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await invoke('ipc.stock.expiring', filters);
      setBatches(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData().catch(console.error);
  }, [filters.daysAhead, filters.includeExpired]);

  const getAlertLevel = (days: number): 'critical' | 'warning' | 'info' => {
    if (days < 0) return 'critical';
    if (days <= 30) return 'warning';
    return 'info';
  };

  const getAlertColor = (level: 'critical' | 'warning' | 'info'): string => {
    switch (level) {
      case 'critical':
        return '#dc2626';
      case 'warning':
        return '#f59e0b';
      case 'info':
        return '#3b82f6';
    }
  };

  const getAlertBg = (level: 'critical' | 'warning' | 'info'): string => {
    switch (level) {
      case 'critical':
        return '#fee2e2';
      case 'warning':
        return '#fef3c7';
      case 'info':
        return '#dbeafe';
    }
  };

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Expiry Management</h2>
          <p>Track batches nearing expiry</p>
        </div>
        <button onClick={loadData} disabled={loading}>
          Refresh
        </button>
      </header>
      <div className="panel__body">
        <div className="purchase-form__meta" style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Days ahead:</span>
            <input
              type="number"
              min={1}
              max={365}
              value={filters.daysAhead ?? 90}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  daysAhead: Number(event.target.value)
                })
              }
              style={{ width: '80px', padding: '0.5rem' }}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={filters.includeExpired ?? false}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  includeExpired: event.target.checked
                })
              }
            />
            Include expired
          </label>
        </div>
        <div className="stock-movements">
          {loading ? (
            <p className="empty">Loading expiry data...</p>
          ) : batches.length === 0 ? (
            <p className="empty">No batches expiring in the selected period</p>
          ) : (
            <table style={{ width: '100%', fontSize: '0.875rem' }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Batch</th>
                  <th>Expiry Date</th>
                  <th>Days Left</th>
                  <th>Quantity</th>
                  <th>Godown</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => {
                  const level = getAlertLevel(batch.daysUntilExpiry);
                  return (
                    <tr key={batch.id}>
                      <td>
                        <strong>{batch.productName}</strong>
                        <br />
                        <small style={{ color: '#64748b' }}>{batch.sku}</small>
                      </td>
                      <td>{batch.batchNumber}</td>
                      <td>
                        {new Date(batch.expiryDate).toLocaleDateString()}
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: '600',
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
                      <td>
                        <strong>{batch.quantity}</strong>
                      </td>
                      <td>{batch.godownName ?? 'Unassigned'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
};

export default ExpiryPanel;

