import { Navigate, Route, Routes } from 'react-router-dom';
import { isAuthed } from './auth';
import { Layout } from './components/Layout';
import { AuditPage } from './pages/AuditPage';
import { DashboardPage } from './pages/DashboardPage';
import { ImportPage } from './pages/ImportPage';
import { LoginPage } from './pages/LoginPage';
import { ReportsPage } from './pages/ReportsPage';
import { SiteEditPage } from './pages/SiteEditPage';
import { SitesListPage } from './pages/SitesListPage';
import { SuggestionsPage } from './pages/SuggestionsPage';
import { UsersPage } from './pages/UsersPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!isAuthed()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/sites" element={<SitesListPage />} />
        <Route path="/sites/new" element={<SiteEditPage />} />
        <Route path="/sites/:id" element={<SiteEditPage />} />
        <Route path="/suggestions" element={<SuggestionsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="/audit" element={<AuditPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
