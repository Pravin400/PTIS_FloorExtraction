import { setRequestLocale, getTranslations } from 'next-intl/server';
import OldTaxationForm from '@/components/modules/property-tax/ptis/QuickDataEntry/old-details/OldTaxation/OldTaxationForm';
import { getPropertyOldDetailsAction } from './action';
import { PropertyOldDetailsApiItem } from '@/types/OldDetails/property-old-details.types';

interface PageProps {
    params: Promise<{
        propertyId: string;
        locale: string;
    }>;
}

export default async function OldTaxationPage({ params }: PageProps) {
    const { locale, propertyId } = await params;
    setRequestLocale(locale);

    let data: PropertyOldDetailsApiItem | null = null;

    try {
        const result = await getPropertyOldDetailsAction(Number(propertyId));

        if (!result.success) {
            throw new Error(result.error || 'Failed to fetch property old details');
        }

        data = result.data ?? null;
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
        <OldTaxationForm
            propertyOldDetails={data}
        />
    );
}
