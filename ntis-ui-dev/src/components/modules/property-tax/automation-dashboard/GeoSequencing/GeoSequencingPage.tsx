'use client';

import { useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { AutomationTable } from '@/components/common/AutomationTable';
import { SearchInput } from '@/components/common/SearchInput';
import { SearchButton } from '@/components/common';
import { ExportDropdown } from '../CommonFilterDashbaord/ExportDropdown';
import { GeoSequencingItems } from '@/types/automation-dashboard/geo-sequencing/geo-sequencing.type';
import {
    GeoSequencingData,
    getGeoSequencingSharedColumns,
    getGeoSequencingSharedHeaderRows,
    getPropertyTypeIdParam
} from './CommonGeoSequencingColumns';
import { applyTableSort, useTableSort } from '@/lib/utils/automation-dashboard/sortUtils';
import { DashboardFilterBar } from '@/components/modules/property-tax/automation-dashboard/CommonFilterDashbaord/DashboardFilterBar';
import { PropertyTypeMasterItem } from '@/types/automation-dashboard/property-dashboard/property-subgrid-details.type';
import { ExportConfig } from '@/types/automation-dashboard/export.type';
import { adaptTableConfigToExport } from '@/lib/utils/automation-dashboard/export/adapter';
import { useDashboardSearch } from '@/hooks/automation-dashboard/useDashboardSearch';
import { getAssessmentStatusNavigationParams } from '@/lib/utils/automation-dashboard/assessmentStatusNavigation';

interface GeoSequencingPageProps {
    serverData?: GeoSequencingItems | null;
    defaultWorkflowStageId?: string;
    propertyDescriptions?: PropertyTypeMasterItem[];
}

const TopBar = ({
    t,
    propertyDescriptions,
    exportConfig
}: {
    t: (key: string) => string;
    propertyDescriptions?: PropertyTypeMasterItem[];
    exportConfig: ExportConfig<GeoSequencingData>;
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const { isPending, handleSearch } = useDashboardSearch(searchTerm);

    return (
        <div className="flex items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-2 flex-1 max-w-xl">
                <SearchInput
                    value={searchTerm}
                    onChange={setSearchTerm}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleSearch();
                        }
                    }}
                    placeholder={t('geoSequencing.searchPlaceholder')}
                    className="w-full flex-1 mb-0"
                />

                <SearchButton
                    label={t('geoSequencing.buttons.search')}
                    onClick={handleSearch}
                    disabled={isPending || !searchTerm.trim()}
                />
            </div>
            <div className="flex items-center gap-3">
                <DashboardFilterBar t={t} propertyDescriptions={propertyDescriptions} />
                <ExportDropdown config={exportConfig} />
            </div>
        </div>
    );
};

