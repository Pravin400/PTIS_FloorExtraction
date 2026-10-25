'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { AlertTriangle, Download } from 'lucide-react';
import { MissingShopNameItem, MissingShopNameZone } from '@/types/automation-dashboard/missing-data-analysis/shop-name/missing-shop-name';
import { AutomationTable, Column } from '@/components/common/AutomationTable';
import { Button } from '@/components/common/ActionButton';
import { SearchInput } from '@/components/common/SearchInput';
import { exportTableData } from '@/lib/utils/automation-dashboard/export';
import { getNumberLocale } from '@/lib/utils/format';
import { getMissingShopNameColumns } from './MissingShopNameColumns';

interface Props {
    serverData?: MissingShopNameItem | null;
}

export default function ShopNameDetails({ serverData }: Props) {
    const t = useTranslations('automationDashboard.missingShopName');
    const locale = useLocale();
    const [searchTerm, setSearchTerm] = useState('');

    const numberLocale = getNumberLocale(locale);

    const totalMissing = serverData?.totalMissing ?? 0;
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

    const handleViewDetails = useCallback((zone: MissingShopNameZone) => {
        if (zone.zoneNo) {
            setSearchTerm(zone.zoneNo);
        }
    }, []);

    const handleDownloadRow = useCallback(
        (zone: MissingShopNameZone) => {
            const cols = getMissingShopNameColumns(t, numberLocale);
            exportTableData({
                fileName: `Missing_Shop_Name_Zone_${zone.zoneNo || zone.zoneId}`,
                reportTitle: `${t('shopNameMissing')} - ${zone.zoneNo} ${zone.zoneName ?? ''}`,
                columns: cols,
                data: [zone as unknown as Record<string, unknown>],
            });
        },
        [t, numberLocale]
    );

    const columns: Column<Record<string, unknown>>[] = useMemo(
        () => getMissingShopNameColumns(t, numberLocale, handleDownloadRow, handleViewDetails),
        [t, numberLocale, handleDownloadRow, handleViewDetails]
    );

    const handleExportAll = useCallback(() => {
        exportTableData({
            fileName: 'Missing_Shop_Name_Analysis_Report',
            reportTitle: t('shopNameMissing'),
            columns,
            data: zones as unknown as Record<string, unknown>[],
        });
    }, [zones, columns, t]);

    const tableData = useMemo(() => {
        return filteredZones.map((z) => ({ ...z })) as unknown as Record<string, unknown>[];
    }, [filteredZones]);

    return (
        <div className="flex flex-col gap-5 w-full p-2 font-sans">
            {/* Top Metric Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-4 p-4 rounded-xl border border-red-100 bg-white shadow-2xs">
                    <div className="p-3 bg-red-50 text-red-500 rounded-xl flex items-center justify-center border border-red-100 shrink-0">
                        <AlertTriangle className="w-6 h-6 stroke-[2]" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-red-500 uppercase tracking-wider">
                            {t('shopNameMissing')}
                        </span>
                        <span className="text-2xl sm:text-3xl font-black text-red-600 tracking-tight">
                            {totalMissing.toLocaleString(numberLocale)}
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
                    getRowKey={(row, idx) => ((row as unknown as MissingShopNameZone).zoneId || idx).toString()}
                    emptyText={t('noActiveZones')}
                    paginationConfig={{ enabled: false }}
                />
            </div>
        </div>
    );
}