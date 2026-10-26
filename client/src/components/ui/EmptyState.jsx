import React from "react";
import { PackageOpen } from "lucide-react";
import { Button } from "./Button.jsx";

export function EmptyState({ title = "Nothing here yet", description = "Add data to get started.", icon: Icon = PackageOpen, action, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-950/40 flex items-center justify-center">
        <Icon className="w-8 h-8 text-primary-400 dark:text-primary-500" />
      </div>
      <div>
        <h3 className="font-heading font-semibold text-slate-800 dark:text-slate-200 text-base">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">{description}</p>
      </div>
      {action && actionLabel && (
        <Button size="sm" onClick={action}>{actionLabel}</Button>
      )}
    </div>
  );
}