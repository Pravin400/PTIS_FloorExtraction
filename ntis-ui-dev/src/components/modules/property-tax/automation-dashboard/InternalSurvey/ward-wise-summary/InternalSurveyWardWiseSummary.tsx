'use client';

import { useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, MapPin } from 'lucide-react';
import Link from 'next/link';
import { AutomationTable, Column } from '@/components/common/AutomationTable';
import { InternalSurveyWardWiseSummaryCards } from './InternalSurveyWardWiseSummaryCards';

import { DashboardFilterBar } from '@/components/modules/property-tax/automation-dashboard/CommonFilterDashbaord/DashboardFilterBar';
import {
    getInternalSurveyColumns,
    getInternalSurveyHeaderRows,
    InternalSurveyTableRow
} from '../InternalSurveyColumns';
import { InternalSurveyWardWiseItems, InternalSurveyWardWiseData } from '@/types/automation-dashboard/internal-surveygrid/internal-surveygrid.type';
import { useFormattedDate } from '@/hooks/automation-dashboard/useFormattedDate';
import { PropertyTypeMasterItem } from '@/types/automation-dashboard/property-dashboard/property-subgrid-details.type';
import { getPropertyTypeIdParam } from '@/components/modules/property-tax/automation-dashboard/GeoSequencing/CommonGeoSequencingColumns';
import { ExportDropdown } from '../../CommonFilterDashbaord/ExportDropdown';
import { ExportConfig } from '@/types/automation-dashboard/export.type';
import { adaptTableConfigToExport } from '@/lib/utils/automation-dashboard/export/adapter';
import { getAssessmentStatusNavigationParams } from '@/lib/utils/automation-dashboard/assessmentStatusNavigation';
import { applyTableSort, useTableSort } from '@/lib/utils/automation-dashboard/sortUtils';

interface InternalSurveyWardWiseSummaryProps {
    zoneId: string;
    summaryData?: InternalSurveyWardWiseItems | null;
    propertyDescriptions?: PropertyTypeMasterItem[];
}

