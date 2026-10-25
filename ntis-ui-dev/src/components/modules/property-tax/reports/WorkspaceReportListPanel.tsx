'use client';

import { FileText, ArrowRight } from 'lucide-react';
import { Card, Badge, Button } from '@/components/common';
import type { Category, ReportDefinition, ReportWorkspaceCopy } from '@/types/report.types';

interface ReportListPanelProps {
  activeCategoryDef: Category;
  activeReports: ReportDefinition[];
  workspaceCopy: ReportWorkspaceCopy;
  onSelectReport: (report: ReportDefinition) => void;
}

export function ReportListPanel({
  activeCategoryDef,
  activeReports,
  workspaceCopy,
  onSelectReport,
}: ReportListPanelProps) {
  return (
    <Card padding="none" className="rounded-xl overflow-hidden shadow-sm border border-gray-200">
      {/* Header */}
      <div className={`px-3 py-1.5 border-b flex items-center gap-2 ${activeCategoryDef.bgColor} border-${activeCategoryDef.borderColor.replace('border-', '')}`}>
        <div className={`w-5 h-5 rounded-md flex items-center justify-center ${activeCategoryDef.iconBg}`}>
          <FileText className={`w-3 h-3 ${activeCategoryDef.color}`} />
        </div>
        <Badge variant="secondary" className={`bg-transparent border-none px-0 text-[10px] font-bold uppercase tracking-widest hover:bg-transparent ${activeCategoryDef.color}`}>
          {activeCategoryDef.name || activeCategoryDef.key}
        </Badge>
        <Badge variant="secondary" className={`bg-transparent border-none ml-auto text-[9px] font-bold rounded-full px-1.5 py-0.5 hover:bg-transparent ${activeCategoryDef.iconBg} ${activeCategoryDef.color}`}>
          {activeReports.length}
        </Badge>
      </div>

      {activeReports.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400">
          {workspaceCopy.noReportsFound}
        </div>
      ) : (
        <div className="flex flex-wrap gap-3 p-4 bg-white">
          {activeReports.map((report) => (
            <Button
              key={report.id}
              variant="ghost"
              onClick={() => onSelectReport(report)}
              className={`group flex items-center gap-2 w-[calc(20%-9.6px)] h-auto text-left cursor-pointer px-3 py-2.5 rounded-xl border border-gray-200 bg-white [&>span]:inline-flex [&>span]:items-center [&>span]:justify-center [&>span]:gap-2
                hover:${activeCategoryDef.bgColor} hover:${activeCategoryDef.borderColor} hover:shadow-sm hover:-translate-y-0.5
                transition-all duration-150 focus:outline-none focus:ring-2 ${activeCategoryDef.glowClass}`}
            >
              <span className={`text-xs font-semibold leading-snug text-gray-800 group-hover:${activeCategoryDef.color} transition-colors`}>
                {report.reportName}
              </span>
              <ArrowRight className={`w-3 h-3 flex-shrink-0 text-gray-300 group-hover:${activeCategoryDef.color} transition-colors`} />
            </Button>
          ))}
        </div>
      )}
    </Card>
  );
}
