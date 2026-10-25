import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDiscountSelectionState } from '@/components/modules/property-tax/ptis/QuickDataEntry/discount/useDiscountSelectionState';
import { DiscountState } from '@/types/discount.types';
import { SocialAttribute } from '@/types/social-attribute.types';
import { ReadonlyURLSearchParams } from 'next/navigation';
import { useDiscountLevelState } from '@/hooks/useDiscountLevelState';

describe('useDiscountSelectionState - Common Area Attributes Filtering', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockDiscounts: DiscountState = {
        101: {
            id: 101,
            socialAttributeCode: 'SOLAR_PANEL',
            socialAttributeName: 'Solar Panel System',
            dataType: 'BIT',
            enabled: true,
            isDiscountApplicable: true,
            isCommonAreaAttribute: false,
        },
        102: {
            id: 102,
            socialAttributeCode: 'HAS_STP',
            socialAttributeName: 'Sewage Treatment Plant',
            dataType: 'BIT',
            enabled: true,
            isDiscountApplicable: true,
            isCommonAreaAttribute: true,
        },
    };

    const mockMasterAttributes = [
        {
            id: 101,
            socialAttributeCode: 'SOLAR_PANEL',
            socialAttributeName: 'Solar Panel System',
            dataType: 'BIT',
            isDiscountApplicable: true,
            isCommonAreaAttribute: false,
        },
        {
            id: 102,
            socialAttributeCode: 'HAS_STP',
            socialAttributeName: 'Sewage Treatment Plant',
            dataType: 'BIT',
            isDiscountApplicable: true,
            isCommonAreaAttribute: true,
        },
    ] as unknown as SocialAttribute[];

    const t = (key: string) => key;

    it('shows all attributes when at Apartment level in society', () => {
        const { result } = renderHook(() =>
            useDiscountSelectionState({
                discountData: mockDiscounts,
                discountMasterAttributes: mockMasterAttributes,
                searchParams: new URLSearchParams() as unknown as ReadonlyURLSearchParams,
                pathname: '/test',
                handleToggleEnabled: vi.fn(),
                handleSave: vi.fn(),
                isSociety: true,
                levelState: { level: 'Apartment' } as unknown as ReturnType<typeof useDiscountLevelState>,
                editingUnitId: null,
                t,
            })
        );

        expect(result.current.filteredDiscounts.map(d => d.id)).toEqual([101, 102]);
    });

    it('filters out common area attributes when at Unit level in society', () => {
        const { result } = renderHook(() =>
            useDiscountSelectionState({
                discountData: mockDiscounts,
                discountMasterAttributes: mockMasterAttributes,
                searchParams: new URLSearchParams('socialAttributeId=102') as unknown as ReadonlyURLSearchParams,
                pathname: '/test',
                handleToggleEnabled: vi.fn(),
                handleSave: vi.fn(),
                isSociety: true,
                levelState: { level: 'Unit' } as unknown as ReturnType<typeof useDiscountLevelState>,
                editingUnitId: null,
                t,
            })
        );

        // Common area attribute 102 should be filtered out
        expect(result.current.filteredDiscounts.map(d => d.id)).toEqual([101]);
        // And activeSelectedId should fall back to non-common attribute 101 instead of 102
        expect(result.current.activeSelectedId).toBe(101);
    });

    it('retains common area attributes when isSociety is false (individual property)', () => {
        const { result } = renderHook(() =>
            useDiscountSelectionState({
                discountData: mockDiscounts,
                discountMasterAttributes: mockMasterAttributes,
                searchParams: new URLSearchParams() as unknown as ReadonlyURLSearchParams,
                pathname: '/test',
                handleToggleEnabled: vi.fn(),
                handleSave: vi.fn(),
                isSociety: false,
                editingUnitId: null,
                t,
            })
        );

        expect(result.current.filteredDiscounts.map(d => d.id)).toEqual([101, 102]);
    });
});
