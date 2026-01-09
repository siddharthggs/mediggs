// FILE: src/components/layout/Sidebar.tsx
/// ANCHOR: Sidebar
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface SidebarProps {
  isMobileOpen?: boolean;
}

const Sidebar = ({ isMobileOpen }: SidebarProps) => {
  const { user } = useAuthStore();

  const allMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊', shortcut: 'Ctrl+1', adminOnly: false },
    { path: '/products', label: 'Products', icon: '📦', shortcut: 'Ctrl+2', adminOnly: false },
    { path: '/stock', label: 'Stock', icon: '📋', shortcut: 'Ctrl+3', adminOnly: false },
    { path: '/purchases', label: 'Purchases', icon: '🛒', shortcut: 'Ctrl+4', adminOnly: false },
    { path: '/sales', label: 'Sales', icon: '💰', shortcut: 'Ctrl+5', adminOnly: false },
    { path: '/billing/new', label: 'Billing', icon: '🧾', shortcut: 'Ctrl+B', adminOnly: false },
    { path: '/search', label: 'Global Search', icon: '🔍', shortcut: 'Ctrl+F', adminOnly: false },
    { path: '/payments', label: 'Payments', icon: '💳', shortcut: 'Ctrl+8', adminOnly: false },
    { path: '/reports', label: 'Reports', icon: '📈', shortcut: 'Ctrl+6', adminOnly: false },
    { path: '/settings', label: 'Settings', icon: '⚙️', shortcut: 'Ctrl+7', adminOnly: true },
    { path: '/settings/company-info', label: 'Company Info', icon: '🏢', shortcut: '', adminOnly: true },
    { path: '/settings/billing-templates', label: 'Billing Templates', icon: '📄', shortcut: '', adminOnly: true }
  ];

  const menuItems = allMenuItems.filter(
    (item) => !item.adminOnly || user?.role === 'ADMIN'
  );

  return (
    <aside className={`sidebar ${isMobileOpen ? 'sidebar--open' : ''}`}>
      <div className="sidebar__header">
        <div className="sidebar__brand">
          <div className="sidebar__logo-mark">MC</div>
          <div className="sidebar__brand-text">
            <span className="sidebar__app-name">Mediclone</span>
            <span className="sidebar__app-tagline">Pharma ERP</span>
          </div>
        </div>
        <div className="sidebar__user">
          <span className="sidebar__user-name">{user?.displayName}</span>
          {user?.role && <span className="sidebar__role-pill">{user.role}</span>}
        </div>
      </div>
      <nav className="sidebar__nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar__item ${isActive ? 'active' : ''}`
            }
            title={item.shortcut ? `${item.label} (${item.shortcut})` : item.label}
          >
            <span className="sidebar__icon">{item.icon}</span>
            <span className="sidebar__label">{item.label}</span>
            {item.shortcut && (
              <span className="sidebar__shortcut">{item.shortcut}</span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar__footer">
        <div className="sidebar__help">
          <span>
            Press <kbd>?</kbd> for shortcuts
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

