import { ClassicReportDesigner } from '@/components/modules/property-tax/report-designer/ClassicReportDesigner';
import { loadDesignerReport } from '@/lib/utils/reports/designer/designer-api';
import type { ClassicReportDefinition } from '@/lib/utils/reports/designer/classic-adapter';

export const dynamic = 'force-dynamic';

export default async function ReportDesignerPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{
    reportId?: string;
    import?: string;
    newReport?: string;
  }>;
}) {
  const { locale } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const reportId = resolvedSearchParams?.reportId;
  const openImporter = resolvedSearchParams?.import === '1';
  const createNewReport = resolvedSearchParams?.newReport === '1';
  let initialDefinition: ClassicReportDefinition | null = null;
  if (reportId) {
    try {
      initialDefinition = await loadDesignerReport(reportId);
    } catch {
      initialDefinition = null;
    }
  }

  return (
    <div className="-mx-3 md:-mx-4 -mb-3 mt-1 flex flex-1 flex-col overflow-hidden h-[calc(100vh-96px)]">
      <ClassicReportDesigner
        key={reportId || 'default'}
        locale={locale}
        defaultReportId={reportId}
        initialDefinition={initialDefinition}
        openImporter={openImporter}
        createNewReport={createNewReport}
      />
    </div>
  );
}
