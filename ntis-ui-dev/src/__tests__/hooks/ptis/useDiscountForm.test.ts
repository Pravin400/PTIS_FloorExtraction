import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDiscountForm } from '@/hooks/useDiscountForm';
import { toast } from 'sonner';
import { deletePropertySocialDetailsByHierarchyAction } from '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/Discount/discount-actions';

vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/hooks/useLoading', () => ({
  useLoading: () => ({
    isLoading: false,
    startLoading: vi.fn(),
    stopLoading: vi.fn(),
  }),
}));

vi.mock('@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/Discount/discount-actions', () => ({
  updateDiscountDetailsAction: vi.fn(),
  deletePropertySocialDetailsByHierarchyAction: vi.fn(),
}));

const mockDiscountData = {
  propertyId: 123,
  discountAttributes: [
    {
      id: 1,
      socialAttributeCode: "DISC1",
      socialAttributeName: "Discount 1",
      dataType: "BIT",
      isDiscountApplicable: true,
      propertySocialDetailId: 10,
      bitValue: true,
      isActive: true,
      documentGuid: "doc-guid",
      documentBindingId: 100
    }
  ]
};

describe('useDiscountForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with mapped discount state', () => {
    const { result } = renderHook(() => useDiscountForm(mockDiscountData, "123"));
    expect(result.current.discountData[1]).toBeDefined();
    expect(result.current.discountData[1].enabled).toBe(true);
  });

  it('should call deletePropertySocialDetailsByHierarchyAction and clear local state on handleDeleteDiscount', async () => {
    vi.mocked(deletePropertySocialDetailsByHierarchyAction).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useDiscountForm(mockDiscountData, "123"));

    await act(async () => {
      await result.current.handleDeleteDiscount(1);
    });

    expect(deletePropertySocialDetailsByHierarchyAction).toHaveBeenCalledWith(
      { socialAttributeId: 1, entityType: "P", propertyId: 123, propertyIds: [123] },
      "123",
      "en"
    );
    expect(result.current.discountData[1].bitValue).toBe(false);
    expect(result.current.discountData[1].enabled).toBe(false);
    expect(result.current.discountData[1].documentGuid).toBeNull();
    expect(toast.success).toHaveBeenCalledWith("discount.deleteSuccess");
  });

  it('should hydrate direct unit record when editing a specific unit at Unit level', () => {
    const masterAttributes = [
      {
        id: 1,
        socialAttributeCode: "STP",
        socialAttributeName: "Sewage Treatment Plant",
        dataType: "BIT",
        isDiscountApplicable: true,
        isActive: true,
      }
    ];

    const savedPropertyDetails = [
      {
        id: 555,
        socialAttributeId: 1,
        propertyId: 1001,
        entityType: 'P',
        bitValue: true,
        documentBindingId: 777,
        documentGuid: "stp-a1-guid",
        fileName: "stp_a1.pdf",
        remark: "A1 Sewage plant remark",
        isActive: true,
      }
    ];

    const { result, rerender } = renderHook(
      (props: { editingUnitId: number | null }) =>
        useDiscountForm(
          mockDiscountData,
          "123",
          masterAttributes as unknown as Parameters<typeof useDiscountForm>[2],
          {
            level: 'Unit',
            savedPropertyDetails: savedPropertyDetails as unknown as NonNullable<Parameters<typeof useDiscountForm>[3]>['savedPropertyDetails'],
            editingUnitId: props.editingUnitId,
            isSociety: true,
          }
        ),
      {
        initialProps: { editingUnitId: 1001 },
      }
    );

    // Unit A1 has direct record saved
    expect(result.current.discountData[1]).toBeDefined();
    expect(result.current.discountData[1].propertySocialDetailId).toBe(555);
    expect(result.current.discountData[1].documentGuid).toBe("stp-a1-guid");
    expect(result.current.discountData[1].fileName).toBe("stp_a1.pdf");
    expect(result.current.discountData[1].remark).toBe("A1 Sewage plant remark");
    expect(result.current.discountData[1].enabled).toBe(true);

    // Switch to Unit A2 (unapplied unit with ID 1002, which inherits baseline data)
    rerender({ editingUnitId: 1002 });
    expect(result.current.discountData[1].propertySocialDetailId).toBeNull();
    // Inherits document and baseline state from wing/society
    expect(result.current.discountData[1].documentGuid).toBe("doc-guid");
    // Attribute enabled toggle must remain true (preserved from master/initial baseline)
    expect(result.current.discountData[1].enabled).toBe(true);
  });

  it('should not show incompleteDiscounts or validation errors when toggling on an attribute before save', async () => {
    const uncompletedMaster = [
      {
        id: 99,
        socialAttributeCode: "SOLAR_INSTALL",
        socialAttributeName: "Solar Installed",
        dataType: "BIT",
        isDiscountApplicable: true,
        isDocumentRequired: true,
        isActive: true,
      }
    ];

    const { result } = renderHook(() =>
      useDiscountForm(null, "123", uncompletedMaster as unknown as Parameters<typeof useDiscountForm>[2])
    );

    // Initially off
    expect(result.current.incompleteDiscounts).toEqual([]);
    expect(result.current.validationErrors).toEqual({});

    // Toggle ON
    act(() => {
      result.current.handleToggleEnabled(99, true);
    });

    // Enabled is true, but incompleteDiscounts MUST remain empty before save attempt
    expect(result.current.discountData[99].enabled).toBe(true);
    expect(result.current.incompleteDiscounts).toEqual([]);
    expect(result.current.validationErrors).toEqual({});

    // Attempt save without required document -> now incompleteDiscounts is populated
    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.incompleteDiscounts.length).toBe(1);
    expect(result.current.incompleteDiscounts[0].id).toBe(99);

    // Attach document -> incompleteDiscounts clears
    act(() => {
      const file = new File(["dummy content"], "solar.pdf", { type: "application/pdf" });
      result.current.handleFileUpload(99, file);
    });

    expect(result.current.incompleteDiscounts).toEqual([]);
  });
});
