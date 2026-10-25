'use client';

import { useState, useRef } from 'react';
import { toast } from 'sonner';

export interface DocumentPreview {
    name: string;
    url: string;
    preview: string;
    type: string;
    size: number;
    file: File;
}

export function useGrievanceAttachments() {
    const [documents, setDocuments] = useState<File[]>([]);
    const [documentPreviews, setDocumentPreviews] = useState<DocumentPreview[]>([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const newFiles = Array.from(e.target.files);
        addFiles(newFiles);
    };

    const addFiles = (files: File[]) => {
        const validFiles = files.filter((file) => {
            const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
            const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
            if (!isValidType) toast.error(`${file.name}: Only image and PDF formats are accepted.`);
            if (!isValidSize) toast.error(`${file.name}: File size must be less than 10MB.`);
            return isValidType && isValidSize;
        });

        if (documents.length + validFiles.length > 5) {
            toast.error('Maximum 5 files can be uploaded.');
            return;
        }

        const newPreviews: DocumentPreview[] = validFiles.map((file) => {
            const url = URL.createObjectURL(file);
            return {
                name: file.name,
                url,
                preview: url,
                type: file.type,
                size: file.size,
                file,
            };
        });

        setDocuments((prev) => [...prev, ...validFiles]);
        setDocumentPreviews((prev) => [...prev, ...newPreviews]);
        toast.success(`${validFiles.length} file(s) added successfully!`);
    };

    const removeDocument = (index: number) => {
        setDocuments((prev) => prev.filter((_, i) => i !== index));
        setDocumentPreviews((prev) => {
            const item = prev[index];
            if (item?.url?.startsWith('blob:')) {
                URL.revokeObjectURL(item.url);
            }
            return prev.filter((_, i) => i !== index);
        });
    };

    const clearDocuments = () => {
        documentPreviews.forEach((item) => {
            if (item?.url?.startsWith('blob:')) {
                URL.revokeObjectURL(item.url);
            }
        });
        setDocuments([]);
        setDocumentPreviews([]);
    };

    return {
        documents,
        setDocuments,
        documentPreviews,
        setDocumentPreviews,
        uploadProgress,
        setUploadProgress,
        isUploading,
        setIsUploading,
        fileInputRef,
        handleFileChange,
        addFiles,
        removeDocument,
        clearDocuments,
    };
}
