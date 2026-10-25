

'use client';

import { useState, useMemo, useTransition } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useDashboardSearch } from '@/hooks/automation-dashboard/useDashboardSearch';
import { AutomationTable } from '@/components/common/AutomationTable';
import { SearchInput } from '@/components/common/SearchInput';
import { SearchButton } from '@/components/common/ActionButtons';
import { Button } from '@/components/common/ActionButton';
import { ExportDropdown } from '../CommonFilterDashbaord/ExportDropdown';
import { ExportConfig } from '@/types/automation-dashboard/export.type';
import { adaptTableConfigToExport } from '@/lib/utils/automation-dashboard/export/adapter';
import { Send, ChevronDown } from 'lucide-react';
import { getAssessmentColumns, getAssessmentHeaderRows } from './AssessmentColumns';
import { AssessmentGridItems, AssessmentRow } from '@/types/automation-dashboard/assessment/assessmentgrid.type';
import { Column, LoadingPage } from '@/components/common';
import { DashboardFilterBar } from '@/components/modules/property-tax/automation-dashboard/CommonFilterDashbaord/DashboardFilterBar';
import { PropertyTypeMasterItem } from '@/types/automation-dashboard/property-dashboard/property-subgrid-details.type';

type TabType = 'Total' | 'Assessed' | 'Unassessed' | 'Rented';

const mapServerDataToTable = (serverData: AssessmentGridItems | null | undefined): AssessmentRow[] => {
    if (!serverData) return [];

    const rows: AssessmentRow[] = [];

    // zoneData 
    (serverData.zoneData || []).forEach((zone, index) => {
        const classifications = zone.classifications || [];
        classifications.forEach((cls, clsIndex) => {
            rows.push({
                id: `${zone.zoneId || index}-${clsIndex}`,
                zoneId: zone.zoneId,
                sr: clsIndex === 0 ? index + 1 : undefined,
                zoneName: clsIndex === 0 ? zone.zoneName : undefined,
                zoneNo: clsIndex === 0 ? zone.zoneNo : undefined,
                totalStructure: clsIndex === 0 ? zone.totalStructure : undefined,
                totalUnit: clsIndex === 0 ? zone.totalUnit : undefined,
                type: cls.type,
                structure: cls.structure,
                unit: cls.unit,
                oldDemand: cls.oldDemand,
                currentDemand: cls.currentDemand,
                retroDemand: cls.retroDemand,
                totalDemand: cls.totalDemand,
                addRevenue: cls.additionalRevenueGenerated,
                rowSpan: clsIndex === 0 ? classifications.length : 0,
            });
        });
    });

    // totalRow
    if (serverData.totalRow) {
        const classifications = serverData.totalRow.classifications || [];
        classifications.forEach((cls, clsIndex) => {
            rows.push({
                id: `tot-${clsIndex}`,
                zoneId: serverData.totalRow.zoneId,
                sr: clsIndex === 0 ? '-' : undefined,
                zoneName: clsIndex === 0 ? serverData.totalRow.zoneName : undefined,
                zoneNo: clsIndex === 0 ? serverData.totalRow.zoneNo : undefined,
                totalStructure: clsIndex === 0 ? serverData.totalRow.totalStructure : undefined,
                totalUnit: clsIndex === 0 ? serverData.totalRow.totalUnit : undefined,
                type: cls.type,
                structure: cls.structure,
                unit: cls.unit,
                oldDemand: cls.oldDemand,
                currentDemand: cls.currentDemand,
                retroDemand: cls.retroDemand,
                totalDemand: cls.totalDemand,
                addRevenue: cls.additionalRevenueGenerated,
                rowSpan: clsIndex === 0 ? classifications.length : 0,
            });
        });
    }

    // grandTotalRow
    if (serverData.grandTotalRow) {
        const classifications = serverData.grandTotalRow.classifications || [];
        classifications.forEach((cls, clsIndex) => {
            rows.push({
                id: `gtot-${clsIndex}`,
                zoneId: serverData.grandTotalRow.zoneId ?? 0,
                sr: clsIndex === 0 ? '-' : undefined,
                zoneName: clsIndex === 0 ? serverData.grandTotalRow.zoneName : undefined,
                zoneNo: clsIndex === 0 ? serverData.grandTotalRow.zoneNo : undefined,
                totalStructure: clsIndex === 0 ? serverData.grandTotalRow.totalStructure : undefined,
                totalUnit: clsIndex === 0 ? serverData.grandTotalRow.totalUnit : undefined,
                type: cls.type,
                structure: cls.structure,
                unit: cls.unit,
                oldDemand: cls.oldDemand,
                currentDemand: cls.currentDemand,
                retroDemand: cls.retroDemand,
                totalDemand: cls.totalDemand,
                addRevenue: cls.additionalRevenueGenerated,
                rowSpan: clsIndex === 0 ? classifications.length : 0,
            });
        });
    }

    return rows;
};

