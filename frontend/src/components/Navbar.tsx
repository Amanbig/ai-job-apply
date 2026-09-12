import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  FileText,
  Bell,
  UploadCloud,
  BarChart3,
  Cpu,
  User as UserIcon,
  LogOut,
  ChevronDown,
  LogIn,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  pendingNudgesCount: number;
  onOpenAuthModal: (mode?: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  pendingNudgesCount,
  onOpenAuthModal,
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const navItems = [
    { id: 'kanban', label: 'Pipeline Board', icon: Layers },
    { id: 'drafts', label: 'AI Draft Studio', icon: FileText },
    {
      id: 'nudges',
      label: 'Scheduled Nudges',
      icon: Bell,
      badge: pendingNudgesCount > 0 ? pendingNudgesCount : undefined,
    },
    { id: 'ingestion', label: 'Ingestion Hub', icon: UploadCloud },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <header className="border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40 transition-all shadow-xs">
      <div className="max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo & Title with clean whitespace protection */}
          <div
            className="flex items-center gap-3 cursor-pointer shrink-0"
            onClick={() => setCurrentTab('kanban')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 p-0.5 shadow-md shadow-indigo-500/20 shrink-0">
              <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                  AI Job Pipeline
                </span>
                <span className="hidden sm:inline-flex px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded whitespace-nowrap">
                  Google Cloud
                </span>
                <span className="hidden sm:inline-flex px-1.5 py-0.5 text-[9px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 rounded items-center gap-1 whitespace-nowrap font-mono">
                  <Cpu className="w-2.5 h-2.5" /> Gemini 2.5
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap hidden sm:block">
                Career Optimization & Scheduled Nudges
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs (Only visible when user is authenticated) */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1.5 overflow-x-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-600/15 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`} />
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="px-1.5 py-0.2 text-[10px] font-bold bg-amber-500 text-slate-950 rounded-full animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Right Action Area */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Theme Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 transition shadow-xs cursor-pointer flex items-center justify-center"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600 hover:-rotate-12 transition-transform" />
              )}
            </button>

            {/* Authentication User Area */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-xs transition cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 text-white font-bold flex items-center justify-center text-[10px]">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-slate-800 dark:text-slate-200 font-medium hidden sm:inline max-w-[120px] truncate">
                    {user.name || user.email}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-2 z-50 text-xs space-y-1">
                    <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">{user.email}</p>
                      <span className="mt-1 inline-block px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        Authenticated Session
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        logout();
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 dark:text-rose-400 flex items-center gap-2 transition cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuthModal('login')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 transition cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>

                <button
                  onClick={() => onOpenAuthModal('register')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition cursor-pointer"
                >
                  <span>Register</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      {user && (
        <div className="md:hidden flex overflow-x-auto border-t border-slate-200 dark:border-slate-800/80 px-2 py-1.5 space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.2 text-[10px] font-bold bg-amber-500 text-slate-950 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
