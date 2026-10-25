'use client';

import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { MasterTable } from '@/components/common/MasterTable';
import { getUploadTableColumns } from './UploadTableColumn';
import { UploadFileItem, UploadTableProps } from '@/types/PropertyMedia/PropertyMedia.types';

export function UploadTable({
    data = [],
    loading = false,
    pageNumber = 1,
    pageSize = 10,
    totalCount = 0,
    totalPages = 1,
    sourceTab = 'server',
    onPageChange,
    onPageSizeChange,
    t,
}: UploadTableProps) {
    const columns = useMemo(() => getUploadTableColumns(t), [t]);

    const resolvedTotalCount = totalCount || data.length;
    const resolvedTotalPages = totalPages || Math.ceil(resolvedTotalCount / pageSize) || 1;

    const title = sourceTab === 'device'
        ? (t ? t("uploadDownloadDrawer.selectFilesDeviceTitle") : "Select Files from Your Device")
        : (t ? t("uploadDownloadDrawer.selectFilesServerTitle") : "Select Files from Server");

    const subtitle = sourceTab === 'device'
        ? (t ? t("uploadDownloadDrawer.selectFilesDeviceSubtitle") : "Choose files from your local storage to preview and match before uploading.")
        : (t ? t("uploadDownloadDrawer.selectFilesServerSubtitle") : "Choose existing files available on the server and upload them.");

    return (
        <Card
            variant="default"
            padding="none"
            className="w-full overflow-hidden rounded-xl sm:rounded-2xl border border-[#d7e3f1] bg-white shadow-2xs"
        >
            <CardHeader className="mb-0 border-b border-[#d7e3f1] bg-[#f4f8fc] px-4 py-3 sm:py-3.5">
                <CardTitle className="text-sm sm:text-base font-bold text-[#1f4977]">
                    {title}
                </CardTitle>
                <p className="mt-0.5 text-xs text-[#64748b]">
                    {subtitle}
                </p>
            </CardHeader>

            <CardContent className="p-0">
                <MasterTable<UploadFileItem>
                    data={data as UploadFileItem[]}
                    columns={columns}
                    loading={loading}
                    pageNumber={pageNumber}
                    pageSize={pageSize}
                    totalCount={resolvedTotalCount}
                    totalPages={resolvedTotalPages}
                    onPageChange={onPageChange}
                    onPageSizeChange={onPageSizeChange}
                    paginationConfig={{ enabled: true, showPageSizeSelector: true }}
                    pageSizeOptions={[5, 10, 20, 50]}
                    containerClassName="[&>div]:border-none [&>div]:rounded-none [&>div]:shadow-none"
                />
            </CardContent>
        </Card>
    );
}

export default UploadTable;
