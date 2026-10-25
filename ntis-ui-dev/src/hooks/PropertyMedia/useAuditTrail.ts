'use client';

import { useState, useTransition, useCallback, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AuditTrailResult, ExportFormat } from "@/types/PropertyMedia/PropertyMedia.types";
import { usePropertyMediaExport } from "./usePropertyMediaExport";
import { ROUTES } from "@/lib/constants/routes";

export interface UseAuditTrailProps {
    initialData?: AuditTrailResult;
}

export function useAuditTrail({ initialData }: UseAuditTrailProps = {}) {
    const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(true);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const locale = useLocale();
    const t = useTranslations("propertyMedia");
    const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { exportAuditTrail, isExporting, isExportingExcel, isExportingPdf } = usePropertyMediaExport();

    const pageNumber = Math.max(1, parseInt(searchParams.get("pageNumber") || String(initialData?.pageNumber || 1), 10));
    const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") || String(initialData?.pageSize || 10), 10));

    const totalCount = initialData?.totalCount ?? 0;
    const totalPages = initialData?.totalPages ?? (Math.ceil(totalCount / pageSize) || 1);
    const paginatedData = initialData?.items ?? [];

    const updateQueries = useCallback(
        (updates: Record<string, string | number | null | undefined>, resetPage = true) => {
            startTransition(() => {
                const params = new URLSearchParams(searchParams.toString());

                Object.entries(updates).forEach(([key, value]) => {
                    if (value === null || value === undefined || value === "") {
                        params.delete(key);
                    } else {
                        params.set(key, String(value));
                    }
                });

                if (resetPage) {
                    params.set("pageNumber", "1");
                }

                router.push(`${pathname}?${params.toString()}`);
            });
        },
        [pathname, router, searchParams]
    );

    const handlePageChange = useCallback(
        (newPage: number) => {
            updateQueries({ pageNumber: newPage }, false);
        },
        [updateQueries]
    );

    const handlePageSizeChange = useCallback(
        (newPageSize: number) => {
            updateQueries({ pageSize: newPageSize, pageNumber: 1 }, false);
        },
        [updateQueries]
    );

    const handleExport = useCallback(
        (format: ExportFormat) => {
            exportAuditTrail({
                format,
                pageNumber,
                pageSize,
            });
        },
        [exportAuditTrail, pageNumber, pageSize]
    );

    const handleDrawerClose = useCallback(() => {
        setIsDrawerOpen(false);
        if (navigationTimer.current) clearTimeout(navigationTimer.current);
        navigationTimer.current = setTimeout(() => {
            navigationTimer.current = null;
            startTransition(() => {
                router.push(`/${locale}${ROUTES.PROPERTY_TAX.PROPERTY_MEDIA}`);
            });
        }, 300);
    }, [locale, router]);

    useEffect(
        () => () => {
            if (navigationTimer.current) clearTimeout(navigationTimer.current);
        },
        []
    );

    return {
        isDrawerOpen,
        handleDrawerClose,
        paginatedData,
        pageNumber,
        pageSize,
        totalCount,
        totalPages,
        handlePageChange,
        handlePageSizeChange,
        handleExport,
        isExporting,
        isExportingExcel,
        isExportingPdf,
        isPending,
        t,
    };
}
