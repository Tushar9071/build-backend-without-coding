import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function MainLayout() {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto relative">
        <Outlet />
      </main>
    </div>
  );
}
