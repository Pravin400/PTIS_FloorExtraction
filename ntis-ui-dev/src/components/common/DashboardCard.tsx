import { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { FileSpreadsheet, Loader2 } from "lucide-react";

export interface DashboardCardProps {
    label: string;
    value: string | number;
    subLabel?: string;
    icon?: ReactNode;
    iconBg?: string;
    valueColor?: string;
    className?: string;
    onExportExcel?: () => void;
    isExporting?: boolean;
}

export const DashboardCard = ({
    label,
    value,
    subLabel,
    icon,
    iconBg = "bg-slate-100 text-slate-700",
    valueColor = "text-slate-900",
    className = "",
    onExportExcel,
    isExporting = false,
}: DashboardCardProps) => {
    const baseClasses = cn(
        "relative flex items-center gap-3 rounded-md bg-white px-4 py-1.5 border border-slate-300 shadow-[0_1px_2px_rgba(0,0,0,0.05)]",
        className
    );
    return (
        <div
            className={baseClasses}
            role="region"
            aria-label={label}
        >
            {/* Accent bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1A86E8] rounded-l-md" />

            {/* Text */}
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-600 truncate">{label}</p>
                <p
                    className={cn("mt-0.5 text-xl font-bold", valueColor)}
                    title={String(value)}
                >
                    {value}
                </p>
                {subLabel && (
                    <p className="mt-0.5 text-xs text-slate-500">{subLabel}</p>
                )}
            </div>

            {/* Excel Download Icon */}
            {onExportExcel && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onExportExcel();
                    }}
                    disabled={isExporting}
                    className="p-1.5 rounded-md border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 active:bg-emerald-200 transition-all flex items-center justify-center shadow-xs disabled:opacity-50 disabled:cursor-not-allowed group flex-shrink-0"
                    title="Download Excel"
                    aria-label="Download Excel"
                >
                    {isExporting ? (
                        <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                    ) : (
                        <FileSpreadsheet className="h-4 w-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                    )}
                </button>
            )}

            {/* Icon */}
            {icon && (
                <div
                    className={cn(
                        "h-9 w-9 rounded flex items-center justify-center border border-slate-300 flex-shrink-0",
                        iconBg
                    )}
                    aria-hidden="true"
                >
                    {icon}
                </div>
            )}
        </div>
    );
};

DashboardCard.displayName = "DashboardCard";