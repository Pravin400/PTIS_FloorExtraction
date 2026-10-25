"use client";

import React, { useMemo } from "react";
import { MasterTable } from "@/components/common/MasterTable";
import { ToastContainer } from "@/components/common/Toast";
import { SaveButton, UpdateButton, ClearButton } from "@/components/common/ActionButtons";
import { AgeFactorCVMaster, AgeFactorCvWeightageMasterProps } from "@/types/asset-masters/ageFactorCv.types";
import { getAgeFactorCvWeightageMasterColumns } from "./ageFactorCvWeightageMasterColumns";
import { AgeFactorCvHeaderExtra } from "./AgeFactorCvHeaderExtra";
import { useAgeFactorCvWeightage } from "@/hooks/asset-masters/weightageMaster/ageFactorCv/useAgeFactorCvWeightage";




const AgeFactorCvWeightageMaster: React.FC<AgeFactorCvWeightageMasterProps> = ({
    data,
    pageNumber,
    pageSize,
    totalCount,
    totalPages,
    assessmentYearOptions,
    constructionTypeOptions,
    ageRangeOptions: initialAgeRangeOptions,
    allAgeFactors,
    sortBy,
    sortOrder,
}) => {
    const {
        t,
        tW,
        tCommon,
        selectedYear,
        editableRows,
        constructionType,
        selectedAgeRange,
        ageFrom,
        setAgeFrom,
        ageTo,
        setAgeTo,
        ageRangeOptions,
        factorValue,
        setFactorValue,
        isAddYearRangeModalOpen,
        setIsAddYearRangeModalOpen,
        toasts,
        isUpdating,
        isBulkUpdating,
        isGeneratingAll,
        hasNewRecords,
        newRecordsCount,

        getRowUid,
        removeToast,
        handleCellChange,
        handleUpdate,
        handleCancelRow,
        handleAddAgeRange,
        handleAgeRangeChange,
        handleAssessmentYearChange,
        handleConstructionTypeChange,
        handleApplyFilter,
        handleBulkUpdate,
        handleGenerateAll,
        handleClearAll,
        changePage,
        changePageSize,
        sortBy: activeSortBy,
        sortOrder: activeSortOrder,
        handleSort,
    } = useAgeFactorCvWeightage({
        paginationData: {
            data,
            pageNumber,
            pageSize,
            totalCount,
            totalPages,
        },
        options: {
            constructionTypeOptions,
            initialAgeRangeOptions,
        },
        allAgeFactors,
        sortBy,
        sortOrder,
    });

    // Memoize column config — avoids recreating column objects (including JSX headers) on every render
    const columns = useMemo(
        () => getAgeFactorCvWeightageMasterColumns({
            t,
            tW,
            tCommon,
            editableRows,
            handleCellChange,
            getRowUid,
            sortBy: activeSortBy,
            sortOrder: activeSortOrder,
            onSort: handleSort,
            constructionTypeOptions,
            assessmentYearOptions,
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [t, tW, tCommon, editableRows, activeSortBy, activeSortOrder, constructionTypeOptions, assessmentYearOptions]
    );

    const renderActions = (row: AgeFactorCVMaster) => {
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
                <ClearButton
                    label={tW('common.buttons.clear')}
                    size="sm"
                    onClick={() => handleCancelRow(row)}
                    disabled={!hasRowChanges || isUpdating || isBulkUpdating}
                />
            </div>
        );
    };

    return (
        <div className="w-full">
            <ToastContainer toasts={toasts} onClose={removeToast} />
            <MasterTable<AgeFactorCVMaster>
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
                loading={isUpdating || isBulkUpdating}
                paginationConfig={{ enabled: true, showPageSizeSelector: true }}
                pageSizeOptions={[5, 10, 20, 50, 100]}
                headerExtra={
                    <AgeFactorCvHeaderExtra
                        t={t}
                        tW={tW}
                        assessmentYearOptions={assessmentYearOptions}
                        constructionTypeOptions={constructionTypeOptions}
                        ageRangeOptions={ageRangeOptions}
                        selectedYear={selectedYear}
                        constructionType={constructionType}
                        selectedAgeRange={selectedAgeRange}
                        ageFrom={ageFrom}
                        ageTo={ageTo}
                        factorValue={factorValue}
                        hasNewRecords={hasNewRecords}
                        newRecordsCount={newRecordsCount}

                        isGeneratingAll={isGeneratingAll}
                        isBulkUpdating={isBulkUpdating}
                        isUpdating={isUpdating}
                        isAddYearRangeModalOpen={isAddYearRangeModalOpen}
                        setIsAddYearRangeModalOpen={setIsAddYearRangeModalOpen}
                        handleAssessmentYearChange={handleAssessmentYearChange}
                        handleConstructionTypeChange={handleConstructionTypeChange}
                        handleAgeRangeChange={handleAgeRangeChange}
                        setAgeFrom={setAgeFrom}
                        setAgeTo={setAgeTo}
                        setFactorValue={setFactorValue}
                        handleAddAgeRange={handleAddAgeRange}
                        handleApplyFilter={handleApplyFilter}
                        handleClearAll={handleClearAll}
                        handleBulkUpdate={handleBulkUpdate}
                        handleGenerateAll={handleGenerateAll}
                        editableRowsCount={Object.keys(editableRows).length}
                    />
                }
            />
        </div>
    );
};

export default AgeFactorCvWeightageMaster;
