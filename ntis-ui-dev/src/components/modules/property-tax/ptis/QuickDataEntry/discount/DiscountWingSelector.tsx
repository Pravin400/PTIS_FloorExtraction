import React from "react";
import { Button, Label } from "@/components/common";
import { cn } from "@/lib/utils/cn";
import { Loader2 } from "lucide-react";
import { useDiscountLevelState } from "@/hooks/useDiscountLevelState";

interface DiscountWingSelectorProps {
    levelState?: ReturnType<typeof useDiscountLevelState>;
    isSociety?: boolean;
    isLoadingWing?: boolean;
    onSelectWing: (wingDetailId: number) => void;
    t: {
        (key: string, values?: Record<string, string | number | Date>): string;
    };
}

export const DiscountWingSelector: React.FC<DiscountWingSelectorProps> = ({
    levelState,
    isSociety,
    isLoadingWing = false,
    onSelectWing,
    t,
}) => {
    if (!isSociety || !levelState || (levelState.level !== 'Wing' && levelState.level !== 'Unit')) {
        return null;
    }

    return (
        <div className="flex-shrink-0 space-y-1.5 bg-slate-50/60 p-2.5 rounded-lg border border-slate-200">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                {t('building.selectWing') || 'SELECT WING'}
            </Label>
            <div className="flex flex-wrap gap-2">
                {levelState.wings.length > 0 ? (
                    levelState.wings.map((wing) => {
                        const isSelected = levelState.selectedWingDetailId === wing.wingDetailId;
                        return (
                            <Button
                                key={wing.wingDetailId}
                                size="xs"
                                variant={isSelected ? 'success' : 'secondary'}
                                onClick={() => onSelectWing(wing.wingDetailId)}
                                className={cn(
                                    'px-4 font-semibold rounded-lg transition-all cursor-pointer border flex items-center gap-1.5',
                                    isSelected
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-xs'
                                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                )}
                            >
                                {isLoadingWing && isSelected && (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                                )}
                                {wing.wingName}
                            </Button>
                        );
                    })
                ) : (
                    <div className="text-xs text-slate-400 italic">
                        {t('building.noWingsFound') || 'No wings found'}
                    </div>
                )}
            </div>
        </div>
    );
};
