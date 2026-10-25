"use client";

import React from "react";
import { LucideIcon, Layers, FileText, Users, Settings, Home, Database, MapPin, Map } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AddButton } from "./ActionButtons";

// Icon mapping for server-to-client compatibility
const ICON_MAP = {
  layers: Layers,
  fileText: FileText,
  users: Users,
  settings: Settings,
  home: Home,
  database: Database,
  mapPin: MapPin,
  map: Map,
} as const;

type IconName = keyof typeof ICON_MAP;

interface TableHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly icon: LucideIcon | IconName;
  readonly actionLabel?: string;
  readonly onActionClick?: () => void;
  readonly actionDisabled?: boolean;
  readonly rightContent?: React.ReactNode;
  readonly className?: string;
}

export default function TableHeader({
  title,
  subtitle,
  icon,
  actionLabel,
  onActionClick,
  actionDisabled = false,
  rightContent,
  className = "",
}: Readonly<TableHeaderProps>) {
  // Resolve icon component
  const Icon = React.useMemo(() => {
    if (typeof icon === 'string') {
      return ICON_MAP[icon];
    }
    return icon;
  }, [icon]);

  return (
    <header
      className={cn(
        "rounded-lg sm:rounded-xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/50 px-3 sm:px-4 md:px-6 py-3 sm:py-4 shadow-sm backdrop-blur-sm",
        className
      )}
      role="banner"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        {/* LEFT SECTION */}
        <div className="flex items-center gap-2.5 sm:gap-3 md:gap-4 min-w-0 flex-1">
          {/* ICON CONTAINER */}
          <div className="flex-shrink-0 p-1.5 sm:p-2 md:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" strokeWidth={2} />
          </div>

          {/* TEXT CONTENT */}
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg md:text-xl font-bold text-slate-800 tracking-tight truncate sm:line-clamp-1">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-2">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-auto sm:ml-0">
          {rightContent && (
            <div className="flex items-center gap-2">
              {rightContent}
            </div>
          )}

          {actionLabel && onActionClick && (
            <AddButton
              label={actionLabel}
              onClick={onActionClick}
              disabled={actionDisabled}
            />
          )}
        </div>
      </div>
    </header>
  );
}