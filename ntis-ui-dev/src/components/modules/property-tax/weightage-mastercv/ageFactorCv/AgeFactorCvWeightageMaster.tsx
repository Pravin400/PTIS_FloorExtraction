"use client";

import React, { startTransition } from "react";
import { toast } from "sonner";
import { MasterTable } from "@/components/common/MasterTable";
import { ToastContainer } from "@/components/common/Toast";
import { SaveButton, UpdateButton, ClearButton, EditButton, DeleteButton } from "@/components/common/ActionButtons";
import { AgeFactorCVMaster } from "@/types/ageFactorCv.types";
import { getAgeFactorCvWeightageMasterColumns } from "./ageFactorCvWeightageMasterColumns";
import { AgeFactorCvHeaderExtra } from "./AgeFactorCvHeaderExtra";
import { useAgeFactorCvWeightage } from "@/hooks/weightageMaster/ageFactorCv/useAgeFactorCvWeightage";
import type { Option } from "@/components/common/select";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAgeFactorCVWeightageMasterDeleteHandler} from "@/hooks/weightageMaster/ageFactorCv/useAgeFactorDeleteHandler";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";


interface AgeFactorCvWeightageMasterProps {
    data: AgeFactorCVMaster[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    assessmentYearOptions: Option[];
    constructionTypeOptions: Option[];
    ageRangeOptions: Option[];
    allAgeFactors: AgeFactorCVMaster[];
    sortBy?: string;
    sortOrder?: string;
}

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
    const router = useRouter();
    const locale = useLocale();
    const { confirm } = useConfirm();
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

    const aliasAssessment = useAliasLabel("Assessment", t("defaults.assessment") || "Assessment");
    const aliasConstructionType = useAliasLabel("Construction_Type", t("defaults.constructionType") || "Construction Type");
    const aliases = {
        assessment: aliasAssessment,
        constructionType: aliasConstructionType
    };

    const columns = getAgeFactorCvWeightageMasterColumns({
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

    const { handleDelete } = useAgeFactorCVWeightageMasterDeleteHandler({
        t,
        tCommon,
        confirm,
        startTransition,
        aliases,
    })

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
                        disabled={isUpdating || isBulkUpdating}
                        className={!hasRowChanges ? "opacity-50" : ""}
                    />
                ) : (
                    <UpdateButton
                        label={tW('common.buttons.update')}
                        size="sm"
                        onClick={() => handleUpdate(row)}
                        disabled={isUpdating || isBulkUpdating}
                        className={!hasRowChanges ? "opacity-50" : ""}
                    />
                )}
                <EditButton
                    size="sm"
                    onClick={() => {
                        if (row.id === 0) {
                            toast.warning(tW("common.messages.createRecordFirst") || "Please create the record first before editing.");
                        }
                        else {
                            router.push(`/${locale}/property-tax/weightage-master/age-weightage/edit/${row.id}`);
                        }
                    }}
                    disabled={isUpdating || isBulkUpdating}
                />
                <DeleteButton
                    size="sm"
                    onClick={() => {
                        if (row.id === 0) {
                            toast.warning(tW("common.messages.createRecordFirst") || "Please create the record first before deleting.");
                        } else {
                            handleDelete(row);

                        }
                    }}
                    disabled={isUpdating || isBulkUpdating}
                />
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
                pageSizeOptions={[5, 10, 20, 50]}
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
                        aliases={aliases}
                    />
                }
            />
        </div>
    );
};

export default AgeFactorCvWeightageMaster;
