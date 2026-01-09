// FILE: src/pages/BillingPage.tsx
/// ANCHOR: BillingPage
import AppLayout from '../components/layout/AppLayout';
import BillingEntryPanel from '../components/dashboard/BillingEntryPanel';

const BillingPage = () => (
  <AppLayout>
    <div className="page-container">
      <div className="page-header">
        <h2>Billing</h2>
        <p>Ultra-fast billing with template-based printing</p>
      </div>
      <div className="dashboard-grid">
        <BillingEntryPanel />
      </div>
    </div>
  </AppLayout>
);

export default BillingPage;

