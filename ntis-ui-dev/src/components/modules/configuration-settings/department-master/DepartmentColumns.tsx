"use client";


import { DepartmentMaster } from "@/types/departmentMaster.types";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Column } from "@/components/common/MasterTable";

/**
 * Returns the table column configuration for Department Master
 * @param t - Translation function from useTranslations('departmentMaster')
 * @param tCommon - Translation function from useTranslations('common')
 * @returns Array of column definitions
 */
export function getDepartmentColumns(
    t: (key: string) => string,
    tCommon: (key: string) => string
): Column<DepartmentMaster>[] {
    return [
        {
            key: "departmentCode",
            label: t("list.table.departmentCode"),
            width: "15%",
            headerClassName: "font-bold",
            cellClassName: "font-medium text-blue-900",
        },
        {
            key: "departmentName",
            label: t("list.table.departmentName"),
            width: "20%",
            headerClassName: "font-bold",
            cellClassName: "font-medium text-slate-700",
        },
        {
            key: "departmentNameLocal",
            label: t("list.table.departmentNameLocal"),
            width: "20%",
            headerClassName: "font-bold",
            cellClassName: "text-slate-600",
        },
        {
            key: "departmentDescription",
            label: t("list.table.departmentDescription"),
            width: "35%",
            headerClassName: "font-bold",
            cellClassName: "text-slate-500 text-xs truncate max-w-[250px]",
        },
        {
            key: "isActive",
            label: tCommon("table.columns.status"),
            width: "10%",
            headerClassName: "font-bold text-center",
            align: "center",
            render: (value: unknown) => (
                <StatusBadge 
                    value={value as boolean} 
                    activeLabel={tCommon("status.active")} 
                    inactiveLabel={tCommon("status.inactive")} 
                />
            ),
        },
    ];
}
