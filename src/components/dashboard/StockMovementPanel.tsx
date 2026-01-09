// FILE: src/components/dashboard/StockMovementPanel.tsx
/// ANCHOR: StockMovementPanel
import { useEffect, useState } from 'react';
import type {
  ProductDTO,
  StockMovementDTO,
  StockMovementRequest
} from '@shared/ipc';
import { invoke } from '../../api/ipcClient';

const StockMovementPanel = () => {
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [movements, setMovements] = useState<StockMovementDTO[]>([]);
  const [filters, setFilters] = useState<StockMovementRequest>({
    limit: 50
  });
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productList, movementList] = await Promise.all([
        invoke('ipc.product.list', { page: 1, pageSize: 1000 }).then(r => 'products' in r ? r.products : r),
        invoke('ipc.stock.movements', filters)
      ]);
      setProducts(productList);
      setMovements(movementList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData().catch(console.error);
  }, [filters.productId, filters.movementType]);

  const movementTypes = [
    { value: '', label: 'All Types' },
    { value: 'PURCHASE', label: 'Purchase' },
    { value: 'SALE', label: 'Sale' },
    { value: 'RETURN', label: 'Return' },
    { value: 'ADJUSTMENT', label: 'Adjustment' }
  ];

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Stock Movement History</h2>
          <p>Track all stock transactions</p>
        </div>
        <button onClick={loadData} disabled={loading}>
          Refresh
        </button>
      </header>
      <div className="panel__body">
        <div className="purchase-form__meta" style={{ marginBottom: '1rem' }}>
          <select
            value={filters.productId ?? 0}
            onChange={(event) =>
              setFilters({
                ...filters,
                productId:
                  Number(event.target.value) > 0
                    ? Number(event.target.value)
                    : undefined
              })
            }
          >
            <option value={0}>All Products</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
          <select
            value={filters.movementType ?? ''}
            onChange={(event) =>
              setFilters({
                ...filters,
                movementType:
                  event.target.value || undefined
              })
            }
          >
            {movementTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <div className="stock-movements">
          {loading ? (
            <p className="empty">Loading movements...</p>
          ) : movements.length === 0 ? (
            <p className="empty">No stock movements found</p>
          ) : (
            <table style={{ width: '100%', fontSize: '0.875rem' }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Batch</th>
                  <th>Type</th>
                  <th>Reference</th>
                  <th>Change</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id}>
                    <td>
                      {new Date(movement.createdAt).toLocaleDateString()}
                    </td>
                    <td>{movement.productName}</td>
                    <td>{movement.batchNumber ?? '-'}</td>
                    <td>
                      <span
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          backgroundColor:
                            movement.movementType === 'PURCHASE'
                              ? '#dcfce7'
                              : movement.movementType === 'SALE'
                                ? '#fee2e2'
                                : movement.movementType === 'RETURN'
                                  ? '#dbeafe'
                                  : '#f3f4f6',
                          color:
                            movement.movementType === 'PURCHASE'
                              ? '#166534'
                              : movement.movementType === 'SALE'
                                ? '#991b1b'
                                : movement.movementType === 'RETURN'
                                  ? '#1e40af'
                                  : '#374151'
                        }}
                      >
                        {movement.movementType}
                      </span>
                    </td>
                    <td>{movement.reference}</td>
                    <td
                      style={{
                        color:
                          movement.quantityChange > 0 ? '#16a34a' : '#dc2626',
                        fontWeight: 'bold'
                      }}
                    >
                      {movement.quantityChange > 0 ? '+' : ''}
                      {movement.quantityChange}
                    </td>
                    <td>{movement.balanceAfter}</td>
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

export default StockMovementPanel;

