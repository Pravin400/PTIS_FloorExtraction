'use client';

import { FileText, ChevronRight } from 'lucide-react';
import { Card, Tabs, TabList, Tab, Badge } from '@/components/common';
import type { Category, ReportDefinition, ReportWorkspaceCopy } from '@/types/report.types';

interface ReportTabsPanelProps {
  locale?: string;
  activeCategoryDef: Category;
  activeReports: ReportDefinition[];
  selectedReport: ReportDefinition;
  workspaceCopy: ReportWorkspaceCopy;
  onSelectReport: (report: ReportDefinition) => void;
}

export function ReportTabsPanel({
  activeCategoryDef,
  activeReports,
  selectedReport,
  workspaceCopy,
  onSelectReport,
}: ReportTabsPanelProps) {
  return (
    <Card padding="none" className="lg:col-span-6 rounded-2xl overflow-hidden shadow-md border border-gray-300 flex flex-col bg-white min-h-[460px]">
      <div className="px-4 py-2 border-b border-gray-300 bg-gray-100 flex items-center gap-2">
        <FileText className="w-4 h-4 text-[#800000]" />
        <Badge variant="secondary" className="bg-transparent border-none px-0 text-[11px] font-bold text-gray-600 uppercase tracking-widest hover:bg-transparent">
          {workspaceCopy.reportsHeader.replace(
            '{category}',
            activeCategoryDef.name || activeCategoryDef.key
          )}
        </Badge>
        <Badge variant="secondary" className="bg-transparent border-none px-0 ml-auto text-[10px] text-gray-500 font-bold bg-gray-200/80 rounded-full px-2 py-0.5 hover:bg-gray-200/80">
          {activeReports.length}
        </Badge>
      </div>
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 min-h-[400px]">
        <Tabs
          value={selectedReport.id}
          onChange={(val) => {
            const rep = activeReports.find((r) => r.id === Number(val));
            if (rep) onSelectReport(rep);
          }}
          variant="pills"
          className="w-full"
        >
          <TabList className="grid grid-cols-3 gap-3.5 bg-transparent border-0 p-0" scrollable={false}>
            {activeReports.map((report) => {
              const isActive = selectedReport.id === report.id;
              return (
                <Tab
                  key={report.id}
                  value={report.id}
                  className={`relative text-left rounded-xl border px-4 py-3.5 sm:py-4 transition-all duration-300 focus:outline-none block w-full h-auto bg-white hover:border-red-200 hover:bg-red-50/30 hover:-translate-y-0.5 group
                    ${isActive
                      ? 'border-[#800000] bg-[#fff5f5] shadow-sm -translate-y-0.5 ring-1 ring-[#800000]/20'
                      : 'border-gray-200 shadow-2xs'
                    }`}
                >
                  <div className="flex items-center justify-between w-full gap-2 min-w-0">
                    <div className="flex flex-col min-w-0 flex-1">
                      <p className={`text-sm font-semibold leading-snug truncate
                        ${isActive ? 'text-[#800000]' : 'text-gray-700 group-hover:text-[#800000]'}`}
                      >
                        {report.reportName}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-[#800000]' : 'text-gray-400 group-hover:text-[#800000]/70'}`} />
                  </div>
                </Tab>
              );
            })}
          </TabList>
        </Tabs>
      </div>
    </Card>
  );
}
