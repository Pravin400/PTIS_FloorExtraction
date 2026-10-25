'use client';

import { SlidersHorizontal } from 'lucide-react';
import { Card, Badge } from '@/components/common';
import { ReportParametersPanel } from './ReportParametersPanel';
import { Stepper, CategoryCard, EmptyState, ReportListPanel, ReportTabsPanel } from './ReportWorkspaceComponents';
import type { FinancialYear } from '@/types/financialYear.types';
import type {
  Category,
  ReportDefinition,
  ReportWorkspaceCopy,
  ReportParamsPanelCopy,
  Step,
  ZoneSummary,
  WardSummary,
  PropertySummary,
  CreateReportRequest,
} from '@/types/report.types';

interface ReportGenerateViewProps {
  locale?: string;
  currentStep: Step;
  selectedCategory: string | null;
  selectedReport: ReportDefinition | null;
  reportsByCategory: Map<string, ReportDefinition[]>;
  categories: Category[];
  workspaceCopy: ReportWorkspaceCopy;
  paramsCopy: ReportParamsPanelCopy;
  zones: ZoneSummary[];
  financialYears: FinancialYear[];
  fetchWards: (zoneId: number) => Promise<WardSummary[]>;
  fetchProperties: (wardId: number) => Promise<PropertySummary[]>;
  fetchReportParameters?: (reportDefinitionId: number) => Promise<{ data: import('@/types/report.types').ReportParameterDefinition[]; error: string | null }>;
  onCategoryClick: (key: string) => void;
  onSelectReport: (report: ReportDefinition) => void;
  onQueued: (requestId: string) => void;
  createReportRequest?: CreateReportRequest;
}

export function ReportGenerateView({
  locale = 'mr',
  currentStep,
  selectedCategory,
  selectedReport,
  reportsByCategory,
  categories,
  workspaceCopy,
  paramsCopy,
  zones,
  financialYears,
  fetchWards,
  fetchProperties,
  fetchReportParameters,
  onCategoryClick,
  onSelectReport,
  onQueued,
  createReportRequest,
}: ReportGenerateViewProps) {
  const categoryCount = (key: string) => reportsByCategory.get(key)?.length ?? 0;
  const activeCategoryDef = categories.find((c) => c.key === selectedCategory);
  const activeReports = selectedCategory ? (reportsByCategory.get(selectedCategory) ?? []) : [];

  return (
    <div className="flex flex-col gap-5">
      <Stepper currentStep={currentStep} copy={workspaceCopy} />

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {categories.map((cat) => (
          <CategoryCard
            key={cat.key}
            category={cat}
            label={cat.name || cat.key}
            count={categoryCount(cat.key)}
            reportsCountTemplate={workspaceCopy.reportsCount}
            isSelected={selectedCategory === cat.key}
            onClick={() => onCategoryClick(cat.key)}
          />
        ))}
      </div>

      {currentStep === 1 && (
        <EmptyState title={workspaceCopy.emptyState.title} subtitle={workspaceCopy.emptyState.subtitle} />
      )}

      {currentStep === 2 && activeCategoryDef && (
        <ReportListPanel
          activeCategoryDef={activeCategoryDef}
          activeReports={activeReports}
          workspaceCopy={workspaceCopy}
          onSelectReport={onSelectReport}
        />
      )}

      {currentStep === 3 && activeCategoryDef && selectedReport && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          <ReportTabsPanel
            locale={locale}
            activeCategoryDef={activeCategoryDef}
            activeReports={activeReports}
            selectedReport={selectedReport}
            workspaceCopy={workspaceCopy}
            onSelectReport={onSelectReport}
          />
          <Card padding="none" className="lg:col-span-6 rounded-2xl overflow-hidden shadow-md border border-gray-300 flex flex-col bg-white min-h-[460px]">
            <div className="px-4 py-2 border-b border-gray-300 bg-gray-100 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#800000]" />
              <Badge variant="secondary" className="bg-transparent border-none px-0 text-[11px] font-bold text-gray-600 uppercase tracking-widest hover:bg-transparent">
                {workspaceCopy.configureParameters}
              </Badge>
            </div>
            <div className="flex-1 flex flex-col justify-between overflow-y-auto">
              <ReportParametersPanel
                report={selectedReport}
                onQueued={onQueued}
                copy={paramsCopy}
                zones={zones}
                financialYears={financialYears}
                fetchWards={fetchWards}
                fetchProperties={fetchProperties}
                fetchReportParameters={fetchReportParameters}
                createReportRequest={createReportRequest}
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
