 

import { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
interface WorkflowTabButtonProps {
    tab: {
        title: string;
        data: { structure: string; unit: string };
    };
    isActive: boolean;
    icon: LucideIcon;
    colors: {
        text: string;
        bgSolid: string;
        bgLight: string;
        border: string;
        ring: string;
        bgTint: string;
    };
    isClickable?: boolean;
}

export function WorkflowTabButton({ tab, isActive, icon: Icon, colors, isClickable = true }: WorkflowTabButtonProps) {
    const t = useTranslations('automationDashboard.summaryCards.metrics');

    return (
        <div
            className={`w-full min-w-0 transition-all duration-300 rounded-xl p-2 border-2 relative overflow-hidden flex flex-col ${isClickable ? 'bg-white dark:bg-slate-900 group hover:shadow-lg hover:-translate-y-0.5' : 'bg-slate-200 dark:bg-slate-900 opacity-80'} ${isActive ? `shadow-lg ${colors.border} ${colors.ring} ring-2` : "shadow-sm border-slate-300 dark:border-slate-700"}`}
        >
            {/* Active: clear tint so card is obviously selected */}
            {isActive && (
                <div
                    className={`absolute inset-0 rounded-xl pointer-events-none z-0 ${colors.bgTint}`}
                />
            )}
            <div className="flex flex-col gap-1.5 relative z-10 text-left">
                {/* Icon + heading row: both use stage color so they’re clearly visible */}
                <div className={`flex items-center gap-2 min-w-0 ${colors.text}`}>
                    <div
                        className={`p-1.5 rounded-lg flex-shrink-0 transition-all duration-300 group-hover:scale-105 shadow border-2 ${isActive ? colors.bgSolid : colors.bgLight} ${colors.border}`}
                    >
                        <Icon
                            className={`h-4 w-4 transition-transform duration-300 ${isActive ? 'text-white' : colors.text}`}
                            strokeWidth={2.25}
                        />
                    </div>
                    <p className={`text-sm truncate leading-tight font-[600] min-w-0 ${colors.text}`}>
                        {tab.title}
                    </p>
                </div>

                <div className="flex items-center gap-2 justify-center">
                    <div className="text-center">
                        <p className="text-[10px] font-bold mb-0.5 text-slate-600 dark:text-slate-400">{t('structure')}</p>
                        <p className="text-sm font-bold text-black dark:text-white">{tab.data.structure}</p>
                    </div>
                    <div className="h-6 w-px bg-slate-300 dark:bg-slate-600" />
                    <div className="text-center">
                        <p className="text-[10px] font-bold mb-0.5 text-slate-600 dark:text-slate-400">{t('unit')}</p>
                        <p className="text-sm font-bold text-black dark:text-white">{tab.data.unit}</p>
                    </div>
                </div>
            </div>

            {/* Active: thick left bar so selected card is obvious */}
            {isActive && (
                <div
                    className={`absolute left-0 top-0 bottom-0 w-2.5 rounded-l-xl z-10 shadow-sm ${colors.bgSolid}`}
                    aria-hidden="true"
                />
            )}
        </div>
    );
}
