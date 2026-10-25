'use client';

import { getDocumentAction } from '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/document.actions';
import { toast } from 'sonner';

/**
 * Client-side helper to retrieve a document as a local Object URL (Blob URL).
 * Returns the object URL and content type. The caller is responsible for revoking the URL.
 */
export async function getDocumentBlobUrl(
    documentGuid: string,
    locale?: string
): Promise<{ url: string; contentType: string }> {
    if (!documentGuid) throw new Error("Document GUID is required");
    const res = await getDocumentAction(documentGuid, 'view', locale);
    if (res.success && res.data?.base64) {
        const byteCharacters = atob(res.data.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: res.data.contentType });
        return {
            url: URL.createObjectURL(blob),
            contentType: res.data.contentType || ""
        };
    }
    throw new Error(res.error || "Failed to view document");
}

/**
 * Client-side helper to open a document in a new tab by fetching its base64 content
 * via a Server Action and converting it into a local Object URL.
 */
export async function viewDocumentClient(documentGuid: string, locale?: string): Promise<void> {
    if (!documentGuid) return;
    try {
        const res = await getDocumentAction(documentGuid, 'view', locale);
        if (res.success && res.data?.base64) {
            const byteCharacters = atob(res.data.base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: res.data.contentType });
            const blobUrl = URL.createObjectURL(blob);
            const opened = window.open(blobUrl, "_blank", "noopener,noreferrer");
            if (!opened) {
                URL.revokeObjectURL(blobUrl);
            } else {
                // Best-effort cleanup after the new tab has had time to load.
                setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
            }
        } else {
            toast.error(res.error || "Failed to view document");
        }
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to view document";
        toast.error(msg);
    }
}

/**
 * Client-side helper to download a document by fetching its base64 content
 * via a Server Action, converting it to a local Blob, and triggering a download.
 */
export async function downloadDocumentClient(documentGuid: string, defaultFileName?: string, locale?: string): Promise<void> {
    if (!documentGuid) return;
    try {
        const res = await getDocumentAction(documentGuid, 'download', locale);
        if (res.success && res.data?.base64) {
            const byteCharacters = atob(res.data.base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: res.data.contentType });
            const blobUrl = URL.createObjectURL(blob);
            
            let filename = defaultFileName || "document";
            const disposition = res.data.contentDisposition;
            if (disposition) {
                const filenameMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            }
            filename = filename.replace(/[\/\\:*"?<>|]/g, "_").replace(/[\u0000-\u001F]/g, "_").trim() || "document";

            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
        } else {
            toast.error(res.error || "Failed to download document");
        }
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to download document";
        toast.error(msg);
    }
}
