import { setRequestLocale } from 'next-intl/server';
import { TariffSlabs } from '@/components/modules/water-bill/tariff-workbench/slabs';
import {
  getTariffSlabsTableData,
  updateTariffSlabAction,
  createTariffSlabAction,
  deleteTariffSlabAction,
} from './actions';

export const dynamic = 'force-dynamic';

export interface TariffSlabsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TariffSlabsPage({ params, searchParams }: TariffSlabsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sParams = await searchParams;

  const { pagedData, pageParams } = await getTariffSlabsTableData(sParams);

  return (
    <TariffSlabs
      locale={locale}
      pagedData={pagedData}
      initialSearchTerm={pageParams.searchTerm}
      initialSortBy={pageParams.sortBy}
      initialSortOrder={pageParams.sortOrder}
      initialTariffId={pageParams.tariffId}
      drawer={null}
      initialEditingData={null}
      updateAction={updateTariffSlabAction}
      createAction={createTariffSlabAction}
      deleteAction={deleteTariffSlabAction}
    />
  );
}
