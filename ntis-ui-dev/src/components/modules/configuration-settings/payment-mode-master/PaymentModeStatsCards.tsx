import type { PaymentMode } from "@/types/paymentMode.types";
import { Wallet, Smartphone, Building2, Activity, Layers } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/common/Card";
import { cn } from "@/lib/utils/cn";

interface PaymentModeStatsCardsProps {
    totalCount: number;
    allData: PaymentMode[];
    locale: string;
}

export function PaymentModeStatsCards({ totalCount, allData }: PaymentModeStatsCardsProps) {
    const t = useTranslations("paymentModeMaster");

    const onlineCount = allData.filter(
        (m) => m.type?.toLowerCase() === "online"
    ).length;
    const offlineCount = allData.filter(
        (m) => m.type?.toLowerCase() === "offline"
    ).length;
    const bothCount = allData.filter(
        (m) => m.type?.toLowerCase() === "both"
    ).length;
    const activeCount = allData.filter((m) => m.isActive).length;

    const stats = [
        {
            label: t("stats.totalModes"),
            value: totalCount,
            icon: Wallet,
            iconBg: "bg-blue-100 text-blue-600",
            valueColor: "text-blue-700",
        },
        {
            label: t("stats.online"),
            value: onlineCount,
            icon: Smartphone,
            iconBg: "bg-emerald-100 text-emerald-600",
            valueColor: "text-emerald-700",
        },
        {
            label: t("stats.offline"),
            value: offlineCount,
            icon: Building2,
            iconBg: "bg-slate-100 text-slate-600",
            valueColor: "text-slate-700",
        },
        {
            label: t("stats.both"),
            value: bothCount,
            icon: Layers,
            iconBg: "bg-amber-100 text-amber-600",
            valueColor: "text-amber-700",
        },
        {
            label: t("stats.active"),
            value: activeCount,
            icon: Activity,
            iconBg: "bg-violet-100 text-violet-600",
            valueColor: "text-violet-700",
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 mb-2">
            {stats.map((stat) => (
                <Card key={stat.label} className="border-l-4 border-l-blue-500 shadow-sm" padding="sm">
                    <div className="flex items-center justify-between pointer-events-none">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter truncate mb-1">{stat.label}</p>
                            <h3 className={cn("text-xl font-bold leading-none tracking-tight", stat.valueColor)}>
                                {stat.value}
                            </h3>
                        </div>
                        <div className={cn("p-2 rounded-lg flex items-center justify-center shrink-0 ml-3", stat.iconBg)}>
                            <stat.icon size={18} strokeWidth={2.5} />
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}
