'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Printer,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertTriangle,
  Languages,
} from 'lucide-react';
import { Button, IconButton, Badge } from '@/components/common';
import {
  renderReport,
  ReportLayoutValidator,
  toDevanagariDigits,
  escapeHtml,
  type ReportDefinition,
  type RenderedReport,
  type ValidationResult,
} from '@/lib/utils/reports/engine';

export interface ReportViewerProps {
  definition: ReportDefinition;
  dataRows?: Record<string, unknown>[];
  parameters?: Record<string, unknown>;
  locale?: string;
  title?: string;
  onClose?: () => void;
  className?: string;
  showDiagnostics?: boolean;
}

export function ReportViewer({
  definition,
  dataRows = [],
  parameters = {},
  locale = 'mr',
  title,
  onClose,
  className = '',
  showDiagnostics = false,
}: ReportViewerProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [useDevanagari, setUseDevanagari] = useState<boolean>(locale === 'mr');
  const [showValidation, setShowValidation] = useState<boolean>(showDiagnostics);
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute rendered report with current digit format
  const renderedReport: RenderedReport = useMemo(() => {
    if (!definition) {
      return {
        pagesHtml: '<div class="p-8 text-center text-slate-500 font-bold">कोणतीही अहवाल रचना (Report Definition) उपलब्ध नाही.</div>',
        totalPages: 0,
        stylesHtml: '',
        geometry: {
          paperSize: 'A4',
          orientation: 'portrait',
          widthMm: 210,
          heightMm: 297,
          pageWidthMm: 210,
          pageHeightMm: 297,
          pageWidth: 794,
          pageHeight: 1123,
          margins: { top: 6.4, right: 3.2, bottom: 6.4, left: 6.4 },
          printableWidth: 757,
          printableHeight: 1074,
          designWidth: 757,
          designHeight: 1074,
          usesPageCoordinates: false,
          printableWidthMm: 200.4,
          printableHeightMm: 284.2,
        },
      };
    }

    const extraCtx: Record<string, unknown> = {
      ...parameters,
      useDevanagari,
      locale,
    };

    return renderReport(definition, dataRows, extraCtx);
  }, [definition, dataRows, parameters, useDevanagari, locale]);

  // Layout validation
  const validation: ValidationResult = useMemo(() => {
    if (!definition) {
      return {
        isValid: true,
        valid: true,
        errors: [],
        warnings: [],
        issues: [],
        overlaps: [],
        elementDiagnostics: {},
        tableDiagnostics: [],
        geometry: renderedReport.geometry,
      };
    }
    return ReportLayoutValidator.validateReport(definition);
  }, [definition, renderedReport.geometry]);

  const totalPages = Math.max(1, renderedReport.totalPages);

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel((z) => Math.min(200, z + 15));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(40, z - 15));
  const handleZoomReset = () => setZoomLevel(100);

  // Print handler
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="${escapeHtml(locale)}">
        <head>
          <meta charset="utf-8">
          <title>${escapeHtml(title || definition.reportName || 'अहवाल')}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            ${renderedReport.stylesHtml}
            body { margin: 0; padding: 0; background: #fff; font-family: 'Noto Sans Devanagari', Arial, sans-serif; }
            @media screen {
              body { padding: 20px; background: #e2e8f0; display: flex; flex-direction: column; align-items: center; }
            }
          </style>
        </head>
        <body>
          ${renderedReport.pagesHtml}
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Download standalone HTML
  const handleDownloadHtml = () => {
    const fullHtml = `<!DOCTYPE html>
<html lang="${escapeHtml(locale)}">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title || definition.reportName || 'अहवाल')}</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    ${renderedReport.stylesHtml}
    body { margin: 0; padding: 20px; background: #f1f5f9; display: flex; flex-direction: column; align-items: center; font-family: 'Noto Sans Devanagari', Arial, sans-serif; }
  </style>
</head>
<body>
  ${renderedReport.pagesHtml}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(definition.reportCode || definition.reportId || 'report').toLowerCase()}_preview.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Scroll to active page if in continuous scroll
  useEffect(() => {
    if (!containerRef.current) return;
    const pageElem = containerRef.current.querySelector(`[data-page="${currentPage}"]`);
    if (pageElem) {
      pageElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentPage]);

  const displayPageStr = useDevanagari
    ? `${toDevanagariDigits(currentPage)} / ${toDevanagariDigits(totalPages)}`
    : `${currentPage} / ${totalPages}`;

  return (
    <div className={`flex flex-col h-full bg-slate-900/95 text-slate-100 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl ${className}`}>
      {/* Top Controls Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0 backdrop-blur-md">
        {/* Left: Title & Meta */}
        <div className="flex items-center gap-3 min-w-0">
          <Badge variant="secondary" className="bg-[#004c8c]/30 text-sky-400 border border-sky-500/20 px-2.5 py-1 text-xs font-semibold">
            {renderedReport.geometry.paperSize} ({renderedReport.geometry.orientation === 'landscape' ? 'आडवे' : 'उभे'})
          </Badge>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white tracking-wide truncate">
              {title || definition.reportName || 'अहवाल पूर्वावलोकन (Report Preview)'}
            </h2>
            <p className="text-[11px] text-slate-400">
              एकूण पाने: {displayPageStr} • नोंदी: {useDevanagari ? toDevanagariDigits(dataRows.length) : dataRows.length}
            </p>
          </div>
        </div>

        {/* Center: Pagination & Zoom */}
        <div className="flex items-center gap-2">
          {/* Page Navigation */}
          <div className="flex items-center bg-slate-800/80 rounded-xl p-1 border border-slate-700/60 shadow-inner">
            <IconButton
              icon={ChevronLeft}
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              aria-label="Previous Page"
              className="text-slate-300 hover:text-white disabled:opacity-30"
            />
            <span className="px-3 text-xs font-bold text-slate-200 select-none">
              {displayPageStr}
            </span>
            <IconButton
              icon={ChevronRight}
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              aria-label="Next Page"
              className="text-slate-300 hover:text-white disabled:opacity-30"
            />
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-800/80 rounded-xl p-1 border border-slate-700/60 shadow-inner">
            <IconButton
              icon={ZoomOut}
              size="sm"
              onClick={handleZoomOut}
              aria-label="Zoom Out"
              className="text-slate-300 hover:text-white"
            />
            <button
              onClick={handleZoomReset}
              className="px-2.5 text-xs font-semibold text-slate-300 hover:text-white select-none transition-colors"
              title="रीसेट करा"
            >
              {zoomLevel}%
            </button>
            <IconButton
              icon={ZoomIn}
              size="sm"
              onClick={handleZoomIn}
              aria-label="Zoom In"
              className="text-slate-300 hover:text-white"
            />
          </div>

          {/* Marathi Numerals Toggle */}
          <Button
            variant="secondary"
            size="sm"
            icon={Languages}
            onClick={() => setUseDevanagari(!useDevanagari)}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium border ${
              useDevanagari
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="मराठी अंक आणि इंग्रजी अंकांमधील बदल"
          >
            {useDevanagari ? '०-९ देवनागरी' : '0-9 English'}
          </Button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {validation.warnings.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              icon={AlertTriangle}
              onClick={() => setShowValidation(!showValidation)}
              className="bg-amber-950/40 text-amber-400 border border-amber-500/30 rounded-xl px-2.5 py-1.5 text-xs hover:bg-amber-900/40"
              title="लेआउट इश्यू दाखवा"
            >
              {validation.warnings.length} इश्यू
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={handleDownloadHtml}
            className="bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 rounded-xl px-3 py-1.5 text-xs"
          >
            HTML डाऊनलोड
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Printer}
            onClick={handlePrint}
            className="bg-[#004c8c] hover:bg-[#003866] text-white font-bold rounded-xl px-4 py-1.5 text-xs shadow-md active:scale-95 transition-all"
          >
            प्रिंट (Print)
          </Button>

          {onClose && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="bg-slate-800/80 hover:bg-red-500/20 hover:text-red-400 text-slate-400 border-slate-700 rounded-xl px-3 py-1.5 text-xs ml-1"
            >
              बंद करा
            </Button>
          )}
        </div>
      </div>

      {/* Validation Banner (Collapsible) */}
      {showValidation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
        <div className="bg-amber-950/60 border-b border-amber-800/60 px-6 py-3 text-xs text-amber-200 flex items-start justify-between gap-4">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300">लेआउट तपासणी (Layout Diagnostics):</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-200/90 text-[11px]">
                {validation.errors.map((err, i) => (
                  <li key={`err_${i}`} className="text-red-300 font-semibold">{err}</li>
                ))}
                {validation.warnings.map((warn, i) => (
                  <li key={`warn_${i}`}>{typeof warn === 'string' ? warn : (warn as { message?: string })?.message || String(warn)}</li>
                ))}
              </ul>
            </div>
          </div>
          <button
            onClick={() => setShowValidation(false)}
            className="text-amber-400 hover:text-amber-200 text-xs font-bold px-2 py-1 rounded-lg hover:bg-amber-900/40"
          >
            लपवा
          </button>
        </div>
      )}

      {/* Main Canvas Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-slate-950/80 p-8 flex flex-col items-center gap-8 relative select-none scrollbar-thin scrollbar-thumb-slate-700"
      >
        <style dangerouslySetInnerHTML={{ __html: renderedReport.stylesHtml }} />
        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className="report-pages-zoom-wrapper flex flex-col items-center gap-10"
          dangerouslySetInnerHTML={{ __html: renderedReport.pagesHtml }}
        />
      </div>
    </div>
  );
}
