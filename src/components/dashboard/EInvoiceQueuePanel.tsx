// FILE: src/components/dashboard/EInvoiceQueuePanel.tsx
/// ANCHOR: EInvoiceQueuePanel
import { useEffect, useState } from 'react';
import type { EInvoiceQueueDTO, EInvoiceSyncResult } from '@shared/ipc';
import { invoke } from '../../api/ipcClient';

const EInvoiceQueuePanel = () => {
  const [rows, setRows] = useState<EInvoiceQueueDTO[]>([]);
  const [syncResult, setSyncResult] = useState<EInvoiceSyncResult | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'syncing'>('idle');
  const [error, setError] = useState<string | undefined>();

  const loadQueue = async () => {
    setStatus('loading');
    setError(undefined);
    try {
      const data = await invoke('ipc.einvoice.list', undefined);
      setRows(data);
      setStatus('idle');
    } catch (err) {
      setStatus('idle');
      setError(err instanceof Error ? err.message : 'Failed to load queue');
    }
  };

  const handleSync = async () => {
    setStatus('syncing');
    setError(undefined);
    try {
      const result = await invoke('ipc.einvoice.sync', undefined);
      setSyncResult(result);
      await loadQueue();
    } catch (err) {
      setStatus('idle');
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setStatus('idle');
    }
  };

  useEffect(() => {
    loadQueue().catch(console.error);
  }, []);

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>E-Invoice Queue</h2>
          <p>Offline IRN queue (mock sync)</p>
        </div>
        <button onClick={handleSync} disabled={status !== 'idle'}>
          {status === 'syncing' ? 'Syncing…' : 'Sync IRN'}
        </button>
      </header>
      <div className="panel__body">
        {error ? <p className="error">{error}</p> : null}
        {syncResult ? (
          <p className="backup-panel__info">
            Synced: {syncResult.synced}, Failed: {syncResult.failed}
          </p>
        ) : null}
        <table className="product-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Status</th>
              <th>Last Attempt</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty">
                  {status === 'loading'
                    ? 'Loading queue…'
                    : 'No e-invoice entries yet'}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.invoiceNumber}</td>
                  <td>{row.status}</td>
                  <td>
                    {row.lastAttemptAt
                      ? new Date(row.lastAttemptAt).toLocaleString()
                      : '-'}
                  </td>
                  <td>{row.errorMessage ?? '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default EInvoiceQueuePanel;


