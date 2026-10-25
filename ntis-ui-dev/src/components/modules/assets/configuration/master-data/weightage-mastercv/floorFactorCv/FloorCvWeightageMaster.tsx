"use client";

import React, { useMemo, useCallback } from "react";

import { MasterTable } from "@/components/common/MasterTable";
import { FloorCvWeightageMasterProps, FloorFactorCVMaster } from "@/types/asset-masters/floor-cv-weightageMaster.types";
import { UpdateButton, ClearButton, SaveButton } from "@/components/common/ActionButtons";
import { ToastContainer } from "@/components/common/Toast";
import { getFloorCvWeightageMasterColumns } from "./floorCvWeightageMasterColumns";
import { FloorCvHeaderExtra } from "./FloorCvHeaderExtra";
import { useFloorCvWeightage } from "@/hooks/asset-masters/weightageMaster/floorFactorCv/useFloorCvWeightage";

const FloorCvWeightageMaster: React.FC<FloorCvWeightageMasterProps> = ({
    data,
    pageNumber,
    pageSize,
    totalCount,
    totalPages,
    floorOptions,
    assessmentYearOptions,
    sortBy,
    sortOrder,
}) => {
    const {
        t,
        tW,
        tCommon,
        selectedYear,
        editableRows,
        fromFloor,
        setFromFloor,
        toFloor,
        setToFloor,
        liftStatus,
        setLiftStatus,
        factorValue,
        setFactorValue,
        toasts,
        isUpdating,
        isBulkUpdating,
        isGeneratingAll,
        newRecordsCount,
        hasNewRecords,
        isApplyDisabled,
        isBulkUpdateDisabled,
        liftStatusOptions,
        getRowUid,
        addToast,
        removeToast,
        handleCellChange,
        handleUpdate,
        handleCancel,
        handleApplyFilter,
        handleBulkUpdate,
        handleGenerateAll,
        handleClearAll,
        changePage,
        changePageSize,
        handleAssessmentYearChange,
        handleSort,
        sortBy: activeSortBy,
        sortOrder: activeSortOrder,
    } = useFloorCvWeightage({ data, pageNumber, pageSize, totalCount, floorOptions, sortBy, sortOrder });

    // Memoize column config — avoids recreating column objects (including JSX headers) on every render
    const columns = useMemo(
        () =>
            getFloorCvWeightageMasterColumns({
                t,
                tW,
                tCommon,
                editableRows,
                handleCellChange,
                getRowUid,
                sortBy: activeSortBy,
                sortOrder: activeSortOrder,
                onSort: handleSort,
                floorOptions,
                assessmentYearOptions,
            }),
        [t, tW, tCommon, editableRows, handleCellChange, getRowUid, activeSortBy, activeSortOrder, handleSort, floorOptions, assessmentYearOptions]
    );

    const renderActions = useCallback(
        (row: FloorFactorCVMaster) => {
            const rowUid = getRowUid(row);
            const hasRowChanges = editableRows[rowUid] !== undefined;

            return (
                <div className="flex gap-2">
                    {row.id === 0 ? (
                        <SaveButton
                            label={tW("common.buttons.create")}
                            size="sm"
                            onClick={() => handleUpdate(row)}
                            disabled={!hasRowChanges || isUpdating}
                        />
                    ) : (
                        <UpdateButton
                            label={tW("common.buttons.update")}
                            size="sm"
                            onClick={() => handleUpdate(row)}
                            disabled={!hasRowChanges || isUpdating}
                        />
                    )}
                    <ClearButton
                        label={tW("common.buttons.clear")}
                        size="sm"
                        onClick={() => handleCancel(row)}
                        disabled={!hasRowChanges || isUpdating}
                    />
                </div>
            );
        },
        [getRowUid, editableRows, tW, handleUpdate, isUpdating, handleCancel]
    );

    const headerExtra = useMemo(
        () => (
            <FloorCvHeaderExtra
                t={t}
                tW={tW}
                assessmentYearOptions={assessmentYearOptions}
                floorOptions={floorOptions}
                liftStatusOptions={liftStatusOptions}
                selectedYear={selectedYear}
                fromFloor={fromFloor}
                toFloor={toFloor}
                liftStatus={liftStatus}
                factorValue={factorValue}
                isApplyDisabled={isApplyDisabled}
                isBulkUpdateDisabled={isBulkUpdateDisabled}
                isGeneratingAll={isGeneratingAll}
                isBulkUpdating={isBulkUpdating}
                isUpdating={isUpdating}
                hasNewRecords={hasNewRecords}
                newRecordsCount={newRecordsCount}
                handleAssessmentYearChange={handleAssessmentYearChange}
                setFromFloor={setFromFloor}
                setToFloor={setToFloor}
                setLiftStatus={setLiftStatus}
                setFactorValue={setFactorValue}
                handleApplyFilter={handleApplyFilter}
                handleClearAll={handleClearAll}
                handleBulkUpdate={handleBulkUpdate}
                handleGenerateAll={handleGenerateAll}
                addToast={addToast}
            />
        ),
        [
            t,
            tW,
            assessmentYearOptions,
            floorOptions,
            liftStatusOptions,
            selectedYear,
            fromFloor,
            toFloor,
            liftStatus,
            factorValue,
            isApplyDisabled,
            isBulkUpdateDisabled,
            isGeneratingAll,
            isBulkUpdating,
            isUpdating,
            hasNewRecords,
            newRecordsCount,
            handleAssessmentYearChange,
            setFromFloor,
            setToFloor,
            setLiftStatus,
            setFactorValue,
            handleApplyFilter,
            handleClearAll,
            handleBulkUpdate,
            handleGenerateAll,
            addToast,
        ]
    );

    return (
        <div className="p-0">
            <ToastContainer toasts={toasts} onClose={removeToast} />

            <MasterTable<FloorFactorCVMaster>
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
                actionLabel={t("columns.action")}
                getRowKey={(row) => getRowUid(row)}
                loading={isBulkUpdating}
                emptyText={t("messages.noRecordsFound")}
                paginationConfig={{ enabled: true, showPageSizeSelector: true }}
                pageSizeOptions={[5, 10, 20, 50, 100]}
                headerExtra={headerExtra}
            />
        </div>
    );
};

export default FloorCvWeightageMaster;