import type { ClassicReportDefinition } from '@/lib/utils/reports/designer/classic-adapter';

export interface ClassicReportDesignerProps {
  locale?: string;
  defaultReportId?: string;
  reportId?: string;
  initialDefinition?: ClassicReportDefinition | null;
  openImporter?: boolean;
  createNewReport?: boolean;
}
