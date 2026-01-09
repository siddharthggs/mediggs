// FILE: src/components/dashboard/DashboardSummaryPanel.tsx
/// ANCHOR: DashboardSummaryPanel
import { useEffect, useState } from 'react';
import type { DashboardSummaryDTO } from '@shared/ipc';
import { invoke } from '../../api/ipcClient';

const DashboardSummaryPanel = () => {
  const [summary, setSummary] = useState<DashboardSummaryDTO | null>(null);
  const [loading, setLoading] = useState(false);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await invoke('ipc.dashboard.summary', undefined);
      setSummary(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary().catch(console.error);
    const interval = setInterval(loadSummary, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !summary) {
    return (
      <section className="panel">
        <header className="panel__header">
          <div>
            <h2>Dashboard Summary</h2>
            <p>Key metrics at a glance</p>
          </div>
        </header>
        <div className="panel__body">
          <p className="empty">Loading...</p>
        </div>
      </section>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <section className="panel" style={{ gridColumn: 'span 2' }}>
      <header className="panel__header">
        <div>
          <h2>Dashboard Summary</h2>
          <p>Key metrics at a glance</p>
        </div>
        <button onClick={loadSummary} disabled={loading} className="btn btn-outline">
          Refresh
        </button>
      </header>
      <div className="panel__body">
        <div className="dashboard-summary">
          <div className="dashboard-summary__grid">
            <div className="dashboard-summary__card">
              <div className="dashboard-summary__card-header">
                <span>Today's Sales</span>
              </div>
              <div className="dashboard-summary__card-body">
                <div className="dashboard-summary__metric">
                  <strong>{summary.todaySales.count}</strong>
                  <span>Invoices</span>
                </div>
                <div className="dashboard-summary__metric">
                  <strong>₹{summary.todaySales.totalAmount.toFixed(2)}</strong>
                  <span>Total</span>
                </div>
              </div>
            </div>

            <div className="dashboard-summary__card">
              <div className="dashboard-summary__card-header">
                <span>Today's Purchases</span>
              </div>
              <div className="dashboard-summary__card-body">
                <div className="dashboard-summary__metric">
                  <strong>{summary.todayPurchases.count}</strong>
                  <span>Invoices</span>
                </div>
                <div className="dashboard-summary__metric">
                  <strong>
                    ₹{summary.todayPurchases.totalAmount.toFixed(2)}
                  </strong>
                  <span>Total</span>
                </div>
              </div>
            </div>

            <div className="dashboard-summary__card">
              <div className="dashboard-summary__card-header">
                <span>Stock Alerts</span>
              </div>
              <div className="dashboard-summary__card-body">
                <div className="dashboard-summary__metric">
                  <strong
                    style={{
                      color:
                        summary.lowStockCount > 0 ? '#dc2626' : '#16a34a'
                    }}
                  >
                    {summary.lowStockCount}
                  </strong>
                  <span>Low Stock</span>
                </div>
                <div className="dashboard-summary__metric">
                  <strong
                    style={{
                      color:
                        summary.expiringBatchesCount > 0
                          ? '#f59e0b'
                          : '#16a34a'
                    }}
                  >
                    {summary.expiringBatchesCount}
                  </strong>
                  <span>Expiring (30d)</span>
                </div>
              </div>
            </div>

            <div className="dashboard-summary__card">
              <div className="dashboard-summary__card-header">
                <span>Master Data</span>
              </div>
              <div className="dashboard-summary__card-body">
                <div className="dashboard-summary__metric">
                  <strong>{summary.totalProducts}</strong>
                  <span>Products</span>
                </div>
                <div className="dashboard-summary__metric">
                  <strong>{summary.totalCustomers}</strong>
                  <span>Customers</span>
                </div>
                <div className="dashboard-summary__metric">
                  <strong>{summary.totalSuppliers}</strong>
                  <span>Suppliers</span>
                </div>
              </div>
            </div>
          </div>

          {summary.recentActivity.length > 0 && (
            <div className="dashboard-summary__activity">
              <h3>Recent Activity</h3>
              <ul>
                {summary.recentActivity.map((activity, index) => (
                  <li key={index}>
                    <span className="dashboard-summary__activity-type">
                      {activity.type}
                    </span>
                    <span className="dashboard-summary__activity-desc">
                      {activity.description}
                    </span>
                    <span className="dashboard-summary__activity-time">
                      {new Date(activity.timestamp).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DashboardSummaryPanel;

