import React from 'react';
import { IndianRupee, TrendingUp, Users, AlertTriangle, FileText } from 'lucide-react';

export const KPI_ICON_MAP: Record<string, React.ReactElement> = {
  rupee: <IndianRupee className="w-4 h-4" />,
  trending: <TrendingUp className="w-4 h-4" />,
  users: <Users className="w-4 h-4" />,
  warning: <AlertTriangle className="w-4 h-4" />,
  file: <FileText className="w-4 h-4" />,
};

export const KPI_BG_MAP: Record<string, string> = {
  blue: 'bg-blue-600 text-white shadow-md shadow-blue-200 border-none',
  green: 'bg-emerald-500 text-white shadow-md shadow-emerald-200 border-none',
  purple: 'bg-purple-500 text-white shadow-md shadow-purple-200 border-none',
  orange: 'bg-orange-500 text-white shadow-md shadow-orange-200 border-none',
  red: 'bg-red-500 text-white shadow-md shadow-red-200 border-none',
};

export const KPI_CARD_BG_MAP: Record<string, string> = {
  blue: 'bg-blue-50/50 border-slate-200',
  green: 'bg-emerald-50/50 border-slate-200',
  purple: 'bg-purple-50/50 border-slate-200',
  orange: 'bg-orange-50/50 border-slate-200',
  red: 'bg-red-50/50 border-slate-200',
};
