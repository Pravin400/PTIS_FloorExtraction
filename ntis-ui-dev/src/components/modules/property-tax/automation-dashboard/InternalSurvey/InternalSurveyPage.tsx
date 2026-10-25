'use client';

import { useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useDashboardSearch } from '@/hooks/automation-dashboard/useDashboardSearch';
import { AutomationTable } from '@/components/common/AutomationTable';
import { SearchInput } from '@/components/common/SearchInput';
import { SearchButton } from '@/components/common';
import { InternalSurveyGridItems } from "@/types/automation-dashboard/internal-surveygrid/internal-surveygrid.type";

import { DashboardFilterBar } from '@/components/modules/property-tax/automation-dashboard/CommonFilterDashbaord/DashboardFilterBar';
import { getInternalSurveyColumns, getInternalSurveyHeaderRows, InternalSurveyTableRow } from './InternalSurveyColumns';
import { getPropertyTypeIdParam } from '@/components/modules/property-tax/automation-dashboard/GeoSequencing/CommonGeoSequencingColumns';
import { PropertyTypeMasterItem } from '@/types/automation-dashboard/property-dashboard/property-subgrid-details.type';
import { ExportDropdown } from '../CommonFilterDashbaord/ExportDropdown';
import { ExportConfig } from '@/types/automation-dashboard/export.type';
import { adaptTableConfigToExport } from '@/lib/utils/automation-dashboard/export/adapter';
import { applyTableSort, useTableSort } from '@/lib/utils/automation-dashboard/sortUtils';
import { getAssessmentStatusNavigationParams } from '@/lib/utils/automation-dashboard/assessmentStatusNavigation';
interface InternalSurveyPageProps {
    serverData: InternalSurveyGridItems | null;
    propertyDescriptions?: PropertyTypeMasterItem[];
}

