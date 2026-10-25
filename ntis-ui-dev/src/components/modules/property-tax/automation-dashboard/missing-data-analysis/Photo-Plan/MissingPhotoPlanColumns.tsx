import { Download, ArrowRight } from 'lucide-react';
import { Column } from '@/components/common/AutomationTable';
import { MissingPhotoPlanZone } from '@/types/automation-dashboard/missing-data-analysis/photo-plan/missing-photo-plan.type';

export const getMissingPhotoPlanColumns = (
  t: (key: string) => string,
  numberLocale: string,
  onDownloadRow?: (zone: MissingPhotoPlanZone) => void,
  onViewDetails?: (zone: MissingPhotoPlanZone) => void
): Column<Record<string, unknown>>[] => [
  {
    key: 'zoneName',
    label: t('columns.municipalZone'),
    align: 'left',
    cellClassName: 'py-3.5 px-4',
    render: (_, row, rowIndex) => {
      const zone = row as unknown as MissingPhotoPlanZone;
      return (
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs min-w-[28px] text-center">
            {rowIndex + 1}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-slate-800 text-xs sm:text-sm">
              {zone.zoneNo}
            </span>
            {zone.zoneName && (
              <span className="text-slate-500 font-medium text-xs">
                - {zone.zoneName}
              </span>
            )}
          </div>
        </div>
      );
    }
  },
  {
    key: 'photoMissing',
    label: t('columns.photoMissing'),
    align: 'center',
    cellClassName: 'py-3.5 px-4 text-center',
    render: (_, row) => {
      const zone = row as unknown as MissingPhotoPlanZone;
      return (
        <span className="font-bold text-red-600 text-xs sm:text-sm">
          {(zone.photoMissing ?? 0).toLocaleString(numberLocale)}
        </span>
      );
    }
  },
  {
    key: 'planMissing',
    label: t('columns.planMissing'),
    align: 'center',
    cellClassName: 'py-3.5 px-4 text-center',
    render: (_, row) => {
      const zone = row as unknown as MissingPhotoPlanZone;
      return (
        <span className="font-bold text-amber-500 text-xs sm:text-sm">
          {(zone.planMissing ?? 0).toLocaleString(numberLocale)}
        </span>
      );
    }
  },
  {
    key: 'totalMissing',
    label: t('columns.totalMissing'),
    align: 'center',
    cellClassName: 'py-3.5 px-4 text-center',
    render: (_, row) => {
      const zone = row as unknown as MissingPhotoPlanZone;
      return (
        <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
          {(zone.totalMissing ?? 0).toLocaleString(numberLocale)}
        </span>
      );
    }
  },
  {
    key: 'action',
    label: t('columns.action'),
    align: 'center',
    cellClassName: 'py-3.5 px-4 text-center',
    render: (_, row) => {
      const zone = row as unknown as MissingPhotoPlanZone;
      return (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            title={t('actions.downloadReport')}
            aria-label={t('actions.downloadReport')}
            onClick={() => onDownloadRow?.(zone)}
            className="p-1.5 rounded-full border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title={t('actions.viewDetails')}
            aria-label={t('actions.viewDetails')}
            onClick={() => onViewDetails?.(zone)}
            className="p-1.5 rounded-full border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }
  }
];
