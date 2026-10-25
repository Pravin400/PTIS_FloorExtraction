"use client";

import React, { useMemo, useCallback } from "react";
import { MasterTable } from "@/components/common/MasterTable";
import { Option } from "@/components/common/select";
import { SaveButton, UpdateButton, CancelButton } from "@/components/common/ActionButtons";
import { ToastContainer } from "@/components/common/Toast";
import { UseFactorCVMaster, UseType } from "@/types/useCategoryCvFactor.types";
import { useCategoryCv } from "@/hooks/asset-masters/weightageMaster/useCategoryCv/useCategoryCv";
import { getTypeOfUseColumns, getUseFactorColumns } from "./useCategoryCvColumns";
import { UseCategoryCvHeaderExtra } from "./UseCategoryCvHeaderExtra";

interface UseCategoryCvFactorMasterProps {
    data: UseFactorCVMaster[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;

    typeOfUseTableData: UseType[];
    typeOfUsePageNumber: number;
    typeOfUsePageSize: number;
    typeOfUseTotalCount: number;
    typeOfUseTotalPages: number;

    assessmentYearOptions: Option[];
    typeOfUseOptions: Option[];

    sortBy?: string;
    sortOrder?: string;
    leftSortBy?: string;
    leftSortOrder?: string;
}

const UseCategoryCvFactorMaster: React.FC<UseCategoryCvFactorMasterProps> = ({
    data,
    pageNumber,
    pageSize,
    totalCount,
    totalPages,

    typeOfUseTableData,
    typeOfUsePageNumber,
    typeOfUsePageSize,
    typeOfUseTotalCount,
    typeOfUseTotalPages,

    assessmentYearOptions,
    typeOfUseOptions,

    sortBy,
    sortOrder,
    leftSortBy,
    leftSortOrder,
}) => {
    const {
        t, tW, tCommon,
        selectedYear, typeOfUseId, factorValue, setFactorValue,
        editableRows, selectedTypeId,
        isUpdating, isBulkUpdating, isGeneratingAll,
        newRecordsCount, hasNewRecords,
        toasts,
        isApplyDisabled, isBulkUpdateDisabled,
        removeToast,
        getRowUid, handleCellChange, handleUpdate, handleCancel,
        handleAssessmentYearChange, handleTypeOfUseChange, handleTypeRowClick,
        handleApplyFilter, handleBulkUpdate, handleGenerateAll, handleClearAll,
        changePage, changePageSize, changeLeftPage, changeLeftPageSize,
        sortBy: activeSortBy,
        sortOrder: activeSortOrder,
        leftSortBy: activeLeftSortBy,
        leftSortOrder: activeLeftSortOrder,
        handleSort,
        handleLeftSort,
    } = useCategoryCv({
        data,
        pageSize,
        pageNumber,
        typeOfUsePageSize,
        typeOfUsePageNumber,
        sortBy,
        sortOrder,
        leftSortBy,
        leftSortOrder,
    });

    // Memoize column configs — avoids recreating column objects (including JSX headers) on every render
    const typeOfUseColumns = useMemo(
        () => getTypeOfUseColumns(
            t,
            tW,
            handleTypeRowClick,
            tCommon,
            activeLeftSortBy,
            activeLeftSortOrder,
            handleLeftSort
        ),
        [t, tW, tCommon, handleTypeRowClick, activeLeftSortBy, activeLeftSortOrder, handleLeftSort]
    );

    const columns = useMemo(
        () => getUseFactorColumns(
            t,
            tW,
            editableRows,
            handleCellChange,
            getRowUid,
            tCommon,
            activeSortBy,
            activeSortOrder,
            handleSort,
            typeOfUseOptions,
            assessmentYearOptions
        ),
        [t, tW, tCommon, editableRows, handleCellChange, getRowUid, activeSortBy, activeSortOrder, handleSort, typeOfUseOptions, assessmentYearOptions]
    );

    const renderActions = useCallback(
        (row: UseFactorCVMaster) => {
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
        },
        [getRowUid, editableRows, tW, handleUpdate, isUpdating, isBulkUpdating, handleCancel]
    );

    return (
        <div className="flex flex-col gap-4">
            <ToastContainer toasts={toasts} onClose={removeToast} />

            <UseCategoryCvHeaderExtra
                t={t}
                tW={tW}
                assessmentYearOptions={assessmentYearOptions}
                typeOfUseOptions={typeOfUseOptions}
                selectedYear={selectedYear}
                typeOfUseId={typeOfUseId}
                factorValue={factorValue}
                setFactorValue={setFactorValue}
                handleAssessmentYearChange={handleAssessmentYearChange}
                handleTypeOfUseChange={handleTypeOfUseChange}
                handleApplyFilter={handleApplyFilter}
                handleClearAll={handleClearAll}
                handleBulkUpdate={handleBulkUpdate}
                handleGenerateAll={handleGenerateAll}
                newRecordsCount={newRecordsCount}
                hasNewRecords={hasNewRecords}
                isApplyDisabled={isApplyDisabled}
                isBulkUpdateDisabled={isBulkUpdateDisabled}
                isGeneratingAll={isGeneratingAll}
                isBulkUpdating={isBulkUpdating}
                isUpdating={isUpdating}
            />

            <div className="grid grid-cols-1 xl:grid-cols-[40%_59%] gap-4 items-start">
                <MasterTable<UseType>
                    theadClassName="!bg-[#0f3d8a] !bg-none hover:!bg-[#0f3d8a] [&_*]:!text-white [&_button:hover]:!bg-transparent [&_button:hover]:!text-white/80"
                    footerClassName="[&_.bg-\[\#2563EB\]]:!bg-[#0f3d8a] [&_.bg-\[\#2563EB\]]:!border-[#0f3d8a] [&_.bg-\[\#2563EB\]]:!text-white hover:[&_.bg-\[\#2563EB\]]:!bg-[#0b2f6b]"
                    columns={typeOfUseColumns}
                    data={typeOfUseTableData}
                    height="lg"
                    pageNumber={typeOfUsePageNumber}
                    pageSize={typeOfUsePageSize}
                    totalCount={typeOfUseTotalCount}
                    totalPages={typeOfUseTotalPages}
                    onPageChange={changeLeftPage}
                    onPageSizeChange={changeLeftPageSize}
                    getRowKey={(row) => `type-${row.id}`}
                    rowClassName={(row) => row.id === selectedTypeId ? "bg-[#F0F7FF] shadow-inner border-l-4 border-blue-500" : ""}
                    paginationConfig={{ enabled: true, showPageSizeSelector: true }}
                    pageSizeOptions={[5, 10, 20, 50, 100]}
                    emptyText={t('messages.noTypeOfUseRecordsFound')}
                    loading={false}
                />

                <MasterTable<UseFactorCVMaster>
                    theadClassName="!bg-[#0f3d8a] !bg-none hover:!bg-[#0f3d8a] [&_*]:!text-white [&_button:hover]:!bg-transparent [&_button:hover]:!text-white/80"
                    footerClassName="[&_.bg-\[\#2563EB\]]:!bg-[#0f3d8a] [&_.bg-\[\#2563EB\]]:!border-[#0f3d8a] [&_.bg-\[\#2563EB\]]:!text-white hover:[&_.bg-\[\#2563EB\]]:!bg-[#0b2f6b]"
                    columns={columns}
                    data={data}
                    pageNumber={pageNumber}
                    pageSize={pageSize}
                    totalCount={totalCount}
                    height="lg"
                    totalPages={totalPages}
                    onPageChange={changePage}
                    onPageSizeChange={changePageSize}
                    renderActions={renderActions}
                    actionLabel={t('columns.action')}
                    getRowKey={(row) => getRowUid(row)}
                    paginationConfig={{ enabled: true, showPageSizeSelector: true }}
                    pageSizeOptions={[5, 10, 20, 50, 100]}
                    emptyText={selectedTypeId ? t('messages.noSubtypeRecordsFound') : t('messages.selectTypeOfUsePrompt')}
                    loading={isBulkUpdating}
                />
            </div>
        </div>
    );
};

export default UseCategoryCvFactorMaster;
