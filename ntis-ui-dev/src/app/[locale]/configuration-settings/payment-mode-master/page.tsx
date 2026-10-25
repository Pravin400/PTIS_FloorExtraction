import { getPaymentModeMastersAction, getAllPaymentModeMastersAction } from "./actions";
import { PaymentModeMaster } from "@/components/modules/configuration-settings/payment-mode-master/PaymentModeMaster";

interface PageProps {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PaymentModeMasterPage({ params, searchParams }: PageProps) {
    await params;

    const resolvedSearchParams = await searchParams;
    const pageNumber = Number(resolvedSearchParams.page) || 1;
    const pageSize = Number(resolvedSearchParams.pageSize) || 10;
    const searchTerm = (resolvedSearchParams.search as string) || "";

    const [pagedResult, allResult] = await Promise.all([
        getPaymentModeMastersAction(pageNumber, pageSize, searchTerm),
        getAllPaymentModeMastersAction(),
    ]);

    const defaultPagedData = { items: [], totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 0, hasPrevious: false, hasNext: false };
    const pagedData = pagedResult.success ? (pagedResult.data || defaultPagedData) : defaultPagedData;
    const allData = allResult.success ? (allResult.data || []) : [];

    const fetchError = !pagedResult.success ? pagedResult.error : undefined;
    const statusCode = undefined;

    return (
        <PaymentModeMaster
            data={pagedData.items}
            pageNumber={pagedData.pageNumber}
            pageSize={pagedData.pageSize}
            totalCount={pagedData.totalCount}
            totalPages={pagedData.totalPages}
            searchTerm={searchTerm}
            allData={allData}
            fetchError={fetchError}
            statusCode={statusCode}
        />
    );
}
