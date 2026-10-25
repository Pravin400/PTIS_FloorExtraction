'use client';

import { type ReactElement } from 'react';
import { CheckCircle2, X } from "lucide-react";
import { ToggleSwitch } from "@/components/common";
import { cn } from "@/lib/utils/cn";

export interface StatusToggleCardProps {
  isActive: boolean;
  onToggle: (checked: boolean) => void;
  activeLabel: string;
  inactiveLabel: string;
  statusLabel: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Standard status toggle card component.
 */
export function StatusToggleCard({
  isActive,
  onToggle,
  activeLabel,
  inactiveLabel,
  statusLabel,
  description,
  disabled = false,
  className = '',
}: StatusToggleCardProps): ReactElement {
  return (
    <div className={cn(
      "rounded-2xl border border-slate-200/60 dark:border-slate-700/30 bg-slate-50/50 dark:bg-slate-800/20 p-4",
      disabled && "opacity-60 pointer-events-none",
      className
    )}>
      <div
        className={cn(
          "rounded-xl p-3 flex items-center justify-between transition-all duration-200",
          isActive 
            ? "border border-blue-200/50 bg-blue-50/30 dark:bg-blue-900/10" 
            : "border border-slate-200 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800/50"
        )}
      >
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-2xl shadow-sm transition-transform duration-200 hover:scale-105",
              isActive 
                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30" 
                : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-600"
            )}
          >
            {isActive ? <CheckCircle2 size={20} /> : <X size={20} />}
          </div>

          <div className="space-y-0.5">
            <div className={cn("text-sm font-bold tracking-tight", isActive ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300")}>
              {statusLabel}
            </div>
            <div className={cn("text-[11px] font-medium leading-relaxed", isActive ? "text-slate-500 dark:text-slate-400" : "text-slate-400 dark:text-slate-500")}>
              {description || (isActive ? activeLabel : inactiveLabel)}
            </div>
          </div>
        </div>

        <ToggleSwitch 
          checked={isActive} 
          onChange={onToggle} 
          activeLabel={activeLabel}
          inactiveLabel={inactiveLabel}
          disabled={disabled}
          showPopup={false}
        />
      </div>
    </div>
  );
}
