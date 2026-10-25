"use client";

import { Settings, Info, FolderKanban } from "lucide-react";
import { useTranslations } from "next-intl";
import { Drawer } from "@/components/common/Drawer";
import { cn } from "@/lib/utils/cn";
import { Checkbox } from "@/components/common/checkbox";
import { Card } from "@/components/common/Card";
import { SaveButton, CancelButton } from "@/components/common/ActionButtons";
import { SearchInput } from "@/components/common/SearchInput";
import { CardPagination } from "@/components/common/CardList";
import { Tooltip } from "@/components/common/Tooltip";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";
import { useConfigureRates } from "@/hooks/RVRateMaster/useConfigureRates";
import { GroupConfigurationCard } from "./GroupConfigurationCard";
import type { RateCategory } from "@/types/RVRateMaster";
import type { ITypeOfUseDetails } from "@/types/RVRateMaster";

interface ConfigureRatesDrawerProps {
  open: boolean;
  onClose: (savedAny: boolean) => void;
  isMatrixVisible?: boolean;
  currentCategories?: RateCategory[];
  onConfigureSelected?: (selectedTypes: ITypeOfUseDetails[]) => void;
  isOpenPlot?: boolean;
}

export function ConfigureRatesDrawer({
  open,
  onClose,
  isMatrixVisible = false,
  currentCategories = [],
  onConfigureSelected,
  isOpenPlot = false,
}: ConfigureRatesDrawerProps) {
  const t = useTranslations("ptis_RVRateMaster");
  const useLabel = useAliasLabel("Use", t("aliasFallback.use"));
  const typeOfUseLabel = useAliasLabel("Type_Of_Use", t("aliasFallback.typeOfUse"));

  const aliasLabels = {
    use: useLabel,
    typeOfUse: typeOfUseLabel,
  };

  const {
    allUseTypes,
    paginatedUseTypes,
    totalCount,
    totalPages,
    isListLoading,
    existingGroups,
    isLoading,
    checkedIds,
    groupForms,
    savedAny,
    searchTerm,
    setSearchTerm,
    pageNumber,
    setPageNumber,
    pageSize,
    setPageSize,
    handleCheckboxChange,
    handleSelectExistingGroup,
    handleToggleMode,
    handleFieldChange,
    handleSaveGroup,
    handleConfigureClick,
  } = useConfigureRates({
    open,
    isMatrixVisible,
    currentCategories,
    onConfigureSelected,
    t,
    isOpenPlot,
  });

  const safePageNumber = Math.min(pageNumber, Math.max(1, totalPages));

  return (
    <div className="open-plot-config-drawer-wrapper">
      {open && (
        <style dangerouslySetInnerHTML={{
          __html: `
          .open-plot-config-drawer-wrapper div.fixed.inset-0 {
            z-index: 200 !important;
          }
          .open-plot-config-drawer-wrapper div.drawer-instance {
            z-index: 210 !important;
          }
        `}} />
      )}
      <Drawer
        open={open}
        onClose={() => onClose(savedAny)}
        title={
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md text-white">
              <Settings size={20} />
            </div>
            <div>
              <div className="text-lg font-bold text-blue-900">
                {t('configureRates.title', aliasLabels)}
              </div>
              <div className="text-xs text-slate-500">
                {t('configureRates.description', aliasLabels)}
              </div>
            </div>
          </div>
        }
        width="xl"
        footer={
          <div className="flex gap-3">
            <SaveButton
              label={t('configureRates.saveButton')}
              size="md"
              onClick={handleConfigureClick}
              className="cursor-pointer"
            />
            <CancelButton
              label={t('configureRates.closeButton')}
              size="md"
              onClick={() => onClose(savedAny)}
              className="cursor-pointer"
            />
          </div>
        }
      >
        {isLoading ? (
          <div className="p-10 text-center text-slate-500">
            <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-blue-600 rounded-full mb-3" />
            <p className="text-sm">{t('configureRates.loadingTypes', aliasLabels)}</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row h-[calc(100vh-140px)] divide-x divide-slate-200">
            {/* LEFT SIDE: List of TypeOfUse */}
            <div className="md:w-1/3 p-4 flex flex-col h-full bg-slate-50/40 border-r border-slate-200">
              <div className="flex items-center justify-between border-b pb-3 mb-3 flex-shrink-0">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                  <Info size={16} className="text-blue-500 animate-pulse" />
                  {t('configureRates.selectTypesOfUse', aliasLabels)}
                </h2>
                <SearchInput
                  className="mb-0 w-44 shadow-xs"
                  value={searchTerm}
                  onChange={(val) => {
                    setSearchTerm(val);
                    setPageNumber(1);
                  }}
                  placeholder={t('configureRates.searchPlaceholder')}
                />
              </div>

              <div className={cn("flex-1 overflow-y-auto pr-1 space-y-2.5 mb-3 transition-opacity duration-200", isListLoading && "opacity-50")}>
                {paginatedUseTypes.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-sm font-sans">
                    {t('configureRates.noTypesFound', aliasLabels)}
                  </div>
                ) : (
                  paginatedUseTypes.map((tu) => {
                    const isChecked = !!checkedIds[tu.id];
                    const isOP = tu.typeOfUseCode === 'OP';
                    return (
                      <Card
                        key={tu.id}
                        onClick={() => !isOP && handleCheckboxChange(tu.id)}
                        padding="sm"
                        className={cn(
                          "relative flex items-start justify-between gap-3 duration-300 transition-all select-none border border-l-4 hover:-translate-y-0.5",
                          isOP
                            ? "cursor-default opacity-75 border-slate-200 border-l-slate-400 bg-slate-50/50"
                            : "cursor-pointer hover:border-l-blue-500 hover:shadow-xs",
                          isChecked
                            ? "bg-gradient-to-r from-blue-50/50 to-indigo-50/10 border-blue-400 border-l-blue-600 shadow-[0_2px_8px_rgba(37,99,235,0.06)]"
                            : "bg-white border-[#DCEAFF] border-l-slate-300"
                        )}
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => { }}
                            disabled={isOP}
                            className={`mt-0.5 ${isChecked ? "bg-blue-600 border-blue-600 text-white" : "border-[#DCEAFF] hover:border-blue-400"}`}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-slate-900 font-sans">
                              {tu.typeOfUseCode}
                            </div>
                            <div className="text-xs text-slate-500 font-sans leading-normal break-words break-all">
                              {tu.description}
                            </div>
                          </div>
                        </div>
                        {tu.typeOfUseGroupCode && (
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            {tu.groupName ? (
                              <Tooltip content={tu.groupName} placement="top">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100/70 shadow-xs font-sans cursor-help">
                                  <FolderKanban size={12} className="text-blue-500" />
                                  {t('configureRates.groupLabel', { groupCode: tu.typeOfUseGroupCode, ...aliasLabels })}
                                </span>
                              </Tooltip>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100/70 shadow-xs font-sans">
                                <FolderKanban size={12} className="text-blue-500" />
                                {t('configureRates.groupLabel', { groupCode: tu.typeOfUseGroupCode, ...aliasLabels })}
                              </span>
                            )}
                            {tu.groupName && (
                              <Tooltip content={tu.groupName} placement="top">
                                <span className="text-[10px] font-medium text-slate-400 max-w-[90px] truncate font-sans cursor-help">
                                  {tu.groupName}
                                </span>
                              </Tooltip>
                            )}
                          </div>
                        )}
                      </Card>
                    );
                  })
                )}
              </div>

              <div className="flex-shrink-0 pt-2 border-t border-slate-100">
                <CardPagination
                  pageNumber={safePageNumber}
                  pageSize={pageSize}
                  totalCount={totalCount}
                  totalPages={totalPages}
                  onPageChange={setPageNumber}
                  onPageSizeChange={setPageSize}
                  pageSizeOptions={[5, 10, 20, 50]}
                  className="rounded-none shadow-none border-none px-0 flex-col md:flex-col items-center md:items-center gap-2"
                />
              </div>
            </div>

            {/* RIGHT SIDE: Configurations for checked items */}
            <div className="md:w-2/3 p-5 space-y-4 overflow-y-auto h-full bg-slate-50/50">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b pb-3 mb-3 flex-shrink-0">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-sans flex-shrink-0">
                  <Settings size={16} className="text-blue-500 animate-spin-slow" />
                  {t('configureRates.configureUseGroups', aliasLabels)}
                </h2>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-blue-700 bg-blue-50/70 border border-blue-100/60 rounded-lg px-2.5 py-1 font-medium font-sans xl:max-w-2xl">
                  <Info size={14} className="text-blue-500 flex-shrink-0" />
                  <span className="leading-tight">
                    {t.rich('configureRates.infoTip', {
                      btn1: (chunks) => <strong>{chunks}</strong>,
                      btn2: (chunks) => <strong>{chunks}</strong>,
                      ...aliasLabels,
                    })}
                  </span>
                </div>
              </div>

              {Object.keys(checkedIds).filter(id => checkedIds[Number(id)]).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400/80 bg-white border border-[#DCEAFF] rounded-xl shadow-xs">
                  <div className="flex h-16 w-16 items-center justify-center bg-blue-50/50 rounded-full mb-3 border border-blue-100/50 shadow-xs">
                    <Settings size={32} className="stroke-[1.5] text-blue-400/80 animate-[spin_8s_linear_infinite]" />
                  </div>
                  <p className="text-sm font-medium font-sans text-slate-500">{t('configureRates.noTypeSelected', aliasLabels)}</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {allUseTypes
                    .filter((tu) => checkedIds[tu.id])
                    .map((tu) => (
                      <GroupConfigurationCard
                        key={tu.id}
                        typeofuse={tu}
                        form={groupForms[tu.id]}
                        existingGroups={existingGroups}
                        handleSelectExistingGroup={handleSelectExistingGroup}
                        handleToggleMode={handleToggleMode}
                        handleFieldChange={handleFieldChange}
                        handleSaveGroup={handleSaveGroup}
                        t={t}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
