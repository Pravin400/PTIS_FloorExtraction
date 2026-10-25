'use client';

import { FileText, Loader2, Download, X } from 'lucide-react';
import { Button, IconButton, Badge } from '@/components/common';
import type { ReportDefinition, ReportWorkspaceCopy } from '@/types/report.types';

interface ReportPreviewOverlayProps {
  requestId: string;
  report: ReportDefinition | null;
  pdfLoading: boolean;
  copy: ReportWorkspaceCopy;
  onPdfLoad: () => void;
  onClose: () => void;
}

export function ReportPreviewOverlay({
  requestId,
  report,
  pdfLoading,
  copy,
  onPdfLoad,
  onClose,
}: ReportPreviewOverlayProps) {
  const pdfUrl = `/api/designer-report-download/${encodeURIComponent(requestId)}`;
  const inlineUrl = `${pdfUrl}?inline=true&view=pdf#toolbar=0`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#090d16]/80 backdrop-blur-md p-4 transition-all duration-300">
      <div className="bg-slate-50 w-full max-w-5xl h-[88vh] rounded-3xl flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.45)] border border-white/10 overflow-hidden relative transition-all duration-300">
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-slate-200/85 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3.5">
            <Badge variant="secondary" className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-inner border border-rose-100 hover:bg-rose-50">
              <FileText className="w-5 h-5" />
            </Badge>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-slate-800 tracking-wide truncate">
                {report?.reportName || copy.preview.title}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              icon={Download}
              onClick={() => { window.location.href = pdfUrl; }}
              className="rounded-xl px-4 py-2 font-bold bg-[#004c8c] hover:bg-[#003866] hover:shadow-md active:scale-95 transition-all duration-150 flex items-center gap-2"
            >
              {copy.preview.downloadPdf}
            </Button>
            <IconButton
              icon={X}
              variant="danger"
              onClick={onClose}
              aria-label="Close preview"
              className="rounded-xl"
            />
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 bg-slate-200/40 p-5 relative flex items-center justify-center">
          {pdfLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/75 backdrop-blur-xs z-10 transition-opacity duration-300">
              <Loader2 className="w-9 h-9 text-[#004c8c] animate-spin" />
              <p className="text-xs font-bold text-slate-500 mt-3 tracking-wide">{copy.toast.preparingDocument}</p>
            </div>
          )}
          <object
            data={inlineUrl}
            type="application/pdf"
            className="w-full h-full rounded-2xl border border-slate-200/80 shadow-md bg-white"
            style={{ colorScheme: 'only light' }}
            onLoad={onPdfLoad}
          >
            <iframe
              src={inlineUrl}
              className="w-full h-full rounded-2xl border border-slate-200/80 shadow-md bg-white"
              title="Report Preview"
              style={{ colorScheme: 'only light' }}
              onLoad={onPdfLoad}
            />
          </object>
        </div>
      </div>
    </div>
  );
}
