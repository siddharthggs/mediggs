// FILE: src/components/dashboard/BackupPanel.tsx
/// ANCHOR: BackupPanel
import { useState } from 'react';
import type { BackupExportResponse } from '@shared/ipc';
import { invoke } from '../../api/ipcClient';

const BackupPanel = () => {
  const [lastBackup, setLastBackup] = useState<BackupExportResponse | null>(null);
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>(
    'idle'
  );
  const [error, setError] = useState<string | undefined>();

  const handleBackup = async () => {
    setStatus('running');
    setError(undefined);
    try {
      const response = await invoke('ipc.backup.export', undefined);
      setLastBackup(response);
      setStatus('done');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Backup failed');
    }
  };

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Backup</h2>
          <p>Local SQLite backup for this machine</p>
        </div>
      </header>
      <div className="panel__body backup-panel">
        <button
          className="backup-panel__button"
          onClick={handleBackup}
          disabled={status === 'running'}
        >
          {status === 'running' ? 'Creating backup…' : 'Create local backup'}
        </button>
        {lastBackup ? (
          <p className="backup-panel__info">
            Last backup: <code>{lastBackup.filePath}</code>
          </p>
        ) : (
          <p className="empty">No backup created in this session yet.</p>
        )}
        {error ? <p className="error">{error}</p> : null}
      </div>
    </section>
  );
};

export default BackupPanel;


