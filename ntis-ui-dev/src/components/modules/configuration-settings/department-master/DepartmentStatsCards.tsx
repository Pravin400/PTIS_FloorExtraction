"use client";

import { Briefcase, CheckCircle2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { DepartmentMaster } from "@/types/departmentMaster.types";

interface DepartmentStatsCardsProps {
    totalCount: number;
    allData: DepartmentMaster[];
    locale: string;
}

export function DepartmentStatsCards({ totalCount, allData }: DepartmentStatsCardsProps) {
    const t = useTranslations("departmentMaster");

    const activeCount = allData.filter(d => d.isActive).length;
    const inactiveCount = allData.length - activeCount;

    const stats = [
        {
            label: t("stats.total"),
            value: totalCount,
            icon: Briefcase,
            bgColor: "bg-blue-50",
            iconColor: "text-blue-600",
            borderColor: "border-blue-100",
        },
        {
            label: t("stats.active"),
            value: activeCount,
            icon: CheckCircle2,
            bgColor: "bg-emerald-50",
            iconColor: "text-emerald-600",
            borderColor: "border-emerald-100",
        },
        {
            label: t("stats.inactive"),
            value: inactiveCount,
            icon: XCircle,
            bgColor: "bg-rose-50",
            iconColor: "text-rose-600",
            borderColor: "border-rose-100",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {stats.map((stat, idx) => (
                <div
                    key={idx}
                    className={`flex items-center p-4 rounded-xl border ${stat.borderColor} ${stat.bgColor} shadow-sm transition-all hover:shadow-md`}
                >
                    <div className={`p-3 rounded-lg bg-white shadow-sm mr-4`}>
                        <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                        <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
