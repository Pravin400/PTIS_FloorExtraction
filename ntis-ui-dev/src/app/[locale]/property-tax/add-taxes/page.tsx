import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { PageContainer } from '@/components/common/PageContainer';
import { LoadingPage } from '@/components/common';
import AddTaxesConsole, { AddTaxesActions } from '@/components/modules/property-tax/add-taxes/AddTaxesConsole';
import TableHeader from '@/components/common/TableHeader';
import { getFinancialYearsPaged } from '@/lib/api/financial-year.service';
import {
  initOperationsAction,
  getScopeOptionsAction,
  fetchZoneOptionsAction,
  fetchPropertyTypeOptionsAction,
  fetchAssessmentStatusOptionsAction,
} from './actions';
import {
  getAllWardsForOperations,
  getImportTemplate,
} from '@/lib/api/add-taxes/operations.service';

interface AddTaxesPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function AddTaxesPageContent({ params, searchParams }: AddTaxesPageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const toSingle = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  let financeYearIdParam = toSingle(sp.financeYearId) || toSingle(sp.financeYear);

  if (!financeYearIdParam) {
    const financialYears = await getFinancialYearsPaged(1, 2000);
    const defaultYear = financialYears.items?.[0];
    if (defaultYear?.id) {
      financeYearIdParam = String(defaultYear.id);
      const search = new URLSearchParams();
      for (const [key, value] of Object.entries(sp)) {
        if (value === undefined) continue;
        if (Array.isArray(value)) value.forEach((v) => search.append(key, v));
        else search.set(key, value);
      }
      search.set('financeYearId', financeYearIdParam);
      search.delete('financeYear');
      redirect(`/${locale}/property-tax/add-taxes?${search.toString()}`);
    }
  }

  // Fetch initial base data concurrently on the server
  const [
    initResponse,
    scopeResponse,
    initialZones,
    initialPropertyTypes,
    initialAssessmentStatuses,
    initialWardsResponse,
    initialImportTemplate,
  ] = await Promise.all([
    initOperationsAction(financeYearIdParam),
    getScopeOptionsAction(),
    fetchZoneOptionsAction(),
    fetchPropertyTypeOptionsAction(),
    fetchAssessmentStatusOptionsAction(),
    getAllWardsForOperations().catch((err) => {
      console.error('[AddTaxesPage] Failed to prefetch wards:', err);
      return { data: [], totalCount: 0 };
    }),
    getImportTemplate().catch((err) => {
      console.error('[AddTaxesPage] Failed to prefetch import template:', err);
      return null;
    }),
  ]);

  const initData = initResponse ? initResponse : null;
  const scopeOptions = scopeResponse ? scopeResponse.items : [];
  const initialWards = initialWardsResponse?.data || [];

  const clientActions = {
    initOperationsAction,
  };

  return (
    <AddTaxesConsole
      initData={initData}
      scopeOptions={scopeOptions}
      actions={clientActions}
      initialZones={initialZones}
      initialPropertyTypes={initialPropertyTypes}
      initialAssessmentStatuses={initialAssessmentStatuses}
      initialWards={initialWards}
      initialImportTemplate={initialImportTemplate}
    />
  );
}

export default async function AddTaxesPage({ params, searchParams }: AddTaxesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'addTaxes' });

  return (
    <PageContainer>
      <div className="flex flex-col gap-4">
        <TableHeader
          title={t('title')}
          subtitle={t('subtitle')}
          icon="database"
          rightContent={<AddTaxesActions />}
        />
        <Suspense fallback={<LoadingPage translationNamespace="addTaxes.loading" />}>
          <AddTaxesPageContent params={params} searchParams={searchParams} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
