'use client';

import { useParams } from "next/navigation";
import { Drawer } from "@/components/common/Drawer";
import { Card } from "@/components/common/Card";
import { Button, MasterTable } from "@/components/common";
import { useGapAnalysisView } from "@/hooks/PropertyMedia/useGapAnalysisView";
import { Cog, FileText, Sheet } from "lucide-react";
import { GapAnalysisViewForm } from "./GapAnalysisViewForm";
import { MissingPropertyRow, GapAnalysisViewProps } from "@/types/PropertyMedia/PropertyMedia.types";
import { usePropertyMediaExport } from "@/hooks/PropertyMedia/usePropertyMediaExport";

export function GapAnalysisView({
    missingPropertyTableData,
    workflowStageOptions,
    divisionOptions,
    propertyTypeOptions,
    wardOptions,
}: GapAnalysisViewProps) {
    const params = useParams();
    const photoTypeId = params?.id ? String(params.id) : undefined;
    const { exportMissingProperties, isExporting, isExportingExcel, isExportingPdf } = usePropertyMediaExport();

    const {
        isDrawerOpen,
        handleCancel,
        isPending,
        summaryItems,
        workflowStageId,
        divisionId,
        wardId,
        propertyTypeId,
        searchTerm,
        isWardDisabled,
        handleFilterChange,
        handleSearchChange,
        handleClear,
        handleFilter,
        isFilterEnabled,
        columns,
        paginatedData,
        pageNumber,
        pageSize,
        totalCount,
        totalPages,
        handlePageChange,
        handlePageSizeChange,
        divisionLabel,
        wardLabel,
        t,
    } = useGapAnalysisView({
        missingPropertyTableData,
        workflowStageOptions,
        divisionOptions,
        wardOptions,
        propertyTypeOptions,
    });

    const handleExport = (format: 0 | 1) => {
        exportMissingProperties({
            format,
            searchTerm: searchTerm || undefined,
            photoTypeId: photoTypeId,
            zoneId: divisionId || undefined,
            wardId: wardId || undefined,
            workflowStageId: workflowStageId || undefined,
            propertyTypeId: propertyTypeId || undefined,
            pageNumber,
            pageSize,
        });
    };

    return (
        <Drawer
            open={isDrawerOpen}
            onClose={handleCancel}
            width="lg"
            title={
                <div className="flex flex-col py-1">
                    <h2 className="text-[#173a67] text-[19px] font-bold leading-tight">
                        {t('propertyMediaViewDrawer.title')}
                    </h2>
                    <p className="text-xs text-slate-400 font-normal mt-0.5">
                        {t('propertyMediaViewDrawer.subtitle')}
                    </p>
                </div>
            }
        >
            <div className="p-4 bg-gray-50">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
                    {summaryItems.map((item, idx) => (
                        <Card
                            key={idx}
                            padding="none"
                            className="bg-[#F8FAFC]/50 border border-slate-200/70 rounded-2xl p-2 flex flex-col justify-center min-h-[64px]"
                        >
                            <span className="text-[12px] text-slate-500 font-normal leading-none mb-1.5">
                                {item.label}
                            </span>
                            <span className="text-[19px] font-bold text-[#1f2b3d] leading-tight">
                                {item.value}
                            </span>
                        </Card>
                    ))}
                </div>
                <div className="mb-2 flex items-center justify-between">
                    {/* Left side */}
                    <Button
                        variant="secondary"
                        size="xs"
                        icon={Cog}
                        onClick={handleFilter}
                        className="h-8 rounded-lg border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                        {t('propertyMediaViewDrawer.filter')}
                    </Button>

                    {/* Right side */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="success"
                            size="xs"
                            icon={Sheet}
                            isLoading={isExportingExcel}
                            disabled={isExporting}
                            onClick={() => handleExport(0)}
                            className="h-8 rounded-lg bg-[#107C41] border-[#107C41] px-3 text-xs font-semibold text-white hover:bg-[#0b5c30]"
                        >
                            {t('propertyMediaViewDrawer.excel')}
                        </Button>

                        <Button
                            variant="secondary"
                            size="xs"
                            icon={FileText}
                            isLoading={isExportingPdf}
                            disabled={isExporting}
                            onClick={() => handleExport(1)}
                            className="h-8 rounded-lg border-blue-200 bg-white px-3 text-xs font-semibold text-[#185FB8] hover:bg-blue-50"
                        >
                            {t('propertyMediaViewDrawer.pdf')}
                        </Button>
                    </div>
                </div>
                {
                    isFilterEnabled && (
                        <GapAnalysisViewForm
                            workflowStageOptions={workflowStageOptions}
                            divisionOptions={divisionOptions}
                            propertyTypeOptions={propertyTypeOptions}
                            wardOptions={wardOptions}
                            selectedWorkflowStage={workflowStageId}
                            selectedDivision={divisionId}
                            selectedWard={wardId}
                            selectedPropertyType={propertyTypeId}
                            searchTerm={searchTerm}
                            onFilterChange={handleFilterChange}
                            onSearchChange={handleSearchChange}
                            onClear={handleClear}
                            isWardDisabled={isWardDisabled}
                            divisionLabel={divisionLabel}
                            wardLabel={wardLabel}
                            isLoading={isPending}
                        />
                    )
                }
                <MasterTable<MissingPropertyRow>
                    data={paginatedData}
                    columns={columns}
                    loading={isPending}
                    pageNumber={pageNumber}
                    pageSize={pageSize}
                    totalCount={totalCount}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    containerClassName="[&>div]:overflow-hidden"
                    tableClassName="[&_th]:text-center [&_td]:text-center"
                    paginationConfig={{ enabled: true, showPageSizeSelector: true }}
                    emptyText={t('propertyMediaViewDrawer.table.noRecords')}
                />
            </div>
        </Drawer>
    );
}
