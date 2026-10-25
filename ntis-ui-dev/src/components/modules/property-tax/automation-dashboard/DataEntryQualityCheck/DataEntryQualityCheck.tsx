'use client';

import { useState, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDashboardSearch } from '@/hooks/automation-dashboard/useDashboardSearch';
import { SearchInput } from '@/components/common/SearchInput';
import { Column, SearchButton } from '@/components/common';
import { AutomationTable } from '@/components/common/AutomationTable';
import { DataEntryGridItems } from '@/types/automation-dashboard/data-entry-quality-check/data-entry-quality-check.type';

import { DashboardFilterBar } from '@/components/modules/property-tax/automation-dashboard/CommonFilterDashbaord/DashboardFilterBar';
import { getDataEntryColumns, getDataEntryHeaderRows } from './DataEntryQualityCheckColumns';
import { getPropertyTypeIdParam } from '@/components/modules/property-tax/automation-dashboard/GeoSequencing/CommonGeoSequencingColumns';
import { PropertyTypeMasterItem } from '@/types/automation-dashboard/property-dashboard/property-subgrid-details.type';
import { ExportDropdown } from '../CommonFilterDashbaord/ExportDropdown';
import { ExportConfig } from '@/types/automation-dashboard/export.type';
import { adaptTableConfigToExport } from '@/lib/utils/automation-dashboard/export/adapter';
import { getAssessmentStatusNavigationParams } from '@/lib/utils/automation-dashboard/assessmentStatusNavigation';

interface DataEntryQualityCheckProps {
    serverData: DataEntryGridItems | null;
    propertyDescriptions?: PropertyTypeMasterItem[];
}

const TopBar = ({ searchTerm, setSearchTerm, t, propertyDescriptions = [], exportConfig }: { searchTerm: string, setSearchTerm: (val: string) => void, t: (key: string) => string, propertyDescriptions?: PropertyTypeMasterItem[], exportConfig: ExportConfig<Record<string, unknown>> }) => {
    const { isPending, handleSearch } = useDashboardSearch(searchTerm);

    return (
        <div className="flex items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-2 flex-1 max-w-xl">
                <SearchInput
                    value={searchTerm}
                    onChange={setSearchTerm}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleSearch();
                        }
                    }}
                    placeholder={t('dataEntryQualityCheck.searchPlaceholder')}
                    className="w-full flex-1 mb-0"
                />
                <SearchButton 
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

