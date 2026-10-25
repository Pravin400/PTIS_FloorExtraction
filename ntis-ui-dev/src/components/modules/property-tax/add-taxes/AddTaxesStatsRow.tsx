'use client';

import { Select } from '@/components/common/select';
import { DashboardCard } from '@/components/common/DashboardCard';
import { CheckCircle } from 'lucide-react';
import type { ActiveJob } from '@/hooks/add-taxes/useActiveJobMonitor';

interface AddTaxesStats {
  totalProperties: number;
  transmastProperties: number;
  eligibleRecords: number;
  skippedRecords: number;
  runningJobs: number;
}

interface AddTaxesStatsRowProps {
  t: (key: string, values?: Record<string, string | number>) => string;
  mappedFinanceYearOptions: { value: string; label: string }[];
  financeYearId: string;
  handleFinanceYearChange: (value: string) => void;
  stats: AddTaxesStats;
  handleExportProperties: (status: string) => void;
  exportingStatus: string | null;
  isFinanceYearActive: boolean;
  runningJobsCount: number | null;
  activeJob: ActiveJob | null;
  showProgress: boolean;
}

/**
 * The top stats row (Finance Year select + 4 dashboard cards + Running Jobs + permission box) —
 * moved out of AddTaxesConsole.tsx verbatim (pure relocation, no logic change) as part of splitting
 * that file down in size.
 */
export function AddTaxesStatsRow({
  t,
  mappedFinanceYearOptions,
  financeYearId,
  handleFinanceYearChange,
  stats,
  handleExportProperties,
  exportingStatus,
  isFinanceYearActive,
  runningJobsCount,
  activeJob,
  showProgress,
}: AddTaxesStatsRowProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {/* Finance Year */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <Select
          label={t('stats.financeYear')}
          required
          options={mappedFinanceYearOptions}
          value={financeYearId}
          onChange={(e) => handleFinanceYearChange(e.target.value)}
          selectSize="sm"
        />
      </div>

      {/* Stats */}
      <DashboardCard
        label={t('stats.totalProperties')}
        value={stats.totalProperties}
        valueColor="text-gray-900"
        onExportExcel={() => handleExportProperties('all')}
        isExporting={exportingStatus === 'all'}
      />
      <DashboardCard
        label={t('stats.transmastProperties')}
        value={stats.transmastProperties}
        valueColor="text-purple-600"
        onExportExcel={() => handleExportProperties('Transmast')}
        isExporting={exportingStatus === 'Transmast'}
      />
      <DashboardCard
        label={t('stats.eligibleRecords')}
        value={stats.eligibleRecords}
        valueColor="text-blue-600"
        onExportExcel={() => handleExportProperties('Eligible')}
        isExporting={exportingStatus === 'Eligible'}
      />
      <DashboardCard
        label={t('stats.skippedLocked')}
        value={stats.skippedRecords}
        valueColor="text-orange-500"
        onExportExcel={() => handleExportProperties('Skipped')}
        isExporting={exportingStatus === 'Skipped'}
      />
      {isFinanceYearActive && (
        <DashboardCard
          label={t('stats.runningJobs')}
          value={runningJobsCount !== null ? runningJobsCount : Math.max(stats.runningJobs || 0, activeJob && showProgress ? 1 : 0)}
          valueColor="text-green-600"
        />
      )}

      {/* User Permission */}
      <div className="bg-green-50 rounded-lg border border-green-200 p-4">
        <div className="flex items-center gap-2 mb-1 text-green-700 font-medium text-sm">
          <CheckCircle className="h-4 w-4" />
          {t('permissions.title')}
        </div>
        <div className="text-xs text-green-600 leading-tight">
          {t('permissions.allowedMessage')}
        </div>
      </div>
    </div>
  );
}

export default AddTaxesStatsRow;
