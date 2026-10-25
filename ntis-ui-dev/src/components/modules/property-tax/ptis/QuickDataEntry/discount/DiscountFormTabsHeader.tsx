import React from "react";
import { Tabs, Button } from "@/components/common";
import { Building2, Home, Store, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ApplicationLevel } from "@/types/building-permission.types";

interface DiscountFormTabsHeaderProps {
    showLevelSelector: boolean;
    showApartmentTab: boolean;
    showWingTab: boolean;
    level: ApplicationLevel;
    onLevelChange: (level: "Apartment" | "Wing" | "Unit") => void;
    isLoading?: boolean;
    isTabLoading?: boolean;
    isLevelLoading?: boolean;
    targetTab?: string | null;
    targetLevel?: "Apartment" | "Wing" | "Unit" | null;
    activeTab?: string;
    t: (key: string) => string;
}

const TabLoader: React.FC<React.ComponentProps<typeof Loader2>> = (props) => (
    <Loader2 {...props} className={cn("animate-spin text-blue-600", props.className)} />
);

export const DiscountFormTabsHeader: React.FC<DiscountFormTabsHeaderProps> = ({
    showLevelSelector,
    showApartmentTab,
    showWingTab,
    level,
    onLevelChange,
    isLoading = false,
    isTabLoading: propIsTabLoading,
    isLevelLoading: propIsLevelLoading,
    targetTab,
    targetLevel,
    activeTab = "discount",
    t,
}) => {
    const isTabLoading = propIsTabLoading ?? isLoading;
    const isLevelLoading = propIsLevelLoading ?? isLoading;

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 sm:mb-2.5 gap-2 flex-shrink-0">
            <Tabs.TabList
                scrollable={false}
                className="bg-slate-100 p-1 rounded-xl border border-slate-200 h-10 flex items-center shadow-xs overflow-hidden w-full sm:w-[380px]"
            >
                <Tabs.Tab
                    value="discount"
                    icon={isTabLoading && (targetTab === "discount" || (!targetTab && activeTab === "discount")) ? TabLoader : undefined}
                    className="w-1/2 flex-1 justify-center h-8 text-xs font-bold cursor-pointer transition-all duration-200 whitespace-nowrap overflow-hidden"
                >
                    {t("discount.title")}
                </Tabs.Tab>
                <Tabs.Tab
                    value="social"
                    icon={isTabLoading && (targetTab === "social" || (!targetTab && activeTab === "social")) ? TabLoader : undefined}
                    className="w-1/2 flex-1 justify-center h-8 text-xs font-bold cursor-pointer transition-all duration-200 whitespace-nowrap overflow-hidden"
                >
                    {t("discount.socialTitle")}
                </Tabs.Tab>
            </Tabs.TabList>

            {showLevelSelector && (
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 h-10 flex-shrink-0 shadow-xs">
                    {showApartmentTab && (
                        <Button
                            size="xs"
                            variant={level === 'Apartment' ? 'primary' : 'ghost'}
                            icon={Building2}
                            isLoading={Boolean(isLevelLoading && (targetLevel === 'Apartment' || (!targetLevel && level === 'Apartment')))}
                            disabled={isLevelLoading}
                            onClick={() => onLevelChange('Apartment')}
                            className={cn(
                                'font-bold cursor-pointer rounded-lg transition-all duration-200 h-8',
                                level === 'Apartment'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-blue-900 hover:bg-slate-200/50'
                            )}
                        >
                            {t('building.apartmentLevel') || 'Apartment Level'}
                        </Button>
                    )}
                    {showWingTab && (
                        <Button
                            size="xs"
                            variant={level === 'Wing' ? 'primary' : 'ghost'}
                            icon={Home}
                            isLoading={Boolean(isLevelLoading && (targetLevel === 'Wing' || (!targetLevel && level === 'Wing')))}
                            disabled={isLevelLoading}
                            onClick={() => onLevelChange('Wing')}
                            className={cn(
                                'font-bold cursor-pointer rounded-lg transition-all duration-200 h-8',
                                level === 'Wing'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-blue-900 hover:bg-slate-200/50'
                            )}
                        >
                            {t('building.wingLevel') || 'Wing Level'}
                        </Button>
                    )}
                    <Button
                        size="xs"
                        variant={level === 'Unit' ? 'primary' : 'ghost'}
                        icon={Store}
                        isLoading={Boolean(isLevelLoading && (targetLevel === 'Unit' || (!targetLevel && level === 'Unit')))}
                        disabled={isLevelLoading}
                        onClick={() => onLevelChange('Unit')}
                        className={cn(
                            'font-bold cursor-pointer rounded-lg transition-all duration-200 h-8',
                            level === 'Unit'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-blue-900 hover:bg-slate-200/50'
                        )}
                    >
                        {t('building.unitLevel') || 'Unit Level'}
                    </Button>
                </div>
            )}
        </div>
    );
};