const DataEntryQualityCheck: React.FC<DataEntryQualityCheckProps> = ({ serverData, propertyDescriptions = [] }) => {
    const locale = useLocale();
    const searchParams = useSearchParams();
    const t = useTranslations('automationDashboard');
    const [searchTerm, setSearchTerm] = useState('');

    const workflowStageId = searchParams.get('workflowStageId') || '';
    const router = useRouter();
    const basePath = `/${locale}/property-tax/automation-dashboard`;

    const columns = useMemo(() => {
        return getDataEntryColumns(
            'division',
            t,
            (zoneIdStr, row) => {
                const actualZoneId = row?.zoneId ?? zoneIdStr;
                const zoneNoParam = row?.zoneNo ? `&zoneNo=${row.zoneNo}` : '';
                const returnUrl = encodeURIComponent(`/${locale}/property-tax/automation-dashboard/quality-check${workflowStageId ? `?workflowStageId=${workflowStageId}` : ''}`);
                const query = `?returnUrl=${returnUrl}${workflowStageId ? `&workflowStageId=${workflowStageId}` : ''}${zoneNoParam}`;
                router.push(`${basePath}/quality-check/ward-wise-summary/${actualZoneId}${query}`);
            },
            undefined,
            (row, columnKey) => {
                if (row.isTotal || !row.division) return;
                const actualZoneId = row.zoneId ?? row.division.split(' ')[0];
                const zoneNoParam = row.zoneNo ? `&zoneNo=${row.zoneNo}` : '';
                const returnUrl = encodeURIComponent(`/${locale}/property-tax/automation-dashboard/quality-check${workflowStageId ? `?workflowStageId=${workflowStageId}` : ''}`);
                const typeIdParam = getPropertyTypeIdParam(columnKey);

                let structureUnitParam = '';
                let assessmentTypeParam = '';
                let targetWorkflowStageId = workflowStageId;

                // Internal Survey column
                if (columnKey === 'isStruct') {
                    structureUnitParam = '&Structure=true&Unit=false';
                    targetWorkflowStageId = '2'; // Internal Survey
                } else if (columnKey === 'isUnit') {
                    structureUnitParam = '&Structure=false&Unit=true';
                    targetWorkflowStageId = '2'; // Internal Survey
                }
                // Data Entry column
                else if (columnKey === 'deCompStruct') {
                    structureUnitParam = '&Structure=true&Unit=false';
                    targetWorkflowStageId = workflowStageId || '3'; // Quality Check / Data Entry
                } else if (columnKey === 'deCompUnit') {
                    structureUnitParam = '&Structure=false&Unit=true';
                    targetWorkflowStageId = workflowStageId || '3'; // Quality Check / Data Entry
                } else if (columnKey === 'dePendStruct') {
                    structureUnitParam = '&PendingStructure=true';
                    targetWorkflowStageId = workflowStageId || '3';
                } else if (columnKey === 'dePendUnit') {
                    structureUnitParam = '&PendingUnit=true';
                    targetWorkflowStageId = workflowStageId || '3';
                }

                const assessmentParams = getAssessmentStatusNavigationParams(columnKey, row);
                if (assessmentParams.isAssessmentStatusColumn) {
                    assessmentTypeParam = assessmentParams.assessmentTypeParam;
                    structureUnitParam = assessmentParams.structureUnitParam;
                }

                const query = `?stage=dataEntryQC&source=division&column=${columnKey}&returnUrl=${returnUrl}${targetWorkflowStageId ? `&workflowStageId=${targetWorkflowStageId}` : ''}${zoneNoParam}${typeIdParam}${assessmentTypeParam}${structureUnitParam}`;
                router.push(`${basePath}/property-details-dashboard/${actualZoneId}${query}`);
            }
        );
    }, [t, router, basePath, workflowStageId, locale]);

    const headerRows = useMemo(() => getDataEntryHeaderRows('division', t), [t]);

    const tableData = useMemo(() => {
        if (!serverData || !serverData.divisionData) return [];

        const mappedZones = serverData.divisionData.map((zone, index) => ({
            sr: index + 1,
            division: zone.zoneNo ? `${zone.zoneNo} - ${zone.divisionName}` : zone.divisionName,
            wardNo: '',
            zoneId: zone.divisionId ?? undefined,
            zoneNo: zone.zoneNo,
            structure: zone.structure ?? 0,
            unit: zone.unit ?? 0,

            isStruct: zone.internalSurvey?.structure ?? 0,
            isUnit: zone.internalSurvey?.unit ?? 0,

            deCompStruct: zone.dataEntry?.completedStructure ?? 0,
            deCompUnit: zone.dataEntry?.completedUnit ?? 0,
            dePendStruct: zone.dataEntry?.pendingStructure ?? 0,
            dePendUnit: zone.dataEntry?.pendingUnit ?? 0,

            photoComp: zone.photo?.complete ?? 0,
            photoPend: zone.photo?.pending ?? 0,

            planComp: zone.plan?.complete ?? 0,
            planPend: zone.plan?.pending ?? 0,

            qaCompStruct: zone.qualityAnalyst?.completedStructure ?? 0,
            qaCompUnit: zone.qualityAnalyst?.completedUnit ?? 0,
            qaPendStruct: zone.qualityAnalyst?.pendingStructure ?? 0,
            qaPendUnit: zone.qualityAnalyst?.pendingUnit ?? 0,
            qaTypeWise: zone.qualityAnalyst?.typeWise ?? 0,

            propRes: zone.propertyType?.residential ?? 0,
            propNonRes: zone.propertyType?.nonResidential ?? 0,
            propMixed: zone.propertyType?.mixed ?? 0,
            propPublic: zone.propertyType?.publicUtility ?? 0,
            propUnder: zone.propertyType?.underConstruction ?? 0,

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

        const totalRow = serverData.totalRow ? {
            isTotal: true,
            sr: t('dataEntryQualityCheck.total'),
            division: '',
            wardNo: '',
            zoneId: undefined,
            zoneNo: undefined,
            structure: serverData.totalRow.structure ?? 0,
            unit: serverData.totalRow.unit ?? 0,

            isStruct: serverData.totalRow.internalSurvey?.structure ?? 0,
            isUnit: serverData.totalRow.internalSurvey?.unit ?? 0,

            deCompStruct: serverData.totalRow.dataEntry?.completedStructure ?? 0,
            deCompUnit: serverData.totalRow.dataEntry?.completedUnit ?? 0,
            dePendStruct: serverData.totalRow.dataEntry?.pendingStructure ?? 0,
            dePendUnit: serverData.totalRow.dataEntry?.pendingUnit ?? 0,

            photoComp: serverData.totalRow.photo?.complete ?? 0,
            photoPend: serverData.totalRow.photo?.pending ?? 0,

            planComp: serverData.totalRow.plan?.complete ?? 0,
            planPend: serverData.totalRow.plan?.pending ?? 0,

            qaCompStruct: serverData.totalRow.qualityAnalyst?.completedStructure ?? 0,
            qaCompUnit: serverData.totalRow.qualityAnalyst?.completedUnit ?? 0,
            qaPendStruct: serverData.totalRow.qualityAnalyst?.pendingStructure ?? 0,
            qaPendUnit: serverData.totalRow.qualityAnalyst?.pendingUnit ?? 0,
            qaTypeWise: serverData.totalRow.qualityAnalyst?.typeWise ?? 0,

            propRes: serverData.totalRow.propertyType?.residential ?? 0,
            propNonRes: serverData.totalRow.propertyType?.nonResidential ?? 0,
            propMixed: serverData.totalRow.propertyType?.mixed ?? 0,
            propPublic: serverData.totalRow.propertyType?.publicUtility ?? 0,
            propUnder: serverData.totalRow.propertyType?.underConstruction ?? 0,

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

        return totalRow ? [...mappedZones, totalRow] : mappedZones;
    }, [serverData, t]);

    const exportConfig = useMemo<ExportConfig<Record<string, unknown>>>(() => {
        const { exportColumns, exportHeaderRows } = adaptTableConfigToExport(columns as unknown as Column<Record<string, unknown>>[], headerRows);

        return {
            fileName: 'Data_Entry_Quality_Check_Division_Report',
            reportTitle: 'Property Tax Data Center - Division-wise Summary',
            reportSubtitle: `Workflow Stage: Data Entry & Quality Check - total | Generated: ${new Date().toLocaleString()}`,
            pdfOrientation: 'landscape',
            headerRows: exportHeaderRows,
            columns: exportColumns,
            data: tableData as Record<string, unknown>[]
        };
    }, [tableData, columns, headerRows]);

    return (
        <AutomationTable
            data={tableData}
            columns={columns}
            headerRows={headerRows}
            headerExtra={
                <div className="flex items-center gap-2 w-full">
                    <TopBar 
                        searchTerm={searchTerm} 
                        setSearchTerm={setSearchTerm} 
                        t={t} 
                        propertyDescriptions={propertyDescriptions}
                        exportConfig={exportConfig}
                    />
                </div>
            }
            containerClassName="h-full"
            paginationConfig={{ enabled: false, showPageSizeSelector: false }}
            rowClassName={(row) => row.isTotal ? "bg-purple-100 dark:bg-purple-900/50 text-slate-900 dark:text-slate-100 font-bold sticky bottom-0 z-20 shadow-[0_-2px_4px_rgba(0,0,0,0.05)] border-t-2 border-slate-300 dark:border-slate-600 hover:bg-purple-200 dark:hover:bg-purple-900/70 transition-colors" : "group transition-colors border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"}
        />
    );
};

export default DataEntryQualityCheck;