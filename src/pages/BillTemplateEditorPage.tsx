// FILE: src/pages/BillTemplateEditorPage.tsx
/// ANCHOR: BillTemplateEditorPage
import AppLayout from '../components/layout/AppLayout';
import BillTemplateEditorPanel from '../components/dashboard/BillTemplateEditorPanel';

const BillTemplateEditorPage = () => (
  <AppLayout>
    <div className="page-container">
      <div className="page-header">
        <h2>Bill Template Editor</h2>
        <p>Create and edit bill templates with HTML/CSS</p>
      </div>
      <div className="dashboard-grid">
        <BillTemplateEditorPanel />
      </div>
    </div>
  </AppLayout>
);

export default BillTemplateEditorPage;

