
'use client';

import { useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, MapPin } from 'lucide-react';
import Link from 'next/link';
import { ExportDropdown } from '../../CommonFilterDashbaord/ExportDropdown';
import { WardWiseSummaryCards } from './WardWiseSummaryCards';
import {
    getGeoSequencingSharedColumns,
    getGeoSequencingSharedHeaderRows,
    getPropertyTypeIdParam,
    GeoSequencingData
} from '../CommonGeoSequencingColumns';
import { applyTableSort, useTableSort } from '@/lib/utils/automation-dashboard/sortUtils';
import { GeoSequencingWardWiseItems, GeoSequencingWard } from '@/types/automation-dashboard/geo-sequencing/geo-sequencing.type';
import { useFormattedDate } from '@/hooks/automation-dashboard/useFormattedDate';
import { AutomationTable } from '@/components/common/AutomationTable';
import { DashboardFilterBar } from '@/components/modules/property-tax/automation-dashboard/CommonFilterDashbaord/DashboardFilterBar';
import { ExportConfig } from '@/types/automation-dashboard/export.type';
import { adaptTableConfigToExport } from '@/lib/utils/automation-dashboard/export/adapter';
import { PropertyTypeMasterItem } from '@/types/automation-dashboard/property-dashboard/property-subgrid-details.type';
import { getAssessmentStatusNavigationParams } from '@/lib/utils/automation-dashboard/assessmentStatusNavigation';

interface GeoSequencingWardWiseDashboardProps {
    zoneId: string;
    summaryData?: GeoSequencingWardWiseItems | null;
    propertyDescriptions?: PropertyTypeMasterItem[];
}