const InternalSurveyWardWiseSummary = ({ zoneId, summaryData, propertyDescriptions = [] }: InternalSurveyWardWiseSummaryProps) => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const locale = useLocale();
    const basePath = `/${locale}/property-tax/automation-dashboard`;
    const stage = searchParams.get('stage') || 'internalSurvey';
    const workflowStageId = searchParams.get('workflowStageId');

    // Generate a formatted current date string once
    const generatedOn = useFormattedDate();

    // Calculate back URL to the main dashboard
    const backUrl = workflowStageId ? `${basePath}/internal-survey?workflowStageId=${workflowStageId}` : `${basePath}/internal-survey`;

    // Format Stage Name for display
    const formattedStage = useMemo(() => {
        if (stage === 'internalSurvey') return 'Internal Survey';
        return stage;
    }, [stage]);

    const t = useTranslations('automationDashboard');

    const pageNumber = summaryData?.pageNumber ?? 1;
    const pageSize = summaryData?.pageSize ?? 10;
    const totalCount = summaryData?.totalCount ?? 0;

    const handlePageChange = (newPageNumber: number) => {
        const currentParams = new URLSearchParams(searchParams.toString());
        currentParams.set('pageNumber', newPageNumber.toString());
        currentParams.set('pageSize', pageSize.toString());
        router.push(`?${currentParams.toString()}`);
    };

    const handlePageSizeChange = (newSize: number) => {
        const currentParams = new URLSearchParams(searchParams.toString());
        currentParams.set('pageNumber', '1');
        currentParams.set('pageSize', newSize.toString());
        router.push(`?${currentParams.toString()}`);
    };

    const zoneNo = searchParams.get('zoneNo');
    const columns = useMemo(() => getInternalSurveyColumns(
        t,
        (divisionStr, row) => {
            const returnUrl = encodeURIComponent(`/${locale}/property-tax/automation-dashboard/internal-survey/ward-wise-summary/${zoneId}${workflowStageId ? `?workflowStageId=${workflowStageId}` : ''}`);
            const pathId = row.wardId ? row.wardId : divisionStr.split(' - ')[0];
            const zoneNoParam = zoneNo ? `&zoneNo=${zoneNo}` : '';
            const query = `?stage=internalSurvey&source=ward&wardWise=true&zoneId=${zoneId}&returnUrl=${returnUrl}${workflowStageId ? `&workflowStageId=${workflowStageId}` : ''}${zoneNoParam}`;
            router.push(`${basePath}/property-details-dashboard/${pathId}${query}`);
        },
        undefined,
        (row, columnKey) => {
            if (row.isTotal || !row.division) return;
            const returnUrl = encodeURIComponent(`/${locale}/property-tax/automation-dashboard/internal-survey/ward-wise-summary/${zoneId}${workflowStageId ? `?workflowStageId=${workflowStageId}` : ''}`);
            const pathId = row.wardId ? row.wardId : row.division.split(' - ')[0];
            const zoneNoParam = zoneNo ? `&zoneNo=${zoneNo}` : '';
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

            const query = `?stage=internalSurvey&source=ward&wardWise=true&zoneId=${zoneId}&column=${columnKey}&returnUrl=${returnUrl}${targetWorkflowStageId ? `&workflowStageId=${targetWorkflowStageId}` : ''}${zoneNoParam}${typeIdParam}${assessmentTypeParam}${structureUnitParam}`;
            router.push(`${basePath}/property-details-dashboard/${pathId}${query}`);
        }
    ), [t, locale, zoneId, workflowStageId, basePath, router, zoneNo]);

    const { sortConfig, handleSort } = useTableSort<InternalSurveyTableRow>();

    const headerRows = useMemo(() => getInternalSurveyHeaderRows(t, 'ward', sortConfig, handleSort), [t, sortConfig, handleSort]);

    const tableData = useMemo(() => {
        if (!summaryData?.wardData) return [];

        const pageNum = summaryData.pageNumber ?? 1;
        const size = summaryData.pageSize ?? 10;
        const startSr = (pageNum - 1) * size;

        const mappedWards: InternalSurveyTableRow[] = summaryData.wardData.map((ward: InternalSurveyWardWiseData, index: number) => ({
            sr: startSr + index + 1,
            division: ward.wardNo,
            wardId: ward.wardId ?? undefined,
            geoStruct: ward.geoSequencingProperties?.structure ?? 0,
            geoUnit: ward.geoSequencingProperties?.unit ?? 0,
            surveyStruct: ward.surveyProperties?.structure ?? 0,
            surveyUnit: ward.surveyProperties?.unit ?? 0,
            propRes: ward.propertyType?.residential ?? 0,
            propNonRes: ward.propertyType?.nonResidential ?? 0,
            propMixed: ward.propertyType?.mixed ?? 0,
            propPublic: ward.propertyType?.publicUtility ?? 0,
            propUnder: ward.propertyType?.underConstruction ?? 0,
            assessStruct: ward.assessedProperties?.structure ?? 0,
            assessUnit: ward.assessedProperties?.units ?? 0,
            unassessStruct: ward.unassessedProperties?.structure ?? 0,
            unassessUnit: ward.unassessedProperties?.units ?? 0,
            newlyStruct: ward.newlyAssessedFound?.structure ?? 0,
            newlyUnit: ward.newlyAssessedFound?.unit ?? 0,
            inprocessStruct: ward.assessmentInprocess?.structure ?? 0,
            inprocessUnit: ward.assessmentInprocess?.unit ?? 0,
            photoCount: ward.photoCount ?? 0,
            assessedStatusId: ward.assessedProperties?.statusId,
            unassessedStatusId: ward.unassessedProperties?.statusId,
            newlyAssessedStatusId: ward.newlyAssessedFound?.statusId,
            inprocessStatusId: ward.assessmentInprocess?.statusId,
        }));

        const sortedWards = sortConfig ? applyTableSort([...mappedWards], sortConfig) : mappedWards;

        sortedWards.forEach((row, index) => {
            row.sr = startSr + index + 1;
        });

        if (summaryData.totalRow) {
            const total = summaryData.totalRow;
            sortedWards.push({
                sr: t('internalSurvey.total'),
                division: total.wardNo,
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

        return sortedWards;
    }, [summaryData, t, sortConfig]);

    const summaryCardsData = useMemo(() => {
        if (!summaryData?.totalRow) return undefined;
        return {
            totalStructure: summaryData.totalRow.surveyProperties?.structure ?? 0,
            totalUnits: summaryData.totalRow.surveyProperties?.unit ?? 0,
            assessed: summaryData.totalRow.assessedProperties?.structure ?? 0,
            unassessed: summaryData.totalRow.unassessedProperties?.structure ?? 0,
            photos: summaryData.totalRow.photoCount ?? 0,
            formattedStage: formattedStage
        };
    }, [summaryData, formattedStage]);

    const exportConfig = useMemo<ExportConfig<Record<string, unknown>>>(() => {
        const { exportColumns, exportHeaderRows } = adaptTableConfigToExport(columns as unknown as Column<Record<string, unknown>>[], headerRows);

        return {
            fileName: `Internal_Survey_Ward_Summary_${zoneNo ? zoneNo + '_' : ''}${summaryData?.zoneName || 'Zone'}`.replace(/\s+/g, '_'),
            reportTitle: `Property Tax Data Center - ${zoneNo ? `${zoneNo} - ` : ''}${summaryData?.zoneName ? summaryData.zoneName : ''} - Ward-wise Summary`,
            reportSubtitle: `Workflow Stage: Internal Survey - total | Generated: ${new Date().toLocaleString()}`,
            pdfOrientation: 'landscape',
            headerRows: exportHeaderRows,
            columns: exportColumns,
            data: tableData as Record<string, unknown>[]
        };
    }, [tableData, columns, headerRows, zoneNo, summaryData]);

    return (
        <div className="flex flex-col h-full gap-2">
            {/* Custom Page Header */}
            <div className="flex items-center justify-between bg-[#fcfaff] px-4 py-3 rounded-lg shadow-sm border border-purple-100/60">
                <div className="flex-1 flex justify-start">
                    <Link
                        href={backUrl}
                        className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-purple-700 bg-white hover:bg-purple-50 border border-purple-200 rounded-lg transition-colors shadow-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t('internalSurvey.buttons.backToDivisions')}
                    </Link>
                </div>

                <div className="flex-none flex items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center shadow-md">
                        <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-[16px] font-bold text-slate-800">
                            {zoneNo ? `${zoneNo} - ` : ''}
                            {summaryData?.zoneName ? summaryData.zoneName : ''} - {t('internalSurvey.wardWiseSummary')}
                        </h1>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                            <span>{t('internalSurvey.stage')} {formattedStage}</span>
                            <span>{t('internalSurvey.generatedOn')} {generatedOn}</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-end gap-3">
                    <DashboardFilterBar t={t} propertyDescriptions={propertyDescriptions} />
                    <ExportDropdown config={exportConfig} />
                </div>
            </div>

            {/* Summary Cards */}
            <InternalSurveyWardWiseSummaryCards data={summaryCardsData} />

            {/* Ward-wise Table */}
            <div className="relative border-0 shadow-lg overflow-hidden bg-white rounded-lg flex flex-col flex-1">
                <div className="flex-1 p-0 overflow-auto max-h-[70vh] border-t border-slate-200">
                    <AutomationTable
                        data={tableData}
                        columns={columns as unknown as Column<InternalSurveyTableRow>[]}
                        headerRows={headerRows}
                        containerClassName="h-full"
                        tableClassName="w-full border-collapse text-sm border border-slate-300"
                        theadClassName="sticky top-0 z-20"
                        maxBodyHeightClassName="max-h-none"
                        rowClassName={(row) => row.isTotal ? "bg-purple-100 dark:bg-purple-900/50 text-slate-900 dark:text-slate-100 font-bold sticky bottom-0 z-20 shadow-[0_-2px_4px_rgba(0,0,0,0.05)] border-t-2 border-slate-300 dark:border-slate-600 hover:bg-purple-200 dark:hover:bg-purple-900/70 transition-colors" : "group transition-colors border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"}
                        loading={false}
                        totalCount={totalCount}
                        pageNumber={pageNumber}
                        pageSize={pageSize}
                        totalPages={Math.ceil(totalCount / pageSize)}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                        paginationConfig={{
                            enabled: true,
                            showPageSizeSelector: true
                        }}
                        onRowClick={(row) => {
                            if (row.isTotal || !row.division) return;
                            const returnUrl = encodeURIComponent(`/${locale}/property-tax/automation-dashboard/internal-survey/ward-wise-summary/${zoneId}${workflowStageId ? `?workflowStageId=${workflowStageId}` : ''}`);
                            const pathId = row.wardId ? row.wardId : row.division.split(' - ')[0];
                            const zoneNoParam = zoneNo ? `&zoneNo=${zoneNo}` : '';
                            const query = `?stage=internalSurvey&source=ward&wardWise=true&zoneId=${zoneId}&returnUrl=${returnUrl}${workflowStageId ? `&workflowStageId=${workflowStageId}` : ''}${zoneNoParam}`;
                            router.push(`${basePath}/property-details-dashboard/${pathId}${query}`);
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default InternalSurveyWardWiseSummary;