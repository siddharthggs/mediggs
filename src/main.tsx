// FILE: src/main.tsx
/// ANCHOR: RendererEntry
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './utils/toast';
import { forceRecoverUI } from './utils/forceRecover';
import './styles/global.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container not found');
}

// Global UI recovery function - uses forceRecoverUI utility
const handleGlobalRecovery = () => {
  forceRecoverUI();
};

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <ErrorBoundary onRecover={handleGlobalRecovery}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

