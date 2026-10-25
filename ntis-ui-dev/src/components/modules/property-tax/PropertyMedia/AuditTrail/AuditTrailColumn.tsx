import { Column, Badge } from "@/components/common"
import { ActivityLog } from "@/types/PropertyMedia/PropertyMedia.types";

export interface AuditTrailColumnsOptions {
    userLabel?: string;
    categoryLabel?: string;
}

const formatCell = (value: unknown): string => {
    if (value === null || value === undefined || value === '') return '-';
    return String(value);
};

export const getAuditTrailColumns = (
    t: (key: string, values?: Record<string, string | number>) => string,
    options?: AuditTrailColumnsOptions
): Column<ActivityLog>[] => [
    {
        key: 'dateTime',
        label: t('auditTrailDrawer.table.columns.dateTime'),
        width: '25%',
        headerClassName: 'border-r border-blue-200/80',
        cellClassName: 'border-r border-blue-100 text-slate-700 font-normal',
        render: (value) => formatCell(value),
    }, {
        key: 'user',
        label: options?.userLabel ?? t('auditTrailDrawer.table.columns.user'),
        width: '15%',
        headerClassName: 'border-r border-blue-200/80',
        cellClassName: 'border-r border-blue-100 text-slate-700 font-normal',
        render: (value) => formatCell(value),
    }, {
        key: 'action',
        label: t('auditTrailDrawer.table.columns.action'),
        width: '20%',
        headerClassName: 'border-r border-blue-200/80',
        cellClassName: 'border-r border-blue-100 text-slate-700 font-normal',
        render: (value) => formatCell(value),
    }, {
        key: 'category',
        label: options?.categoryLabel ?? t('auditTrailDrawer.table.columns.category'),
        width: '20%',
        headerClassName: 'border-r border-blue-200/80',
        cellClassName: 'border-r border-blue-100 text-slate-700 font-normal',
        render: (value) => formatCell(value),
    }, {
        key: 'result',
        label: t('auditTrailDrawer.table.columns.result'),
        width: '20%',
        headerClassName: 'border-r border-blue-200/80',
        cellClassName: 'border-r border-blue-100 text-slate-700 font-normal',
        render: (value) => {
            const count = value !== null && value !== undefined && value !== '' ? String(value) : '0';
            return (
                <Badge variant="success" size="md" className="h-auto py-1 text-center leading-tight">
                    {t('auditTrailDrawer.table.uploadedCount', { count })}
                </Badge>
            );
        }
    }
]