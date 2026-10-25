"use client";

import React from "react";
import { ShieldAlert } from "lucide-react";
import {
  LockButton,
  UnlockButton,
  SearchButton,
  Card,
  WaitingWindow,
  useToast,
} from "@/components/common";
import TableHeader from "@/components/common/TableHeader";
import { MasterTable } from "@/components/common/MasterTable";
import { SearchInput } from "@/components/common/SearchInput";
import { WardItem } from "@/types/wardMaster.types";
import { LockedScreen, LockUnlockPropertyItem, ModuleItem, SEARCH_CATEGORY } from "@/types/lockunlock.types";
import { useSearchParams } from "next/navigation";
import { PaginationState } from "@/hooks/lockunlock/useLockUnlockMaster";
import { useLockUnlockExcel } from "@/hooks/lockunlock/useLockUnlockExcel";
import { TableModal } from "./TableModal";
import { useTranslations } from "next-intl";
import { PropertySelectionCard } from "./PropertySelectionCard";
import { ScreenSelectionCard } from "./ScreenSelectionCard";
import { ScopeSelectionCard } from "./ScopeSelectionCard";
import { ZoneItem } from "@/types/zoneMaster.types";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

export interface LockUnlockMasterProps {
  zones?: ZoneItem[];
  wards: WardItem[];
  dropdownProperties?: { label: string; value: string; propertyNo?: string; partitionNo?: string; }[];
  screens?: LockedScreen[];
  modules?: ModuleItem[];
  initialProperties?: LockUnlockPropertyItem[];
  initialPagination?: PaginationState;
}

