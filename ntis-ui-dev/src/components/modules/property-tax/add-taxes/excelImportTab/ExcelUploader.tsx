'use client';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/ActionButton';
import { UploadCloud, FileSpreadsheet, Trash2 } from 'lucide-react';

interface ExcelUploaderProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- next-intl translate function type varies
    t: any;
    file: File | null;
    isDragging: boolean;
    handleDragOver: (e: React.DragEvent) => void;
    handleDragLeave: () => void;
    handleDrop: (e: React.DragEvent) => void;
    handleRemoveFile: () => void;
    processFile: (selectedFile: File) => void;
}

export function ExcelUploader({
    t,
    file,
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleRemoveFile,
    processFile
}: ExcelUploaderProps) {
    return (
        <Card
            className={`lg:col-span-2 p-8 flex flex-col items-center justify-center border-2 border-dashed transition-all duration-200 min-h-[250px] ${isDragging
                    ? 'border-blue-500 bg-blue-50/40'
                    : file
                        ? 'border-green-300 bg-green-50/10'
                        : 'border-gray-300 bg-white hover:border-blue-400'
                }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {file ? (
                <div className="flex flex-col items-center text-center">
                    <div className="h-16 w-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">
                        <FileSpreadsheet className="h-8 w-8" />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-1">{file.name}</h4>
                    <p className="text-xs text-gray-400 mb-6">{(file.size / 1024 / 1024).toFixed(2)} MB</p>

                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            icon={Trash2}
                            onClick={handleRemoveFile}
                            className="hover:text-red-600 hover:bg-red-50 hover:border-red-200"
                        >
                            {t('uploader.removeFile')}
                        </Button>
                        <label className="cursor-pointer">
                            <span className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors">
                                {t('uploader.uploadAnother')}
                            </span>
                            <input
                                type="file"
                                className="hidden"
                                accept=".xlsx, .xls"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        processFile(e.target.files[0]);
                                    }
                                }}
                            />
                        </label>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center text-center w-full">
                    <div className="h-14 w-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                        <UploadCloud className="h-7 w-7 animate-pulse" />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-1">{t('uploader.dragDrop')}</h4>
                    <p className="text-xs text-gray-400 mb-4">{t('uploader.clickBrowse')}</p>
                    <p className="text-[10px] text-gray-400 mb-6">{t('uploader.sizeSupport')}</p>

                    <label className="cursor-pointer">
                        <span className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors">
                            {t('uploader.browseFile')}
                        </span>
                        <input
                            type="file"
                            className="hidden"
                            accept=".xlsx, .xls"
                            onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                    processFile(e.target.files[0]);
                                }
                            }}
                        />
                    </label>
                </div>
            )}
        </Card>
    );
}
