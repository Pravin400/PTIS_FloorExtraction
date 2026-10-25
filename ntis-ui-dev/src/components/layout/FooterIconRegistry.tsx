'use client';

import React from 'react';
import {
  Save,
  RotateCcw,
  ArrowLeft,
  Printer,
  CheckCircle,
  X,
  Trash2,
  FileText,
  Calculator,
  Search,
  Plus,
  CheckCircle2,
  Undo2,
  Merge,
  Percent,
  FileSpreadsheet,
  Pencil,
  RefreshCw,
  BarChart3,
  Split,
  Droplet,
  Monitor,
  LayoutDashboard,
  Settings,
  History,
  Info,
  User,
  Layers,
  AlertCircle,
  Eye,
  Send,
  Database,
} from 'lucide-react';

export interface IconProps {
  size?: number | string;
  className?: string;
  strokeWidth?: number;
}

/**
 * Mapping of icon names to their Lucide components.
 */
export const ICON_MAP: Record<string, React.ComponentType<IconProps>> = {
  Save,
  RotateCcw,
  ArrowLeft,
  Printer,
  CheckCircle,
  X,
  Trash2,
  FileText,
  Calculator,
  Search,
  Plus,
  CheckCircle2,
  Undo2,
  Merge,
  Percent,
  FileSpreadsheet,
  Pencil,
  RefreshCw,
  BarChart3,
  Split,
  Droplet,
  Monitor,
  LayoutDashboard,
  Settings,
  History,
  User,
  Layers,
  AlertCircle,
  Eye,
  Send,
  Info,
  Database,
  save: Save,
  printer: Printer,
  plus: Plus,
  calculator: Calculator,
  search: Search,
};

/**
 * Helper component to render Lucide icons by name string
 */
export const DynamicIcon = ({
  name,
  size = 18,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) => {
  const IconComponent =
    ICON_MAP[name] ||
    (name ? ICON_MAP[name.charAt(0).toUpperCase() + name.slice(1)] : null);

  if (!IconComponent) return null;
  return <IconComponent size={size} className={className} />;
};
