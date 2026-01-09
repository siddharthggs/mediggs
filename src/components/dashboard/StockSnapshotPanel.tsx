// FILE: src/components/dashboard/StockSnapshotPanel.tsx
/// ANCHOR: StockSnapshotPanel
import { useEffect } from 'react';
import { useStockStore } from '../../stores/stockStore';

const StockSnapshotPanel = () => {
  const { entries, load, status } = useStockStore();

  useEffect(() => {
    load().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Stock Snapshot</h2>
          <p>Live quantities by product & godown</p>
        </div>
        <button onClick={load} disabled={status === 'loading'}>
          Refresh
        </button>
      </header>
      <div className="panel__body">
        {entries.length === 0 ? (
          <p className="empty">
            {status === 'loading' ? 'Loading stock...' : 'No stock ledger entries'}
          </p>
        ) : (
          <ul className="stock-list">
            {entries.map((entry) => (
              <li key={entry.productId}>
                <div className="stock-list__header">
                  <strong>{entry.name}</strong>
                  <span>{entry.totalQuantity} units</span>
                </div>
                <ul className="stock-list__godowns">
                  {entry.godownBreakup.map((godown) => (
                    <li key={`${entry.productId}-${godown.godownId ?? 'none'}`}>
                      {godown.godownName}: {godown.quantity}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default StockSnapshotPanel;

