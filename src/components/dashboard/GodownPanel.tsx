// FILE: src/components/dashboard/GodownPanel.tsx
/// ANCHOR: GodownPanel
import { FormEvent, useEffect, useState } from 'react';
import type { GodownDTO, GodownInput } from '@shared/ipc';
import { invoke } from '../../api/ipcClient';

const initialForm: GodownInput = {
  name: '',
  location: '',
  isDefault: false
};

const GodownPanel = () => {
  const [godowns, setGodowns] = useState<GodownDTO[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const loadGodowns = async () => {
    setLoading(true);
    try {
      const data = await invoke('ipc.godown.list', undefined);
      setGodowns(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGodowns().catch(console.error);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await invoke('ipc.godown.create', {
      name: form.name,
      location: form.location || undefined,
      isDefault: form.isDefault
    });
    setForm(initialForm);
    await loadGodowns();
  };

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Godowns</h2>
          <p>Manage warehouse locations</p>
        </div>
        <button onClick={loadGodowns} disabled={loading}>
          Refresh
        </button>
      </header>
      <div className="panel__body supplier-panel">
        <form className="supplier-form" onSubmit={handleSubmit}>
          <input
            placeholder="Godown name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
          <input
            placeholder="Location (optional)"
            value={form.location}
            onChange={(event) =>
              setForm({ ...form, location: event.target.value })
            }
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(event) =>
                setForm({ ...form, isDefault: event.target.checked })
              }
            />
            Set as default
          </label>
          <button type="submit">Add Godown</button>
        </form>
        <div className="supplier-list">
          {godowns.length === 0 ? (
            <p className="empty">
              {loading ? 'Loading godowns...' : 'No godowns yet'}
            </p>
          ) : (
            <ul>
              {godowns.map((godown) => (
                <li key={godown.id}>
                  <div>
                    <strong>
                      {godown.name}
                      {godown.isDefault && (
                        <span style={{ color: '#16a34a', marginLeft: '0.5rem' }}>
                          (Default)
                        </span>
                      )}
                    </strong>
                    {godown.location ? <span>{godown.location}</span> : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};
export default GodownPanel;