const TopFilters = ({ activeTab, onTabChange, t }: { activeTab: TabType, onTabChange: (t: TabType) => void, t: (key: string) => string }) => {
    const tabs: { label: TabType, displayLabel: string, defaultColor: string, activeColor: string }[] = [
        { label: 'Total', displayLabel: t('tabs.total'), defaultColor: 'text-blue-500', activeColor: 'text-blue-500 border-blue-500 bg-blue-50/50' },
        { label: 'Assessed', displayLabel: t('tabs.assessed'), defaultColor: 'text-emerald-500', activeColor: 'text-emerald-500 border-emerald-500 bg-emerald-50/50' },
        { label: 'Unassessed', displayLabel: t('tabs.unassessed'), defaultColor: 'text-orange-500', activeColor: 'text-orange-500 border-orange-500 bg-orange-50/50' },
        { label: 'Rented', displayLabel: t('tabs.rented'), defaultColor: 'text-purple-500', activeColor: 'text-purple-500 border-purple-500 bg-purple-50/50' },
    ];

    return (
        <div className="flex items-center">
            {tabs.map((tab, idx) => (
                <button
                    key={idx}
                    onClick={() => onTabChange(tab.label)}
                    className={`px-4 py-2 text-[13px] font-semibold border-b-2 transition-colors ${activeTab === tab.label
                        ? tab.activeColor
                        : `${tab.defaultColor} border-transparent hover:bg-slate-50`
                        }`}
                >
                    {tab.displayLabel}
                </button>
            ))}
        </div>
    );
};

const TopBar = ({ activeTab, onTabChange, t, tDashboard, exportConfig, propertyDescriptions }: { activeTab: TabType, onTabChange: (t: TabType) => void, t: (key: string) => string, tDashboard: (key: string) => string, exportConfig: ExportConfig<Record<string, unknown>>, propertyDescriptions?: PropertyTypeMasterItem[] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const { isPending, handleSearch } = useDashboardSearch(searchTerm);
    const router = useRouter();
    const locale = useLocale();

    return (
        <div className="flex items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-4 flex-1">
                <TopFilters activeTab={activeTab} onTabChange={onTabChange} t={t} />
                <div className="flex items-center gap-2 flex-1 max-w-xl ml-4">
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSearch();
                            }
                        }}
                        placeholder={t('searchPlaceholder')}
                        className="w-full flex-1 mb-0"
                    />
                    <SearchButton
                        onClick={handleSearch}
                        disabled={isPending || !searchTerm.trim()}
                    />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <Button
                    variant="secondary"
                    icon={ChevronDown}
                    iconPosition="right"
                >
                    {t('summary')}
                </Button>

                <Button
                    variant="secondary"
                    icon={Send}
                    onClick={() => router.push(`/${locale}/property-tax/automation-dashboard/assessment/send-to-approve`)}
                    className="whitespace-nowrap border-blue-200 bg-blue-50 text-blue-600 hover:border-blue-300 hover:bg-blue-100"
                >
                    {t('sendToApprove')}
                </Button>

                <DashboardFilterBar t={tDashboard} propertyDescriptions={propertyDescriptions} />
                <ExportDropdown config={exportConfig} />
            </div>
        </div>
    );
};

