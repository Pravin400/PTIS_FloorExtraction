'use client'

import { useRouter, usePathname, useSearchParams, useParams } from 'next/navigation';
import { Drawer } from '@/components/common/Drawer';
import { useTranslations } from 'next-intl';
import { FileText, MapPin, Hash, Layers, Tag } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { ReactNode } from 'react';
import { ApartmentQCTabNavigation } from './apartmentQCTabNavigation';

export function ApartmentQCClientWrapper({ children, categoryName }: { children: ReactNode; categoryName?: string }) {
    return (
        <ApartmentQCContent categoryName={categoryName}>
            {children}
        </ApartmentQCContent>
    );
}

function ApartmentQCContent({
    children,
    categoryName,
}: { children: ReactNode; categoryName?: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const routeParams = useParams();
    const t = useTranslations('quickDataEntry');
    const tQC = useTranslations('appartmentQC');

    const locale = routeParams.locale as string;
    const wardNo = searchParams.get("wardNo") || "";
    const propertyNo = searchParams.get("propertyNo") || "";
    const partitionNo = searchParams.get("partitionNo") || "";
    const valuationTab = searchParams.get("valuationTab") || "";
    
    const handleClose = () => {
            const params = new URLSearchParams(searchParams.toString());
            
            // Restore propertyId if it was stripped out in FloorSubmission tab
            const editPropId = params.get('editPropertyId');
            if (editPropId && !params.has('propertyId')) {
                params.set('propertyId', editPropId);
            }

            // Delete drawer-specific parameters if any
            params.delete('drawer');
            params.delete('editPropertyId');
            params.delete('editRowId');
            
            // If valuationTab is apartment, remove the tab parameter so it doesn't switch to propertydetails
            const valTab = params.get('valuationTab') || valuationTab;
            if (valTab === 'apartment') {
                params.delete('tab');
            }
            
            router.push(`/${locale}/property-tax/ptis?${params.toString()}`);              
    };

    const isRenterPage = pathname ? pathname.toLowerCase().includes("/renter") : false;
    const isPhotoOpen = searchParams.get('photo') === 'true';

    const drawerClassName = cn(
        !isPhotoOpen && "[&_div.fixed.right-0]:!w-[97vw]",
        !isPhotoOpen && "md:[&_div.fixed.right-0]:!w-[1000px]",
        !isPhotoOpen && "lg:[&_div.fixed.right-0]:!w-[1100px]",
        !isPhotoOpen && "xl:[&_div.fixed.right-0]:!w-[1200px]",
        !isRenterPage && "[&_div.fixed.right-0>div:first-child]:!bg-blue-600",
        !isRenterPage && "[&_div.fixed.right-0>div:first-child_h2]:!text-white",
        !isRenterPage && "[&_div.fixed.right-0>div:first-child_button_svg]:!text-white",
        !isRenterPage && "[&_div.fixed.right-0>div:first-child_button]:hover:!bg-blue-700"
    );

    const drawerTitle = (
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4 lg:gap-6">
            <h2 className="flex items-center gap-2 text-[15px] font-bold leading-tight text-white">
                <FileText className="h-4 w-4 text-white" />
               {tQC('drawer.apartmentQCHeading')}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-semibold text-white border border-white/10 backdrop-blur-xs transition-colors hover:bg-white/15">
                    <MapPin className="h-3 w-3 text-white/80" />
                    <span>{t('roomSubmission.info.ward')}: {wardNo || '—'}</span>
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-semibold text-white border border-white/10 backdrop-blur-xs transition-colors hover:bg-white/15">
                    <Hash className="h-3 w-3 text-white/80" />
                    <span>{t('roomSubmission.info.property')}: {propertyNo || '—'}</span>
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-semibold text-white border border-white/10 backdrop-blur-xs transition-colors hover:bg-white/15">
                    <Layers className="h-3 w-3 text-white/80" />
                    <span>{t('roomSubmission.info.partition')}: {partitionNo || '—'}</span>
                </div>
                {categoryName && (
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-semibold text-white border border-white/20 backdrop-blur-xs transition-colors hover:bg-white/20">
                        <Tag className="h-3 w-3 text-white/95" />
                        <span>{t('floor.propertyCategory') || 'Property Category'}: {categoryName}</span>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className={drawerClassName}>
            <Drawer open={true} onClose={handleClose} title={drawerTitle} width="xl" hideHeader={isRenterPage}>
                <div className="flex h-full flex-col overflow-hidden border-slate-300 bg-white shadow-sm">
                    {!isRenterPage && (
                        <ApartmentQCTabNavigation/>
                    )}
                    <div className="flex-1 overflow-auto" key={pathname}>
                        {children}
                    </div>
                </div>
            </Drawer>
        </div>
    );
}