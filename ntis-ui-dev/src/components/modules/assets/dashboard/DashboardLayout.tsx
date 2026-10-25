import { BarChart3 } from 'lucide-react';
import { DashboardTabs } from './DashboardTabs';
import type { DashboardLayoutProps } from '@/types/assets/dashboard/master-dashboard/asset-dashboard.types';

export function DashboardLayout({
  children,
  filters,
}: DashboardLayoutProps) {
  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 p-1 pb-0">
      <div className="mb-6 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>

          <DashboardTabs />

        </div>

        {filters}
      </div>

      {children}
    </div>
  );
}