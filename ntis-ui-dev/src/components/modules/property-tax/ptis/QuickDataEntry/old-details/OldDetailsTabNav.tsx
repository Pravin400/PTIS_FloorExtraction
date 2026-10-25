import { useRouter, usePathname, useParams, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import { ReceiptText, Layers3, Calculator } from 'lucide-react';
import { Section } from '@/types/OldDetails/property-old-floor-info.types';

export function OldDetailsTabNav() {
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams();
    const searchParams = useSearchParams();
    const t = useTranslations('quickDataEntry');

    const locale = params.locale as string;
    const propertyId = (params.propertyId as string) || "";
    
    // Get query parameters
    const wardNo = searchParams.get("wardNo") || "";
    const wardId = searchParams.get("wardId") || "";
    const propertyNo = searchParams.get("propertyNo") || "";
    const partitionNo = searchParams.get("partitionNo") || "";
    const returnTab = searchParams.get("returnTab") || "";
    const valuationTab = searchParams.get("valuationTab") || "";
    const appartmentTab = searchParams.get("appartmentTab") || "";
    const subTab = searchParams.get("subTab") || "";
    const showDetails = searchParams.get("showDetails") || "";
    const rateableExpands = searchParams.getAll("rateableExpand");
    const capitalExpands = searchParams.getAll("capitalExpand");
    const dualExpands = searchParams.getAll("dualExpand");

    // Build query string
    const queryParams = new URLSearchParams();
    if (propertyId) queryParams.set('propertyId', propertyId);
    if (wardNo) queryParams.set('wardNo', wardNo);
    if (wardId) queryParams.set('wardId', wardId);
    if (propertyNo) queryParams.set('propertyNo', propertyNo);
    if (partitionNo) queryParams.set('partitionNo', partitionNo);
    if (returnTab) queryParams.set('returnTab', returnTab);
    if (valuationTab) queryParams.set('valuationTab', valuationTab);
    if (appartmentTab) queryParams.set('appartmentTab', appartmentTab);
    if (subTab) queryParams.set('subTab', subTab);
    if (showDetails) queryParams.set('showDetails', showDetails);
    rateableExpands.forEach(v => queryParams.append('rateableExpand', v));
    capitalExpands.forEach(v => queryParams.append('capitalExpand', v));
    dualExpands.forEach(v => queryParams.append('dualExpand', v));

    const queryString = queryParams.toString();

    const sections: Section[] = [
        {
            id: 'old-taxation',
            label: t('tabs.OldTaxation'),
            href: 'old-taxation',
            icon: ReceiptText,
            activeClass: 'from-blue-500 to-blue-600 border-blue-700',
        },
        {
            id: 'floor-information',
            label: t('tabs.FloorInformation'),
            href: 'floor-information',
            icon: Layers3,
            activeClass: 'from-blue-500 to-blue-600 border-blue-700',
        },
        {
            id: 'taxation-breakdown',
            label: t('tabs.TaxationBreakdown'),
            href: 'taxation-breakdown',
            icon: Calculator,
            activeClass: 'from-blue-500 to-blue-600 border-blue-700',
        },
    ];

    return (
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3 shadow-sm backdrop-blur">
            <nav className="flex overflow-x-auto gap-3 sm:gap-5 pb-1 select-none scrollbar-none">
                {sections.map((section) => {
                    const Icon = section.icon;

                    const sectionPath = `/${locale}/property-tax/ptis/QuickDataEntry/${propertyId}/OldDetails/${section.href}`;
                    const sectionHref = queryString ? `${sectionPath}?${queryString}` : sectionPath;

                    const isActive =
                        pathname === sectionPath || pathname.endsWith(`/${section.href}`);

                    return (
                        <button
                            key={section.id}
                            onClick={() => router.push(sectionHref)}
                            data-href={sectionHref}
                            className={cn(
                                'inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-bold transition-all duration-200 focus:outline-none cursor-pointer text-left whitespace-nowrap shrink-0',
                                'hover:-translate-y-0.5 hover:shadow-md',
                                isActive
                                    ? `bg-linear-to-br ${section.activeClass} text-white shadow-md`
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            <span>{section.label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}