export function GeoSequencingWardWiseDashboard({ zoneId, summaryData, propertyDescriptions = [] }: GeoSequencingWardWiseDashboardProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const locale = useLocale();
    const basePath = `/${locale}/property-tax/automation-dashboard`;
    const stage = searchParams.get('stage') || 'geoSequencing';
    const workflowStageId = searchParams.get('workflowStageId');

    // Generate a formatted current date string once
    const generatedOn = useFormattedDate();

    // Calculate back URL to the main dashboard
    const backUrl = workflowStageId ? `${basePath}/geo-sequencing?workflowStageId=${workflowStageId}` : `${basePath}/geo-sequencing`;

    // Format Stage Name for display
    const formattedStage = useMemo(() => {
        if (stage === 'geoSequencing') return 'Geo-sequencing';
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
    const columns = useMemo(() => getGeoSequencingSharedColumns(
        t,
        'ward',
        (_wardNo, row) => {
            const returnUrl = encodeURIComponent(`/${locale}/property-tax/automation-dashboard/geo-sequencing/ward-wise-summary/${zoneId}${workflowStageId ? `?workflowStageId=${workflowStageId}` : ''}`);
            const pathId = row.wardId ? row.wardId : _wardNo.split(' - ')[0];
            const zoneNoParam = zoneNo ? `&zoneNo=${zoneNo}` : '';
            const query = `?stage=geoSequencing&source=ward&wardWise=true&zoneId=${zoneId}&returnUrl=${returnUrl}${workflowStageId ? `&workflowStageId=${workflowStageId}` : ''}${zoneNoParam}`;
            router.push(`${basePath}/property-details-dashboard/${pathId}${query}`);
        },
        undefined,
        (row, columnKey) => {
            if (row.isTotal || !row.division) return;
            const returnUrl = encodeURIComponent(`/${locale}/property-tax/automation-dashboard/geo-sequencing/ward-wise-summary/${zoneId}${workflowStageId ? `?workflowStageId=${workflowStageId}` : ''}`);
            const pathId = row.wardId ? row.wardId : row.division.split(' - ')[0];
            const zoneNoParam = zoneNo ? `&zoneNo=${zoneNo}` : '';

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

            const query = `?stage=geoSequencing&source=ward&column=${columnKey}&wardWise=true&zoneId=${zoneId}&returnUrl=${returnUrl}${workflowStageId ? `&workflowStageId=${workflowStageId}` : ''}${zoneNoParam}${typeIdParam}${assessmentTypeParam}${structureUnitParam}`;
            router.push(`${basePath}/property-details-dashboard/${pathId}${query}`);
        }
    ), [t, locale, zoneId, workflowStageId, basePath, router, zoneNo]);

    const { sortConfig, handleSort } = useTableSort<GeoSequencingData>();

    const headerRows = useMemo(() => getGeoSequencingSharedHeaderRows(t, 'ward', sortConfig, handleSort), [t, sortConfig, handleSort]);

    const tableData = useMemo<GeoSequencingData[]>(() => {
        if (!summaryData?.wardData) return [];

        const pageNum = summaryData.pageNumber ?? 1;
        const size = summaryData.pageSize ?? 10;
        const startSr = (pageNum - 1) * size;

        const mappedWards: GeoSequencingData[] = summaryData.wardData.map((ward: GeoSequencingWard, index: number) => ({
            sr: startSr + index + 1,
            division: ward.wardNo,
            wardId: ward.wardId,
            geoStruct: ward.geoSequencedProperties?.structureCount ?? 0,
            geoUnit: ward.geoSequencedProperties?.unitCount ?? 0,
            propRes: ward.propertyTypeBreakdown?.residential ?? 0,
            propNonRes: ward.propertyTypeBreakdown?.nonResidential ?? 0,
            propMixed: ward.propertyTypeBreakdown?.mixed ?? 0,
            propPublic: ward.propertyTypeBreakdown?.publicUtility ?? 0,
            propUnder: ward.propertyTypeBreakdown?.underConstruction ?? 0,
            assessStruct: ward.assessmentStatusBreakdown?.assessed?.structureCount ?? 0,
            assessUnit: ward.assessmentStatusBreakdown?.assessed?.unitCount ?? 0,
            unassessStruct: ward.assessmentStatusBreakdown?.unassessed?.structureCount ?? 0,
            unassessUnit: ward.assessmentStatusBreakdown?.unassessed?.unitCount ?? 0,
            newlyStruct: ward.assessmentStatusBreakdown?.newlyAssessedFound?.structureCount ?? 0,
            newlyUnit: ward.assessmentStatusBreakdown?.newlyAssessedFound?.unitCount ?? 0,
            inprocessStruct: ward.assessmentStatusBreakdown?.assessmentInProcess?.structureCount ?? 0,
            inprocessUnit: ward.assessmentStatusBreakdown?.assessmentInProcess?.unitCount ?? 0,
            assessedStatusId: ward.assessmentStatusBreakdown?.assessed?.statusId,
            unassessedStatusId: ward.assessmentStatusBreakdown?.unassessed?.statusId,
            newlyAssessedStatusId: ward.assessmentStatusBreakdown?.newlyAssessedFound?.statusId,
            inprocessStatusId: ward.assessmentStatusBreakdown?.assessmentInProcess?.statusId,
        }));

        let sortedWards = mappedWards;
        if (sortConfig) {
            sortedWards = applyTableSort(mappedWards, sortConfig);
        }

        // Reassign SR numbers after sorting so they stay sequential
        sortedWards.forEach((ward, index) => {
            ward.sr = startSr + index + 1;
        });

        if (summaryData.totalRow) {
            const total = summaryData.totalRow;
            sortedWards.push({
                sr: t('geoSequencing.total'),
                division: total.wardNo,
                isTotal: true,
                geoStruct: total.geoSequencedProperties?.structureCount ?? 0,
                geoUnit: total.geoSequencedProperties?.unitCount ?? 0,
                propRes: total.propertyTypeBreakdown?.residential ?? 0,
                propNonRes: total.propertyTypeBreakdown?.nonResidential ?? 0,
                propMixed: total.propertyTypeBreakdown?.mixed ?? 0,
                propPublic: total.propertyTypeBreakdown?.publicUtility ?? 0,
                propUnder: total.propertyTypeBreakdown?.underConstruction ?? 0,
                assessStruct: total.assessmentStatusBreakdown?.assessed?.structureCount ?? 0,
                assessUnit: total.assessmentStatusBreakdown?.assessed?.unitCount ?? 0,
                unassessStruct: total.assessmentStatusBreakdown?.unassessed?.structureCount ?? 0,
                unassessUnit: total.assessmentStatusBreakdown?.unassessed?.unitCount ?? 0,
                newlyStruct: total.assessmentStatusBreakdown?.newlyAssessedFound?.structureCount ?? 0,
                newlyUnit: total.assessmentStatusBreakdown?.newlyAssessedFound?.unitCount ?? 0,
                inprocessStruct: total.assessmentStatusBreakdown?.assessmentInProcess?.structureCount ?? 0,
                inprocessUnit: total.assessmentStatusBreakdown?.assessmentInProcess?.unitCount ?? 0,
                assessedStatusId: total.assessmentStatusBreakdown?.assessed?.statusId,
                unassessedStatusId: total.assessmentStatusBreakdown?.unassessed?.statusId,
                newlyAssessedStatusId: total.assessmentStatusBreakdown?.newlyAssessedFound?.statusId,
                inprocessStatusId: total.assessmentStatusBreakdown?.assessmentInProcess?.statusId,
            });
        }
        return sortedWards;
    }, [summaryData, t, sortConfig]);

    const summaryCardsData = useMemo(() => {
        if (!summaryData?.totalRow) return undefined;
        return {
            totalStructure: summaryData.totalRow.geoSequencedProperties?.structureCount ?? 0,
            totalUnits: summaryData.totalRow.geoSequencedProperties?.unitCount ?? 0,
            assessed: summaryData.totalRow.assessmentStatusBreakdown?.assessed?.structureCount ?? 0,
            unassessed: summaryData.totalRow.assessmentStatusBreakdown?.unassessed?.structureCount ?? 0,
            formattedStage: formattedStage
        };
    }, [summaryData, formattedStage]);

    const exportConfig = useMemo<ExportConfig<GeoSequencingData>>(() => {
        const { exportColumns, exportHeaderRows } = adaptTableConfigToExport(columns, headerRows);

        return {
            fileName: 'Geo_Sequencing_Ward_Wise_Report',
            reportTitle: `Property Tax Data Center - Ward-wise Summary (${zoneNo ? `${zoneNo} - ` : ''}${summaryData?.zoneName || ''})`,
            reportSubtitle: `Workflow Stage: Geo-sequencing - total | Generated: ${new Date().toLocaleString()}`,
            pdfOrientation: 'landscape',
            headerRows: exportHeaderRows,
            columns: exportColumns,
            data: tableData
        };
    }, [tableData, zoneNo, summaryData, columns, headerRows]);

    return (
        <div className="w-full h-[calc(100vh-140px)] flex flex-col bg-slate-50 gap-2 overflow-hidden">
            {/* Custom Page Header */}
            <div className="flex items-center justify-between bg-[#f8f9fe] px-4 py-3 rounded-lg shadow-sm border border-indigo-100/60">
                <div className="flex-1 flex justify-start">
                    <Link
                        href={backUrl}
                        className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors shadow-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t('geoSequencing.buttons.backToDivisions')}
                    </Link>
                </div>

                <div className="flex-none flex items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md">
                        <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-[16px] font-bold text-slate-800">
                            {zoneNo ? `${zoneNo} - ` : ''}
                            {summaryData?.zoneName ? summaryData.zoneName : ''} - {t('geoSequencing.wardWiseSummary')}
                        </h1>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                            <span>{t('geoSequencing.stage')} {formattedStage}</span>
                            <span>{t('geoSequencing.generatedOn')} {generatedOn}</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-end gap-3">
                    <DashboardFilterBar t={t} propertyDescriptions={propertyDescriptions} />
                    <ExportDropdown config={exportConfig} />
                </div>
            </div>

            {/* Summary Cards */}
            <WardWiseSummaryCards data={summaryCardsData} />

            {/* Ward-wise Table */}
            <div className="relative border-0 shadow-lg overflow-hidden bg-white rounded-lg flex flex-col flex-1">
                <div className="flex-1 p-0 overflow-auto max-h-[70vh] border-t border-slate-200">
                    <AutomationTable<GeoSequencingData>
                        data={tableData}
                        columns={columns}
                        headerRows={headerRows}
                        containerClassName="h-full"
                        tableClassName="w-full border-collapse text-xs border border-slate-300"
                        theadClassName="sticky top-0 z-20 shadow-[0_1px_0_0_#cbd5e1,0_2px_4px_rgba(0,0,0,0.04)]"
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
                    />
                </div>
            </div>
        </div>
    );
}
