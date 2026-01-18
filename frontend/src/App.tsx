import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import WorkflowBuilder from './pages/WorkflowBuilder';
import DatabaseManager from './pages/DatabaseManager';
import Runner from './pages/Runner';
import Settings from './pages/Settings';
import Workflows from './pages/Workflows';
import Projects from './pages/Projects';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { useThemeStore } from './store/themeStore';
import { useEffect, type JSX } from 'react';


function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-slate-950 text-slate-500">Loading...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppContent() {
  const { theme } = useThemeStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: theme === 'dark' ? '#1e293b' : '#fff',
            color: theme === 'dark' ? '#fff' : '#0f172a',
            border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<RequireAuth><MainLayout /></RequireAuth>}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="routes" element={<Workflows category="route" title="API Routes" description="Manage your public API endpoints." />} />
          <Route path="functions" element={<Workflows category="function" title="Functions" description="Reusable business logic and internal functions." />} />
          <Route path="schemas" element={<Workflows category="interface" title="Interfaces" description="Data validation schemas and types." />} />

          <Route path="workflows" element={<Navigate to="/projects" replace />} />
          <Route path="workflows/:id" element={<WorkflowBuilder />} />
          <Route path="database" element={<DatabaseManager />} />
          <Route path="runner" element={<Runner />} />
          <Route path="settings" element={<Settings />} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App
