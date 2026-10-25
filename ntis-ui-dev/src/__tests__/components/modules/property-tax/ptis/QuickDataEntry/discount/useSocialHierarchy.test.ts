import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSocialHierarchy } from '@/components/modules/property-tax/ptis/QuickDataEntry/discount/useSocialHierarchy';
import { FlatSocialAttributeState } from '@/lib/utils/social-details';
import { SocialAttribute } from '@/types/social-attribute.types';

describe('useSocialHierarchy - Common Area Attributes Filtering', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockSocialMasterAttributes = [
        {
            id: 201,
            socialAttributeCode: 'ELEC_CONN',
            socialAttributeName: 'Electric Connection',
            dataType: 'BIT',
            isDiscountApplicable: false,
            isCommonAreaAttribute: false,
            isActive: true,
        },
        {
            id: 202,
            socialAttributeCode: 'LIFT_AVAIL',
            socialAttributeName: 'Lift Available',
            dataType: 'BIT',
            isDiscountApplicable: false,
            isCommonAreaAttribute: true,
            isActive: true,
        },
    ] as unknown as SocialAttribute[];

    const mockSocialData = {
        201: {
            id: 1,
            socialAttributeId: 201,
            socialAttributeCode: 'ELEC_CONN',
            socialAttributeName: 'Electric Connection',
            dataType: 'BIT',
            bitValue: true,
            isCommonAreaAttribute: false,
        },
        202: {
            id: 2,
            socialAttributeId: 202,
            socialAttributeCode: 'LIFT_AVAIL',
            socialAttributeName: 'Lift Available',
            dataType: 'BIT',
            bitValue: true,
            isCommonAreaAttribute: true,
        },
    } as unknown as Record<number, FlatSocialAttributeState>;

    const t = (key: string) => key;

    it('shows common area attributes when isUnitLevel is false', () => {
        const { result } = renderHook(() =>
            useSocialHierarchy({
                socialMasterAttributes: mockSocialMasterAttributes,
                initialSocialData: null,
                socialData: mockSocialData,
                selectedId: 202,
                searchTerm: '',
                showActiveFirst: false,
                incompleteAttributes: [],
                isUnitLevel: false,
                t,
            })
        );

        expect(result.current.filteredAttributes.map(a => a.socialAttributeId)).toEqual([201, 202]);
        expect(result.current.activeSelectedId).toBe(202);
    });

    it('hides common area attributes when isUnitLevel is true and falls back to unit attribute', () => {
        const { result } = renderHook(() =>
            useSocialHierarchy({
                socialMasterAttributes: mockSocialMasterAttributes,
                initialSocialData: null,
                socialData: mockSocialData,
                selectedId: 202, // User had selected common attribute 202 at apartment level
                searchTerm: '',
                showActiveFirst: false,
                incompleteAttributes: [],
                isUnitLevel: true,
                t,
            })
        );

        expect(result.current.filteredAttributes.map(a => a.socialAttributeId)).toEqual([201]);
        // Selection should automatically fall back to 201
        expect(result.current.activeSelectedId).toBe(201);
    });
});
