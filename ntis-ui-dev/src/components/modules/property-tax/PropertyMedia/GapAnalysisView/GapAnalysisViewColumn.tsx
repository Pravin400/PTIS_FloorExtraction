import { Column, Badge } from "@/components/common";
import {MissingPropertyRow} from "@/types/PropertyMedia/PropertyMedia.types";
import {getWorkflowBadgeColor} from "@/lib/utils/PropertyMedia/propertyMediaHelper"


export interface MissingPropertyColumnsOptions {
    propertyNoLabel?: string;
    divisionLabel?: string;
    wardLabel?: string;
}

export function getMissingPropertyColumns(
    t?: (key: string) => string,
    options?: MissingPropertyColumnsOptions
): Column<MissingPropertyRow>[] {
    const propertyNumberLabel = options?.propertyNoLabel ?? (t ? t('propertyMediaViewDrawer.table.propertyNumber') : "Property No.");
    const divisionLabel = options?.divisionLabel ?? (t ? t('propertyMediaViewDrawer.table.division') : "Division");
    const wardLabel = options?.wardLabel ?? (t ? t('propertyMediaViewDrawer.table.ward') : "Ward");

    return [
        {
            key: 'propertyNumber',
            label: propertyNumberLabel,
            width: '11%',
            headerClassName: 'border-r border-blue-200/80',
            cellClassName: 'border-r border-blue-100 text-slate-700 font-normal',
            render: (value) => (
                <span className="font-bold">
                    {value !== null && value !== undefined && value !== "" ? String(value) : "-"}
                </span>
            )
        },
        {
            key: 'division',
            label: divisionLabel,
            width: '10%',
            headerClassName: 'border-r border-blue-200/80',
            cellClassName: 'border-r border-blue-100',
        },
        {
            key: 'ward',
            label: wardLabel,
            width: '9%',
            headerClassName: 'border-r border-blue-200/80',
            cellClassName: 'border-r border-blue-100',
        },
        {
            key: 'ownerName',
            label: t?t('propertyMediaViewDrawer.table.ownerName'):"Owner Name",
            width: '12%',
            headerClassName: 'border-r border-blue-200/80',
            cellClassName: 'border-r border-blue-100 text-slate-700',
        },
        {
            key: 'propertyType',
            label: t?t('propertyMediaViewDrawer.table.propertyType'):"Property Type",
            width: '12%',
            headerClassName: 'border-r border-blue-200/80',
            cellClassName: 'border-r border-blue-100 text-slate-700',
        },
        {
            key: 'missingType',
            label: t?t('propertyMediaViewDrawer.table.missingType'):"Missing Type",
            width: '15%',
            headerClassName: 'border-r border-blue-200/80',
            cellClassName: 'border-r border-blue-100',
            render: (value) => (
                value !== null && value !== undefined && value !== "" ? (
                    <Badge variant="destructive" size="md" className="h-auto py-1 text-center leading-tight">
                        {String(value)}
                    </Badge>
                ) : (
                    <span className="text-slate-400 font-medium">-</span>
                )
            ),
        },
        {
            key: 'workflowStatus',
            label: t ? t('propertyMediaViewDrawer.table.workflowStatus') : "Workflow Status",
            width: '19%',
            headerClassName: 'border-r border-blue-200/80',
            cellClassName: 'border-r border-blue-100',
            render: (value, row) => {
                if (value === null || value === undefined || value === "" || value === "-") {
                    return <span className="text-slate-400 font-normal">-</span>;
                }
                return (
                    <Badge
                        dot={true}
                        variant={getWorkflowBadgeColor(row?.workflowStatus ?? "default")}>
                        {String(value)}
                    </Badge>
                );
            }
        },
        {
            key: 'lastUpdatedDate',
            label: t ? (t('propertyMediaViewDrawer.table.lastUpdatedDate') || t('propertyMediaViewDrawer.table.lastUpdated')) : "Last Updated Date",
            width: '12%',
            headerClassName: 'border-r border-blue-200/80',
            cellClassName: 'border-r border-blue-100 text-slate-700',
            render: (value) => {
                const hasValue = value !== null && value !== undefined && value !== "" && value !== "-";
                return (
                    <span className={!hasValue ? "text-slate-400" : ""}>
                        {hasValue ? String(value) : "-"}
                    </span>
                );
            },
        },
    ];
}

export const MissingPropertyColumns = getMissingPropertyColumns();

