import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";

/**
 * Custom hook to handle pagination and URL navigation for the Use Category CV module.
 * Manages both the main data table and the side-bar Type of Use table.
 */
export function useCategoryCvPagination(
    pageNumber: number, 
    pageSize: number, 
    typeOfUsePageNumber: number, 
    typeOfUsePageSize: number,
    sortBy?: string,
    sortOrder?: string,
    leftSortBy?: string,
    leftSortOrder?: string
) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const locale = useLocale();

    const buildUrl = (paramsObj: Record<string, string | number | undefined>) => {
        const params = new URLSearchParams(searchParams.toString());
        
        // Ensure default values are set for consistency
        if (!params.has("page")) params.set("page", String(pageNumber));
        if (!params.has("pageSize")) params.set("pageSize", String(pageSize));
        if (!params.has("leftPage")) params.set("leftPage", String(typeOfUsePageNumber));
        if (!params.has("leftPageSize")) params.set("leftPageSize", String(typeOfUsePageSize));

        // Synchronize current sorting states in URL if not explicitly overridden
        const sb = paramsObj.sortBy !== undefined ? paramsObj.sortBy : sortBy;
        const so = paramsObj.sortOrder !== undefined ? paramsObj.sortOrder : sortOrder;
        const lsb = paramsObj.leftSortBy !== undefined ? paramsObj.leftSortBy : leftSortBy;
        const lso = paramsObj.leftSortOrder !== undefined ? paramsObj.leftSortOrder : leftSortOrder;

        if (sb) params.set("sortBy", String(sb)); else params.delete("sortBy");
        if (so) params.set("sortOrder", String(so)); else params.delete("sortOrder");
        if (lsb) params.set("leftSortBy", String(lsb)); else params.delete("leftSortBy");
        if (lso) params.set("leftSortOrder", String(lso)); else params.delete("leftSortOrder");

        Object.entries(paramsObj).forEach(([key, value]) => {
            if (["sortBy", "sortOrder", "leftSortBy", "leftSortOrder"].includes(key)) {
                return;
            }
            if (value === undefined || value === "") {
                params.delete(key);
            } else {
                params.set(key, String(value));
            }
        });

        return `/${locale}/property-tax/weightage-master/sub-type-weightage?${params.toString()}`;
    };

    const changePage = (page: number): void => {
        router.push(buildUrl({ page }));
    };

    const changePageSize = (size: number): void => {
        router.push(buildUrl({ page: 1, pageSize: size }));
    };

    const changeLeftPage = (page: number): void => {
        router.push(buildUrl({ leftPage: page }));
    };

    const changeLeftPageSize = (size: number): void => {
        router.push(buildUrl({ leftPage: 1, leftPageSize: size }));
    };

    return { buildUrl, changePage, changePageSize, changeLeftPage, changeLeftPageSize };
}
