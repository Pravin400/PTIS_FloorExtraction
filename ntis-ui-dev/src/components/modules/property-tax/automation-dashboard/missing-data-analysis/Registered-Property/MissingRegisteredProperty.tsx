'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Building2, Layers, AlertTriangle, Download } from 'lucide-react';
import { MissingRegisteredPropertyItem, MissingRegisteredPropertyZone } from '@/types/automation-dashboard/missing-data-analysis/registered-property/missing-registered-property.type';
import { AutomationTable, Column } from '@/components/common/AutomationTable';
import { Button } from '@/components/common/ActionButton';
import { SearchInput } from '@/components/common/SearchInput';
import { exportTableData } from '@/lib/utils/automation-dashboard/export';
import { getNumberLocale } from '@/lib/utils/format';
import { getMissingRegisteredPropertyColumns } from './MissingRegisteredPropertyColumns';

interface Props {
    serverData?: MissingRegisteredPropertyItem | null;
}

export default function MissingRegisteredProperty({ serverData }: Props) {
    const t = useTranslations('automationDashboard.registeredProperty');
    const locale = useLocale();
    const [searchTerm, setSearchTerm] = useState('');

    const numberLocale = getNumberLocale(locale);

    const totalOldPropertyCount = serverData?.totalOldPropertyCount ?? 0;
    const mergeOldPropertyCount = serverData?.mergeOldPropertyCount ?? serverData?.totalMergedProperties ?? 0;
    const missingOldPropertyCount = serverData?.missingOldPropertyCount ?? serverData?.totalMissingOldPropertyCount ?? 0;

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

    const handleViewDetails = useCallback((zone: MissingRegisteredPropertyZone) => {
        if (zone.zoneNo) {
            setSearchTerm(zone.zoneNo);
        }
    }, []);

    const handleDownloadRow = useCallback(
        (zone: MissingRegisteredPropertyZone) => {
            const cols = getMissingRegisteredPropertyColumns(t, numberLocale);
            exportTableData({
                fileName: `Missing_Registered_Property_Zone_${zone.zoneNo || zone.zoneId}`,
                reportTitle: `${t('missingOldPropertyCount')} - ${zone.zoneNo} ${zone.zoneName ?? ''}`,
                columns: cols,
                data: [zone as unknown as Record<string, unknown>],
            });
        },
        [t, numberLocale]
    );

    const columns: Column<Record<string, unknown>>[] = useMemo(
        () => getMissingRegisteredPropertyColumns(t, numberLocale, handleDownloadRow, handleViewDetails),
        [t, numberLocale, handleDownloadRow, handleViewDetails]
    );

    const handleExportAll = useCallback(() => {
        exportTableData({
            fileName: 'Missing_Registered_Property_Analysis_Report',
            reportTitle: t('missingOldPropertyCount'),
            columns,
            data: zones as unknown as Record<string, unknown>[],
        });
    }, [zones, columns, t]);

    const tableData = useMemo(() => {
        return filteredZones.map((z) => ({ ...z })) as unknown as Record<string, unknown>[];
    }, [filteredZones]);

    return (
        <div className="flex flex-col gap-5 w-full p-2 font-sans">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Old Property Count Card */}
                <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
                    <div className="p-3 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center border border-slate-200 shrink-0">
                        <Building2 className="w-6 h-6 stroke-[2]" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            {t('totalOldPropertyCount')}
                        </span>
                        <span className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                            {totalOldPropertyCount.toLocaleString(numberLocale)}
                        </span>
                    </div>
                </div>

                {/* Merge Old Property Count Card */}
                <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
                    <div className="p-3 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center border border-slate-200 shrink-0">
                        <Layers className="w-6 h-6 stroke-[2]" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            {t('mergeOldPropertyCount')}
                        </span>
                        <span className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                            {mergeOldPropertyCount.toLocaleString(numberLocale)}
                        </span>
                    </div>
                </div>

                {/* Missing Old Property Count Card */}
                <div className="flex items-center gap-4 p-4 rounded-xl border border-red-100 bg-white shadow-2xs">
                    <div className="p-3 bg-red-50 text-red-500 rounded-xl flex items-center justify-center border border-red-100 shrink-0">
                        <AlertTriangle className="w-6 h-6 stroke-[2]" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-red-500 uppercase tracking-wider">
                            {t('missingOldPropertyCount')}
                        </span>
                        <span className="text-2xl sm:text-3xl font-black text-red-600 tracking-tight">
                            {missingOldPropertyCount.toLocaleString(numberLocale)}
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

            {/* Active Zones Table */}
            <div className="w-full border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <AutomationTable
                    columns={columns}
                    data={tableData}
                    getRowKey={(row, idx) => ((row as unknown as MissingRegisteredPropertyZone).zoneId || idx).toString()}
                    emptyText={t('noActiveZones')}
                    paginationConfig={{ enabled: false }}
                />
            </div>
        </div>
    );
}