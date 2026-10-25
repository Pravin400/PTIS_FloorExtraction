import { Download, ArrowRight } from 'lucide-react';
import { Column } from '@/components/common/AutomationTable';
import { MissingMobileNoZone } from '@/types/automation-dashboard/missing-data-analysis/mobile-no/missing-mobile-no.type';

export const getMissingMobileNoColumns = (
  t: (key: string) => string,
  numberLocale: string,
  onDownloadRow?: (zone: MissingMobileNoZone) => void,
  onViewDetails?: (zone: MissingMobileNoZone) => void
): Column<Record<string, unknown>>[] => [
  {
    key: 'zoneName',
    label: t('columns.municipalZone'),
    align: 'left',
    cellClassName: 'py-3.5 px-4',
    render: (_, row, rowIndex) => {
      const zone = row as unknown as MissingMobileNoZone;
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
    key: 'missingCount',
    label: t('columns.mobileNoMissing'),
    align: 'center',
    cellClassName: 'py-3.5 px-4 text-center',
    render: (_, row) => {
      const zone = row as unknown as MissingMobileNoZone;
      return (
        <span className="font-black text-red-600 text-xs sm:text-sm">
          {(zone.missingCount ?? 0).toLocaleString(numberLocale)}
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
      const zone = row as unknown as MissingMobileNoZone;
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
