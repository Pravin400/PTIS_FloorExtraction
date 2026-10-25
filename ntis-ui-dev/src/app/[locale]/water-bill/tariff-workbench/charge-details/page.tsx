import { setRequestLocale } from 'next-intl/server';
import { TariffChargeDetails } from '@/components/modules/water-bill/tariff-workbench/charge-details';
import {
  getTariffChargeDetailsTableData,
  updateTariffChargeDetailAction,
  createTariffChargeDetailAction,
  deleteTariffChargeDetailAction,
} from './actions';

export const dynamic = 'force-dynamic';

export interface TariffChargeDetailsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TariffChargeDetailsPage({ params, searchParams }: TariffChargeDetailsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sParams = await searchParams;

  const { pagedData, pageParams } = await getTariffChargeDetailsTableData(sParams);

  return (
    <TariffChargeDetails
      locale={locale}
      pagedData={pagedData}
      initialSearchTerm={pageParams.searchTerm}
      initialSortBy={pageParams.sortBy}
      initialSortOrder={pageParams.sortOrder}
      drawer={null}
      initialEditingData={null}
      updateAction={updateTariffChargeDetailAction}
      createAction={createTariffChargeDetailAction}
      deleteAction={deleteTariffChargeDetailAction}
    />
  );
}
