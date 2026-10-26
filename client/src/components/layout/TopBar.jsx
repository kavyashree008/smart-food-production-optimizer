import React, { useState } from "react";
import {
  Search,
  Moon,
  Sun,
  Bell,
  Sparkles,
  LogOut,
  User,
  ShieldCheck
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export function TopBar({ onOpenCommand, onOpenAI }) {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-slate-200/80 dark:border-slate-800 glass-header px-6 flex items-center justify-between">
      {/* Search trigger */}
      <button
        onClick={onOpenCommand}
        className="flex items-center gap-3 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-surface-dark/60 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:border-primary-400 transition-all text-xs w-64 shadow-xs"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="truncate">Search products, batches...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-1.5 font-mono text-[10px] font-medium text-slate-500">
          ⌘K
        </kbd>
      </button>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* AI Assistant Quick Trigger */}
        <button
          onClick={onOpenAI}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-50 hover:bg-primary-100 text-primary-700 dark:bg-primary-950/60 dark:hover:bg-primary-900/60 dark:text-primary-300 font-semibold text-xs border border-primary-200 dark:border-primary-800/80 transition-all shadow-xs group"
          title="Open AI Planning Assistant"
        >
          <Sparkles className="w-3.5 h-3.5 text-accent transition-transform group-hover:rotate-12" />
          <span>AI Assistant</span>
          <kbd className="hidden sm:inline-block ml-1 text-[9px] px-1 rounded bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
            ⌘J
          </kbd>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun className="w-4 h-4 text-accent" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notification Bell */}
        <button
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
          title="Alerts and notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger ring-2 ring-white dark:ring-surface-dark animate-pulse" />
        </button>

        {/* User Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
          </button>

          {userMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-card dark:shadow-cardDark py-2 z-50 text-xs"
              onClick={() => setUserMenuOpen(false)}
            >
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="font-semibold text-slate-900 dark:text-white truncate">
                  {user?.name}
                </p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                  <ShieldCheck className="w-3 h-3" />
                  {user?.role?.toUpperCase()}
                </span>
              </div>

              <div className="p-1">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-danger hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
