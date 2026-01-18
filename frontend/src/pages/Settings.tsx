import { useAuth } from '../context/AuthContext';
import { useThemeStore } from '../store/themeStore';
import { User, Mail, Shield, LogOut, Moon, Sun, Monitor, Github } from 'lucide-react';

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useThemeStore();

  const handleLogout = async () => {
    await logout();
    // Redirect might be handled by RequireAuth or router, but context usually handles state.
  };

  const providerId = user?.providerData[0]?.providerId;
  const isGoogle = providerId === 'google.com';
  const isGithub = providerId === 'github.com';

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-600 dark:from-indigo-400 dark:to-cyan-400">
          Account Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your profile and preferences</p>
      </div>

      {/* Profile Section */}
      <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6 backdrop-blur-sm shadow-sm dark:shadow-none">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          Profile Information
        </h2>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-shrink-0">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-slate-800 shadow-xl"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-4 border-slate-200 dark:border-slate-700">
                <span className="text-3xl font-bold text-slate-400 dark:text-slate-500">
                  {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800/50">
                <label className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Display Name</label>
                <div className="mt-1 text-slate-900 dark:text-slate-200 font-medium flex items-center gap-2">
                  {user?.displayName || 'Not Set'}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800/50">
                <label className="text-xs text-slate-500 uppercase font-semibold tracking-wider flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email Address
                </label>
                <div className="mt-1 text-slate-900 dark:text-slate-200 font-medium">
                  {user?.email}
                </div>
              </div>
            </div>


          </div>
        </div>
      </div>

      {/* Login Method */}
      <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6 backdrop-blur-sm shadow-sm dark:shadow-none">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
          Security & Login
        </h2>

        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800/50">
          <div>
            <p className="text-slate-900 dark:text-slate-200 font-medium">Authentication Provider</p>
            <p className="text-sm text-slate-500">You are logged in using {isGoogle ? 'Google' : isGithub ? 'GitHub' : 'Email/Password'}.</p>
          </div>
          <div className="px-3 py-1 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 flex items-center gap-2 shadow-sm">
            {isGoogle && (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.8-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z" /></svg>
                <span className="text-sm">Google</span>
              </>
            )}
            {isGithub && (
              <>
                <Github className="w-4 h-4" />
                <span className="text-sm">GitHub</span>
              </>
            )}
            {!isGoogle && !isGithub && <span className="text-sm text-slate-400">Email</span>}
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6 backdrop-blur-sm shadow-sm dark:shadow-none">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Monitor className="w-5 h-5 text-purple-500 dark:text-purple-400" />
          Appearance
        </h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-900 dark:text-slate-200 font-medium">Interface Theme</p>
            <p className="text-sm text-slate-500">Customize how the application looks.</p>
          </div>

          <div className="bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center">
            <button
              onClick={() => theme === 'dark' && toggleTheme()}
              className={`p-2 rounded-md transition-all ${theme === 'light' ? 'bg-white shadow text-amber-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <Sun className="w-5 h-5" />
            </button>
            <button
              onClick={() => theme === 'light' && toggleTheme()}
              className={`p-2 rounded-md transition-all ${theme === 'dark' ? 'bg-slate-800 text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <Moon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone / Logout */}
      <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-6 py-3 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-500 rounded-lg border border-red-200 dark:border-red-500/20 transition-all ml-auto"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>

    </div>
  );
}
