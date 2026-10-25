'use client';

import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/common/ActionButton';
import { SearchSelect } from '@/components/common/SearchSelect';
import { Filter } from 'lucide-react';
import { PropertyTypeMasterItem } from '@/types/automation-dashboard/property-dashboard/property-subgrid-details.type';

export const propertyTypeOptions = [
    { value: 'All', label: 'All Types' },
    { value: '1', label: 'Residential' },
    { value: '2', label: 'NonResidential' },
    { value: '3', label: 'Mixed' },
    { value: '4', label: 'OpenPlots' },
    { value: '5', label: 'PublicUtility' },
    { value: '6', label: 'UnderConstruction' }
];

interface DashboardFilterBarProps {
    t: (key: string) => string;
    propertyDescriptions?: PropertyTypeMasterItem[];
}

export const DashboardFilterBar = ({ t, propertyDescriptions = [] }: DashboardFilterBarProps) => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const isFilterOpen = searchParams.get('isFilter') === 'true';

    const descriptionOptions = useMemo(() => {
        const mapped = propertyDescriptions.map((item) => ({ label: item.propertyDescription, value: String(item.id) }));
        return [{ value: 'All', label: 'All' }].concat(mapped);
    }, [propertyDescriptions]);

    const selectedDescription = searchParams.get('propertyTypeId') || 'All';
    const selectedCategory = searchParams.get('propertyTypeCategoryId') || 'All';

    const handleToggleFilter = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (isFilterOpen) {
            params.delete('isFilter');
            params.delete('propertyTypeId');
            params.delete('propertyTypeCategoryId');
        } else {
            params.set('isFilter', 'true');
        }
        params.set('pageNumber', '1');
        router.push(`?${params.toString()}`);
    };

    const handleDescriptionChange = (val: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (val && val !== 'All') params.set('propertyTypeId', val);
        else params.delete('propertyTypeId');
        params.set('pageNumber', '1');
        router.push(`?${params.toString()}`);
    };

    const handleCategoryChange = (val: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (val && val !== 'All') params.set('propertyTypeCategoryId', val);
        else params.delete('propertyTypeCategoryId');
        params.set('pageNumber', '1');
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-3">
            {isFilterOpen && (
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[12px] text-slate-800 whitespace-nowrap capitalize">{t('propertyDetailsDashboard.filters.Descriptionforproperty')?.toLowerCase() || 'Description'}</span>
                        <div className="w-[150px]">
                            <SearchSelect
                                id="common-filter-description"
                                name="description"
                                options={descriptionOptions}
                                value={selectedDescription}
                                onChange={(_, val) => handleDescriptionChange(val)}
                                placeholder="All"
                                className="!mb-0 !border-slate-200 !shadow-none !h-9 !text-[13px] bg-white rounded-md"
                            />
                        </div>
                    </div>                    
                    <div className="flex items-center gap-2">
                        <span className="text-[12px] text-slate-800 whitespace-nowrap capitalize">{t('propertyDetailsDashboard.filters.CategoryProperty')?.toLowerCase() || 'Category'}</span>
                        <div className="w-[150px]">
                            <SearchSelect
                                id="common-filter-category"
                                name="category"
                                options={propertyTypeOptions}
                                value={selectedCategory}
                                onChange={(_, val) => handleCategoryChange(val)}
                                placeholder="All Types"
                                className="!mb-0 !border-slate-200 !shadow-none !h-9 !text-[13px] bg-white rounded-md"
                            />
                        </div>
                    </div>
                </div>
            )}
            <Button
                variant="secondary"
                icon={Filter}
                onClick={handleToggleFilter}
                className={`h-9 px-4 text-[13px] font-semibold flex items-center gap-1.5 transition-all duration-200 rounded-md border shadow-sm ${
                    isFilterOpen
                        ? '!bg-blue-50 !text-blue-700 !border-blue-200 hover:!bg-blue-100 hover:!border-blue-300'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
                {t('propertyDetailsDashboard.filters.Filters') || 'Filters'}
            </Button>
        </div>
    );
};
