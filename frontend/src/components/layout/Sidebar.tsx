import { LayoutDashboard, Network, Workflow, Database, Settings, Play, Sun, Moon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useThemeStore } from '../../store/themeStore';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Network, label: 'API Builder', path: '/api-builder' },
  { icon: Workflow, label: 'Workflows', path: '/workflows' },
  { icon: Database, label: 'Database', path: '/database' },
  { icon: Play, label: 'Runner', path: '/runner' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar() {
  const { theme, toggleTheme } = useThemeStore();
  return (
    <aside className="w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 flex flex-col h-screen">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Network className="text-white w-5 h-5" />
        </div>
        <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">BackendVis</span>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                  : "hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
              )
            }
          >
            <item.icon className="w-5 h-5 transition-colors" />
            <span className="font-medium text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        {/* Project info ... */}
        <div className="bg-slate-200/50 dark:bg-slate-800/50 rounded-lg p-3">
          <p className="text-xs text-slate-500 font-medium mb-2">PROJECT</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-mono text-slate-400">production-api-v1</span>
          </div>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => toggleTheme()}
          className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-colors text-slate-400 hover:text-white group"
        >
          <span className="text-xs font-medium pl-1">Theme</span>
          <div className="flex items-center gap-2 bg-slate-950 rounded-full p-1 border border-slate-800">
            <Sun className={cn("w-3.5 h-3.5 transition-colors", theme === 'light' ? "text-yellow-400" : "text-slate-600")} />
            <Moon className={cn("w-3.5 h-3.5 transition-colors", theme === 'dark' ? "text-indigo-400" : "text-slate-600")} />
          </div>
        </button>
      </div>
    </aside>
  );
}
