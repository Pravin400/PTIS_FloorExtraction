'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Layers, FileText, LayoutGrid, Download } from 'lucide-react';
import { MissingPhotoPlanItem, MissingPhotoPlanZone } from '@/types/automation-dashboard/missing-data-analysis/photo-plan/missing-photo-plan.type';
import { AutomationTable, Column } from '@/components/common/AutomationTable';
import { Button } from '@/components/common/ActionButton';
import { SearchInput } from '@/components/common/SearchInput';
import { exportTableData } from '@/lib/utils/automation-dashboard/export';
import { getNumberLocale } from '@/lib/utils/format';
import { getMissingPhotoPlanColumns } from './MissingPhotoPlanColumns';

interface Props {
  serverData?: MissingPhotoPlanItem | null;
}

export default function MissingPhotoPlanDetails({ serverData }: Props) {
  const t = useTranslations('automationDashboard.missingPhotoPlan');
  const locale = useLocale();
  const [searchTerm, setSearchTerm] = useState('');

  const numberLocale = getNumberLocale(locale);

  const totalGapFields = serverData?.totalGapFields ?? 0;
  const totalPhotoMissing = serverData?.totalPhotoMissing ?? 0;
  const totalPlanMissing = serverData?.totalPlanMissing ?? 0;

  const zones = useMemo(() => serverData?.zones ?? [], [serverData?.zones]);

  const filteredZones = useMemo(() => {
    if (!searchTerm.trim()) return zones;
    const term = searchTerm.toLowerCase().trim();
    return zones.filter(
      (z) =>
        z.zoneName?.toLowerCase().includes(term) ||
        z.zoneNo?.toLowerCase().includes(term)
    );
  }, [zones, searchTerm]);

  const handleViewDetails = useCallback((zone: MissingPhotoPlanZone) => {
    if (zone.zoneNo) {
      setSearchTerm(zone.zoneNo);
    }
  }, []);

  const handleDownloadRow = useCallback(
    (zone: MissingPhotoPlanZone) => {
      const cols = getMissingPhotoPlanColumns(t, numberLocale);
      exportTableData({
        fileName: `Missing_Photo_Plan_Zone_${zone.zoneNo || zone.zoneId}`,
        reportTitle: `${t('totalGapFields')} - ${zone.zoneNo} ${zone.zoneName ?? ''}`,
        columns: cols,
        data: [zone as unknown as Record<string, unknown>],
      });
    },
    [t, numberLocale]
  );

  const columns: Column<Record<string, unknown>>[] = useMemo(
    () => getMissingPhotoPlanColumns(t, numberLocale, handleDownloadRow, handleViewDetails),
    [t, numberLocale, handleDownloadRow, handleViewDetails]
  );

  const handleExportAll = useCallback(() => {
    exportTableData({
      fileName: 'Missing_Photo_Plan_Analysis_Report',
      reportTitle: t('totalGapFields'),
      columns,
      data: zones as unknown as Record<string, unknown>[],
    });
  }, [zones, columns, t]);

  const tableData = useMemo(() => {
    return filteredZones.map((z) => ({ ...z })) as unknown as Record<string, unknown>[];
  }, [filteredZones]);

  return (
    <div className="flex flex-col gap-5 w-full p-2">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* TOTAL GAP FIELDS */}
        <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center border border-slate-200">
            <Layers className="w-6 h-6 stroke-[2]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {t('totalGapFields')}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {totalGapFields.toLocaleString(numberLocale)}
            </span>
          </div>
        </div>

        {/* PHOTO MISSING */}
        <div className="flex items-center gap-4 p-4 rounded-xl border border-red-100 bg-red-50/20 shadow-2xs">
          <div className="p-3 bg-red-50 text-red-500 rounded-xl flex items-center justify-center border border-red-100">
            <FileText className="w-6 h-6 stroke-[2]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-red-500 uppercase tracking-wider">
              {t('photoMissing')}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-red-600 tracking-tight">
              {totalPhotoMissing.toLocaleString(numberLocale)}
            </span>
          </div>
        </div>

        {/* PLAN MISSING */}
        <div className="flex items-center gap-4 p-4 rounded-xl border border-amber-100 bg-amber-50/20 shadow-2xs">
          <div className="p-3 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center border border-amber-100">
            <LayoutGrid className="w-6 h-6 stroke-[2]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">
              {t('planMissing')}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-500 tracking-tight">
              {totalPlanMissing.toLocaleString(numberLocale)}
            </span>
          </div>
        </div>
      </div>

      {/* Active Zones Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <h2 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">
          {t('activeZones')}
        </h2>

        <div className="flex items-center gap-3">
          {/* Search Input */}
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={t('searchZonePlaceholder')}
            className="mb-0 w-full sm:w-64"
          />

          {/* Export Button */}
          <Button
            variant="primary"
            icon={Download}
            iconPosition="left"
            onClick={handleExportAll}
            className="rounded-xl font-bold text-xs uppercase tracking-wider whitespace-nowrap cursor-pointer px-4 py-2"
          >
            {t('exportAll')}
          </Button>
        </div>
      </div>

      {/* Active Zones Table using master AutomationTable */}
      <div className="w-full border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
        <AutomationTable
          columns={columns}
          data={tableData}
          getRowKey={(row, idx) => ((row as unknown as MissingPhotoPlanZone).zoneId || idx).toString()}
          emptyText={t('noActiveZones')}
          paginationConfig={{ enabled: false }}
        />
      </div>
    </div>
  );
}