export default function LockUnlockMaster({
  zones = [],
  wards,
  dropdownProperties = [],
  screens = [],
  modules = [],
  initialProperties = [],
  initialPagination,
}: LockUnlockMasterProps): React.ReactElement {
  const searchParams = useSearchParams();
  const t = useTranslations("lockUnlock");
  const toast = useToast();
  const wardAlias = useAliasLabel("Ward", t("defaults.ward"));
  const partitionAlias = useAliasLabel("Partition", t("defaults.partition"));
  const propertyNoAlias = useAliasLabel("Property_No", useAliasLabel("Property No.", useAliasLabel("Property No", t("defaults.propertyNo"))));

  const {
    formData,
    selectedScreenIds,
    setSelectedScreenIds,
    showResults,
    properties,
    selectedPropertyIds,
    isAllPropertiesSelected,
    editModal,
    setEditModal,
    isPending,
    propertyOptions,
    toPropertyOptions,
    isLoadingProperties,
    propertySearchTerm,
    isSearching,
    handlePropertySearch,
    handleSearchButtonClick,
    pagination,
    handleSelectChange,
    handleClearAll,
    handleShow,
    handleSaveIndividualLock,
    handleBulkAction,
    handlePageChange,
    handlePageSizeChange,
    columns,
    isActionPending,
    isShowPending,
    isExcelSearching,
    excelFile,
    setExcelFile,
    excelFileName,
    setExcelFileName,
    handleScopeChange,
  } = useLockUnlockExcel({
    wardIdFromUrl: searchParams.get("wardId") || "",
    screens,
    dropdownProperties,
    initialProperties,
    initialPagination,
  });

  // Map Wards to options format for SearchSelect
  const wardOptions = (wards || []).map((w) => ({
    label: w.wardNo,
    value: String(w.id),
  }));

  // Map Zones to options format
  const zoneOptions = (zones || []).map((z) => ({
    label: z.zoneNo,
    value: String(z.id),
  }));

  return (
    <div className="space-y-2">
      <WaitingWindow
        isOpen={isActionPending}
        title={t("messages.processingTitle", { defaultValue: "Processing Request" })}
        message={t("messages.processingMessage", { defaultValue: "Please wait while the properties are being updated. This may take a few moments..." })}
      />
      <TableHeader
        title={t("title")}
        subtitle={t("subtitle")}
        icon={ShieldAlert}
      />

      <div className="grid grid-cols-12 gap-2 items-stretch">
        {/* Left Panel */}
        <div className="col-span-5 flex flex-col gap-2 h-full">
          <Card className="rounded-xl shadow-lg border border-[#1A86E8]/20 overflow-visible h-full flex flex-col pb-2 pt-4 px-4 bg-white">
            <ScopeSelectionCard
              selectedCategory={formData.searchCategory}
              onChange={handleScopeChange}
            />
            <div className="h-px bg-slate-200 w-full my-2" />
            <PropertySelectionCard
              formData={formData}
              handleSelectChange={handleSelectChange}
              zoneOptions={zoneOptions}
              wardOptions={wardOptions}
              propertyOptions={propertyOptions}
              toPropertyOptions={toPropertyOptions}
              handleShow={() => handleShow(true)}
              handleClearAll={handleClearAll}
              isPending={formData.searchCategory === SEARCH_CATEGORY.EXCEL ? isExcelSearching : isShowPending}
              isLoadingProperties={isLoadingProperties}
              excelFile={excelFile}
              setExcelFile={setExcelFile}
              excelFileName={excelFileName}
              setExcelFileName={setExcelFileName}
            />
            <div className="h-px bg-slate-200 w-full my-2" />
            <ScreenSelectionCard
              screens={screens}
              modules={modules}
              selectedScreenIds={selectedScreenIds}
              setSelectedScreenIds={setSelectedScreenIds}
            />
          </Card>
        </div>

        {/* Right Panel */}
        <div className="col-span-7 flex h-full">
          <div className="flex-1">
            <div className="h-full animate-in fade-in slide-in-bottom-up-2 duration-200">
              <MasterTable<LockUnlockPropertyItem>
                columns={columns}
                data={properties}
                loading={isPending || isShowPending || isSearching}
                height="md"
                getRowKey={(row) => row.propertyId}
                pageNumber={pagination.pageNumber}
                pageSize={pagination.pageSize}
                totalCount={pagination.totalCount}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                paginationConfig={{
                  enabled: true,
                  showPageSizeSelector: true,
                }}
                pageSizeOptions={[5, 10, 20, 50, 100]}
                headerExtra={
                  <div className="flex flex-wrap items-center gap-3 w-full">
                    <SearchInput
                      value={propertySearchTerm}
                      onChange={handlePropertySearch}
                      placeholder={t(
                        "resultsTable.searchPropertyPlaceholder",
                        { propertyNo: propertyNoAlias, partition: partitionAlias }
                      )}
                      className="!mb-0"
                    />

                    <SearchButton
                      size="sm"
                      label={t("resultsTable.searchButton")}
                      onClick={handleSearchButtonClick}
                    />

                    <LockButton
                      size="sm"
                      label={t("resultsTable.lockButton")}
                      disabled={isPending}
                      className={
                        (!isAllPropertiesSelected && selectedPropertyIds.length === 0 && !(formData.searchCategory === 1 || formData.searchCategory === 2)) ||
                        (isAllPropertiesSelected && properties.length === 0) ||
                        selectedScreenIds.length === 0
                          ? "opacity-50 cursor-not-allowed hover:!bg-red-600 hover:!shadow-none active:!scale-100"
                          : ""
                      }
                      onClick={(e) => {
                        if (selectedScreenIds.length === 0) {
                          e.preventDefault();
                          toast.error(t("messages.selectScreenRequired"));
                          return;
                        }
                        const hasSelected = isAllPropertiesSelected
                          ? properties.length > 0
                          : selectedPropertyIds.length > 0 || (formData.searchCategory === 1 || formData.searchCategory === 2);
                        if (!hasSelected) {
                          e.preventDefault();
                          toast.error(t("messages.selectPropertyRequired"));
                          return;
                        }
                        handleBulkAction("lock");
                      }}
                    />

                    <UnlockButton
                      size="sm"
                      label={t("resultsTable.unlockButton")}
                      disabled={isPending}
                      className={
                        (!isAllPropertiesSelected && selectedPropertyIds.length === 0 && !(formData.searchCategory === 1 || formData.searchCategory === 2)) ||
                        (isAllPropertiesSelected && properties.length === 0) ||
                        selectedScreenIds.length === 0
                          ? "opacity-50 cursor-not-allowed hover:!bg-green-600 hover:!shadow-none active:!scale-100"
                          : ""
                      }
                      onClick={(e) => {
                        if (selectedScreenIds.length === 0) {
                          e.preventDefault();
                          toast.error(t("messages.selectScreenRequired"));
                          return;
                        }
                        const hasSelected = isAllPropertiesSelected
                          ? properties.length > 0
                          : selectedPropertyIds.length > 0 || (formData.searchCategory === 1 || formData.searchCategory === 2);
                        if (!hasSelected) {
                          e.preventDefault();
                          toast.error(t("messages.selectPropertyRequired"));
                          return;
                        }
                        handleBulkAction("unlock");
                      }}
                    />
                  </div>
                }
                emptyText={
                  showResults ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-8">
                      <p className="text-xs font-semibold text-slate-500">
                        {t("resultsTable.noResultsFound")}
                      </p>
                    </div>
                  ) as unknown as string : (
                    <div className="flex flex-col items-center justify-center gap-2 py-8">
                      <ShieldAlert className="w-8 h-8 text-slate-300" />
                      <p className="text-xs font-semibold text-slate-500">
                        {t("resultsTable.placeholderText", {
                          ward: wardAlias,
                        })}
                      </p>
                    </div>
                  ) as unknown as string
                }
              />
            </div>
          </div>
        </div>
      </div>

      <TableModal
        editModal={editModal}
        setEditModal={setEditModal}
        screens={screens}
        handleSaveIndividualLock={handleSaveIndividualLock}
        isPending={isPending}
      />
    </div>
  );
}