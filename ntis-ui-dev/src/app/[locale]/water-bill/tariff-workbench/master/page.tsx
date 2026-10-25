import { setRequestLocale } from 'next-intl/server';
import { TariffWorkbench } from '@/components/modules/water-bill/tariff-workbench';
import type { TariffWorkbenchPageProps } from '@/types/water-bill/tariff-workbench/tariffWorkbench.types';
import {
  getTariffWorkbenchTableData,
  createTariffWorkbenchAction,
  updateTariffWorkbenchAction,
  deleteTariffWorkbenchAction,
} from './actions';

export const dynamic = 'force-dynamic';

export default async function TariffMasterPage({ params, searchParams }: TariffWorkbenchPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sParams = await searchParams;

  const {
    pagedData,
    financialYearOptions,
    connectionTypeOptions,
    connectionCategoryOptions,
    tapSizeOptions,
    pageParams,
  } = await getTariffWorkbenchTableData(sParams);

  return (
    <TariffWorkbench
      pagedData={pagedData}
      locale={locale}
      drawer={null}
      initialEditingData={null}
      initialSortBy={pageParams.sortBy}
      initialSortOrder={pageParams.sortOrder}
      initialSearchTerm={pageParams.searchTerm}
      financialYearOptions={financialYearOptions}
      connectionTypeOptions={connectionTypeOptions}
      connectionCategoryOptions={connectionCategoryOptions}
      tapSizeOptions={tapSizeOptions}
      createAction={createTariffWorkbenchAction}
      updateAction={updateTariffWorkbenchAction}
      deleteAction={deleteTariffWorkbenchAction}
    />
  );
}