const TopBar = ({ t, propertyDescriptions = [], exportConfig }: { t: (key: string) => string, propertyDescriptions?: PropertyTypeMasterItem[], exportConfig: ExportConfig<InternalSurveyTableRow> }) => {
    const [searchTerm, setSearchTerm] = useState('');
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
                    placeholder={t('internalSurvey.searchPlaceholder')}
                    className="w-full flex-1 mb-0"
                />

                <SearchButton 
                    label={t('internalSurvey.buttons.search')} 
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

const InternalSurveyPage: React.FC<InternalSurveyPageProps> = ({ serverData, propertyDescriptions = [] }) => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const t = useTranslations('automationDashboard');
    const locale = useLocale();
    const workflowStageId = searchParams.get('workflowStageId') || '';
    const basePath = `/${locale}/property-tax/automation-dashboard`;

    const columns = useMemo(() => {
        return getInternalSurveyColumns(
            t,
            (divisionStr, row) => {
                const zoneId = row.zoneId ?? divisionStr.split(' ')[0];
                const zoneNoParam = row.zoneNo ? `&zoneNo=${row.zoneNo}` : '';
                const returnUrl = encodeURIComponent(`/${locale}/property-tax/automation-dashboard/internal-survey${workflowStageId ? `?workflowStageId=${workflowStageId}` : ''}`);
                const query = `?returnUrl=${returnUrl}${workflowStageId ? `&workflowStageId=${workflowStageId}` : ''}${zoneNoParam}`;
                router.push(`${basePath}/internal-survey/ward-wise-summary/${zoneId}${query}`);
            },
            undefined,
            (row, columnKey) => {
                if (row.sr === t('internalSurvey.total') || !row.division) return;
                const zoneId = row.zoneId ?? row.division.split(' ')[0];
                const zoneNoParam = row.zoneNo ? `&zoneNo=${row.zoneNo}` : '';
                const returnUrl = encodeURIComponent(`/${locale}/property-tax/automation-dashboard/internal-survey${workflowStageId ? `?workflowStageId=${workflowStageId}` : ''}`);
                const typeIdParam = getPropertyTypeIdParam(columnKey);

                let structureUnitParam = '';
                let assessmentTypeParam = '';
                let targetWorkflowStageId = workflowStageId;

                // Geo-Sequencing Properties
                if (columnKey === 'geoStruct') {
                    structureUnitParam = '&Structure=true&Unit=false';
                    targetWorkflowStageId = '1'; // Geo-Sequencing
                } else if (columnKey === 'geoUnit') {
                    structureUnitParam = '&Structure=false&Unit=true';
                    targetWorkflowStageId = '1'; // Geo-Sequencing
                }
                // Survey Properties
                else if (columnKey === 'surveyStruct') {
                    structureUnitParam = '&Structure=true&Unit=false';
                    targetWorkflowStageId = workflowStageId || '2'; // Internal Survey
                } else if (columnKey === 'surveyUnit') {
                    structureUnitParam = '&Structure=false&Unit=true';
                    targetWorkflowStageId = workflowStageId || '2'; // Internal Survey
                }

                const assessmentParams = getAssessmentStatusNavigationParams(columnKey, row);
                if (assessmentParams.isAssessmentStatusColumn) {
                    assessmentTypeParam = assessmentParams.assessmentTypeParam;
                    structureUnitParam = assessmentParams.structureUnitParam;
                }

                const query = `?stage=internalSurvey&source=division&column=${columnKey}&returnUrl=${returnUrl}${targetWorkflowStageId ? `&workflowStageId=${targetWorkflowStageId}` : ''}${zoneNoParam}${typeIdParam}${assessmentTypeParam}${structureUnitParam}`;
                router.push(`${basePath}/property-details-dashboard/${zoneId}${query}`);
            }
        );
    }, [t, router, basePath, workflowStageId, locale]);

    const { sortConfig, handleSort } = useTableSort<InternalSurveyTableRow>();

    const headerRows = useMemo(() => getInternalSurveyHeaderRows(t, 'zone', sortConfig, handleSort), [t, sortConfig, handleSort]);

    const tableData: InternalSurveyTableRow[] = useMemo(() => {
        if (!serverData) return [];

        const mappedData: InternalSurveyTableRow[] = (serverData.divisionData || []).map((data, index) => ({
            sr: (index + 1).toString(),
            division: data.zoneNo ? `${data.zoneNo} - ${data.divisionName}` : data.divisionName,
            zoneId: data.divisionId ?? undefined,
            zoneNo: data.zoneNo,
            isTotal: false,
            geoStruct: data.geoSequencingProperties?.structure ?? 0,
            geoUnit: data.geoSequencingProperties?.unit ?? 0,
            surveyStruct: data.surveyProperties?.structure ?? 0,
            surveyUnit: data.surveyProperties?.unit ?? 0,
            propRes: data.propertyType?.residential ?? 0,
            propNonRes: data.propertyType?.nonResidential ?? 0,
            propMixed: data.propertyType?.mixed ?? 0,
            propPublic: data.propertyType?.publicUtility ?? 0,
            propUnder: data.propertyType?.underConstruction ?? 0,
            assessStruct: data.assessedProperties?.structure ?? 0,
            assessUnit: data.assessedProperties?.units ?? 0,
            unassessStruct: data.unassessedProperties?.structure ?? 0,
            unassessUnit: data.unassessedProperties?.units ?? 0,
            newlyStruct: data.newlyAssessedFound?.structure ?? 0,
            newlyUnit: data.newlyAssessedFound?.unit ?? 0,
            inprocessStruct: data.assessmentInprocess?.structure ?? 0,
            inprocessUnit: data.assessmentInprocess?.unit ?? 0,
            photoCount: data.photoCount ?? 0,
            assessedStatusId: data.assessedProperties?.statusId,
            unassessedStatusId: data.unassessedProperties?.statusId,
            newlyAssessedStatusId: data.newlyAssessedFound?.statusId,
            inprocessStatusId: data.assessmentInprocess?.statusId,
        }));

        const sortedData = sortConfig ? applyTableSort([...mappedData], sortConfig) : mappedData;

        sortedData.forEach((row, index) => {
            row.sr = (index + 1).toString();
        });

        if (serverData.totalRow) {
            const total = serverData.totalRow;
            sortedData.push({
                sr: t('internalSurvey.total'),
                division: '',
                isTotal: true,
                geoStruct: total.geoSequencingProperties?.structure ?? 0,
                geoUnit: total.geoSequencingProperties?.unit ?? 0,
                surveyStruct: total.surveyProperties?.structure ?? 0,
                surveyUnit: total.surveyProperties?.unit ?? 0,
                propRes: total.propertyType?.residential ?? 0,
                propNonRes: total.propertyType?.nonResidential ?? 0,
                propMixed: total.propertyType?.mixed ?? 0,
                propPublic: total.propertyType?.publicUtility ?? 0,
                propUnder: total.propertyType?.underConstruction ?? 0,
                assessStruct: total.assessedProperties?.structure ?? 0,
                assessUnit: total.assessedProperties?.units ?? 0,
                unassessStruct: total.unassessedProperties?.structure ?? 0,
                unassessUnit: total.unassessedProperties?.units ?? 0,
                newlyStruct: total.newlyAssessedFound?.structure ?? 0,
                newlyUnit: total.newlyAssessedFound?.unit ?? 0,
                inprocessStruct: total.assessmentInprocess?.structure ?? 0,
                inprocessUnit: total.assessmentInprocess?.unit ?? 0,
                photoCount: total.photoCount ?? 0,
                assessedStatusId: total.assessedProperties?.statusId,
                unassessedStatusId: total.unassessedProperties?.statusId,
                newlyAssessedStatusId: total.newlyAssessedFound?.statusId,
                inprocessStatusId: total.assessmentInprocess?.statusId,
            });
        }

        return sortedData;
    }, [serverData, t, sortConfig]);

    const exportConfig = useMemo<ExportConfig<InternalSurveyTableRow>>(() => {
        const { exportColumns, exportHeaderRows } = adaptTableConfigToExport(columns, headerRows);

        return {
            fileName: 'Internal_Survey_Division_Report',
            reportTitle: 'Property Tax Data Center - Division-wise Summary',
            reportSubtitle: `Workflow Stage: Internal Survey - total | Generated: ${new Date().toLocaleString()}`,
            pdfOrientation: 'landscape',
            headerRows: exportHeaderRows,
            columns: exportColumns,
            data: tableData
        };
    }, [tableData, columns, headerRows]);

    return (
        <AutomationTable<InternalSurveyTableRow>
            data={tableData}
            columns={columns}
            headerRows={headerRows}
            headerExtra={<TopBar t={t} propertyDescriptions={propertyDescriptions} exportConfig={exportConfig} />}
            loading={!serverData}
            rowClassName={(row) => row.sr === t('internalSurvey.total') ? "bg-purple-100 dark:bg-purple-900/50 text-slate-900 dark:text-slate-100 font-bold sticky bottom-0 z-20 shadow-[0_-2px_4px_rgba(0,0,0,0.05)] border-t-2 border-slate-300 dark:border-slate-600 hover:bg-purple-200 dark:hover:bg-purple-900/70 transition-colors" : "group transition-colors border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"}
            emptyText={t('internalSurvey.emptyMessage')}
            containerClassName="h-full"
        />
    );
};

export default InternalSurveyPage;