'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Select, SearchSelect, Option, Input, Button } from "@/components/common";
import { ValidationMessage } from '@/components/common';
import { Tabs } from '@/components/common/Tabs';
import { Folder, X, HardDrive, UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { UploadTable } from './UploadTable';
import { ImportMatchPreviewResult, BrowseMatchPreviewResult, UploadFormData } from '@/types/PropertyMedia/PropertyMedia.types';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

export interface UploadTabProps {
    categoryOptions: Option[];
    subCategoryOptions?: Option[];
    formData: UploadFormData;
    activePreview?: ImportMatchPreviewResult | BrowseMatchPreviewResult | null;
    shouldShowTable?: boolean;
    loading?: boolean;
    uploadSourceTab?: 'server' | 'device';
    onUploadSourceTabChange?: (tab: 'server' | 'device') => void;
    isUploadingLocal?: boolean;
    handleLocalUpload?: () => void;
    fileInputRef?: React.RefObject<HTMLInputElement | null>;
    fileDisplayValue?: string;
    handleBrowseClick?: () => void;
    handleFileInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleClearFiles?: () => void;
    onChange: (field: keyof UploadFormData, value: string) => void;
    onBlur: (field: string) => void;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    errors: Record<string, string>;
    showError: (field: string) => boolean;
    t: (key: string, values?: Record<string, string | number>) => string;
    tCommon?: (key: string) => string;
}

const FolderIcon = ({ className }: { className?: string }) => (
    <Folder className={cn("text-amber-500 fill-amber-400 shrink-0", className)} />
);

export function UploadTab({
    categoryOptions,
    subCategoryOptions,
    formData,
    activePreview,
    shouldShowTable = false,
    loading = false,
    uploadSourceTab = 'server',
    onUploadSourceTabChange,
    isUploadingLocal = false,
    handleLocalUpload,
    fileInputRef,
    fileDisplayValue = '',
    handleBrowseClick,
    handleFileInputChange,
    handleClearFiles,
    onChange,
    onBlur,
    onPageChange,
    onPageSizeChange,
    errors,
    showError,
    t,
}: UploadTabProps) {
    const categoryAlias = useAliasLabel("Category", t("uploadDownloadDrawer.categoryLabel"));
    const propertyNoAlias = useAliasLabel("Property_No", t("aliasFallback.propertyNo"));

    return (
        <div className="w-full space-y-3 sm:space-y-4">
            <Card
                variant="default"
                padding="none"
                className="w-full overflow-visible rounded-xl sm:rounded-2xl border border-[#d7e3f1] bg-white shadow-2xs"
            >
                {/* Header */}
                <CardHeader className="mb-0 rounded-t-xl sm:rounded-t-2xl border-b border-[#d7e3f1] bg-[#f4f8fc] px-3 sm:px-4 py-2 sm:py-2.5">
                    <CardTitle className="text-xs sm:text-sm font-bold text-[#1f4977]">
                        {t("uploadDownloadDrawer.chooseWhatToUpload")}
                    </CardTitle>
                </CardHeader>

                {/* Content */}
                <CardContent className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                        <div>
                            <Select
                                options={categoryOptions ?? []}
                                value={formData.category}
                                onChange={(_, val) => onChange('category', val)}
                                onBlur={() => onBlur('upload.category')}
                                placeholder={t("uploadDownloadDrawer.categoryPlaceholder")}
                                label={categoryAlias}
                            />
                            <ValidationMessage
                                message={errors['upload.category']}
                                visible={showError('upload.category')}
                            />
                        </div>
                        <div>
                            <SearchSelect
                                options={subCategoryOptions ?? []}
                                value={formData.subCategory}
                                onChange={(_, val) => onChange('subCategory', val)}
                                onBlur={() => onBlur('upload.subCategory')}
                                placeholder={t("uploadDownloadDrawer.subCategoryPlaceholder")}
                                label={t("uploadDownloadDrawer.photoSubtypeLabel")}
                                disabled={!formData.category}
                            />
                            <ValidationMessage
                                message={errors['upload.subCategory']}
                                visible={showError('upload.subCategory')}
                            />
                        </div>
                    </div>

                    <div className="rounded-lg bg-[#f1f3f6] border border-[#e2e8f0] px-3 py-2 text-[11px] sm:text-xs leading-4 sm:leading-5 text-[#666]">
                        <span className="font-semibold text-[#444]">{t("uploadDownloadDrawer.autoMapNotePrefix")}</span>{" "}
                        {t("uploadDownloadDrawer.autoMapNoteText", { propertyNo: propertyNoAlias })}
                    </div>
                    {uploadSourceTab === "device" &&

                        /* File Picker Control */
                        <div className="flex items-center gap-2 sm:gap-2.5 w-full">
                            <div className="flex-1 relative">
                                <Input
                                    readOnly
                                    value={fileDisplayValue}
                                    placeholder={t("uploadDownloadDrawer.noFilesSelected")}
                                    className={cn(
                                        "w-full h-9 sm:h-9.5 text-xs sm:text-sm bg-white border-[#d7e3f1] placeholder:text-slate-400 text-slate-700 cursor-pointer focus:ring-1 focus:ring-blue-400 focus:border-[#4F6A94] rounded-lg sm:rounded-xl",
                                        fileDisplayValue && "pr-8"
                                    )}
                                />
                                {fileDisplayValue && handleClearFiles && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="xs"
                                        icon={X}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleClearFiles();
                                        }}
                                        className="!absolute right-2.5 top-1/2 -translate-y-1/2 !h-6 !w-6 !p-0 !min-w-0 !rounded-full !bg-transparent hover:!bg-transparent text-slate-400 hover:text-slate-600 cursor-pointer !border-0 focus:!ring-0 shadow-none"
                                        aria-label="Remove selected files"
                                    />
                                )}
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                icon={FolderIcon}
                                onClick={handleBrowseClick}
                                className="h-9 sm:h-9.5 px-3 sm:px-4 rounded-lg sm:rounded-xl border border-[#d0e1fd] !bg-white hover:!bg-[#f0f6ff] !text-[#185FB8] font-semibold text-xs sm:text-sm shadow-2xs transition-colors shrink-0 cursor-pointer"
                            >
                                {t("uploadDownloadDrawer.browse")}
                            </Button>
                            <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                icon={UploadCloud}
                                onClick={handleLocalUpload}
                                isLoading={isUploadingLocal}
                                disabled={!fileDisplayValue || isUploadingLocal}
                                className="h-9 sm:h-9.5 px-3 sm:px-4 rounded-lg sm:rounded-xl !bg-[#185FB8] hover:!bg-[#15509c] text-white font-semibold text-xs sm:text-sm shadow-2xs transition-colors shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t("uploadDownloadDrawer.localUploadButton")}
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                onChange={handleFileInputChange}
                                className="hidden"
                            />
                        </div>
                    }
                </CardContent>
            </Card>

            {/* Upload Source Tabs (From Your Device / From Server) */}
            <Tabs
                value={uploadSourceTab}
                onChange={(val) => onUploadSourceTabChange?.(val as 'server' | 'device')}
                defaultValue="server"
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
                        value="server"
                        icon={HardDrive}
                        className="justify-center rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm py-1.5 sm:py-2 text-[#4F6A94] hover:text-[#173A67] hover:bg-white/40 transition-all"
                    >
                        {t("uploadDownloadDrawer.fromServerTab")}
                    </Tabs.Tab>
                    <Tabs.Tab
                        value="device"
                        icon={Folder}
                        className="justify-center rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm py-1.5 sm:py-2 text-[#4F6A94] hover:text-[#173A67] hover:bg-white/40 transition-all"
                    >
                        {t("uploadDownloadDrawer.fromDeviceTab")}
                    </Tabs.Tab>
                </Tabs.TabList>
            </Tabs>

            {shouldShowTable && (
                <UploadTable
                    data={activePreview?.items}
                    loading={loading}
                    pageNumber={activePreview?.page}
                    pageSize={activePreview?.pageSize}
                    totalCount={activePreview?.totalCount}
                    totalPages={activePreview?.totalPages}
                    sourceTab={uploadSourceTab}
                    onPageChange={onPageChange}
                    onPageSizeChange={onPageSizeChange}
                    t={t}
                />
            )}
        </div>
    );
}
