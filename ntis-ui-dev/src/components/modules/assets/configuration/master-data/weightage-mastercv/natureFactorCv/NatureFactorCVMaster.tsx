"use client";

import React, { useMemo } from "react";
import { MasterTable } from "@/components/common/MasterTable";

import { UpdateButton, CancelButton, SaveButton } from "@/components/common/ActionButtons";
import { ToastContainer } from "@/components/common/Toast";
import { NatureFactorCVMaster as NatureFactorCVMasterType, NatureFactorCVMasterProps } from "@/types/asset-masters/natureofbuilding-cv-weightageMaster.types";
import { useNatureFactorCv } from "@/hooks/asset-masters/weightageMaster/natureFactorCv/useNatureFactorCv";
import { getNatureFactorCvColumns } from "./natureFactorCvColumns";
import { NatureFactorCvHeaderExtra } from "./NatureFactorCvHeaderExtra";




const NatureFactorCVMaster: React.FC<NatureFactorCVMasterProps> = ({
    data,
    pageNumber,
    pageSize,
    totalCount,
    totalPages,
    assessmentYearOptions,
    constructionTypeOptions,
    sortBy,
    sortOrder,
}) => {
    const {
        t, tW, tCommon,
        selectedYear, constructionType, factorValue,
        editableRows,
        isUpdating, isBulkUpdating, isGeneratingAll,
        newRecordsCount, hasNewRecords,
        toasts,
        isApplyDisabled, isBulkUpdateDisabled,
        removeToast,
        getRowUid, handleCellChange, handleUpdate, handleCancel,
        handleAssessmentYearChange, handleConstructionTypeChange, setFactorValue,
        handleApplyFilter, handleBulkUpdate, handleGenerateAll, handleClearAll,
        changePage, changePageSize, handleSort,
        sortBy: activeSortBy, sortOrder: activeSortOrder
    } = useNatureFactorCv({ data, pageSize, sortBy, sortOrder });

    // Memoize column config — avoids recreating column objects (including JSX headers) on every render
    const columns = useMemo(
        () => getNatureFactorCvColumns({
            t, tW, tCommon, editableRows, getRowUid, handleCellChange,
            sortBy: activeSortBy, sortOrder: activeSortOrder, onSort: handleSort,
            constructionTypeOptions, assessmentYearOptions
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [t, tW, tCommon, editableRows, activeSortBy, activeSortOrder, constructionTypeOptions, assessmentYearOptions]
    );

    const renderActions = (row: NatureFactorCVMasterType) => {
        const rowUid = getRowUid(row);
        const hasRowChanges = editableRows[rowUid] !== undefined;

        return (
            <div className="flex gap-2">
                {row.id === 0 ? (
                    <SaveButton
                        label={tW('common.buttons.create')}
                        size="sm"
                        onClick={() => handleUpdate(row)}
                        disabled={!hasRowChanges || isUpdating || isBulkUpdating}
                    />
                ) : (
                    <UpdateButton
                        label={tW('common.buttons.update')}
                        size="sm"
                        onClick={() => handleUpdate(row)}
                        disabled={!hasRowChanges || isUpdating || isBulkUpdating}
                    />
                )}
                <CancelButton
                    size="sm"
                    onClick={() => handleCancel(row)}
                    disabled={!hasRowChanges || isUpdating || isBulkUpdating}
                />
            </div>
        );
    };

    return (
        <div className="p-0">
            <ToastContainer toasts={toasts} onClose={removeToast} />
            <MasterTable<NatureFactorCVMasterType>
                theadClassName="!bg-[#0f3d8a] !bg-none hover:!bg-[#0f3d8a] [&_*]:!text-white [&_button:hover]:!bg-transparent [&_button:hover]:!text-white/80"
                footerClassName="[&_.bg-\[\#2563EB\]]:!bg-[#0f3d8a] [&_.bg-\[\#2563EB\]]:!border-[#0f3d8a] [&_.bg-\[\#2563EB\]]:!text-white hover:[&_.bg-\[\#2563EB\]]:!bg-[#0b2f6b]"
                columns={columns}
                data={data}
                height="lg"
                pageNumber={pageNumber}
                pageSize={pageSize}
                totalCount={totalCount}
                totalPages={totalPages}
                onPageChange={changePage}
                onPageSizeChange={changePageSize}
                renderActions={renderActions}
                actionLabel={t('columns.action')}
                getRowKey={(row) => getRowUid(row)}
                paginationConfig={{ enabled: true, showPageSizeSelector: true }}
                pageSizeOptions={[5, 10, 20, 50, 100]}
                emptyText={t('messages.noRecordsFound')}
                loading={isUpdating || isBulkUpdating}
                headerExtra={
                    <NatureFactorCvHeaderExtra
                        t={t}
                        tW={tW}
                        assessmentYearOptions={assessmentYearOptions}
                        constructionTypeOptions={constructionTypeOptions}
                        selectedYear={selectedYear}
                        constructionType={constructionType}
                        factorValue={factorValue}
                        setFactorValue={setFactorValue}
                        handleAssessmentYearChange={handleAssessmentYearChange}
                        handleConstructionTypeChange={handleConstructionTypeChange}
                        handleGenerateAll={handleGenerateAll}
                        handleApplyFilter={handleApplyFilter}
                        handleClearAll={handleClearAll}
                        handleBulkUpdate={handleBulkUpdate}
                        hasNewRecords={hasNewRecords}
                        newRecordsCount={newRecordsCount}
                        isGeneratingAll={isGeneratingAll}
                        isBulkUpdating={isBulkUpdating}
                        isUpdating={isUpdating}
                        isApplyDisabled={isApplyDisabled}
                        isBulkUpdateDisabled={isBulkUpdateDisabled}
                    />
                }
            />
        </div>
    );
};

export default NatureFactorCVMaster;