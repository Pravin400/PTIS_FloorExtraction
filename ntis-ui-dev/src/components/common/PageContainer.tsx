import React from "react";
import { cn } from "@/lib/utils/cn";

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageContainer({ 
  children, 
  title, 
  subtitle, 
  actions, 
  className = "" 
}: PageContainerProps) {
  return (
    <div className={cn("flex-1 overflow-y-auto bg-[#F8FAFC]", className)}>
      {(title || actions) && (
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {title && (
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-2 text-sm text-slate-500">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex flex-shrink-0 items-center gap-3">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
