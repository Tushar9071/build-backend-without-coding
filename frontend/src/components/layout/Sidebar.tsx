import { useState } from 'react';
import { LayoutDashboard, Network, Workflow, Database, Settings, Play, Sun, Moon, ChevronLeft, ChevronRight, Menu, FileJson, Folder } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useThemeStore } from '../../store/themeStore';

const coreItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Folder, label: 'Projects', path: '/projects' },
];

const projectItems = [
  { icon: Network, label: 'API Routes', path: '/routes' },
  { icon: Workflow, label: 'Functions', path: '/functions' },
  { icon: FileJson, label: 'Interfaces', path: '/schemas' },
  { icon: Database, label: 'Database', path: '/database' },
];

const bottomItems = [
  { icon: Play, label: 'Runner', path: '/runner' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar() {
  const { theme, toggleTheme } = useThemeStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Helper to render links
  const renderLink = (item: any) => (
    <NavLink
      key={item.path}
      to={item.path}
      title={isCollapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
          isActive
            ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
            : "hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white",
          isCollapsed ? "justify-center px-2" : ""
        )
      }
    >
      <item.icon className={cn("w-5 h-5 transition-colors min-w-[20px]")} />

      {!isCollapsed && (
        <span className="font-medium text-sm text-nowrap overflow-hidden">{item.label}</span>
      )}

      {/* Tooltip for collapsed mode */}
      {isCollapsed && (
        <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-slate-700">
          {item.label}
        </div>
      )}
    </NavLink>
  );

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-md shadow-lg"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <Menu className="w-5 h-5" />
      </button>

      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 flex flex-col h-screen transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        "lg:translate-x-0",
        isMobileOpen && "w-64"
      )}>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-8 bg-slate-900 border border-slate-700 text-slate-400 hover:text-white rounded-full p-1 shadow-xl z-50"
        >
          {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        <div className={cn("p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2", isCollapsed ? "justify-center p-4" : "")}>
          <div className="w-8 h-8 min-w-[32px] rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Network className="text-white w-5 h-5" />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight text-nowrap overflow-hidden">
              BackendVis
            </span>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-6 mt-4 overflow-y-auto scrollbar-hide">
          {/* Core */}
          <div className="space-y-1">
            {coreItems.map(renderLink)}
          </div>

          {/* Project Items */}
          <div className="space-y-2">
            {!isCollapsed && (
              <div className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Active Project</span>
                <span className="bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded text-[10px]">v1</span>
              </div>
            )}
            <div className="space-y-1">
              {projectItems.map(renderLink)}
            </div>
          </div>

          {/* Bottom / Tools */}
          <div className="space-y-1">
            {!isCollapsed && <div className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-4">Tools</div>}
            {bottomItems.map(renderLink)}
          </div>

        </nav>

        {/* Footer Section */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">

          {/* Project info - Hide in collapsed */}
          {!isCollapsed && (
            <div className="bg-slate-200/50 dark:bg-slate-800/50 rounded-lg p-3 animate-in fade-in zoom-in duration-200">
              <p className="text-xs text-slate-500 font-medium mb-2">PROJECT</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-mono text-slate-400 text-nowrap overflow-hidden text-ellipsis">production-api-v1</span>
              </div>
            </div>
          )}

          {/* Theme Toggle */}
          <button
            onClick={() => toggleTheme()}
            className={cn(
              "w-full flex items-center p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-colors text-slate-400 hover:text-white group",
              isCollapsed ? "justify-center" : "justify-between"
            )}
            title={isCollapsed ? "Toggle Theme" : undefined}
          >
            {!isCollapsed && <span className="text-xs font-medium pl-1">Theme</span>}

            <div className={cn("flex items-center gap-2 bg-slate-950 rounded-full p-1 border border-slate-800", isCollapsed && "p-1.5")}>
              {theme === 'light' ? (
                <Sun className={cn("transition-colors", isCollapsed ? "w-4 h-4 text-yellow-400" : "w-3.5 h-3.5 text-yellow-400")} />
              ) : (
                <Moon className={cn("transition-colors", isCollapsed ? "w-4 h-4 text-indigo-400" : "w-3.5 h-3.5 text-indigo-400")} />
              )}
            </div>
          </button>
        </div>
      </aside>
    </>
  );
}
