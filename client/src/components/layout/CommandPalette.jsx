import React, { useEffect } from "react";
import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Sparkles,
  TrendingUp,
  Package,
  CalendarDays,
  ShoppingBag,
  SlidersHorizontal,
  BarChart3,
  Bell,
  Settings,
  Search
} from "lucide-react";

export function CommandPalette({ open, setOpen }) {
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setOpen]);

  if (!open) return null;

  const handleSelect = (path) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={() => setOpen(false)}
      />
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-10">
        <Command className="w-full">
          <div className="flex items-center px-4 border-b border-slate-100 dark:border-slate-800">
            <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <Command.Input
              placeholder="Search pages or quick actions..."
              className="w-full py-3.5 text-sm bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400"
            />
          </div>

          <Command.List className="max-h-72 overflow-y-auto p-2 text-xs space-y-1">
            <Command.Empty className="py-6 text-center text-slate-400">
              No matching results found.
            </Command.Empty>

            <Command.Group heading="Navigation" className="text-[11px] font-semibold text-slate-400 px-2 py-1">
              <Command.Item
                onSelect={() => handleSelect("/")}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-primary-500" />
                <span>Dashboard Overview</span>
              </Command.Item>

              <Command.Item
                onSelect={() => handleSelect("/planning")}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span>Smart Planning Engine</span>
              </Command.Item>

              <Command.Item
                onSelect={() => handleSelect("/demand")}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                <span>Demand Analysis & Forecast</span>
              </Command.Item>

              <Command.Item
                onSelect={() => handleSelect("/inventory")}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer"
              >
                <Package className="w-3.5 h-3.5 text-indigo-500" />
                <span>Inventory & FEFO Batches</span>
              </Command.Item>

              <Command.Item
                onSelect={() => handleSelect("/production")}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer"
              >
                <CalendarDays className="w-3.5 h-3.5 text-amber-500" />
                <span>Production Schedule</span>
              </Command.Item>

              <Command.Item
                onSelect={() => handleSelect("/orders")}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-rose-500" />
                <span>Confirmed Orders</span>
              </Command.Item>

              <Command.Item
                onSelect={() => handleSelect("/simulator")}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-500" />
                <span>What-If Sandbox Simulator</span>
              </Command.Item>

              <Command.Item
                onSelect={() => handleSelect("/analytics")}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer"
              >
                <BarChart3 className="w-3.5 h-3.5 text-violet-500" />
                <span>Analytics & Waste Trends</span>
              </Command.Item>
            </Command.Group>
          </Command.List>

          <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-surface-darkElevated border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
            <span>Use ↑↓ arrows to navigate</span>
            <span>ESC to close</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
