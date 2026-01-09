// FILE: src/components/dashboard/StockKPICards.tsx
/// ANCHOR: StockKPICards
import { useEffect, useState } from 'react';
import type { StockKPIs } from '@shared/ipc';
import { invoke } from '../../api/ipcClient';

const StockKPICards = () => {
  const [kpis, setKpis] = useState<StockKPIs>({
    totalSKUs: 0,
    totalStockValue: 0,
    lowStockCount: 0,
    expiringSoonCount: 0,
    expiredCount: 0
  });
  const [loading, setLoading] = useState(true);

  const loadKPIs = async () => {
    try {
      setLoading(true);
      const data = await invoke('ipc.stock.kpis', undefined);
      setKpis(data);
    } catch (error) {
      console.error('Error loading stock KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKPIs();
    const interval = setInterval(loadKPIs, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const cards = [
    {
      title: 'Total SKUs',
      value: kpis.totalSKUs,
      icon: '📦',
      color: '#3b82f6',
      bgColor: '#dbeafe'
    },
    {
      title: 'Total Stock Value',
      value: `₹${kpis.totalStockValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: '💰',
      color: '#10b981',
      bgColor: '#d1fae5'
    },
    {
      title: 'Low Stock',
      value: kpis.lowStockCount,
      icon: '⚠️',
      color: '#f59e0b',
      bgColor: '#fef3c7'
    },
    {
      title: 'Expiring Soon',
      value: kpis.expiringSoonCount,
      icon: '⏰',
      color: '#f97316',
      bgColor: '#fed7aa'
    },
    {
      title: 'Expired',
      value: kpis.expiredCount,
      icon: '❌',
      color: '#ef4444',
      bgColor: '#fee2e2'
    }
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 'var(--spacing-lg)',
        marginBottom: 'var(--spacing-xl)'
      }}
    >
      {cards.map((card, index) => (
        <div
          key={index}
          className="kpi-card"
        >
          <div
            className="kpi-card__icon"
            style={{
              backgroundColor: card.bgColor,
              color: card.color
            }}
          >
            {card.icon}
          </div>
          <div className="kpi-card__content">
            <div className="kpi-card__title">
              {card.title}
            </div>
            <div
              className="kpi-card__value"
              style={{
                color: card.color
              }}
            >
              {loading ? '...' : card.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StockKPICards;

