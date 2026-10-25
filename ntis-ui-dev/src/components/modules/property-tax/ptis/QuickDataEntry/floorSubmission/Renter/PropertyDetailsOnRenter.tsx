'use client';
import React from 'react';

import { useTranslations } from 'next-intl';

interface PropertyInfo {
    propertyName?: string;
    floorNumber?: string;
    zone?: string;
}

export const PropertyDetailsOnRenter = React.memo(({ propertyInfo: _propertyInfo }: { propertyInfo?: PropertyInfo }) => {
    const t = useTranslations('quickDataEntry');

    return (
        <div className="flex items-center justify-end gap-6 flex-1">
            {/* Title - Right Side */}
            <div className="flex flex-col gap-1 items-end min-w-[200px]">
                <div className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-600 shrink-0">
                    {t('floor.renterSection.renterPropertyDetails')}
                </div>
            </div>
        </div>
    );
});

PropertyDetailsOnRenter.displayName = 'PropertyDetailsOnRenter';
