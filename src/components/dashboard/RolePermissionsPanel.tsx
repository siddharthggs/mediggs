// FILE: src/components/dashboard/RolePermissionsPanel.tsx
/// ANCHOR: RolePermissionsPanel
import { useEffect, useState } from 'react';
import type { RoleDTO } from '@shared/ipc';
import { invoke } from '../../api/ipcClient';

interface Permission {
  resource: string;
  actions: string[];
}

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  ADMIN: [
    { resource: 'All Resources', actions: ['All Actions'] }
  ],
  MANAGER: [
    { resource: 'Products', actions: ['Create', 'Read', 'Update', 'Delete', 'List'] },
    { resource: 'Customers', actions: ['Create', 'Read', 'Update', 'Delete', 'List'] },
    { resource: 'Suppliers', actions: ['Create', 'Read', 'Update', 'Delete', 'List'] },
    { resource: 'Batches', actions: ['Create', 'Read', 'Update', 'Delete', 'List', 'Transfer'] },
    { resource: 'Godowns', actions: ['Create', 'Read', 'Update', 'Delete', 'List'] },
    { resource: 'Sales', actions: ['Create', 'Read', 'List'] },
    { resource: 'Purchases', actions: ['Create', 'Read', 'List'] },
    { resource: 'Billing', actions: ['Create', 'Read', 'Update', 'List', 'Finalize'] },
    { resource: 'Credit Notes', actions: ['Create', 'Read', 'List'] },
    { resource: 'Payments', actions: ['Create', 'Read', 'Delete', 'List'] },
    { resource: 'Reports', actions: ['Read'] },
    { resource: 'Users', actions: ['Read', 'List'] },
    { resource: 'Schemes', actions: ['Create', 'Read', 'Update', 'Delete', 'List'] },
    { resource: 'Import', actions: ['Create'] },
    { resource: 'PDF Generation', actions: ['Generate'] }
  ],
  ACCOUNTANT: [
    { resource: 'Products', actions: ['Read', 'List'] },
    { resource: 'Customers', actions: ['Read', 'List'] },
    { resource: 'Suppliers', actions: ['Read', 'List'] },
    { resource: 'Batches', actions: ['Read', 'List'] },
    { resource: 'Godowns', actions: ['Read', 'List'] },
    { resource: 'Sales', actions: ['Read', 'List'] },
    { resource: 'Purchases', actions: ['Read', 'List'] },
    { resource: 'Billing', actions: ['Read', 'List'] },
    { resource: 'Credit Notes', actions: ['Read', 'List'] },
    { resource: 'Payments', actions: ['Create', 'Read', 'Delete', 'List'] },
    { resource: 'Reports', actions: ['Read'] },
    { resource: 'PDF Generation', actions: ['Generate'] }
  ],
  SALES: [
    { resource: 'Products', actions: ['Read', 'List'] },
    { resource: 'Customers', actions: ['Create', 'Read', 'Update', 'List'] },
    { resource: 'Suppliers', actions: ['Read', 'List'] },
    { resource: 'Batches', actions: ['Read', 'List'] },
    { resource: 'Godowns', actions: ['Read', 'List'] },
    { resource: 'Sales', actions: ['Create', 'Read', 'List'] },
    { resource: 'Billing', actions: ['Create', 'Read', 'List', 'Finalize'] },
    { resource: 'Credit Notes', actions: ['Create', 'Read', 'List'] },
    { resource: 'Payments', actions: ['Read', 'List'] },
    { resource: 'PDF Generation', actions: ['Generate'] }
  ]
};

const RolePermissionsPanel = () => {
  const [roles, setRoles] = useState<RoleDTO[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const roleList = await invoke('ipc.role.list', undefined);
      setRoles(roleList);
      if (roleList.length > 0 && !selectedRole) {
        setSelectedRole(roleList[0].name);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const permissions = selectedRole ? ROLE_PERMISSIONS[selectedRole] || [] : [];

  return (
    <div className="supplier-panel">
      <h3 style={{ margin: '0 0 var(--spacing-lg) 0', fontSize: '1.125rem', fontWeight: 600 }}>Role Permissions</h3>
      
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: 'var(--spacing-md)', 
          fontWeight: 500,
          fontSize: '0.875rem',
          color: 'var(--color-text-secondary)'
        }}>
          Select Role to View Permissions:
        </label>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            fontSize: '0.9375rem',
            background: 'var(--color-bg-primary)',
            color: 'var(--color-text-primary)',
            transition: 'all 0.2s'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--color-primary)';
            e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--color-border)';
            e.target.style.boxShadow = 'none';
          }}
        >
          <option value="">Select a role</option>
          {roles.map((role) => (
            <option key={role.id} value={role.name}>
              {role.name} {role.description && `- ${role.description}`}
            </option>
          ))}
        </select>
      </div>

      {selectedRole && (
        <div>
          <h4 style={{ 
            margin: 'var(--spacing-lg) 0 var(--spacing-md) 0', 
            fontSize: '0.9375rem', 
            fontWeight: 600,
            color: 'var(--color-text-primary)'
          }}>
            Permissions for {selectedRole}:
          </h4>
          {permissions.length === 0 ? (
            <p className="empty" style={{ fontSize: '0.875rem' }}>
              No specific permissions defined for this role.
            </p>
          ) : (
            <div style={{ 
              background: 'var(--color-bg-secondary)', 
              padding: 'var(--spacing-lg)', 
              borderRadius: 'var(--radius-lg)',
              maxHeight: '400px',
              overflowY: 'auto',
              border: '1px solid var(--color-border)'
            }}>
              {permissions.map((perm, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    marginBottom: idx < permissions.length - 1 ? 'var(--spacing-lg)' : 0,
                    paddingBottom: idx < permissions.length - 1 ? 'var(--spacing-lg)' : 0,
                    borderBottom: idx < permissions.length - 1 ? '1px solid var(--color-border)' : 'none'
                  }}
                >
                  <div style={{ 
                    fontWeight: 600, 
                    marginBottom: 'var(--spacing-sm)', 
                    color: 'var(--color-text-primary)',
                    fontSize: '0.9375rem'
                  }}>
                    {perm.resource}
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 'var(--spacing-sm)',
                    marginTop: 'var(--spacing-sm)'
                  }}>
                    {perm.actions.map((action, actionIdx) => (
                      <span
                        key={actionIdx}
                        style={{
                          padding: '0.375rem 0.75rem',
                          background: 'var(--color-primary)',
                          color: 'white',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: 500
                        }}
                      >
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ 
        marginTop: 'var(--spacing-lg)', 
        padding: 'var(--spacing-md)', 
        background: 'var(--color-warning-bg)', 
        borderRadius: 'var(--radius-md)',
        fontSize: '0.875rem',
        color: 'var(--color-warning-dark)',
        border: '1px solid var(--color-border)'
      }}>
        <strong>Note:</strong> Only one ADMIN user is allowed in the system. 
        ADMIN has full access to all resources and actions.
      </div>
    </div>
  );
};

export default RolePermissionsPanel;

