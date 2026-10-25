"use client";

import React, { startTransition } from "react";
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { MasterTable } from "@/components/common/MasterTable";
import { Option } from "@/components/common/select";
import { UpdateButton, SaveButton, EditButton, DeleteButton, ClearButton } from "@/components/common/ActionButtons";
import { ToastContainer } from "@/components/common/Toast";
import { NatureFactorCVMaster as NatureFactorCVMasterType } from "@/types/natureofbuilding-cv-weightageMaster.types";
import { useNatureFactorCv } from "@/hooks/weightageMaster/natureFactorCv/useNatureFactorCv";
import { getNatureFactorCvColumns } from "./natureFactorCvColumns";
import { NatureFactorCvHeaderExtra } from "./NatureFactorCvHeaderExtra";
import { useNatureFactorCVWeightageMasterDeleteHandler } from "@/hooks/weightageMaster/natureFactorCv/useNatureFactorDeleteHandler";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider"; 



interface NatureFactorCVMasterProps {
    data: NatureFactorCVMasterType[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    assessmentYearOptions: Option[];
    constructionTypeOptions: Option[];
    sortBy?: string;
    sortOrder?: string;
}

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
    const router = useRouter();
    const locale = useLocale();
    const { confirm } = useConfirm();

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

    const aliasAssessment = useAliasLabel("Assessment", t("defaults.assessment") || "Assessment");
    const aliasConstructionType = useAliasLabel("Construction_Type", t("defaults.constructionType") || "Construction Type");
    const aliases = {
        assessment: aliasAssessment,
        constructionType: aliasConstructionType
    };

    const columns = getNatureFactorCvColumns({
        t, tW, tCommon, editableRows, getRowUid, handleCellChange,
        sortBy: activeSortBy, sortOrder: activeSortOrder, onSort: handleSort, aliases
    });

    const { handleDelete } = useNatureFactorCVWeightageMasterDeleteHandler({
        t,
        tCommon,
        confirm,
        startTransition,
        aliases,
    });

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
                        } else {
                            router.push(`/${locale}/property-tax/weightage-master/nature-weightage/edit/${row.id}`);
                        }
                    }}
                    disabled={isUpdating || isBulkUpdating}
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
                    disabled={isUpdating || isBulkUpdating}
                />
                <ClearButton
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
                pageSizeOptions={[5, 10, 20, 50]}
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
                        aliases={aliases}
                    />
                }
            />
        </div>
    );
};

export default NatureFactorCVMaster;