'use client';

import { Drawer } from "@/components/common/Drawer";
import { CancelButton, UploadButton, Option } from "@/components/common";
import { MoveUp, MoveDown } from "lucide-react";
import { Tabs } from "@/components/common/Tabs";
import { UploadTab } from './UploadTab';
import { DownloadTab } from './DownloadTab';
import { CategoryOption, ImportMatchPreviewResult, BrowseMatchPreviewResult } from '@/types/PropertyMedia/PropertyMedia.types';
import { useUploadDownload } from '@/hooks/PropertyMedia/uploadDownload';
import { categoryIcons } from "@/lib/constants/propertyMedia.constants";
import { mapSubCategoryToOptions, mapPropertyNumbersToOptions } from "@/lib/utils/PropertyMedia/propertyMediaHelper";
import { UploadFooterCounts } from './UploadCountCard';

export interface UploadDownloadContainerProps {
    categoryOptions: CategoryOption[];
    subCategoryOptions?: CategoryOption[];
    previewData?: ImportMatchPreviewResult | null;
    devicePreviewData?: BrowseMatchPreviewResult | null;
    zoneOptions?: Option[];
    wardOptions?: Option[];
}

export function UploadDownloadContainer({
    categoryOptions,
    subCategoryOptions,
    previewData,
    devicePreviewData,
    zoneOptions,
    wardOptions,
}: UploadDownloadContainerProps) {
    const {
        open,
        activeTab,
        setActiveTab,
        uploadSourceTab,
        setUploadSourceTab,
        isUploadingLocal,
        handleLocalUpload,
        formData,
        errors,
        showError,
        handleFilterZoneChange,
        handleFilterWardsChange,
        propertyFromOptions,
        propertyToOptions,
        isLoadingPropertyFrom,
        isLoadingPropertyTo,
        handleFilterPropertyFromChange,
        handleFilterPropertyToChange,
        handleUploadFieldChange,
        handleDownloadFieldChange,
        handleBlur,
        handleSubmit,
        handleCancel,
        isSubmitting,
        isPending,
        fileInputRef,
        fileDisplayValue,
        handleBrowseClick,
        handleFileInputChange,
        handleClearFiles,
        previewId,
        handlePageChange,
        handlePageSizeChange,
        t,
        tCommon
    } = useUploadDownload({ categoryOptions });

    const activePreview = uploadSourceTab === 'device' ? devicePreviewData : previewData;
    const hasDevicePreview = Boolean(previewId) || Boolean(devicePreviewData?.items?.length);
    const hasServerPreview = Boolean(formData.upload.subCategory);
    const shouldShowPreview =
        (uploadSourceTab === 'server' && hasServerPreview) ||
        (uploadSourceTab === 'device' && hasDevicePreview);

    const totalMatched = activePreview?.totalMatched;
    const isMatchedCountInvalid =
        totalMatched === null ||
        totalMatched === undefined ||
        isNaN(Number(totalMatched)) ||
        Number(totalMatched) <= 0;

    const isUploadDisabled =
        activeTab === 'download' ? false : !shouldShowPreview || isMatchedCountInvalid;

    const categoryOptionsConversion = (
        options?: CategoryOption[] | null
    ): Option[] => {
        return (
            options?.map((option) => {
                const Icon =
                    categoryIcons[
                    option.id as keyof typeof categoryIcons
                    ];

                return {
                    value: String(option.id),
                    label: option.name,
                    icon: Icon ? <Icon className="h-4 w-4" /> : undefined,
                };
            }) ?? []
        );
    };


    return (
        <Drawer
            open={open}
            onClose={handleCancel}
            width="lg"
            title={
                <div className="flex flex-col py-1">
                    <h2 className="text-[#173a67] text-[19px] font-bold leading-tight">
                        {t("uploadDownloadDrawer.title")}
                    </h2>
                </div>
            }
            footer={
                <div className="flex w-full items-center justify-between gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        {activeTab === 'upload' && shouldShowPreview && activePreview && (
                            <UploadFooterCounts
                                totalMatched={activePreview.totalMatched ?? 0}
                                totalUnmatched={activePreview.totalUnmatched ?? 0}
                                t={t}
                            />
                        )}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
                        <CancelButton
                            label={tCommon("buttons.cancel")}
                            onClick={handleCancel}
                            size="sm"
                            className="text-xs sm:text-sm px-3 sm:px-4"
                        />
                        <UploadButton
                            label={activeTab === 'download' ? t("uploadDownloadDrawer.downloadButton") : t("uploadDownloadDrawer.uploadButton")}
                            type="submit"
                            form="uploadDownloadForm"
                            disabled={isUploadDisabled}
                            size="sm"
                            isLoading={isSubmitting}
                            className="text-xs sm:text-sm px-3 sm:px-4"
                        />
                    </div>
                </div>
            }
        >
            <form id="uploadDownloadForm" onSubmit={handleSubmit} className="flex flex-col h-full">
                {/* Content with Responsive Tabs */}
                <div className="p-2.5 sm:p-4 md:p-5 flex-1">
                    <Tabs
                        value={activeTab}
                        onChange={(val) => setActiveTab(val as 'upload' | 'download')}
                        defaultValue="upload"
                        variant="pills"
                        fullWidth
                        activeTabClassName="!bg-white !text-[#185FB8] !shadow-xs !font-bold"
                    >
                        <Tabs.TabList
                            className="
                                bg-[#EDF4FC]
                                border border-[#D5E4F5]
                                rounded-xl sm:rounded-2xl
                                p-1 sm:p-1.5
                                gap-1 sm:gap-1.5
                                shadow-2xs
                            "
                        >
                            <Tabs.Tab
                                value="upload"
                                icon={MoveUp}
                                className="justify-center rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm py-1.5 sm:py-2.5 text-[#4F6A94] hover:text-[#173A67] hover:bg-white/40 transition-all"
                            >
                                {t("uploadDownloadDrawer.uploadTab")}
                            </Tabs.Tab>

                            <Tabs.Tab
                                value="download"
                                icon={MoveDown}
                                className="justify-center rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm py-1.5 sm:py-2.5 text-[#4F6A94] hover:text-[#173A67] hover:bg-white/40 transition-all"
                            >
                                {t("uploadDownloadDrawer.downloadTab")}
                            </Tabs.Tab>
                        </Tabs.TabList>

                        <Tabs.TabPanel value="upload">
                            <div className="pt-2.5 sm:pt-3.5 text-xs sm:text-sm text-[#173A67] font-medium">
                                <UploadTab
                                    categoryOptions={categoryOptionsConversion(categoryOptions)}
                                    subCategoryOptions={mapSubCategoryToOptions(subCategoryOptions)}
                                    formData={formData.upload}
                                    activePreview={activePreview}
                                    shouldShowTable={shouldShowPreview}
                                    loading={isPending}
                                    uploadSourceTab={uploadSourceTab}
                                    onUploadSourceTabChange={setUploadSourceTab}
                                    isUploadingLocal={isUploadingLocal}
                                    handleLocalUpload={handleLocalUpload}
                                    fileInputRef={fileInputRef}
                                    fileDisplayValue={fileDisplayValue}
                                    handleBrowseClick={handleBrowseClick}
                                    handleFileInputChange={handleFileInputChange}
                                    handleClearFiles={handleClearFiles}
                                    onChange={handleUploadFieldChange}
                                    onBlur={handleBlur}
                                    onPageChange={handlePageChange}
                                    onPageSizeChange={handlePageSizeChange}
                                    errors={errors}
                                    showError={showError}
                                    t={t}
                                    tCommon={tCommon}
                                />
                            </div>
                        </Tabs.TabPanel>

                        <Tabs.TabPanel value="download">
                            <div className="pt-2.5 sm:pt-3.5 text-xs sm:text-sm text-[#173A67] font-medium">
                                <DownloadTab
                                    categoryOptions={categoryOptionsConversion(categoryOptions)}
                                    subCategoryOptions={mapSubCategoryToOptions(subCategoryOptions)}
                                    zoneOptions={zoneOptions}
                                    wardOptions={wardOptions}
                                    propertyFromOptions={mapPropertyNumbersToOptions(propertyFromOptions)}
                                    propertyToOptions={mapPropertyNumbersToOptions(propertyToOptions)}
                                    isLoadingPropertyFrom={isLoadingPropertyFrom}
                                    isLoadingPropertyTo={isLoadingPropertyTo}
                                    formData={formData.download}
                                    onChange={handleDownloadFieldChange}
                                    onZoneChange={handleFilterZoneChange}
                                    onWardsChange={handleFilterWardsChange}
                                    onPropertyFromChange={handleFilterPropertyFromChange}
                                    onPropertyToChange={handleFilterPropertyToChange}
                                    onBlur={handleBlur}
                                    errors={errors}
                                    showError={showError}
                                    t={t}
                                    tCommon={tCommon}
                                />
                            </div>
                        </Tabs.TabPanel>
                    </Tabs>
                </div>
            </form>
        </Drawer>
    );
}