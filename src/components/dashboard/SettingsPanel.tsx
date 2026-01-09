// FILE: src/components/dashboard/SettingsPanel.tsx
/// ANCHOR: SettingsPanel
import { FormEvent, useEffect, useState } from 'react';
import type { UserDTO, RoleDTO, CreateUserRequest } from '@shared/ipc';
import { invoke } from '../../api/ipcClient';

const SettingsPanel = () => {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [roles, setRoles] = useState<RoleDTO[]>([]);
  const [form, setForm] = useState<CreateUserRequest>({
    username: '',
    password: '',
    roleId: 0
  });
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [userList, roleList] = await Promise.all([
        invoke('ipc.user.list', undefined),
        invoke('ipc.role.list', undefined)
      ]);
      setUsers(userList);
      setRoles(roleList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData().catch(console.error);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.username || !form.password || !form.roleId) {
      return;
    }

    setLoading(true);
    try {
      await invoke('ipc.user.create', form);
      setForm({ username: '', password: '', roleId: 0 });
      await loadData();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="supplier-panel">
      <form className="supplier-form" onSubmit={handleSubmit}>
        <h3 style={{ margin: '0 0 var(--spacing-lg) 0', fontSize: '1.125rem', fontWeight: 600 }}>Create New User</h3>
        <input
          type="email"
          placeholder="Email (username)"
          value={form.username}
          onChange={(event) =>
            setForm({ ...form, username: event.target.value })
          }
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(event) =>
            setForm({ ...form, password: event.target.value })
          }
          required
          minLength={6}
        />
        <select
          value={form.roleId}
          onChange={(event) =>
            setForm({ ...form, roleId: Number(event.target.value) })
          }
          required
        >
          <option value={0}>Select role</option>
          {roles
            .filter(role => role.name !== 'ADMIN') // Hide ADMIN role from selection
            .map((role) => (
              <option key={role.id} value={role.id}>
                {role.name} {role.description && `- ${role.description}`}
              </option>
            ))}
        </select>
        <small style={{ 
          color: 'var(--color-text-tertiary)', 
          fontSize: '0.8125rem', 
          marginTop: 'calc(var(--spacing-sm) * -1)', 
          marginBottom: 'var(--spacing-md)',
          display: 'block',
          padding: 'var(--spacing-sm)',
          background: 'var(--color-warning-bg)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)'
        }}>
          Note: Only one admin user is allowed. Other roles can be assigned to new users.
        </small>
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create User'}
        </button>
      </form>
      <div className="supplier-list">
        <h3 style={{ margin: '0 0 var(--spacing-lg) 0', fontSize: '1.125rem', fontWeight: 600 }}>All Users</h3>
        {loading && users.length === 0 ? (
          <p className="empty">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="empty">No users yet</p>
        ) : (
          <ul>
            {users.map((user) => (
              <li key={user.id}>
                <div>
                  <strong>{user.username}</strong>
                  <span
                    style={{
                      padding: '0.375rem 0.75rem',
                      background: user.roleName === 'ADMIN' ? 'var(--color-danger)' : 'var(--color-primary)',
                      color: 'white',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      marginLeft: 'var(--spacing-md)',
                      fontWeight: user.roleName === 'ADMIN' ? 600 : 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    {user.roleName}
                    {user.roleName === 'ADMIN' && ' (System Admin)'}
                  </span>
                </div>
                <small style={{ color: 'var(--color-text-tertiary)', fontSize: '0.8125rem' }}>
                  Created {new Date(user.createdAt).toLocaleDateString()}
                </small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;

