"use client";

import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { MasterTable } from "@/components/common/MasterTable";
import { SearchInput } from "@/components/common/SearchInput";
import { ConfirmProvider } from "@/components/common/ConfirmProvider";
import { getPaymentModeColumns } from "./columns";
import { PaymentModeRowActions } from "./PaymentModeRowActions";
import PaymentModeForm from "./PaymentModeForm";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { toast } from "sonner";
import { deletePaymentModeMasterAction } from "@/app/[locale]/configuration-settings/payment-mode-master/actions";
import type { PaymentMode } from "@/types/paymentMode.types";

interface PaymentModeTableProps {
    data: PaymentMode[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    searchTerm: string;
}

function PaymentModeTableContent({
    data,
    pageNumber,
    pageSize,
    totalCount,
    totalPages,
    searchTerm,
}: PaymentModeTableProps) {
    const router = useRouter();
    const t = useTranslations("paymentModeMaster");
    const commonT = useTranslations("common");
    const locale = useLocale();

    const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
    const [prevSearchTerm, setPrevSearchTerm] = useState(searchTerm);
    const [editingMode, setEditingMode] = useState<PaymentMode | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
    const { confirm } = useConfirm();

    // Sync localSearchTerm with prop if searchTerm changes externally (e.g., page navigation)
    if (searchTerm !== prevSearchTerm) {
        setLocalSearchTerm(searchTerm);
        setPrevSearchTerm(searchTerm);
    }

    const columns = useMemo(() => getPaymentModeColumns(t, locale), [t, locale]);

    const updateParams = useCallback((updates: Record<string, string>) => {
        const params = new URLSearchParams(window.location.search);
        Object.entries(updates).forEach(([key, value]) => {
            if (value) params.set(key, value);
            else params.delete(key);
        });
        router.push(`?${params.toString()}`);
    }, [router]);

    const handlePageChange = (page: number) => {
        updateParams({ page: page.toString() });
    };

    const handlePageSizeChange = (size: number) => {
        updateParams({ pageSize: size.toString(), page: "1" });
    };

    const handleSearch = useCallback((term: string) => {
        setLocalSearchTerm(term);
    }, []);

    const debouncedSearchTerm = useDebounce(localSearchTerm, 500);

    // Sync debounced search term update to URL
    useEffect(() => {
        if (debouncedSearchTerm !== searchTerm) {
            updateParams({ search: debouncedSearchTerm, page: "1" });
        }
    }, [debouncedSearchTerm, updateParams, searchTerm]);

    const start = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1;

    const footerLeft = (
        <div className="flex items-center gap-1.5 text-sm text-[#6B7280] flex-wrap">
            <span>{commonT("table.showingStart", { start })}</span>
            <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                aria-label={commonT("table.rowsPerPage")}
                data-testid="page-size-select"
                className="w-16 h-8 px-1 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all cursor-pointer"
            >
                {[5, 10, 20, 50].map((s) => (
                    <option key={s} value={s}>{s}</option>
                ))}
            </select>
            <span>{commonT("table.ofTotalEntries", { total: totalCount })}</span>
        </div>
    );

    const handleEdit = (row: PaymentMode) => {
        setEditingMode(row);
        setIsFormOpen(true);
    };

    const handleDelete = (row: PaymentMode) => {
        confirm({
            title: t("table.deleteConfirmTitle"),
            description: t("table.deleteConfirmSubtitle"),
            confirmText: t("table.deleteConfirmButton"),
            cancelText: t("table.deleteCancelButton"),
            variant: "delete",
            onConfirm: async () => {
                setIsDeletingId(row.id);
                try {
                    const formData = new FormData();
                    formData.append('id', String(row.id));
                    const result = await deletePaymentModeMasterAction(formData);
                    if (result.success) {
                        toast.success(t("toast.deleteSuccess"));
                        router.refresh();
                    } else {
                        toast.error(result.error || t("toast.unexpectedError"));
                    }
                } catch (_error) {
                    toast.error(t("toast.unexpectedError"));
                } finally {
                    setIsDeletingId(null);
                }
            },
        });
    };

    return (
        <>
            <MasterTable
                columns={columns}
                data={data}
                pageNumber={pageNumber}
                pageSize={pageSize}
                totalCount={totalCount}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                emptyText={t("noDataFound")}
                paginationConfig={{
                    enabled: true,
                    showPageSizeSelector: false,
                }}
                footerLeftContent={footerLeft}
                renderActions={(row) => (
                    <PaymentModeRowActions
                        mode={row}
                        onEdit={() => handleEdit(row)}
                        onDelete={() => handleDelete(row)}
                        isDeleting={isDeletingId === row.id}
                    />
                )}
                headerExtra={
                    <div className="flex w-full justify-start">
                        <SearchInput
                            value={localSearchTerm}
                            onChange={handleSearch}
                            className="mb-0 w-64 h-9 text-sm"
                            placeholder={t("searchPlaceholder")}
                        />
                    </div>
                }
                tableClassName="border-separate border-spacing-0 [&_td]:!py-1 [&_th]:!py-1.5 [&_th]:!text-blue-900"
                theadClassName="bg-[#EBF3FF]"
                maxBodyHeightClassName="max-h-[calc(100vh-320px)]"
            />
            <PaymentModeForm
                key={editingMode?.id ?? (isFormOpen ? 'new-open' : 'closed')}
                open={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingMode(null);
                }}
                editingMode={editingMode}
                onSuccess={() => {
                    setIsFormOpen(false);
                    setEditingMode(null);
                    router.refresh();
                }}
            />
        </>
    );
}

export function PaymentModeTable(props: PaymentModeTableProps) {
    return (
        <ConfirmProvider>
            <PaymentModeTableContent {...props} />
        </ConfirmProvider>
    );
}
