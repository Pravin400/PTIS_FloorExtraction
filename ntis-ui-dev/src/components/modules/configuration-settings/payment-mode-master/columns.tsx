import type { Column } from "@/components/common/MasterTable";
import type { PaymentMode } from "@/types/paymentMode.types";

const LOCALE_CURRENCY_MAP: Record<string, string> = {
    'en-IN': 'INR',
    'hi': 'INR',
    'mr': 'INR',
    'en-US': 'USD',
};

const getCurrencyForLocale = (locale: string): string => {
    return LOCALE_CURRENCY_MAP[locale] || 'INR';
};

/**
 * Returns the table column configuration for Payment Mode Master
 * @param t - Translation function from useTranslations('paymentModeMaster')
 * @returns Array of column definitions
 */
export function getPaymentModeColumns(
    t: (key: string) => string,
    locale: string = 'en-IN'
): Column<any>[] { // eslint-disable-line @typescript-eslint/no-explicit-any
    return [
        {
            key: "code",
            label: t("table.code"),
            render: (value: unknown) => (
                <span className="font-medium text-gray-700">
                    {String(value)}
                </span>
            )
        },
        {
            key: "paymentModeName",
            label: t("table.name"),
            render: (value: unknown, row: PaymentMode) => (
                <div>
                    <div className="font-medium text-gray-900">{String(value)}</div>
                    {row.description && <div className="text-xs text-gray-500">{row.description}</div>}
                </div>
            )
        },
        {
            key: "type",
            label: t("table.type"),
            render: (value: unknown) => (
                <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    {String(value)}
                </span>
            )
        },
        {
            key: "category",
            label: t("table.category"),
            render: (value: unknown) => (
                <span className="text-xs font-medium text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                    {String(value)}
                </span>
            )
        },
        {
            key: "transactionCharge",
            label: t("table.charge"),
            render: (_: unknown, row: PaymentMode) => (
                <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-medium">
                        {row.chargeType === 'Percentage'
                            ? `${row.transactionCharge}%`
                            : new Intl.NumberFormat(locale, {
                                style: 'currency',
                                currency: getCurrencyForLocale(locale),
                                maximumFractionDigits: 2
                            }).format(row.transactionCharge)}
                    </span>
                    <span className="text-xs text-gray-500">{row.chargeType}</span>
                </div>
            )
        },
        {
            key: "isActive",
            label: t("table.status"),
            isStatus: true,
        },
    ];
}
