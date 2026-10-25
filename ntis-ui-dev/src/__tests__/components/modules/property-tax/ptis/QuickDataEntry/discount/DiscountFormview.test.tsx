import { vi } from 'vitest';

// HOISTED MOCKS - Must be at the very top to prevent Vite from resolving the real modules
vi.mock('server-only', () => ({}));
vi.mock('@/services/api.service', () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    }
}));
vi.mock('@/lib/api/document.service', () => ({
    uploadDocument: vi.fn(),
    getViewDocumentUrl: vi.fn(() => 'mock-url'),
}));
vi.mock('@/lib/api/discount.service', () => ({
    updateDiscountDetails: vi.fn(),
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, Mock } from 'vitest';
import DiscountFormview from '@/components/modules/property-tax/ptis/QuickDataEntry/discount/DiscountFormview';
import { PropertyDiscountInfoResponseDto } from '@/types/discount.types';
import { toast } from 'sonner';

// Mock next/navigation
const mockPush = vi.fn();
const mockParams = { locale: 'en', propertyId: '123' };
let mockSearchQuery = 'view=social';

vi.mock('next/navigation', () => ({
  useParams: vi.fn(() => mockParams),
  useRouter: vi.fn(() => ({
    push: mockPush,
    refresh: vi.fn(),
  })),
  usePathname: vi.fn(() => '/en/property-tax/ptis/QuickDataEntry/123/Discount'),
  useSearchParams: vi.fn(() => new URLSearchParams(mockSearchQuery)),
}));

// Mock ConfirmProvider
vi.mock('@/components/common/ConfirmProvider', () => ({
  useConfirm: () => ({
    confirm: vi.fn((options) => options.onConfirm()),
  }),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    const translations: Record<string, string> = {
      'discount.title': 'Discount Information',
      'discount.description': 'Configure discount eligibility',
      'discount.socialTitle': 'Other Social Information',
      'discount.socialDescription': 'Configure social attributes, status, and associated documents for this property.',
      'discount.unitLabel': 'Unit: {unit}',
      'discount.solarPanel': 'Solar Panel System',
      'discount.solarHeater': 'Solar Water Heater',
      'discount.uploadDocument': 'Upload Document',
      'discount.viewDocument': 'View Document',
      'discount.saveSuccess': 'Discount details saved successfully!',
      'discount.saveError': 'Failed to save discount details',
      'discount.searchPlaceholder': 'Search discount attributes...',
      'discount.statusActiveUploaded': 'Active & Uploaded',
      'discount.statusIncomplete': 'Incomplete',
      'discount.statusDisabled': 'Disabled',
      'discount.showActiveFirst': 'Show Active First',
      'discount.noDiscountsFound': 'No discount attributes found',
      'discount.incompleteCertificates': 'The following attributes have incomplete required fields',
      'discount.bannerNavigationHint': 'Click an attribute tag to navigate directly to its fields.',
      'discount.bannerTagAriaLabel': 'View incomplete fields for {name}',
      'discount.bannerTagTooltip': 'Click to view incomplete fields for {name}',
      'discount.disabledWithDataNote': 'This discount is currently disabled. Toggle it active to edit details.',
      'discount.enableDiscountPrompt': 'This discount type is currently disabled. Toggle it active in the sidebar list to edit details and attach documents.',
      'discount.selectDiscountPrompt': 'Select a discount attribute from the sidebar to edit details',
      'discount.verifyDetailsNote': 'Verify details & file attachment before saving changes.',
      'common.saveChanges': 'Save Changes',
      'common.validation.documentRequired': 'Document is required',
      'building.statusActiveUploaded': 'Active & Uploaded',
      'building.statusIncomplete': 'Incomplete',
      'building.statusDisabled': 'Disabled',
      'building.searchPlaceholder': 'Search discounts...',
      'building.showActiveFirst': 'Show Active First',
      'building.editingCertificate': 'Discount Details',
      'building.selectCertificatePrompt': 'Select an attribute from the sidebar to edit details',
      'building.verifyDetailsNote': 'Verify details & file attachment before saving changes.'
    };
    let val = translations[key] || key;
    if (values) {
      Object.entries(values).forEach(([k, v]) => {
        val = val.replace(`{${k}}`, String(v));
      });
    }
    return val;
  },
  useLocale: () => 'en',
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// We need to mock the action as well because it's imported by the hook
vi.mock('@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/Discount/discount-actions', () => ({
  updateDiscountDetailsAction: vi.fn(),
  uploadDiscountDocumentAction: vi.fn(),
  replaceDiscountDocumentAction: vi.fn(),
  deleteDiscountDocumentAction: vi.fn(),
  deletePropertySocialDetailAction: vi.fn(),
}));

vi.mock('@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/Discount/social-actions', () => ({
  getPropertySocialInfoAction: vi.fn(),
  upsertPropertySocialInfoAction: vi.fn(),
  uploadSocialPhotoAction: vi.fn(),
  replaceSocialPhotoAction: vi.fn(),
  deleteSocialDocumentAction: vi.fn(),
  deletePropertySocialDetailAction: vi.fn(),
}));

import { updateDiscountDetailsAction } from '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/Discount/discount-actions';

const mockInitialData: PropertyDiscountInfoResponseDto = {
  propertyId: 123,
  discountAttributes: [
    {
      id: 1,
      socialAttributeCode: "SOLAR_PANEL",
      socialAttributeName: "Solar Panel System",
      dataType: "BIT",
      isDiscountApplicable: true,
      propertySocialDetailId: 10,
      bitValue: true,
      isActive: true,
      documentGuid: "guid-solar",
      documentBindingId: 100
    },
    {
      id: 2,
      socialAttributeCode: "SOLAR_WATER_HEATER",
      socialAttributeName: "Solar Water Heater",
      dataType: "BIT",
      isDiscountApplicable: true,
      propertySocialDetailId: null,
      bitValue: false,
      isActive: true,
      documentGuid: "guid-water", // Setting documentGuid so that validation passes when enabled
      documentBindingId: 101
    }
  ]
};

const mockSocialData = {
  propertyId: 123,
  socialAttributes: [
    {
      id: 1,
      socialAttributeCode: "HAS_SOLAR",
      socialAttributeName: "Solar Panel Installed",
      dataType: "BIT",
      bitValue: true,
      isRequiredWhenParentTrue: false,
      isDiscountApplicable: true,
      children: []
    }
  ]
};

describe('DiscountFormview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchQuery = 'view=social';
  });

  it('renders correctly with initial data', () => {
    mockSearchQuery = 'view=social';
    const { rerender } = render(
      <DiscountFormview
        initialDiscountData={mockInitialData}
        initialSocialData={mockSocialData}
        propertyId="123"
      />
    );

    expect(screen.getAllByText('Discount Information').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Other Social Information').length).toBeGreaterThan(0);

    const discountTab = screen.getByRole('tab', { name: /Discount Information/i });
    fireEvent.click(discountTab);

    mockSearchQuery = 'view=discount';
    rerender(
      <DiscountFormview
        initialDiscountData={mockInitialData}
        initialSocialData={mockSocialData}
        propertyId="123"
      />
    );

    expect(screen.getAllByText('Solar Panel System').length).toBeGreaterThan(0);
  });

  it('disables save button initially', () => {
    mockSearchQuery = 'view=discount';
    render(
      <DiscountFormview
        initialDiscountData={mockInitialData}
        initialSocialData={mockSocialData}
        propertyId="123"
      />
    );

    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    expect(saveBtn).toBeDisabled();
  });

  it('enables save button when a toggle is changed', async () => {
    mockSearchQuery = 'view=discount';
    render(
      <DiscountFormview
        initialDiscountData={mockInitialData}
        initialSocialData={mockSocialData}
        propertyId="123"
      />
    );

    const switches = screen.getAllByRole('switch');
    // Toggle the second switch (index 2)
    fireEvent.click(switches[2]);

    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    expect(saveBtn).not.toBeDisabled();
  });

  it('calls updateDiscountDetailsAction when saving', async () => {
    (updateDiscountDetailsAction as Mock).mockResolvedValue({ success: true });
    mockSearchQuery = 'view=discount';

    render(
      <DiscountFormview
        initialDiscountData={mockInitialData}
        initialSocialData={mockSocialData}
        propertyId="123"
      />
    );

    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[2]);

    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(updateDiscountDetailsAction).toHaveBeenCalled();
      const call = (updateDiscountDetailsAction as Mock).mock.calls[0];
      expect(call[0]).toBe('en');
      expect(call[1]).toBe('123');
      const formData = call[2] as FormData;
      expect(formData).toBeInstanceOf(FormData);
      const discountAttributes = JSON.parse(formData.get("discountAttributes") as string);
      expect(discountAttributes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            socialAttributeId: 2,
            bitValue: true,
            isActive: true,
          })
        ])
      );
      expect(toast.success).toHaveBeenCalledWith("Discount details saved successfully!");
    });
  });

  it('handles submission error correctly', async () => {
    (updateDiscountDetailsAction as Mock).mockResolvedValue({ success: false, error: 'Save failed' });
    mockSearchQuery = 'view=discount';

    render(
      <DiscountFormview
        initialDiscountData={mockInitialData}
        initialSocialData={mockSocialData}
        propertyId="123"
      />
    );

    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[2]);

    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Save failed");
    });
  });

  it('synchronizes active tab with URL query parameter when tab is clicked', () => {
    mockSearchQuery = 'view=social';
    render(
      <DiscountFormview
        initialDiscountData={mockInitialData}
        initialSocialData={mockSocialData}
        propertyId="123"
      />
    );

    const discountTab = screen.getByRole('tab', { name: /Discount Information/i });
    fireEvent.click(discountTab);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('view=discount')
    );
  });

  it('starts on discount tab when URL query parameter view is set to discount', () => {
    mockSearchQuery = 'view=discount';
    render(
      <DiscountFormview
        initialDiscountData={mockInitialData}
        initialSocialData={mockSocialData}
        propertyId="123"
      />
    );

    expect(screen.getAllByText('Solar Panel System').length).toBeGreaterThan(0);
  });
});
