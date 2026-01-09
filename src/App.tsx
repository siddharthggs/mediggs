// FILE: src/App.tsx
/// ANCHOR: AppShell
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { useCompanyInfo } from './hooks/useCompanyInfo';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import ProductsPage from './pages/ProductsPage';
import ProductCreationPage from './pages/ProductCreationPage';
import GlobalSearchPage from './pages/GlobalSearchPage';
import PaymentManagementPage from './pages/PaymentManagementPage';
import MRManagementPage from './pages/MRManagementPage';
import DoctorManagementPage from './pages/DoctorManagementPage';
import CategoryManagementPage from './pages/CategoryManagementPage';
import ExpiryReturnPage from './pages/ExpiryReturnPage';
import StockPage from './pages/StockPage';
import PurchasesPage from './pages/PurchasesPage';
import SalesPage from './pages/SalesPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import BillingPage from './pages/BillingPage';
import BillTemplateEditorPage from './pages/BillTemplateEditorPage';
import BillViewPage from './pages/BillViewPage';
import CompanyInfoPage from './pages/CompanyInfoPage';
import BillingTemplateManagerPage from './pages/BillingTemplateManagerPage';
import TemplateEditor from './pages/TemplateEditor';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

const App = () => {
  const { user, checkSession } = useAuthStore();
  const { reload: loadCompanyInfo } = useCompanyInfo();

  // FIX: Only run on mount to prevent infinite loops
  useEffect(() => {
    checkSession();
    // Load company info on app boot for use across the app
    loadCompanyInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/products"
          element={
            <PrivateRoute>
              <ProductsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/products/create"
          element={
            <PrivateRoute>
              <ProductCreationPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/search"
          element={
            <PrivateRoute>
              <GlobalSearchPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <PrivateRoute>
              <PaymentManagementPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/mrs"
          element={
            <PrivateRoute>
              <MRManagementPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/doctors"
          element={
            <PrivateRoute>
              <DoctorManagementPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <PrivateRoute>
              <CategoryManagementPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/expiry-returns"
          element={
            <PrivateRoute>
              <ExpiryReturnPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/stock"
          element={
            <PrivateRoute>
              <StockPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/purchases"
          element={
            <PrivateRoute>
              <PurchasesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/sales"
          element={
            <PrivateRoute>
              <SalesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <PrivateRoute>
              <ReportsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <AdminRoute>
              <SettingsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/settings/company-info"
          element={
            <AdminRoute>
              <CompanyInfoPage />
            </AdminRoute>
          }
        />
        <Route
          path="/settings/billing-templates"
          element={
            <AdminRoute>
              <BillingTemplateManagerPage />
            </AdminRoute>
          }
        />
        <Route
          path="/billing/new"
          element={
            <PrivateRoute>
              <BillingPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/billing/templates"
          element={
            <AdminRoute>
              <BillTemplateEditorPage />
            </AdminRoute>
          }
        />
        <Route
          path="/billing/templates/editor"
          element={
            <AdminRoute>
              <TemplateEditor />
            </AdminRoute>
          }
        />
        <Route
          path="/billing/view/:id"
          element={
            <PrivateRoute>
              <BillViewPage />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

