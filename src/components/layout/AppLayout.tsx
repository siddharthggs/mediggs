// FILE: src/components/layout/AppLayout.tsx
/// ANCHOR: AppLayout
import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import Sidebar from './Sidebar';
import { useKeyboardShortcuts, getGlobalShortcuts } from '../../utils/shortcuts';

interface Props {
  children: ReactNode;
}

const AppLayout = ({ children }: Props) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const shortcuts = [
    ...getGlobalShortcuts(navigate),
    {
      key: '?',
      action: () => setShowShortcuts(true),
      description: 'Show keyboard shortcuts'
    },
    {
      key: 'Escape',
      action: () => setShowShortcuts(false),
      description: 'Close shortcuts dialog'
    }
  ];

  useKeyboardShortcuts(shortcuts);

  return (
    <div className="app-shell">
      <Sidebar isMobileOpen={isSidebarOpen} />
      <div className="app-shell__main">
        <header className="app-shell__header">
          <div className="app-shell__header-left">
            <button
              type="button"
              className="app-shell__menu-btn"
              onClick={() => setIsSidebarOpen((open) => !open)}
            >
              <span className="app-shell__menu-icon" aria-hidden="true" />
              <span className="sr-only">Toggle navigation</span>
            </button>
            <div>
              <h1>Mediclone ERP</h1>
              <span className="app-shell__subtitle">Wholesale Pharma Desk</span>
            </div>
          </div>
          <div className="app-shell__user">
            <span>{user?.displayName}</span>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </header>
        <main className="app-shell__content">{children}</main>
      </div>
      {isSidebarOpen && (
        <div
          className="app-shell__backdrop"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      {showShortcuts && (
        <div className="shortcuts-modal" onClick={() => setShowShortcuts(false)}>
          <div className="shortcuts-modal__content" onClick={(e) => e.stopPropagation()}>
            <div className="shortcuts-modal__header">
              <h2>Keyboard Shortcuts</h2>
              <button onClick={() => setShowShortcuts(false)}>×</button>
            </div>
            <div className="shortcuts-modal__body">
              {shortcuts.map((shortcut, index) => (
                <div key={index} className="shortcut-item">
                  <div className="shortcut-item__keys">
                    {shortcut.ctrl && <kbd>Ctrl</kbd>}
                    {shortcut.shift && <kbd>Shift</kbd>}
                    {shortcut.alt && <kbd>Alt</kbd>}
                    <kbd>{shortcut.key.toUpperCase()}</kbd>
                  </div>
                  <div className="shortcut-item__description">{shortcut.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppLayout;

