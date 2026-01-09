// FILE: src/components/dashboard/StockAlertsPanel.tsx
/// ANCHOR: StockAlertsPanel
import { useEffect, useMemo } from 'react';
import { useStockStore } from '../../stores/stockStore';

const StockAlertsPanel = () => {
  const { entries, load, status } = useStockStore();

  useEffect(() => {
    if (entries.length === 0) {
      load().catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lowStock = useMemo(
    () =>
      entries.filter((item) => {
        const threshold = item.minStock ?? 0;
        return threshold > 0 && item.totalQuantity <= threshold;
      }),
    [entries]
  );

  const zeroStock = useMemo(
    () => entries.filter((item) => item.totalQuantity === 0),
    [entries]
  );

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Stock Alerts</h2>
          <p>Monitor low and zero stock SKUs</p>
        </div>
        <button onClick={load} disabled={status === 'loading'} className="btn btn-outline">
          Refresh
        </button>
      </header>
      <div className="panel__body stock-alerts">
        <div>
          <h3>Low Stock</h3>
          {lowStock.length === 0 ? (
            <p className="empty">
              {status === 'loading' ? 'Checking...' : 'All good on reorder levels'}
            </p>
          ) : (
            <ul>
              {lowStock.map((entry) => (
                <li key={`low-${entry.productId}`}>
                  <span>{entry.name}</span>
                  <strong>{entry.totalQuantity}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3>Out of Stock</h3>
          {zeroStock.length === 0 ? (
            <p className="empty">
              {status === 'loading' ? 'Checking...' : 'No zero-stock alerts'}
            </p>
          ) : (
            <ul>
              {zeroStock.map((entry) => (
                <li key={`zero-${entry.productId}`}>
                  <span>{entry.name}</span>
                  <strong>0</strong>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};

export default StockAlertsPanel;

