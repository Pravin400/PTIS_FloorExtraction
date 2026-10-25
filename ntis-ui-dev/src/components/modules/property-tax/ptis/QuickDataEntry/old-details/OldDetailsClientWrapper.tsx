'use client';

import { ReactNode } from 'react';
import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { OldDetailsTabNav } from './OldDetailsTabNav';

export default function OldDetailsClientWrapper({
    children,
}: {
    children: ReactNode;
}) {
    const t = useTranslations('quickDataEntry');

    return (
        <div className="flex min-h-screen flex-col bg-white">
            <div className="mx-4 mt-3 mb-2 flex items-start gap-3 p-3.5 bg-blue-50/90 border border-blue-200/80 text-blue-900 rounded-xl shadow-xs transition-all duration-300">
                <div className="p-1 bg-blue-100/80 rounded-lg text-blue-700 shrink-0 mt-0.5">
                    <Info size={16} strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                    <p className="text-xs leading-relaxed font-medium mt-1">
                        {t('property.pageInProgress') || "This page is in progress"}
                    </p>
                </div>
            </div>
            <OldDetailsTabNav />
            <div className="flex-1 overflow-y-auto bg-white">
                {children}
            </div>
        </div>
    );
}