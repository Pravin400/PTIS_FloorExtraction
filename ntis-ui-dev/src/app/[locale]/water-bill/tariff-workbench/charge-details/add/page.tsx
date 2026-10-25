import { setRequestLocale } from 'next-intl/server';
import { TariffChargeDetails } from '@/components/modules/water-bill/tariff-workbench/charge-details';
import {
    getTariffChargeDetailsTableData,
    fetchTariffChargeTariffOptionsAction,
    fetchTariffChargeHeadOptionsAction,
    fetchTariffChargeGeographyUnitOptionsAction,
    updateTariffChargeDetailAction,
    createTariffChargeDetailAction,
    deleteTariffChargeDetailAction
} from '../actions';

export const dynamic = 'force-dynamic';

interface AddChargeDetailPageProps {
    params: Promise<{ locale: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AddChargeDetailPage({ params, searchParams }: AddChargeDetailPageProps) {
    const { locale } = await params;
    setRequestLocale(locale);
    const sParams = await searchParams;

    const [tableData, tariffOptions, chargeHeadOptions, geographyUnitOptions] = await Promise.all([
        getTariffChargeDetailsTableData(sParams),
        fetchTariffChargeTariffOptionsAction(),
        fetchTariffChargeHeadOptionsAction(),
        fetchTariffChargeGeographyUnitOptionsAction(),
    ]);

    return (
        <TariffChargeDetails
            locale={locale}
            pagedData={tableData.pagedData}
            initialSearchTerm={tableData.pageParams.searchTerm}
            initialSortBy={tableData.pageParams.sortBy}
            initialSortOrder={tableData.pageParams.sortOrder}
            tariffOptions={tariffOptions}
            chargeHeadOptions={chargeHeadOptions}
            geographyUnitOptions={geographyUnitOptions}
            drawer="add"
            initialEditingData={null}
            updateAction={updateTariffChargeDetailAction}
            createAction={createTariffChargeDetailAction}
            deleteAction={deleteTariffChargeDetailAction}
        />
    );
}
