'use client';

import { OffSetForm } from './OffSetForm';
import { Drawer } from '@/components/common';
import { useTranslations } from 'next-intl';
import { Layers } from 'lucide-react';
import type { FullOffSetFormProps } from '@/types/offset-details.types';
import { cn } from '@/lib/utils/cn';

const OFFSET_DRAWER_CLASSNAME = cn(
    "[&>div.fixed.right-0]:!w-[98vw]",
    "xl:[&>div.fixed.right-0]:!w-[600px]",
    "[&_div]:![scrollbar-width:none]",
    "[&_div]:![-ms-overflow-style:none]",
    "[&_div::-webkit-scrollbar]:!hidden"
);

export function OffSetSidebar(props: FullOffSetFormProps) {
    const { offsetModalOpen, handleOffsetClose, formData } = props;
    const t = useTranslations("quickDataEntry");

    const drawerTitle = (
        <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-blue-900">
                    {t("offset.title")}
                </h2>
                <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                    <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">{t("offset.roomNo")}</span>
                    <span className="text-xs font-bold text-blue-700">
                        {formData.roomNo || "-"}
                    </span>
                </div>
            </div>
        </div>
    );

    return (

        <div className={OFFSET_DRAWER_CLASSNAME}>
            <Drawer
                open={offsetModalOpen}
                onClose={handleOffsetClose}
                title={drawerTitle}
                width="md"
            >
                <div className="flex flex-col h-full">
                    <div className="flex-1">
                        <OffSetForm {...props} isInline={false} />
                    </div>
                </div>
            </Drawer>

        </div>
    );
}
