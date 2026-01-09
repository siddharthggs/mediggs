// FILE: src/components/dashboard/ReportsPanel.tsx
/// ANCHOR: ReportsPanel
import { FormEvent, useEffect, useState } from 'react';
import type {
  ReportDateRange,
  SalesReportDTO,
  PurchaseReportDTO,
  ProfitLossReportDTO
} from '@shared/ipc';
import { invoke } from '../../api/ipcClient';
import { formatCurrency } from '@utils/validation';

const ReportsPanel = () => {
  const [activeReport, setActiveReport] = useState<
    'sales' | 'purchase' | 'profitloss'
  >('sales');
  const [dateRange, setDateRange] = useState<ReportDateRange>({
    fromDate: new Date(new Date().setDate(1)).toISOString().substring(0, 10),
    toDate: new Date().toISOString().substring(0, 10)
  });
  const [salesReport, setSalesReport] = useState<SalesReportDTO | null>(null);
  const [purchaseReport, setPurchaseReport] =
    useState<PurchaseReportDTO | null>(null);
  const [profitLossReport, setProfitLossReport] =
    useState<ProfitLossReportDTO | null>(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      switch (activeReport) {
        case 'sales':
          const sales = await invoke('ipc.report.sales', dateRange);
          setSalesReport(sales);
          break;
        case 'purchase':
          const purchase = await invoke('ipc.report.purchase', dateRange);
          setPurchaseReport(purchase);
          break;
        case 'profitloss':
          const pl = await invoke('ipc.report.profitloss', dateRange);
          setProfitLossReport(pl);
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport().catch(console.error);
  }, [activeReport, dateRange.fromDate, dateRange.toDate]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loadReport().catch(console.error);
  };

  return (
    <section className="panel" style={{ gridColumn: 'span 2' }}>
      <header className="panel__header">
        <div>
          <h2>Reports</h2>
          <p>Sales, Purchase & Profit/Loss Reports</p>
        </div>
      </header>
      <div className="panel__body">
        <div className="reports-controls">
          <div className="reports-tabs">
            <button
              className={activeReport === 'sales' ? 'active' : ''}
              onClick={() => setActiveReport('sales')}
            >
              Sales Report
            </button>
            <button
              className={activeReport === 'purchase' ? 'active' : ''}
              onClick={() => setActiveReport('purchase')}
            >
              Purchase Report
            </button>
            <button
              className={activeReport === 'profitloss' ? 'active' : ''}
              onClick={() => setActiveReport('profitloss')}
            >
              Profit & Loss
            </button>
          </div>
          <form className="reports-date-form" onSubmit={handleSubmit}>
            <input
              type="date"
              value={dateRange.fromDate}
              onChange={(event) =>
                setDateRange({ ...dateRange, fromDate: event.target.value })
              }
            />
            <span>to</span>
            <input
              type="date"
              value={dateRange.toDate}
              onChange={(event) =>
                setDateRange({ ...dateRange, toDate: event.target.value })
              }
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Loading...' : 'Generate'}
            </button>
          </form>
        </div>

        <div className="reports-content">
          {loading ? (
            <p className="empty">Generating report...</p>
          ) : activeReport === 'sales' && salesReport ? (
            <div className="report-view">
              <div className="report-summary">
                <div className="report-summary-item">
                  <span>Total Invoices</span>
                  <strong>{salesReport.totalInvoices}</strong>
                </div>
                <div className="report-summary-item">
                  <span>Total Amount</span>
                  <strong>{formatCurrency(salesReport.totalAmount)}</strong>
                </div>
                <div className="report-summary-item">
                  <span>Total Tax</span>
                  <strong>{formatCurrency(salesReport.totalTax)}</strong>
                </div>
                <div className="report-summary-item">
                  <span>Net Amount</span>
                  <strong>{formatCurrency(salesReport.netAmount)}</strong>
                </div>
              </div>
              <div className="report-tables">
                <div>
                  <h3>By Customer</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Invoices</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesReport.byCustomer.map((item) => (
                        <tr key={item.customerId}>
                          <td>{item.customerName}</td>
                          <td>{item.invoiceCount}</td>
                          <td>{formatCurrency(item.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div>
                  <h3>By Product</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesReport.byProduct.slice(0, 10).map((item) => (
                        <tr key={item.productId}>
                          <td>{item.productName}</td>
                          <td>{item.quantity}</td>
                          <td>{formatCurrency(item.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeReport === 'purchase' && purchaseReport ? (
            <div className="report-view">
              <div className="report-summary">
                <div className="report-summary-item">
                  <span>Total Invoices</span>
                  <strong>{purchaseReport.totalInvoices}</strong>
                </div>
                <div className="report-summary-item">
                  <span>Total Amount</span>
                  <strong>{formatCurrency(purchaseReport.totalAmount)}</strong>
                </div>
                <div className="report-summary-item">
                  <span>Total Tax</span>
                  <strong>{formatCurrency(purchaseReport.totalTax)}</strong>
                </div>
              </div>
              <div className="report-tables">
                <div>
                  <h3>By Supplier</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Supplier</th>
                        <th>Invoices</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseReport.bySupplier.map((item) => (
                        <tr key={item.supplierId}>
                          <td>{item.supplierName}</td>
                          <td>{item.invoiceCount}</td>
                          <td>{formatCurrency(item.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div>
                  <h3>By Product</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseReport.byProduct.slice(0, 10).map((item) => (
                        <tr key={item.productId}>
                          <td>{item.productName}</td>
                          <td>{item.quantity}</td>
                          <td>{formatCurrency(item.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeReport === 'profitloss' && profitLossReport ? (
            <div className="report-view">
              <div className="report-summary">
                <div className="report-summary-item">
                  <span>Total Sales</span>
                  <strong>{formatCurrency(profitLossReport.totalSales)}</strong>
                </div>
                <div className="report-summary-item">
                  <span>Total Purchases</span>
                  <strong>
                    {formatCurrency(profitLossReport.totalPurchases)}
                  </strong>
                </div>
                <div
                  className="report-summary-item"
                  style={{
                    backgroundColor:
                      profitLossReport.grossProfit >= 0
                        ? '#dcfce7'
                        : '#fee2e2'
                  }}
                >
                  <span>Gross Profit</span>
                  <strong>{formatCurrency(profitLossReport.grossProfit)}</strong>
                </div>
                <div className="report-summary-item">
                  <span>Profit Margin</span>
                  <strong>
                    {profitLossReport.grossProfitMargin.toFixed(2)}%
                  </strong>
                </div>
              </div>
            </div>
          ) : (
            <p className="empty">No report data available</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default ReportsPanel;

