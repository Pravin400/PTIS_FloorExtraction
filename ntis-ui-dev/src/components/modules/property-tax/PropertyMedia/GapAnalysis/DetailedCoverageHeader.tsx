'use client';

import type { RefObject } from 'react';
import { Button, SearchInput } from '@/components/common';
import { Badge } from '@/components/common/Badge';

export interface DetailedCoverageHeaderProps {
    searchInputRef: RefObject<HTMLInputElement | null>;
    searchTerm: string;
    onSearchChange: (value: string) => void;
    currentCategoryLabel: string;
    isShowAllDisabled: boolean;
    onShowAll: () => void;
    t:(key:string)=> string;
}

export function DetailedCoverageHeader({
    searchInputRef,
    searchTerm,
    onSearchChange,
    currentCategoryLabel,
    isShowAllDisabled,
    onShowAll,
    t,
}: DetailedCoverageHeaderProps) {

    return (
        <div className="px-4">
            {/* Horizontal Line */}
            <div className="w-full h-[2px] bg-[#e2edf8]" />

            {/* Header Content */}
            <div className="flex items-center justify-between gap-4 py-3">
                {/* Left Side */}
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">
                        {t('detailedCoverageHeader.title')}
                    </span>

                    <Badge
                        variant={isShowAllDisabled ? 'secondary' : 'default'}
                        size="lg"
                        className={!isShowAllDisabled ? 'bg-blue-50 text-blue-700 border-blue-200 font-medium' : ''}
                    >
                        {currentCategoryLabel}
                    </Badge>
                    {!isShowAllDisabled && (
                        <Button
                            variant="secondary"
                            size="xs"
                            disabled={isShowAllDisabled}
                            onClick={onShowAll}
                            className={`h-8 rounded-lg border border-gray-200 px-3 text-xs font-medium transition-all ${isShowAllDisabled
                                ? 'bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed hover:bg-gray-100'
                                : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'
                                }`}
                        >
                            {t('detailedCoverageHeader.showAll')}
                        </Button>

                    )}

                </div>

                {/* Right Side - Search */}
                <div className="w-[200px]">
                    <SearchInput
                        value={searchTerm}
                        inputRef={searchInputRef}
                        onChange={onSearchChange}
                        placeholder={t('detailedCoverageHeader.searchPlaceholder')}
                        className="mb-0 w-full text-gray-900"
                    />
                </div>
            </div>
        </div>
    );
}
