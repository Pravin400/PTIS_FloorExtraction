"use client";

import React, { startTransition } from "react";
import { toast } from "sonner";

import { MasterTable, Column } from "@/components/common/MasterTable";
import { FloorCvWeightageMasterProps, FloorFactorCVMaster } from "@/types/floor-cv-weightageMaster.types";
import { UpdateButton, ClearButton, SaveButton, EditButton, DeleteButton } from "@/components/common/ActionButtons";
import { ToastContainer } from "@/components/common/Toast";
import { getFloorCvWeightageMasterColumns } from "./floorCvWeightageMasterColumns";
import { FloorCvHeaderExtra } from "./FloorCvHeaderExtra";
import { useFloorCvWeightage } from "@/hooks/weightageMaster/floorFactorCv/useFloorCvWeightage";
import { useFloorFactorCVWeightageMasterDeleteHandler } from "@/hooks/weightageMaster/floorFactorCv/useFloorFactorDeleteHandler";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";


// Extend FloorFactorCVMaster to add index signature
type FloorFactorCVMasterWithIndex = FloorFactorCVMaster & Record<string, unknown>;

const FloorCvWeightageMaster: React.FC<FloorCvWeightageMasterProps> = ({
    // NOTE: Do NOT use useEffect in server components. Default selection is handled in useState.
    // If you need to update the URL on first load, do it in the parent server component (page.tsx) during SSR.
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
    const router = useRouter();
    const locale = useLocale();
    const { confirm } = useConfirm();
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

    const aliasFloor = useAliasLabel("Floor", t("defaults.floor"));
    const aliasAssessment = useAliasLabel("Assessment", t("defaults.assessment"));
    const aliasFloors = useAliasLabel("Floors", t("defaults.floors"));
    const aliases = { 
        floor: aliasFloor || t("defaults.floor") || "Floor", 
        assessment: aliasAssessment || t("defaults.assessment") || "Assessment", 
        floors: aliasFloors || t("defaults.floors") || "Floors" 
    };

    const columns: Column<FloorFactorCVMasterWithIndex>[] = getFloorCvWeightageMasterColumns({
        t,
        tW,
        tCommon,
        editableRows,
        handleCellChange,
        getRowUid,
        sortBy: activeSortBy,
        sortOrder: activeSortOrder,
        onSort: handleSort,
        aliases,
    });

    const { handleDelete } = useFloorFactorCVWeightageMasterDeleteHandler({
        t,
        tCommon,
        confirm,
        startTransition,
        aliases,
    });

    const renderActions = (row: FloorFactorCVMaster) => {
        const rowUid = getRowUid(row);
        const hasRowChanges = editableRows[rowUid] !== undefined;

        return (
            <div className="flex gap-2">
                {row.id === 0 ? (
                    <SaveButton
                        label={tW("common.buttons.create")}
                        size="sm"
                        onClick={() => handleUpdate(row)}
                        disabled={isUpdating}
                        className={!hasRowChanges ? "opacity-50" : ""}
                    />
                ) : (
                    <UpdateButton
                        label={tW("common.buttons.update")}
                        size="sm"
                        onClick={() => handleUpdate(row)}
                        disabled={isUpdating}
                        className={!hasRowChanges ? "opacity-50" : ""}
                    />
                )}
                <EditButton
                    size="sm"
                    onClick={() => {
                        if (row.id === 0) {
                            toast.warning(tW("common.messages.createRecordFirst") || "Please create the record first before editing.");
                        } else {
                            router.push(`/${locale}/property-tax/weightage-master/edit/${row.id}`);
                        }
                    }}
                    disabled={isUpdating}
                />
                <DeleteButton
                    size="sm"
                    onClick={() => {
                        if (row.id === 0) {
                            toast.warning(tW("common.messages.createRecordFirst") || "Please create the record first before deleting.");
                        }
                        else {
                            handleDelete(row);
                        }
                    }}
                    disabled={isUpdating}
                />
                <ClearButton
                    label={tW("common.buttons.clear")}
                    size="sm"
                    onClick={() => handleCancel(row)}
                    disabled={!hasRowChanges || isUpdating}
                />
            </div>
        );
    };

    return (
        <div className="p-0">
            <ToastContainer toasts={toasts} onClose={removeToast} />

            <MasterTable
                columns={columns as unknown as Column<Record<string, unknown>>[]}
                data={data as unknown as Record<string, unknown>[]}
                height="lg"
                pageNumber={pageNumber}
                pageSize={pageSize}
                totalCount={totalCount}
                totalPages={totalPages} 
                onPageChange={changePage}
                onPageSizeChange={changePageSize}
                renderActions={renderActions as unknown as (row: Record<string, unknown>) => React.ReactNode}
                actionLabel={t("columns.action")}
                getRowKey={(row) => getRowUid(row as unknown as FloorFactorCVMaster)}
                paginationConfig={{ enabled: true, showPageSizeSelector: true }}
                pageSizeOptions={[10, 20, 30, 40, 50]}

                headerExtra={
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
                        aliases={aliases}
                    />
                }
            />
        </div>
    );
};

export default FloorCvWeightageMaster;