import React, { useState } from "react";
import { NavLink } from "react-router-dom";
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
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Wheat
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

const NAV_ITEMS = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard, roles: ["admin", "manager"] },
  { name: "Smart Planning", path: "/planning", icon: Sparkles, roles: ["admin", "manager"], badge: "AI" },
  { name: "Demand Analysis", path: "/demand", icon: TrendingUp, roles: ["admin", "manager"] },
  { name: "Inventory (FEFO)", path: "/inventory", icon: Package, roles: ["admin", "manager"] },
  { name: "Production Schedule", path: "/production", icon: CalendarDays, roles: ["admin", "manager", "staff"] },
  { name: "Orders", path: "/orders", icon: ShoppingBag, roles: ["admin", "manager"] },
  { name: "What-If Simulator", path: "/simulator", icon: SlidersHorizontal, roles: ["admin", "manager"] },
  { name: "Analytics & Waste", path: "/analytics", icon: BarChart3, roles: ["admin", "manager"] },
  { name: "Alerts Center", path: "/alerts", icon: Bell, roles: ["admin", "manager", "staff"] },
  { name: "Settings", path: "/settings", icon: Settings, roles: ["admin"] }
];

export function Sidebar({ collapsed, setCollapsed }) {
  const { user } = useAuth();

  const userRole = user?.role || "staff";
  const visibleNavItems = NAV_ITEMS.filter((item) => item.roles.includes(userRole));

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen transition-all duration-300 ease-in-out border-r border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-surface-dark/95 backdrop-blur-md flex flex-col justify-between ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-md shadow-primary-500/20 shrink-0">
              <Wheat className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <h1 className="font-heading font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-tight">
                  SmartFood
                </h1>
                <p className="text-[10px] font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                  Production Engine
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-140px)]">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 group relative ${
                    isActive
                      ? "bg-primary-500 text-white shadow-sm shadow-primary-500/30"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? "text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-primary-500"
                      }`}
                    />
                    {!collapsed && <span className="truncate">{item.name}</span>}
                    {!collapsed && item.badge && (
                      <span
                        className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-accent text-slate-900 shadow-xs"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Role Footer */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/80">
        <div
          className={`flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-surface-darkElevated ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/60 text-primary-700 dark:text-primary-300 font-bold text-xs flex items-center justify-center shrink-0">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          {!collapsed && (
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                {user?.name || "Guest"}
              </p>
              <span className="inline-block text-[10px] font-bold px-1.5 py-0.2 rounded bg-primary-500/10 text-primary-700 dark:text-primary-400 uppercase">
                {user?.role || "staff"}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
