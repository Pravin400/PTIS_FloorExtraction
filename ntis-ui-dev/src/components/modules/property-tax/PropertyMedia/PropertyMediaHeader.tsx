'use client';

import { useTranslations } from 'next-intl';
import { ArrowLeftRight, Clock9 } from 'lucide-react';
import { Button } from '@/components/common';
import { useParams, useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants/routes';

export function PropertyMediaHeader() {
    const t = useTranslations('propertyMedia');
    const router = useRouter();
    const { locale } = useParams();

    return (
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
                <h2 className="text-xl sm:text-2xl tracking-tight font-semibold text-[#173A67]">
                    {t('propertyMediaHeader.propertyMediaHeaderTitle')}
                </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
                <Button
                    type="button"
                    size="xs"
                    variant="primary"
                    icon={ArrowLeftRight}
                    onClick={() => {
                        router.push(`/${locale}${ROUTES.PROPERTY_TAX.PROPERTY_MEDIA_UPLOAD_DOWNLOAD}`)
                    }}
                    className="h-9 sm:h-10 rounded-xl border-[#185FB8] bg-[#185FB8] px-3 sm:px-4 py-0 text-xs sm:text-sm font-bold text-white shadow-md"
                >
                    {t('propertyMediaHeader.uploadDownload')}
                </Button>

                <Button
                    type="button"
                    size="xs"
                    variant="secondary"
                    icon={Clock9}
                    onClick={()=>{
                        router.push(`/${locale}${ROUTES.PROPERTY_TAX.PROPERTY_MEDIA}/audit`)
                    }}
                    className="h-9 sm:h-10 rounded-xl border-[#CFDDED] bg-white px-3 sm:px-4 py-0 text-xs sm:text-sm font-bold text-[#315474]"
                >
                    {t('propertyMediaHeader.auditTrail')}
                </Button>
            </div>
        </div>
    );
}