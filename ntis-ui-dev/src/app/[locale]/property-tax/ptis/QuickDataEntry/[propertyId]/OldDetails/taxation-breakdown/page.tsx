import TaxationBreakdownForm from '@/components/modules/property-tax/ptis/QuickDataEntry/old-details/TaxationBreakdown/TaxationBreakdownForm';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getOldTaxesDetailsAction, getYearMasterAction } from './action';
import { OldTaxesDetails, YearMaster } from '@/types/OldDetails/property-old-details.types';

interface PageProps {
    params: Promise<{
        propertyId: string;
        locale: string;
    }>;
}

export default async function TaxationBreakdownPage({ params }: PageProps) {
    const { locale, propertyId } = await params;
    setRequestLocale(locale);

    let data: OldTaxesDetails | null = null;
    let years: YearMaster[] = [];

    try {
        const [taxesResult, yearsResult] = await Promise.all([
            getOldTaxesDetailsAction(Number(propertyId)),
            getYearMasterAction(1, -1)
        ]);

        if (!taxesResult.success) {
            throw new Error(taxesResult.error || 'Failed to load old taxes details.');
        }

        data = taxesResult.data ?? null;
        years = yearsResult.success ? (yearsResult.data ?? []) : [];

    } catch (error: unknown) {
        const t = await getTranslations({ locale, namespace: 'quickDataEntry' });
        const msg = error instanceof Error ? error.message.toLowerCase() : "";
        if (msg.includes('unauthorized') || msg.includes('token expired') || msg.includes('token is expired')) {
            throw new Error(t('oldDetails.error.unauthorized'));
        }
        if (msg.includes('forbidden')) {
            throw new Error(t('oldDetails.error.forbidden'));
        }
        if (msg.includes('not found')) {
            throw new Error(t('oldDetails.error.notFound'));
        }
        if (msg.includes('fetch failed') || msg.includes('failed to fetch') || msg.includes('network error') || msg.includes('econnrefused')) {
            throw new Error(t('oldDetails.error.failedToConnect'));
        }
        throw error;
    }

    return (
        <TaxationBreakdownForm
            key={propertyId}
            initialData={data}
            yearOptions={years}
        />
    );
}