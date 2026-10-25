"use client";

import { useTranslations, useLocale } from "next-intl";
import { PageContainer } from "@/components/common/PageContainer";
import { PaymentModeAddButton } from "./PaymentModeAddButton";
import { PaymentModeStatsCards } from "./PaymentModeStatsCards";
import { PaymentModeTable } from "./PaymentModeTable";
import type { PaymentMode } from "@/types/paymentMode.types";


interface PaymentModeMasterProps {
    data: PaymentMode[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    searchTerm: string;
    allData: PaymentMode[];
    statusCode?: number;
    fetchError?: string;
}

export function PaymentModeMaster({
    data,
    pageNumber,
    pageSize,
    totalCount,
    totalPages,
    searchTerm,
    allData,
}: PaymentModeMasterProps) {
    const t = useTranslations("paymentModeMaster");
    const locale = useLocale();





    return (
        <PageContainer>
            {/* Page Header: Title + Add Button */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div>
                    <h1 className="text-xl font-bold text-blue-950">{t("title")}</h1>
                    <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
                </div>
                <PaymentModeAddButton />
            </div>

            {/* Stats Cards — Server fetched, Client rendered here */}
            <PaymentModeStatsCards totalCount={totalCount} allData={allData} locale={locale} />

            {/* Table — Client Island */}
            <PaymentModeTable
                data={data}
                pageNumber={pageNumber}
                pageSize={pageSize}
                totalCount={totalCount}
                totalPages={totalPages}
                searchTerm={searchTerm}
            />
        </PageContainer>
    );
}
