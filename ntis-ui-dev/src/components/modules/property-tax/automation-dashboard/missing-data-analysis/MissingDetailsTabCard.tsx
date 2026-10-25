import { LucideIcon } from 'lucide-react';

export interface TabColorConfig {
    text: string;
    bgSolid: string;
    bgLight: string;
    border: string;
    ring: string;
    bgTint: string;
}

export interface MissingDetailsTabCardProps {
    title: string;
    isActive: boolean;
    icon: LucideIcon;
    colors: TabColorConfig;
    onClick?: () => void;
}

export function MissingDetailsTabCard({
    title,
    isActive,
    icon: Icon,
    colors,
    onClick,
}: MissingDetailsTabCardProps) {
    return (
        <button
            onClick={onClick}
            className={`w-full min-w-0 transition-all duration-300 rounded-xl p-2.5 border-2 relative overflow-hidden flex flex-col text-left outline-none cursor-pointer group hover:shadow-lg hover:-translate-y-0.5 ${
                isActive
                    ? `shadow-lg ${colors.border} ${colors.ring} ring-2 bg-white`
                    : 'shadow-sm border-slate-200 bg-white hover:border-slate-300'
            }`}
        >
            {/* Active Background Tint */}
            {isActive && (
                <div
                    className={`absolute inset-0 rounded-xl pointer-events-none z-0 ${colors.bgTint}`}
                />
            )}

            {/* Card Content Header */}
            <div className="flex items-center gap-2 min-w-0 relative z-10">
                <div
                    className={`p-1.5 rounded-lg flex-shrink-0 transition-all duration-300 group-hover:scale-105 shadow border ${
                        isActive
                            ? `${colors.bgSolid} ${colors.border}`
                            : `${colors.bgLight} ${colors.border}`
                    }`}
                >
                    <Icon
                        className={`h-4 w-4 transition-transform duration-300 ${
                            isActive ? 'text-white' : colors.text
                        }`}
                        strokeWidth={2.25}
                    />
                </div>
                <p className={`text-xs sm:text-sm truncate leading-tight font-semibold min-w-0 ${colors.text}`}>
                    {title}
                </p>
            </div>

            {/* Active Left Accent Bar */}
            {isActive && (
                <div
                    className={`absolute left-0 top-0 bottom-0 w-2.5 rounded-l-xl z-10 shadow-sm ${colors.bgSolid}`}
                    aria-hidden="true"
                />
            )}
        </button>
    );
}