const AssessmentDetailsContent = ({ serverData, propertyDescriptions }: { serverData?: AssessmentGridItems | null, propertyDescriptions?: PropertyTypeMasterItem[] }) => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations('automationDashboard.assessment');
    const tDashboard = useTranslations('automationDashboard');
    const locale = useLocale();

    const [isPending, startTransition] = useTransition();
    const [pendingTab, setPendingTab] = useState<TabType | null>(null);

    const currentTab = searchParams.get('tab') as TabType | null;
    const validTabs: TabType[] = ['Total', 'Assessed', 'Unassessed', 'Rented'];
    const activeTab = currentTab && validTabs.includes(currentTab) ? currentTab : 'Total';

    const handleTabChange = (tab: TabType) => {
        setPendingTab(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        params.set('type', tab); // Also update type for the backend
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        });
    };

    const returnUrl = `${pathname}?${searchParams.toString()}`;
    const columns = useMemo(() => getAssessmentColumns(activeTab, t, locale, searchParams.get('workflowStageId'), returnUrl, router), [activeTab, t, locale, searchParams, returnUrl, router]);
    const tableData = useMemo(() => mapServerDataToTable(serverData), [serverData]);

    const exportConfig = useMemo<ExportConfig<Record<string, unknown>>>(() => {
        const { exportColumns, exportHeaderRows } = adaptTableConfigToExport(columns as unknown as Column<Record<string, unknown>>[], getAssessmentHeaderRows(activeTab, t));

        return {
            fileName: 'Assessment_Report',
            reportTitle: 'Property Tax Data Center - Assessment Dashboard',
            reportSubtitle: `Workflow Stage: Assessment - ${activeTab} | Generated: ${new Date().toLocaleString()}`,
            pdfOrientation: 'landscape',
            headerRows: exportHeaderRows,
            columns: exportColumns,
            data: tableData as Record<string, unknown>[]
        };
    }, [tableData, columns, activeTab, t]);

    return (
        <div className="flex flex-col gap-4 h-full relative">
            <AutomationTable
                data={tableData}
                columns={columns}
                headerRows={getAssessmentHeaderRows(activeTab, t)}
                headerExtra={
                    <div className="flex items-center gap-2 w-full">
                        <TopBar activeTab={activeTab} onTabChange={handleTabChange} t={t} tDashboard={tDashboard} exportConfig={exportConfig} propertyDescriptions={propertyDescriptions} />
                    </div>
                }
                containerClassName="h-full"
                tableClassName="border-collapse"
                paginationConfig={{ enabled: false, showPageSizeSelector: false }}
                rowClassName={(row) => {
                    if (row.zoneName === 'GRAND TOTAL' || row.id?.startsWith('gtot-') || row.isTotal) {
                        return "border-t-2 border-slate-400 text-black font-bold [&_td]:font-bold [&_div]:font-bold";
                    }
                    if (row.zoneName === 'TOTAL' || row.id?.startsWith('tot-')) {
                        return "border-t-2 border-slate-400 text-black font-bold [&_td]:font-bold [&_div]:font-bold";
                    }
                    return "hover:bg-slate-50/50 transition-colors group";
                }}
            />
            {isPending && (
                <div
                    className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-center justify-center z-50 [&_h2]:before:content-['Loading..._'] [&_p]:text-[0px] [&_p]:before:content-[var(--loading-desc)] [&_p]:before:text-sm [&_p]:before:text-gray-600"
                    style={{ '--loading-desc': `"Loading the ${pendingTab || 'Total'} Property..."` } as React.CSSProperties}
                >
                    <LoadingPage
                        translationNamespace="automationDashboard.assessment"
                        messageKey={`tabs.${(pendingTab || 'Total').toLowerCase()}`}
                        descriptionKey={`tabs.${(pendingTab || 'Total').toLowerCase()}`}
                    />
                </div>
            )}
        </div>
    );
};

const AssessmentDetails = ({ serverData, propertyDescriptions }: { serverData?: AssessmentGridItems | null, propertyDescriptions?: PropertyTypeMasterItem[] }) => {
    return (
        <AssessmentDetailsContent serverData={serverData} propertyDescriptions={propertyDescriptions} />
    );
};

export default AssessmentDetails;