import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { SortDirection, SortConfig } from '@/lib/utils/automation-dashboard/sortUtils';

export type ViewType = 'zone' | 'ward';

export const SortIconComponent = ({ direction }: { direction: SortDirection, viewType: ViewType }) => {
    if (direction === 'asc') {
        return <ArrowUp className="inline-block ml-1 w-3 h-3 shrink-0 text-slate-600" strokeWidth={2.5} />;
    }
    if (direction === 'desc') {
        return <ArrowDown className="inline-block ml-1 w-3 h-3 shrink-0 text-slate-600" strokeWidth={2.5} />;
    }
    return <ArrowUpDown className="inline-block ml-1 w-3 h-3 shrink-0 text-slate-600 opacity-70 group-hover:opacity-100 group-hover:text-indigo-600 transition-all" />;
};

export const renderSortableHeader = <T,>(
    title: string,
    sortKey: keyof T | null,
    sortConfig?: SortConfig<T> | null,
    onSort?: (key: keyof T) => void,
    alignLeft: boolean = false,
    viewType: ViewType = 'zone'
) => {
    const isSorted = sortConfig?.key === sortKey;
    const direction = isSorted ? sortConfig.direction : null;
    const isSortable = Boolean(sortKey);

    return (
        <div
            className={`flex items-center ${alignLeft ? 'justify-start' : 'justify-center'} gap-1 font-bold text-[15px] text-slate-700 ${isSortable ? 'cursor-pointer select-none group' : ''}`}
            onClick={() => isSortable && sortKey && onSort?.(sortKey)}
        >
            <span className={alignLeft ? 'uppercase' : ''}>{title}</span>
            {sortKey && (
                <SortIconComponent direction={direction} viewType={viewType} />
            )}
        </div>
    );
};
