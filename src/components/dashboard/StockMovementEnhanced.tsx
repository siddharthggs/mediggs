// FILE: src/components/dashboard/StockMovementEnhanced.tsx
/// ANCHOR: StockMovementEnhanced
import { useEffect, useState, useMemo } from 'react';
import type { StockMovementDTO, StockMovementRequest, ProductDTO, StockMovementChartData } from '@shared/ipc';
import { invoke } from '../../api/ipcClient';

const StockMovementEnhanced = ({ globalSearch }: { globalSearch?: string }) => {
  const [movements, setMovements] = useState<StockMovementDTO[]>([]);
  const [chartData, setChartData] = useState<StockMovementChartData[]>([]);
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [filters, setFilters] = useState<StockMovementRequest & { fromDate?: string; toDate?: string }>({
    limit: 500
  });
  const [loading, setLoading] = useState(false);
  const [showChart, setShowChart] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [movementList, productList] = await Promise.all([
        invoke('ipc.stock.movements', filters),
        invoke('ipc.product.list', { page: 1, pageSize: 10000 }).then(r => 'products' in r ? r.products : [])
      ]);
      setMovements(movementList);
      setProducts(productList as ProductDTO[]);

      // Load chart data for last 7 days by default
      const toDate = filters.toDate || new Date().toISOString().substring(0, 10);
      const fromDate = filters.fromDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
      
      if (filters.fromDate || filters.toDate || !filters.fromDate) {
        const chart = await invoke('ipc.stock.movementChart', { fromDate, toDate });
        setChartData(chart);
      }
    } catch (error) {
      console.error('Error loading stock movements:', error);
      alert('Failed to load stock movements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters.productId, filters.movementType, filters.fromDate, filters.toDate, filters.batchId]);

  const filteredMovements = useMemo(() => {
    if (!globalSearch) return movements;
    const searchLower = globalSearch.toLowerCase();
    return movements.filter(m =>
      m.productName.toLowerCase().includes(searchLower) ||
      m.batchNumber?.toLowerCase().includes(searchLower) ||
      m.reference.toLowerCase().includes(searchLower)
    );
  }, [movements, globalSearch]);

  const movementTypes = [
    { value: '', label: 'All Types' },
    { value: 'PURCHASE', label: 'Purchase' },
    { value: 'SALE', label: 'Sale' },
    { value: 'RETURN', label: 'Return' },
    { value: 'CREDIT_NOTE', label: 'Credit Note' },
    { value: 'TRANSFER_IN', label: 'Transfer In' },
    { value: 'TRANSFER_OUT', label: 'Transfer Out' },
    { value: 'ADJUSTMENT', label: 'Adjustment' },
    { value: 'CANCELLATION', label: 'Cancellation' }
  ];

  const exportToCSV = () => {
    const headers = ['Date', 'Product', 'Batch', 'Qty (IN/OUT)', 'Movement Type', 'Reference Invoice No', 'Godown', 'Balance After'];
    const rows = filteredMovements.map(m => [
      new Date(m.createdAt).toLocaleDateString(),
      m.productName,
      m.batchNumber || '-',
      m.quantityChange > 0 ? `+${m.quantityChange}` : String(m.quantityChange),
      m.movementType,
      m.reference || '-',
      m.godownName || '-',
      String(m.balanceAfter)
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-movements-${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate max for chart scaling
  const maxChartValue = useMemo(() => {
    if (chartData.length === 0) return 100;
    return Math.max(
      ...chartData.map(d => Math.max(d.in, d.out)),
      100
    );
  }, [chartData]);

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Stock Movement History</h2>
          <p>Track all stock transactions and movements</p>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '0.5rem'
          }}
        >
          <button onClick={() => setShowChart(!showChart)}>
            {showChart ? '📊 Hide Chart' : '📊 Show Chart'}
          </button>
          <button onClick={exportToCSV} disabled={loading}>
            📥 Export CSV
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
              Product
            </label>
            <select
              value={filters.productId || ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  productId: e.target.value ? Number(e.target.value) : undefined
                }))
              }
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            >
              <option value="">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
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
              Movement Type
            </label>
            <select
              value={filters.movementType || ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  movementType: e.target.value || undefined
                }))
              }
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            >
              {movementTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
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
              From Date
            </label>
            <input
              type="date"
              value={filters.fromDate || ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  fromDate: e.target.value || undefined
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
              To Date
            </label>
            <input
              type="date"
              value={filters.toDate || ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  toDate: e.target.value || undefined
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
        </div>

        {/* Chart */}
        {showChart && chartData.length > 0 && (
          <div style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '6px'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600 }}>Weekly Stock Movement Trend</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '200px', padding: '0.5rem 0' }}>
              {chartData.slice(-7).map((data, idx) => {
                const inHeight = (data.in / maxChartValue) * 100;
                const outHeight = (data.out / maxChartValue) * 100;
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '150px', width: '100%' }}>
                      <div
                        style={{
                          flex: 1,
                          backgroundColor: '#10b981',
                          height: `${inHeight}%`,
                          minHeight: '2px',
                          borderRadius: '4px 4px 0 0'
                        }}
                        title={`IN: ${data.in}`}
                      />
                      <div
                        style={{
                          flex: 1,
                          backgroundColor: '#ef4444',
                          height: `${outHeight}%`,
                          minHeight: '2px',
                          borderRadius: '4px 4px 0 0'
                        }}
                        title={`OUT: ${data.out}`}
                      />
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', textAlign: 'center', marginTop: '0.5rem' }}>
                      {new Date(data.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '0.5rem', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '2px' }}></div>
                <span>Stock IN</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#ef4444', borderRadius: '2px' }}></div>
                <span>Stock OUT</span>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="table-wrapper" style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading movements...</div>
          ) : filteredMovements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              No stock movements found
            </div>
          ) : (
            <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Batch</th>
                  <th>Qty (IN/OUT)</th>
                  <th>Movement Type</th>
                  <th>Reference</th>
                  <th>Godown</th>
                  <th style={{ textAlign: 'right' }}>Balance After</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.map((movement) => (
                  <tr key={movement.id}>
                    <td>{new Date(movement.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td><strong>{movement.productName}</strong></td>
                    <td>{movement.batchNumber || '-'}</td>
                    <td style={{
                      color: movement.quantityChange > 0 ? '#16a34a' : '#dc2626',
                      fontWeight: 600,
                      textAlign: 'right'
                    }}>
                      {movement.quantityChange > 0 ? '+' : ''}{movement.quantityChange}
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor:
                            movement.movementType === 'PURCHASE' ? '#dcfce7' :
                            movement.movementType === 'SALE' ? '#fee2e2' :
                            movement.movementType === 'RETURN' ? '#dbeafe' :
                            movement.movementType === 'TRANSFER_IN' ? '#f0f9ff' :
                            movement.movementType === 'TRANSFER_OUT' ? '#fef3c7' :
                            '#f3f4f6',
                          color:
                            movement.movementType === 'PURCHASE' ? '#166534' :
                            movement.movementType === 'SALE' ? '#991b1b' :
                            movement.movementType === 'RETURN' ? '#1e40af' :
                            movement.movementType === 'TRANSFER_IN' ? '#0369a1' :
                            movement.movementType === 'TRANSFER_OUT' ? '#92400e' :
                            '#374151'
                        }}
                      >
                        {movement.movementType}
                      </span>
                    </td>
                    <td>{movement.reference || '-'}</td>
                    <td>{movement.godownName || '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{movement.balanceAfter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
};

export default StockMovementEnhanced;

