"use client";

import { Briefcase, CheckCircle2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Department } from "@/types/departmentActivation.types";

interface DepartmentActivationStatsCardsProps {
    departments: Department[];
}

export function DepartmentActivationStatsCards({ departments }: DepartmentActivationStatsCardsProps) {
    const t = useTranslations("departmentActivation");

    const totalCount = departments.length;
    const activeCount = departments.filter(d => d.isActive).length;
    const inactiveCount = totalCount - activeCount;

    const stats = [
        {
            label: t("stats.total"),
            value: totalCount,
            icon: Briefcase,
            cardClass: "border-blue-100 bg-blue-50 dark:border-blue-100 dark:bg-blue-50",
            iconColor: "text-blue-600 dark:text-blue-600",
        },
        {
            label: t("stats.active"),
            value: activeCount,
            icon: CheckCircle2,
            cardClass: "border-emerald-100 bg-emerald-50 dark:border-emerald-100 dark:bg-emerald-50",
            iconColor: "text-emerald-600 dark:text-emerald-600",
        },
        {
            label: t("stats.inactive"),
            value: inactiveCount,
            icon: XCircle,
            cardClass: "border-rose-100 bg-rose-50 dark:border-rose-100 dark:bg-rose-50",
            iconColor: "text-rose-600 dark:text-rose-600",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {stats.map((stat, idx) => (
                <div
                    key={idx}
                    className={`flex items-center p-4 rounded-xl border shadow-sm transition-all hover:shadow-md ${stat.cardClass}`}
                >
                    <div className="p-3 rounded-lg bg-white dark:bg-white shadow-sm mr-4">
                        <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-500">{stat.label}</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-900">{stat.value}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
