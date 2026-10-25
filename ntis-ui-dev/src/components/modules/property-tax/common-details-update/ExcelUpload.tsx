import { Upload, CheckCircle2, HelpCircle } from "lucide-react";
import { Button, Badge, Checkbox, Input, Label, Tooltip, useToast } from "@/components/common";
import { SearchSelectPaginated } from "@/components/common/SearchSelectPaginated";
import { BulkUpdateMaster, CommonDetailsUpdateActions } from "@/types/common-details-update/common-details-update.types";
import { Modal } from "@/components/common/Modal";
import { useTranslations } from "next-intl";
import { PropertySelectionCriteria } from "./PropertySelectionCriteria";
import { ExcelUploadTable } from "./ExcelUploadTable";
import { RemarksConfirmationModal } from "./RemarksConfirmationModal";
import { DownloadButton, UploadButton } from "@/components/common/ActionButtons";
import { useExcelUpload } from "@/hooks/commonDetailsUpdate/useExcelUpload";

interface ExcelUploadProps {
  initialExcelTemplateFields?: BulkUpdateMaster[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateData?: any;
  actions?: Partial<CommonDetailsUpdateActions>;
  locale?: string;
}

export const ExcelUpload = ({ updateData, actions, locale = "en" }: ExcelUploadProps) => {
  const t = useTranslations("commonDetailsUpdate");
  const toast = useToast();

  const {
    downloading,
    downloadWithData,
    setDownloadWithData,
    uploading,
    isGuidelineOpen,
    setIsGuidelineOpen,
    selectedFile,
    validationData,
    setValidationData,
    showRemarkModal,
    setShowRemarkModal,
    fileInputRef,
    handleDownloadTemplate,
    handleFileChange,
    handleValidateExcel,
    handleConfirmUpload,
    groupOptions,
    loadingGroups,
    loadGroupOptions,
  } = useExcelUpload({ updateData, actions, locale });

  const handleToggleDownloadWithData = (targetChecked?: boolean) => {
    const nextVal = targetChecked !== undefined ? targetChecked : !downloadWithData;
    if (nextVal) {
      const isGroupSelected = Boolean(updateData?.selectedCode);
      if (!isGroupSelected) {
        toast.error(t("excelUpload.validations.selectFieldFirst"));
        return;
      }
    }
    setDownloadWithData(nextVal);
  };

  return (
    <div className="flex flex-col space-y-2 h-full border border-blue-200 rounded-xl bg-white overflow-hidden">
      {/* Top Header */}
      <div className="bg-[#F8FAFF] px-4 py-3 border-b border-blue-200 flex justify-between items-center mb-0">
        <div>
          <h3 className="text-sm font-semibold text-[#1E3A8A]">{t("excelUpload.title")}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {t("excelUpload.subtitle")}
          </p>
        </div>
        <Badge
          variant="success"
          icon={Upload}
          className="bg-green-50 text-green-800 border-green-200 font-bold"
        >
          {t("excelUpload.bulkUploadBadge")}
        </Badge>
      </div>

      <div className="space-y-2">
        {updateData && (
          <div className="border border-blue-200 rounded-xl bg-white overflow-visible mb-2 m-2">
            {/* Header & Guidelines */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-blue-200 bg-[#F8FAFF] rounded-t-xl">
              <div>
                <h3 className="text-sm font-semibold text-[#1E3A8A]">
                  {t("excelUpload.actionSectionTitle")}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t("excelUpload.actionSectionDesc")}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon={HelpCircle}
                onClick={() => setIsGuidelineOpen(true)}
                className="text-slate-700 bg-amber-50 border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-colors [&>svg]:text-amber-500 font-bold"
              >
                {t("excelUpload.viewGuidelinesBtn")}
              </Button>
            </div>

            {/* Action Bar: 1. Enabled Group List -> 2. Download With Data -> 3. Download Template -> 4. Upload Excel -> 5. Validate Excel */}
            <div className="p-3 relative">
              <div className="flex flex-wrap items-end gap-3.5 relative z-30">
                {/* 1. Enabled Group List Dropdown */}
                <div className="flex-1 min-w-[220px] max-w-[300px] relative z-40 [&_ul]:!max-h-[240px] [&_[role=listbox]]:!max-h-[240px]">
                  <div className="h-[20px] flex items-center mb-1.5">
                    <Label className="text-xs font-semibold text-slate-700 truncate" title={t("fieldList.title")}>
                      {t("fieldList.title")}
                    </Label>
                  </div>
                  <SearchSelectPaginated
                    options={groupOptions}
                    value={updateData.selectedCode || ""}
                    onChange={(_, val) => {
                      setValidationData(null);
                      updateData.handleMenuSelect(val, false);
                    }}
                    placeholder={t("fieldList.selectFieldPlaceholder")}
                    noOptionsPlaceholder={t("fieldList.selectFieldPlaceholder")}
                    onInputFocus={() => {
                      loadGroupOptions();
                    }}
                    isLoading={loadingGroups}
                    className="w-full h-[40px]"
                  />
                </div>

                {/* 2. Download With Data */}
                <div
                  className="flex items-center gap-2 h-[40px] px-3 border border-blue-200 hover:border-blue-400 hover:bg-blue-100/60 rounded-lg bg-blue-50/40 shrink-0 transition-all duration-200 cursor-pointer shadow-sm"
                  onClick={() => handleToggleDownloadWithData()}
                >
                  <Checkbox
                    checked={downloadWithData}
                    className="border-blue-300 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white cursor-pointer"
                    onCheckedChange={(checked) => {
                      handleToggleDownloadWithData(Boolean(checked));
                    }}
                    id="downloadWithData"
                  />
                  <Label
                    htmlFor="downloadWithData"
                    className="text-xs sm:text-sm font-medium cursor-pointer whitespace-nowrap text-slate-700 select-none"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggleDownloadWithData();
                    }}
                  >
                    {t("excelUpload.downloadWithData")}
                  </Label>
                </div>

                {/* 3. Download Template */}
                <DownloadButton
                  size="md"
                  onClick={handleDownloadTemplate}
                  disabled={downloading}
                  isLoading={downloading}
                  label={
                    downloadWithData
                      ? (t("excelUpload.downloadExcelWithDataBtn"))
                      : t("excelUpload.downloadTemplateBtn")
                  }
                  className="!bg-white !border !border-blue-300 hover:!border-blue-500 !text-[#0F5FC2] hover:!bg-blue-50 font-semibold h-[40px] shrink-0 transition-all duration-300 ease-out whitespace-nowrap shadow-sm"
                />

                {/* 4. Upload Excel (Choose Excel File to Upload Excel) */}
                <div className="flex items-center border border-dashed border-blue-300 hover:border-blue-500 rounded-lg p-1 bg-blue-50/40 hover:bg-blue-50/80 h-[40px] overflow-hidden max-w-[250px] shrink-0 transition-all duration-200">
                  <UploadButton
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    label={t("excelUpload.chooseExcelFileBtn")}
                    className="!bg-white !text-blue-700 !border !border-blue-300 hover:!border-blue-500 hover:!bg-blue-50 hover:!text-blue-800 font-medium shrink-0 whitespace-nowrap mr-2 h-full text-xs transition-all duration-200 shadow-sm"
                  />
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <Tooltip
                      content={selectedFile ? selectedFile.name : t("excelUpload.noFileChosen")}
                      placement="top"
                    >
                      <span className="text-xs text-slate-600 truncate font-medium block cursor-default">
                        {selectedFile ? selectedFile.name : t("excelUpload.noFileChosen")}
                      </span>
                    </Tooltip>
                  </div>
                  <Input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".xlsx, .xls"
                    className="hidden"
                  />
                </div>

                {/* 5. Validate Excel */}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleValidateExcel}
                  disabled={uploading || !selectedFile}
                  isLoading={uploading}
                  icon={CheckCircle2}
                  className="h-[40px] px-4 shadow-sm font-bold shrink-0"
                >
                  {t("excelUpload.validateExcelBtn")}
                </Button>
              </div>

              {/* Next Row: Criteria Fields (Only when Download With Data is selected) */}
              <div
                className={`grid transition-all duration-300 ease-out relative z-10 ${
                  downloadWithData
                    ? "grid-rows-[1fr] opacity-100 mt-3 pt-3 border-t border-blue-100 p-2.5 overflow-visible"
                    : "grid-rows-[0fr] opacity-0 mt-0 pt-0 border-t-0 p-0 pointer-events-none overflow-hidden"
                }`}
              >
                <div className="min-h-0 overflow-visible">
                  <PropertySelectionCriteria
                    key={updateData.resetKey}
                    t={t}
                    selectedScopeId={updateData.selectedScopeId}
                    handleScopeChange={updateData.handleScopeChange}
                    scopeOptions={updateData.scopeOptions}
                    loadingScopeOptions={updateData.loadingScopeOptions}
                    activeScopeDetails={updateData.activeScopeDetails}
                    filterValues={updateData.filterValues}
                    setFilterValues={updateData.setFilterValues}
                    handleZoneChange={updateData.handleZoneChange}
                    zoneOptions={updateData.zoneOptions}
                    handleWardChange={updateData.handleWardChange}
                    wardOptions={updateData.wardOptions}
                    propertyTypeOptions={updateData.propertyTypeOptions}
                    propertyOptions={updateData.propertyOptions}
                    fromPropertyOptions={updateData.fromPropertyOptions}
                    toPropertyOptions={updateData.toPropertyOptions}
                    handlePropertyDropdownFocus={updateData.handlePropertyDropdownFocus}
                    handleFromPropertyChange={updateData.handleFromPropertyChange}
                    handleToPropertyChange={updateData.handleToPropertyChange}
                    loadingPropertyOptions={updateData.loadingPropertyOptions}
                    isPropertyDropdownDisabled={!updateData.filterValues.wardId}
                    filterSubmitted={updateData.filterSubmitted}
                    loadingShowProperties={updateData.loadingShowProperties}
                    canShowProperties={updateData.canShowProperties}
                    handleShowProperties={updateData.handleShowProperties}
                    handleFilterCancel={updateData.handleBack}
                    hasAnyFilterValue={updateData.hasAnyFilterValue}
                    hasMore={updateData.propertyDropdownHasMore}
                    onLoadMore={updateData.handleLoadMorePropertyOptions}
                    isLoadingMore={updateData.loadingMorePropertyOptions}
                    propertySearchTerm={updateData.propertySearchTerm}
                    onPropertySearchChange={updateData.handlePropertyDropdownSearch}
                    fromHasMore={updateData.fromPropertyDropdownHasMore}
                    onFromLoadMore={updateData.handleLoadMoreFromPropertyOptions}
                    isFromLoadingMore={updateData.loadingMoreFromPropertyOptions}
                    fromPropertySearchTerm={updateData.fromPropertySearchTerm}
                    onFromPropertySearchChange={updateData.handleFromPropertyDropdownSearch}
                    loadingFromPropertyOptions={updateData.loadingFromPropertyOptions}
                    toHasMore={updateData.toPropertyDropdownHasMore}
                    onToLoadMore={updateData.handleLoadMoreToPropertyOptions}
                    isToLoadingMore={updateData.loadingMoreToPropertyOptions}
                    toPropertySearchTerm={updateData.toPropertySearchTerm}
                    onToPropertySearchChange={updateData.handleToPropertyDropdownSearch}
                    loadingToPropertyOptions={updateData.loadingToPropertyOptions}
                    hideActionButtons={true}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full-width Excel Table & Summary */}
        {updateData && (
          <div className="flex flex-col min-h-0 m-2">
            <div className="flex flex-col min-h-0 h-full overflow-hidden transition-all duration-300 flex-1 w-full">
              <ExcelUploadTable t={t} validationData={validationData} />
            </div>
          </div>
        )}
      </div>

      <Modal
        open={isGuidelineOpen}
        onClose={() => setIsGuidelineOpen(false)}
        title={t("excelUpload.guidelineModalTitle")}
      >
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-700">
            {t("excelUpload.guidelineModalIntro")}
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
            <li>
              <span className="font-semibold text-gray-800">{t("excelUpload.downloadEmptyTitle")}</span> {t("excelUpload.downloadEmptyDesc")}
            </li>
            <li>
              <span className="font-semibold text-gray-800">{t("excelUpload.downloadDataTitle")}</span> {t("excelUpload.downloadDataDesc")}
            </li>
            <li>
              <span className="font-semibold text-gray-800">{t("excelUpload.selectCorrectGroupTitle")}</span> {t("excelUpload.selectCorrectGroupDesc")}
            </li>
            <li>
              <span className="font-semibold text-gray-800">{t("excelUpload.reuploadTitle")}</span> {t("excelUpload.reuploadDesc")}
            </li>
          </ul>
          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              onClick={() => setIsGuidelineOpen(false)}
              className="px-6 gap-2"
              icon={CheckCircle2}
            >
              {t("excelUpload.okButton")}
            </Button>
          </div>
        </div>
      </Modal>

      <RemarksConfirmationModal
        open={showRemarkModal}
        onClose={() => setShowRemarkModal(false)}
        onConfirm={handleConfirmUpload}
        t={t}
      />
    </div>
  );
};
