import { useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

export function useDashboardSearch(searchTerm: string) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const locale = useLocale();

    const handleSearch = () => {
        if (!searchTerm.trim()) return;

        const currentSearch = searchParams.toString();
        const currentUrl = currentSearch ? `${pathname}?${currentSearch}` : pathname;
        const returnUrl = encodeURIComponent(currentUrl);
        const workflowStageId = searchParams.get('workflowStageId');
      
        let targetUrl = `/${locale}/property-tax/automation-dashboard/property-details-dashboard/All?PropertyNo=${encodeURIComponent(searchTerm.trim())}&returnUrl=${returnUrl}`;
        if (workflowStageId) {
            targetUrl += `&workflowStageId=${workflowStageId}`;
        }

        startTransition(() => {
            router.push(targetUrl);
        });
    };

    return {
        isPending,
        handleSearch
    };
}
