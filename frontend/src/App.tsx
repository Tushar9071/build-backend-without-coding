

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import ApiBuilder from './pages/ApiBuilder';
import WorkflowBuilder from './pages/WorkflowBuilder';
import DatabaseManager from './pages/DatabaseManager';
import Runner from './pages/Runner';
import Settings from './pages/Settings';
import Workflows from './pages/Workflows';

import { Toaster } from 'react-hot-toast';
import { useThemeStore } from './store/themeStore';
import { useEffect } from 'react';

function App() {
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
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="api-builder" element={<ApiBuilder />} />
          <Route path="workflows" element={<Workflows />} />
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

export default App
