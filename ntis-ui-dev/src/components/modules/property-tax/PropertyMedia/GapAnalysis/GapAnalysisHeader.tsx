'use client';

import { Cog, Sheet, FileText, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/common';
import { CardHeader, CardTitle } from '@/components/common/Card';

interface GapAnalysisHeaderProps {
    handleFilterClick: () => void;
    onExport?: (format: 0 | 1) => void;
    isExporting?: boolean;
    isExportingExcel?: boolean;
    isExportingPdf?: boolean;
    t: (key: string) => string;
}

export function GapAnalysisHeader({
    handleFilterClick,
    onExport,
    isExporting,
    isExportingExcel,
    isExportingPdf,
    t,
}: GapAnalysisHeaderProps) {

    return (
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-[#e2edf8] mb-0 bg-[#f8fbff]">
            {/* Left Side */}
            <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100/70">
                    <TriangleAlert className="h-4 w-4 text-[#185FB8]" />
                </div>

                <CardTitle className="text-base font-bold text-[#173A67]">
                    {t('gapAnalysis.header.title')}
                </CardTitle>
            </div>

            {/* Right Side */}
            <div className="flex flex-wrap items-center gap-2">
                <Button
                    variant="secondary"
                    size="xs"
                    icon={Cog}
                    className="h-8 rounded-lg border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    onClick={handleFilterClick}
                >
                    {t('gapAnalysis.header.filter')}
                </Button>

                <Button
                    variant="success"
                    size="xs"
                    icon={Sheet}
                    isLoading={isExportingExcel}
                    disabled={isExporting}
                    onClick={() => onExport?.(0)}
                    className="h-8 rounded-lg bg-[#107C41] border-[#107C41] px-3 text-xs font-semibold text-white hover:bg-[#0b5c30]"
                >
                    {t('gapAnalysis.header.excel')}
                </Button>

                <Button
                    variant="secondary"
                    size="xs"
                    icon={FileText}
                    isLoading={isExportingPdf}
                    disabled={isExporting}
                    onClick={() => onExport?.(1)}
                    className="h-8 rounded-lg border-blue-200 bg-white px-3 text-xs font-semibold text-[#185FB8] hover:bg-blue-50"
                >
                    {t('gapAnalysis.header.pdf')}
                </Button>
            </div>
        </CardHeader>
    );
}