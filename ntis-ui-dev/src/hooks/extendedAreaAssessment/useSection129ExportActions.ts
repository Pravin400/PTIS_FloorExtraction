import { useState } from "react";
import { toast } from "sonner";
import type { useTranslations } from "next-intl";
import {
  exportSection129ScheduleCsvAction,
  exportSection129SchedulePdfAction,
} from "@/app/[locale]/property-tax/extended-area-assesment/single-assessment/action";

/** Decodes a base64 file export and returns a blob object URL for it. Caller owns the URL and
 *  must revoke it (URL.revokeObjectURL) once done with it. */
function base64ToBlobUrl(data: { base64: string; contentType: string }): string {
  const byteCharacters = atob(data.base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const blob = new Blob([new Uint8Array(byteNumbers)], { type: data.contentType });
  return URL.createObjectURL(blob);
}

/** Decodes a base64 file export and triggers a browser download for it. */
function downloadBase64File(
  data: { base64: string; contentType: string; contentDisposition: string | null },
  fallbackFilename: string
) {
  const blobUrl = base64ToBlobUrl(data);

  let filename = fallbackFilename;
  const match = data.contentDisposition?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
  if (match?.[1]) filename = match[1].replace(/['"]/g, "");

  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
}

/** The single-assessment screen's "Export CSV" and "Print / PDF" actions. Both download
 *  server-generated files (authoritative schedule data) — CSV downloads directly, PDF is decoded
 *  into a blob and shown in a preview modal instead of downloading directly, so the officer can
 *  review it before printing. */
export function useSection129ExportActions(propertyId: number | null, t: ReturnType<typeof useTranslations>) {
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  const handleExportCsv = async () => {
    if (!propertyId) {
      toast.error(t("messages.propertyNotFound") ?? "Search for a property first.");
      return;
    }
    try {
      const res = await exportSection129ScheduleCsvAction(propertyId);
      if (!res.success || !res.data) {
        toast.error(res.error ?? "Failed to export Section 129A schedule CSV.");
        return;
      }
      downloadBase64File(res.data, "Section_129A_General_Tax_Schedule.csv");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to export Section 129A schedule CSV.");
    }
  };

  const handlePrint = async () => {
    if (!propertyId) {
      toast.error(t("messages.propertyNotFound") ?? "Search for a property first.");
      return;
    }
    try {
      const res = await exportSection129SchedulePdfAction(propertyId);
      if (!res.success || !res.data) {
        toast.error(res.error ?? "Failed to generate Section 129A schedule PDF.");
        return;
      }
      setPdfPreviewUrl(base64ToBlobUrl(res.data));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate Section 129A schedule PDF.");
    }
  };

  const closePdfPreview = () => {
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    setPdfPreviewUrl(null);
  };

  return { handleExportCsv, handlePrint, pdfPreviewUrl, closePdfPreview };
}
