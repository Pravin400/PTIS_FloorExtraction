'use client';

import { Column } from '@/components/common/MasterTable';
import { UploadFileItem } from '@/types/PropertyMedia/PropertyMedia.types';
import { ImageIcon, FileText, CheckCircle2, CircleX } from 'lucide-react';

function isImageFile(fileName: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png'];
    return imageExtensions.some((ext) => fileName.toLowerCase().endsWith(ext));
}

function isPdfFile(fileName: string): boolean {
    return fileName.toLowerCase().endsWith('.pdf');
}

function FileIconPreview({
    fileName,
}: {
    fileName: string;
}) {
    if (isImageFile(fileName)) {
        return (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#cbe0f8] bg-[#f0f6ff] text-[#2563eb] shadow-2xs">
                <ImageIcon className="h-4.5 w-4.5" />
            </div>
        );
    }

    if (isPdfFile(fileName)) {
        return (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#fecaca] bg-[#fff1f2] text-[#e11d48] shadow-2xs">
                <FileText className="h-4.5 w-4.5" />
            </div>
        );
    }

    return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-500 shadow-2xs">
            <FileText className="h-4.5 w-4.5" />
        </div>
    );
}

export const getUploadTableColumns = (t?: (key: string) => string): Column<UploadFileItem>[] => [
    {
        key: 'fileName',
        label: t ? t('uploadDownloadDrawer.table.columns.fileName') : 'File Name',
        width: '45%',
        render: (_val, row) => {
            const fileName = row.fileName !== null && row.fileName !== undefined ? String(row.fileName) : '';
            return (
                <div className="flex items-center gap-3">
                    <FileIconPreview fileName={fileName} />
                    <span className="font-medium text-[#2d3748] text-xs sm:text-sm truncate">
                        {fileName !== '' ? fileName : '-'}
                    </span>
                </div>
            );
        },
    },
    {
        key: 'propertyDisplay',
        label: t ? t('uploadDownloadDrawer.table.columns.propertyDetails') : 'Property Details',
        width: '40%',
        render: (_val, row) => {
            const propertyDisplay = row.propertyDisplay ?? row.propertyDetails;
            const hasDisplay = propertyDisplay !== null && propertyDisplay !== undefined && propertyDisplay !== '';
            return (
                <span className="text-[#4a5568] text-xs sm:text-sm">
                    {hasDisplay ? String(propertyDisplay) : '-'}
                </span>
            );
        },
    },
    {
        key: 'isMatched',
        label: t ? t('uploadDownloadDrawer.table.columns.matchStatus') : 'Match Status',
        width: '15%',
        align: 'center',
        render: (_val, row) => {
            const isMatched = Boolean(row.isMatched);
            return (
                <div className="flex items-center justify-center">
                    {isMatched ? (
                        <CheckCircle2 className="h-5 w-5 text-[#16a34a] transition-transform duration-150 hover:scale-110" />
                    ) : (
                        <CircleX className="h-5 w-5 text-[#dc2626] transition-transform duration-150 hover:scale-110" />
                    )}
                </div>
            );
        },
    },
];

export const uploadTableColumns: Column<UploadFileItem>[] = getUploadTableColumns();
