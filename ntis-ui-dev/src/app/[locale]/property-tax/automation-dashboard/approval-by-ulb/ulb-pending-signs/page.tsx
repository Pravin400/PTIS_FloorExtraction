import ULBPendingSigns from '@/components/modules/property-tax/automation-dashboard/ApprovalByULB/ULB-Pending-Signs/ULBPendingSigns';
import { getPendingSignsAction } from './action';
import { cookies } from 'next/headers';
import { getUserIdFromCookies, CookieStoreLike } from '@/lib/utils/cookie';

interface PageProps {
    searchParams: Promise<{
        pageNumber?: string;
        pageSize?: string;
        SearchTerm?: string;
    }>;
}

export default async function ULBPendingSignsPage({ searchParams }: PageProps) {
    const search = await searchParams;
    const pageNumber = search.pageNumber ? parseInt(search.pageNumber, 10) : 1;
    const pageSize = search.pageSize ? parseInt(search.pageSize, 10) : 10;
    const searchTerm = search.SearchTerm || '';

    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore as unknown as CookieStoreLike) || undefined;

    const response = await getPendingSignsAction(
        pageNumber,
        pageSize,
        userId,
        searchTerm
    );

    const serverData = response.success ? (response.data ?? null) : null;

    return (
        <>
            <ULBPendingSigns 
                serverData={serverData}
                initialPageNumber={pageNumber}
                initialPageSize={pageSize}
                userId={userId}
            />
        </>
    ) 
}