const GeoSequencingPage = ({ serverData, defaultWorkflowStageId, propertyDescriptions }: GeoSequencingPageProps) => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const t = useTranslations('automationDashboard');
    const locale = useLocale();
    const workflowStageId = searchParams.get('workflowStageId') || defaultWorkflowStageId || '';
    const basePath = `/${locale}/property-tax/automation-dashboard`;

    const columns = useMemo(() => {
        return getGeoSequencingSharedColumns(
            t,
            'zone',
            (zoneCode, row) => {
                const targetZoneId = row.zoneId ?? zoneCode;
                const zoneNoParam = row.zoneNo ? `&zoneNo=${row.zoneNo}` : '';
                const returnUrl = encodeURIComponent(`/${locale}/property-tax/automation-dashboard/geo-sequencing${workflowStageId ? `?workflowStageId=${workflowStageId}` : ''}`);
                const query = `?returnUrl=${returnUrl}${workflowStageId ? `&workflowStageId=${workflowStageId}` : ''}${zoneNoParam}`;
                router.push(`${basePath}/geo-sequencing/ward-wise-summary/${targetZoneId}${query}`);
            },
            undefined,
            (row, columnKey) => {
                if (row.isTotal || !row.division) return;
                const zoneId = row.zoneId ?? row.division.split(' ')[0];
                const zoneNoParam = row.zoneNo ? `&zoneNo=${row.zoneNo}` : '';
                const returnUrl = encodeURIComponent(`/${locale}/property-tax/automation-dashboard/geo-sequencing${workflowStageId ? `?workflowStageId=${workflowStageId}` : ''}`);
                const typeIdParam = getPropertyTypeIdParam(columnKey);

                let structureUnitParam = '';
                let assessmentTypeParam = '';
                if (columnKey === 'geoStruct') {
                    structureUnitParam = '&Structure=true&Unit=false';
                } else if (columnKey === 'geoUnit') {
                    structureUnitParam = '&Structure=false&Unit=true';
                }

                const assessmentParams = getAssessmentStatusNavigationParams(columnKey, row);
                if (assessmentParams.isAssessmentStatusColumn) {
                    assessmentTypeParam = assessmentParams.assessmentTypeParam;
                    structureUnitParam = assessmentParams.structureUnitParam;
                }

                const query = `?stage=geoSequencing&source=division&column=${columnKey}&returnUrl=${returnUrl}${workflowStageId ? `&workflowStageId=${workflowStageId}` : ''}${zoneNoParam}${typeIdParam}${assessmentTypeParam}${structureUnitParam}`;
                router.push(`${basePath}/property-details-dashboard/${zoneId}${query}`);
            }
        );
    }, [t, router, basePath, workflowStageId, locale]);

    const { sortConfig, handleSort } = useTableSort<GeoSequencingData>();

    const headerRows = useMemo(() => getGeoSequencingSharedHeaderRows(t, 'zone', sortConfig, handleSort), [t, sortConfig, handleSort]);

    const tableData = useMemo<GeoSequencingData[]>(() => {
        if (!serverData || !serverData.zones) return [];

        const mappedZones: GeoSequencingData[] = serverData.zones.map((zone, index) => ({
            sr: index + 1,
            division: zone.zoneNo ? `${zone.zoneNo} - ${zone.zoneName}` : zone.zoneName,
            zoneId: zone.zoneId,
            zoneNo: zone.zoneNo,
            registered: zone.registeredProperties ?? 0,
            geoStruct: zone.geoSequencedProperties?.structureCount ?? 0,
            geoUnit: zone.geoSequencedProperties?.unitCount ?? 0,
            propRes: zone.propertyTypeBreakdown?.residential ?? 0,
            propNonRes: zone.propertyTypeBreakdown?.nonResidential ?? 0,
            propMixed: zone.propertyTypeBreakdown?.mixed ?? 0,
            propPublic: zone.propertyTypeBreakdown?.publicUtility ?? 0,
            propUnder: zone.propertyTypeBreakdown?.underConstruction ?? 0,
            assessStruct: zone.assessmentStatusBreakdown?.assessed?.structureCount ?? 0,
            assessUnit: zone.assessmentStatusBreakdown?.assessed?.unitCount ?? 0,
            unassessStruct: zone.assessmentStatusBreakdown?.unassessed?.structureCount ?? 0,
            unassessUnit: zone.assessmentStatusBreakdown?.unassessed?.unitCount ?? 0,
            newlyStruct: zone.assessmentStatusBreakdown?.newlyAssessedFound?.structureCount ?? 0,
            newlyUnit: zone.assessmentStatusBreakdown?.newlyAssessedFound?.unitCount ?? 0,
            inprocessStruct: zone.assessmentStatusBreakdown?.assessmentInProcess?.structureCount ?? 0,
            inprocessUnit: zone.assessmentStatusBreakdown?.assessmentInProcess?.unitCount ?? 0,
            assessedStatusId: zone.assessmentStatusBreakdown?.assessed?.statusId,
            unassessedStatusId: zone.assessmentStatusBreakdown?.unassessed?.statusId,
            newlyAssessedStatusId: zone.assessmentStatusBreakdown?.newlyAssessedFound?.statusId,
            inprocessStatusId: zone.assessmentStatusBreakdown?.assessmentInProcess?.statusId,
        }));

        let sortedZones = mappedZones;
        if (sortConfig) {
            sortedZones = applyTableSort(mappedZones, sortConfig);
        }

        // Reassign SR numbers after sorting so they stay sequential
        sortedZones.forEach((zone, index) => {
            zone.sr = index + 1;
        });

        const totalRow: GeoSequencingData | null = serverData.totalRow ? {
            sr: t('geoSequencing.total'),
            division: '',
            isTotal: true,
            registered: serverData.totalRow.registeredProperties ?? 0,
            geoStruct: serverData.totalRow.geoSequencedProperties?.structureCount ?? 0,
            geoUnit: serverData.totalRow.geoSequencedProperties?.unitCount ?? 0,
            propRes: serverData.totalRow.propertyTypeBreakdown?.residential ?? 0,
            propNonRes: serverData.totalRow.propertyTypeBreakdown?.nonResidential ?? 0,
            propMixed: serverData.totalRow.propertyTypeBreakdown?.mixed ?? 0,
            propPublic: serverData.totalRow.propertyTypeBreakdown?.publicUtility ?? 0,
            propUnder: serverData.totalRow.propertyTypeBreakdown?.underConstruction ?? 0,
            assessStruct: serverData.totalRow.assessmentStatusBreakdown?.assessed?.structureCount ?? 0,
            assessUnit: serverData.totalRow.assessmentStatusBreakdown?.assessed?.unitCount ?? 0,
            unassessStruct: serverData.totalRow.assessmentStatusBreakdown?.unassessed?.structureCount ?? 0,
            unassessUnit: serverData.totalRow.assessmentStatusBreakdown?.unassessed?.unitCount ?? 0,
            newlyStruct: serverData.totalRow.assessmentStatusBreakdown?.newlyAssessedFound?.structureCount ?? 0,
            newlyUnit: serverData.totalRow.assessmentStatusBreakdown?.newlyAssessedFound?.unitCount ?? 0,
            inprocessStruct: serverData.totalRow.assessmentStatusBreakdown?.assessmentInProcess?.structureCount ?? 0,
            inprocessUnit: serverData.totalRow.assessmentStatusBreakdown?.assessmentInProcess?.unitCount ?? 0,
            assessedStatusId: serverData.totalRow.assessmentStatusBreakdown?.assessed?.statusId,
            unassessedStatusId: serverData.totalRow.assessmentStatusBreakdown?.unassessed?.statusId,
            newlyAssessedStatusId: serverData.totalRow.assessmentStatusBreakdown?.newlyAssessedFound?.statusId,
            inprocessStatusId: serverData.totalRow.assessmentStatusBreakdown?.assessmentInProcess?.statusId,
        } : null;

        return totalRow ? [...sortedZones, totalRow] : sortedZones;
    }, [serverData, t, sortConfig]);

    const exportConfig = useMemo<ExportConfig<GeoSequencingData>>(() => {
        const { exportColumns, exportHeaderRows } = adaptTableConfigToExport(columns, headerRows);

        return {
            fileName: 'Geo_Sequencing_Division_Report',
            reportTitle: 'Property Tax Data Center - Division-wise Summary',
            reportSubtitle: `Workflow Stage: Geo-sequencing - total | Generated: ${new Date().toLocaleString()}`,
            pdfOrientation: 'landscape',
            headerRows: exportHeaderRows,
            columns: exportColumns,
            data: tableData
        };
    }, [tableData, columns, headerRows]);

    return (
        <AutomationTable<GeoSequencingData>
            data={tableData}
            columns={columns}
            headerRows={headerRows}
            headerExtra={<TopBar t={t} propertyDescriptions={propertyDescriptions} exportConfig={exportConfig} />}
            containerClassName="h-full"
            paginationConfig={{ enabled: false, showPageSizeSelector: false }}
            rowClassName={(row) => row.sr === t('geoSequencing.total') ? "bg-purple-100 dark:bg-purple-900/50 text-slate-900 dark:text-slate-100 font-bold sticky bottom-0 z-20 shadow-[0_-2px_4px_rgba(0,0,0,0.05)] border-t-2 border-slate-300 dark:border-slate-600 hover:bg-purple-200 dark:hover:bg-purple-900/70 transition-colors" : "group transition-colors border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"}
        />
    );
};

export default GeoSequencingPage;