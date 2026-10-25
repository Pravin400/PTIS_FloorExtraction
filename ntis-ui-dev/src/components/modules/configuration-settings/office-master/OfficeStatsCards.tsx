import React from "react";
import { BuildingIcon, Building2, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/common";
import { cn } from "@/lib/utils/cn";

interface OfficeStatsCardsProps {
  totalCount: number;
  headOfficesCount: number;
  activeOfficesCount: number;
  inactiveOfficesCount: number;
  t: (key: string) => string;
}

export const OfficeStatsCards = React.memo(
  function OfficeStatsCards({ 
    totalCount, 
    headOfficesCount, 
    activeOfficesCount, 
    inactiveOfficesCount, 
    t 
  }: OfficeStatsCardsProps) {
    const stats = [
      {
        label: t("stats.total"),
        value: totalCount,
        icon: BuildingIcon,
        bgColor: "bg-blue-500",
        iconBg: "bg-blue-50",
        iconColor: "text-blue-600",
        accentColor: "bg-blue-600"
      },
      {
        label: t("stats.headOffices"),
        value: headOfficesCount,
        icon: Building2,
        bgColor: "bg-purple-500",
        iconBg: "bg-purple-50",
        iconColor: "text-purple-600",
        accentColor: "bg-purple-600"
      },
      {
        label: t("stats.activeOffices"),
        value: activeOfficesCount,
        icon: CheckCircle2,
        bgColor: "bg-green-500",
        iconBg: "bg-green-50",
        iconColor: "text-green-600",
        accentColor: "bg-green-600"
      },
      {
        label: t("stats.inactiveOffices"),
        value: inactiveOfficesCount,
        icon: XCircle,
        bgColor: "bg-red-500",
        iconBg: "bg-red-50",
        iconColor: "text-red-600",
        accentColor: "bg-red-600"
      }
    ];

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="group relative overflow-hidden border-none bg-white shadow-sm transition-all duration-300 hover:shadow-md"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-3xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "rounded-2xl p-3 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm",
                      stat.iconBg,
                      stat.iconColor
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                
                {/* Decorative Elements */}
                <div className={cn(
                  "absolute -bottom-4 -right-4 h-24 w-24 rounded-full opacity-[0.03] transition-all duration-500 group-hover:scale-150",
                  stat.bgColor
                )} />
                <div className={cn(
                  "absolute top-0 left-0 h-full w-1.5 transition-all duration-300",
                  stat.accentColor
                )} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  },
  (prev, next) => 
    prev.totalCount === next.totalCount &&
    prev.headOfficesCount === next.headOfficesCount &&
    prev.activeOfficesCount === next.activeOfficesCount &&
    prev.inactiveOfficesCount === next.inactiveOfficesCount
);
