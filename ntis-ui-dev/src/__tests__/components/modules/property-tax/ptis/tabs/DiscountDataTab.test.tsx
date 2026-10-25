import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import DiscountDataTab from '@/components/modules/property-tax/ptis/tabs/DiscountDataTab';
import type { DiscountData, PropertySocialDetailItem } from '@/types/ptis.types';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      noDataAvailable: 'No data available',
      'fields.status': 'Status',
      'fields.dateLabel': 'Date',
      'fields.value': 'Value',
      'fields.yes': 'Yes',
      'fields.no': 'No',
      'fields.applied': 'Applied',
      applied: 'Applied',
      index: '#',
      discountAttribute: 'DISCOUNT ATTRIBUTE',
      socialAttribute: 'SOCIAL ATTRIBUTE',
      status: 'STATUS',
      value: 'VALUE',
      document: 'DOCUMENT',
      remark: 'REMARK',
      activeAndUploaded: 'Active & Uploaded',
      active: 'Active',
      disabled: 'Disabled',
      viewFile: 'View File',
      noDocument: 'No Document',
      noData: 'No discount or social details configured yet.',
      amount: 'AMOUNT',
      percentage: 'PERCENTAGE',
      'buildingPermission.levels.all': 'All',
      'buildingPermission.levels.allLevels': 'All Scopes',
      'buildingPermission.levels.apartment': 'Apartment Level',
      'buildingPermission.levels.wing': 'Wing Level',
      'buildingPermission.levels.unit': 'Unit Level',
      'buildingPermission.clearFilter': 'Clear Filter',
      'actions.viewDocument': 'View Document',
      partitionNo: 'Partition No',
    };
    return translations[key] || key;
  },
  useLocale: () => 'en',
}));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ locale: 'en' }),
}));

// Mock FieldShell component
vi.mock('@/components/common/FieldShell', () => ({
  default: ({ children, label }: { children: React.ReactNode; label: string }) => (
    <div data-testid="field-shell" data-label={label}>
      <span className="field-label">{label}</span>
      {children}
    </div>
  ),
}));

vi.mock('@/lib/utils/document-client-utils', () => ({
  getDocumentBlobUrl: vi.fn(() => new Promise(() => {})), // Returns pending promise for testing loading state
}));

// Mock server actions
vi.mock('@/app/[locale]/property-tax/ptis/ptis-detail-actions', () => ({
  fetchDiscountDetailsOnlyAction: vi.fn(() =>
    Promise.resolve({
      success: true,
      data: {
        items: [],
      },
    })
  ),
  fetchSocialDetailsOnlyAction: vi.fn(() =>
    Promise.resolve({
      success: true,
      data: {
        items: [
          {
            id: 4001,
            propertyId: 549442,
            socialAttributeId: 45,
            bitValue: true,
            intValue: null,
            decimalValue: null,
            textValue: null,
            dateValue: null,
            documentBindingId: null,
            remark: null,
            socialAttributeCode: 'DYNAMIC_SOCIAL',
            socialAttributeName: 'Dynamic Social Field',
            isActive: true,
            createdDate: '',
            updatedDate: null,
          },
        ],
      },
    })
  ),
}));

vi.mock('@/app/[locale]/property-tax/ptis/apartment/action', () => ({
  fetchApartmentSocialAndDiscountDetailsAction: vi.fn(() =>
    Promise.resolve({
      success: true,
      discountData: { items: [] },
      socialData: { items: [] },
    })
  ),
}));

describe('DiscountDataTab', () => {
  it('should render fallback when items is empty', () => {
    const mockData: DiscountData = { items: [] };
    render(<DiscountDataTab initialData={mockData} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('should filter out items with all null values regardless of isActive status', () => {
    const mockData: DiscountData = {
      items: [
        {
          id: 0,
          propertyId: 549442,
          socialAttributeId: 1,
          bitValue: null,
          intValue: null,
          decimalValue: null,
          textValue: null,
          dateValue: null,
          documentBindingId: null,
          remark: null,
          socialAttributeCode: 'TEST',
          socialAttributeName: 'Should be hidden',
          isActive: false,
          createdDate: '',
          updatedDate: null,
        },
      ] as PropertySocialDetailItem[],
    };
    render(<DiscountDataTab initialData={mockData} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('should filter out items when bitValue is false and other value fields are null', () => {
    const mockData: DiscountData = {
      items: [
        {
          id: 0,
          propertyId: 549442,
          socialAttributeId: 5,
          bitValue: false,
          intValue: null,
          decimalValue: null,
          textValue: null,
          dateValue: null,
          documentBindingId: null,
          remark: null,
          socialAttributeCode: 'HAS_BOREWELL_FALSE',
          socialAttributeName: 'Borewell Available False',
          isActive: true,
          createdDate: '',
          updatedDate: null,
        },
      ] as PropertySocialDetailItem[],
    };
    render(<DiscountDataTab initialData={mockData} />);
    expect(screen.queryByText('Borewell Available False')).not.toBeInTheDocument();
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('should filter out items when isActive is false even if a value field is present', () => {
    const mockData: DiscountData = {
      items: [
        {
          id: 2,
          propertyId: 549442,
          socialAttributeId: 2,
          bitValue: true,
          intValue: null,
          decimalValue: null,
          textValue: null,
          dateValue: null,
          documentBindingId: null,
          remark: null,
          socialAttributeCode: 'TEST_INACTIVE_WITH_VAL',
          socialAttributeName: 'Should be hidden when inactive',
          isActive: false,
          createdDate: '',
          updatedDate: null,
        },
      ] as PropertySocialDetailItem[],
    };
    render(<DiscountDataTab initialData={mockData} />);
    expect(screen.queryByText('Should be hidden when inactive')).not.toBeInTheDocument();
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('should display intValue when both bitValue and intValue are present', () => {
    const mockData: DiscountData = {
      items: [
        {
          id: 3036,
          propertyId: 549442,
          socialAttributeId: 34,
          bitValue: true,
          intValue: 3,
          decimalValue: null,
          textValue: null,
          dateValue: null,
          documentBindingId: 3134,
          remark: null,
          socialAttributeCode: 'GREEN_PROPERTY_STAR',
          socialAttributeName: 'Green Property Star Rating',
          isActive: true,
          createdDate: '',
          updatedDate: null,
          percentage: 10,
          amount: 500,
        },
      ] as PropertySocialDetailItem[],
    };

    render(<DiscountDataTab initialData={mockData} />);

    // Verify field label
    expect(screen.getByText('Green Property Star Rating')).toBeInTheDocument();
    // Verify display value (should be 3 instead of Yes)
    expect(screen.getByText('3')).toBeInTheDocument();

  });

  it('should display decimalValue when both bitValue and decimalValue are present', () => {
    const mockData: DiscountData = {
      items: [
        {
          id: 3033,
          propertyId: 549442,
          socialAttributeId: 22,
          bitValue: true,
          intValue: null,
          decimalValue: 45,
          textValue: null,
          dateValue: null,
          documentBindingId: 3137,
          remark: null,
          socialAttributeCode: 'SOLAR_ELECTRIC_KW',
          socialAttributeName: 'Solar Electric Capacity (KW)',
          isActive: true,
          createdDate: '',
          updatedDate: null,
        },
      ] as PropertySocialDetailItem[],
    };

    render(<DiscountDataTab initialData={mockData} />);

    expect(screen.getByText('Solar Electric Capacity (KW)')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
  });

  it('should display Yes/No when only bitValue is present', () => {
    const mockData: DiscountData = {
      items: [
        {
          id: 3029,
          propertyId: 549442,
          socialAttributeId: 38,
          bitValue: true,
          intValue: null,
          decimalValue: null,
          textValue: null,
          dateValue: null,
          documentBindingId: null,
          remark: null,
          socialAttributeCode: 'HAS_CLUB_HOUSE',
          socialAttributeName: 'Club House Available',
          isActive: true,
          createdDate: '',
          updatedDate: null,
        },
      ] as PropertySocialDetailItem[],
    };

    render(<DiscountDataTab initialSocialData={mockData} />);
    fireEvent.click(screen.getByText('tabs.social'));

    expect(screen.getByText('Club House Available')).toBeInTheDocument();
    expect(screen.getByText('Applied')).toBeInTheDocument();
  });

  it('should filter out items when all value fields are null even if isActive is true', () => {
    const mockData: DiscountData = {
      items: [
        {
          id: 0,
          propertyId: 549442,
          socialAttributeId: 39,
          bitValue: null,
          intValue: null,
          decimalValue: null,
          textValue: null,
          dateValue: null,
          documentBindingId: null,
          remark: null,
          socialAttributeCode: 'HAS_PLAYGROUND',
          socialAttributeName: 'Playground Available',
          isActive: true,
          createdDate: '',
          updatedDate: null,
        },
      ] as PropertySocialDetailItem[],
    };

    render(<DiscountDataTab initialSocialData={mockData} />);
    fireEvent.click(screen.getByText('tabs.social'));

    expect(screen.queryByText('Playground Available')).not.toBeInTheDocument();
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('should display social details when social sub-tab is clicked', () => {
    const mockDiscountData: DiscountData = { items: [] };
    const mockSocialData: DiscountData = {
      items: [
        {
          id: 4001,
          propertyId: 549442,
          socialAttributeId: 45,
          bitValue: true,
          intValue: null,
          decimalValue: null,
          textValue: null,
          dateValue: null,
          documentBindingId: null,
          remark: null,
          socialAttributeCode: 'DYNAMIC_SOCIAL',
          socialAttributeName: 'Dynamic Social Field',
          isActive: true,
          createdDate: '',
          updatedDate: null,
        } as PropertySocialDetailItem,
      ],
    };

    render(
      <DiscountDataTab
        propertyId={549442}
        initialData={mockDiscountData}
        initialSocialData={mockSocialData}
      />
    );

    // Click on social tab to switch
    fireEvent.click(screen.getByText('tabs.social'));

    // Verify social field appears
    expect(screen.getByText('Dynamic Social Field')).toBeInTheDocument();
    expect(screen.getByText('Applied')).toBeInTheDocument();

    // Verify Amount and Percentage columns are not displayed in Social Data tab
    expect(screen.queryByText('AMOUNT')).not.toBeInTheDocument();
    expect(screen.queryByText('PERCENTAGE')).not.toBeInTheDocument();
  });

  it('should render cards and 2 tabs in the right corner', () => {
    const mockData: DiscountData = {
      items: [
        {
          id: 101,
          propertyId: 549442,
          socialAttributeId: 26,
          bitValue: true,
          intValue: null,
          decimalValue: null,
          textValue: null,
          dateValue: null,
          documentBindingId: 24312,
          documentGuid: 'test-guid-123',
          remark: 'STP Plant operational',
          socialAttributeCode: 'STP',
          socialAttributeName: 'Sewage Treatment Plant',
          isActive: true,
          createdDate: '',
          updatedDate: null,
          level: 'Apartment',
        } as PropertySocialDetailItem,
      ],
    };

    render(
      <DiscountDataTab
        propertyId={549442}
        initialData={mockData}
        wardNo="LS14"
        propertyNo="116"
        societyDetailId={1507857}
      />
    );

    // Verify 2 tabs in right corner
    expect(screen.getByText('tabs.discount')).toBeInTheDocument();
    expect(screen.getByText('tabs.social')).toBeInTheDocument();

    // Verify card data
    expect(screen.getByText('Sewage Treatment Plant')).toBeInTheDocument();
    expect(screen.getByText('Applied')).toBeInTheDocument();
    expect(screen.getByText('STP Plant operational')).toBeInTheDocument();
  });

  it('should not render search bar or add/edit buttons', () => {
    const mockData: DiscountData = {
      items: [
        {
          id: 101,
          propertyId: 549442,
          socialAttributeId: 26,
          bitValue: true,
          intValue: null,
          decimalValue: null,
          textValue: null,
          dateValue: null,
          documentBindingId: null,
          remark: null,
          socialAttributeCode: 'STP',
          socialAttributeName: 'Sewage Treatment Plant',
          isActive: true,
          createdDate: '',
          updatedDate: null,
        } as PropertySocialDetailItem,
      ],
    };

    render(
      <DiscountDataTab
        propertyId={549442}
        initialData={mockData}
        wardNo="LS14"
        propertyNo="116"
        societyDetailId={1507857}
      />
    );

    expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/add \/ edit/i)).not.toBeInTheDocument();
    expect(screen.getByText('Sewage Treatment Plant')).toBeInTheDocument();
  });

  it('should render scope filter pills instead of top edit button on apartment screen', () => {
    const mockData: DiscountData = {
      items: [
        {
          id: 101,
          propertyId: 0,
          socialAttributeId: 26,
          bitValue: true,
          intValue: null,
          decimalValue: null,
          textValue: null,
          dateValue: null,
          documentBindingId: null,
          remark: null,
          socialAttributeCode: 'STP',
          socialAttributeName: 'Sewage Treatment Plant',
          isActive: true,
          createdDate: '',
          updatedDate: null,
          entityType: 'S',
          societyDetailId: 1507857,
        } as PropertySocialDetailItem,
        {
          id: 102,
          propertyId: 0,
          socialAttributeId: 27,
          bitValue: true,
          intValue: null,
          decimalValue: null,
          textValue: null,
          dateValue: null,
          documentBindingId: null,
          remark: null,
          socialAttributeCode: 'SOLAR',
          socialAttributeName: 'Solar Panel',
          isActive: true,
          createdDate: '',
          updatedDate: null,
          entityType: 'W',
          wingDetailId: 1530993,
          societyDetailId: 1507857,
        } as PropertySocialDetailItem,
      ],
    };

    render(
      <DiscountDataTab
        propertyId={549442}
        initialData={mockData}
        wardNo="LS14"
        propertyNo="116"
        societyDetailId={1507857}
        isApartmentScreen={true}
      />
    );

    // Verify scope filters exist including All
    expect(screen.getByRole('button', { name: /All/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Apartment Level/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Wing Level/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Unit Level/i })).toBeInTheDocument();

    // By default All is selected -> both Sewage Treatment Plant and Solar Panel are visible
    expect(screen.getByText('Sewage Treatment Plant')).toBeInTheDocument();
    expect(screen.getByText('Solar Panel')).toBeInTheDocument();
    expect(screen.getAllByTitle('actions.edit').length).toBe(3);

    // Clicking Apartment Level filters to apartment items only
    fireEvent.click(screen.getByRole('button', { name: /Apartment Level/i }));
    expect(screen.getByText('Sewage Treatment Plant')).toBeInTheDocument();
    expect(screen.queryByText('Solar Panel')).not.toBeInTheDocument();
    expect(screen.getAllByTitle('actions.edit').length).toBe(2);

    // Test filtering by Wing Level
    fireEvent.click(screen.getByRole('button', { name: /Wing Level/i }));
    expect(screen.getByText('Solar Panel')).toBeInTheDocument();
    expect(screen.queryByText('Sewage Treatment Plant')).not.toBeInTheDocument();

    // Test filtering by Unit Level (0 records)
    fireEvent.click(screen.getByRole('button', { name: /Unit Level/i }));
    expect(screen.getByText('No data available')).toBeInTheDocument();

    // Switching back to Apartment Level restores apartment items
    fireEvent.click(screen.getByRole('button', { name: /Apartment Level/i }));
    expect(screen.getByText('Sewage Treatment Plant')).toBeInTheDocument();
    expect(screen.queryByText('Solar Panel')).not.toBeInTheDocument();
  });

  it('should render cards with values and fallback', () => {
    const mockData: DiscountData = {
      items: [
        {
          id: 501,
          propertyId: 549442,
          socialAttributeId: 51,
          bitValue: true,
          intValue: null,
          decimalValue: null,
          textValue: null,
          dateValue: null,
          documentBindingId: null,
          remark: '50% concession',
          socialAttributeCode: 'CONCESSION_50',
          socialAttributeName: 'Senior Citizen Concession',
          isActive: true,
          createdDate: '',
          updatedDate: null,
          percentage: 50,
          amount: 2500,
        } as PropertySocialDetailItem,
        {
          id: 502,
          propertyId: 549442,
          socialAttributeId: 52,
          bitValue: true,
          intValue: null,
          decimalValue: null,
          textValue: null,
          dateValue: null,
          documentBindingId: null,
          remark: null,
          socialAttributeCode: 'SOLAR_DISCOUNT',
          socialAttributeName: 'Solar Discount',
          isActive: true,
          createdDate: '',
          updatedDate: null,
          percentage: null,
          amount: null,
        } as PropertySocialDetailItem,
      ],
    };

    render(<DiscountDataTab initialData={mockData} />);

    // Both cards display their values
    expect(screen.getByText('Senior Citizen Concession')).toBeInTheDocument();
    expect(screen.getByText('Solar Discount')).toBeInTheDocument();
  });

  it('should render edit button on non-apartment screen and navigate to QDE', () => {
    const mockData: DiscountData = {
      items: [
        {
          id: 101,
          propertyId: 549442,
          socialAttributeId: 26,
          bitValue: true,
          intValue: null,
          decimalValue: null,
          textValue: null,
          dateValue: null,
          documentBindingId: null,
          remark: null,
          socialAttributeCode: 'STP',
          socialAttributeName: 'Sewage Treatment Plant',
          isActive: true,
          createdDate: '',
          updatedDate: null,
        } as PropertySocialDetailItem,
      ],
    };

    render(
      <DiscountDataTab
        propertyId={549442}
        initialData={mockData}
        wardNo="LS14"
        propertyNo="116"
        isApartmentScreen={false}
      />
    );

    const editBtns = screen.getAllByTitle('actions.edit');
    expect(editBtns[0]).toBeInTheDocument();
    fireEvent.click(editBtns[0]);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('/en/property-tax/ptis/QuickDataEntry/549442/Discount?')
    );
  });

  it('should display level counts for Apartment, Wing, and Unit and filter rows when level pills are clicked', () => {
    const mockData: DiscountData = {
      items: [
        {
          id: 2748554,
          propertyId: 0,
          socialAttributeId: 26,
          bitValue: true,
          socialAttributeCode: 'STP',
          socialAttributeName: 'Sewage Treatment Plant',
          entityType: 'S',
          societyDetailId: 1507857,
          remark: 'Apartment',
          isActive: true,
          createdDate: '',
          updatedDate: null,
        } as PropertySocialDetailItem,
        {
          id: 2748555,
          propertyId: 0,
          socialAttributeId: 26,
          bitValue: true,
          socialAttributeCode: 'STP',
          socialAttributeName: 'Sewage Treatment Plant',
          entityType: 'W',
          wingDetailId: 1530993,
          societyDetailId: 1507857,
          wingName: 'BWING',
          remark: 'BWING',
          isActive: true,
          createdDate: '',
          updatedDate: null,
        } as PropertySocialDetailItem,
        {
          id: 2748556,
          propertyId: 2079050,
          socialAttributeId: 26,
          bitValue: true,
          socialAttributeCode: 'STP',
          socialAttributeName: 'Sewage Treatment Plant',
          entityType: 'P',
          wingDetailId: 1530993,
          societyDetailId: 1507857,
          wingName: 'BWING',
          unitNo: 'B10',
          remark: 'BWING-B10',
          isActive: true,
          createdDate: '',
          updatedDate: null,
        } as PropertySocialDetailItem,
      ],
    };

    render(
      <DiscountDataTab
        propertyId={0}
        initialData={mockData}
        societyDetailId={1507857}
        isApartmentScreen={true}
      />
    );

    // Verify level buttons show counts for all 4 filter buttons
    expect(screen.getByRole('button', { name: /All/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Apartment Level/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Wing Level/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Unit Level/i })).toBeInTheDocument();

    // Default selected level is All -> all rows visible
    expect(screen.getByText('Apartment')).toBeInTheDocument();
    expect(screen.getAllByText('BWING').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('BWING-B10')).toBeInTheDocument();

    // Click Apartment Level pill
    fireEvent.click(screen.getByRole('button', { name: /Apartment Level/i }));
    expect(screen.getByText('Apartment')).toBeInTheDocument();
    expect(screen.queryByText('BWING')).not.toBeInTheDocument();
    expect(screen.queryByText('BWING-B10')).not.toBeInTheDocument();

    // Click Wing Level pill
    fireEvent.click(screen.getByRole('button', { name: /Wing Level/i }));
    expect(screen.getAllByText('BWING').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('BWING-B10')).not.toBeInTheDocument();

    // Click Unit Level pill
    fireEvent.click(screen.getByRole('button', { name: /Unit Level/i }));
    expect(screen.getByText('BWING-B10')).toBeInTheDocument();
    expect(screen.getByText('B10 Unit')).toBeInTheDocument();
    expect(screen.queryByText('Apartment')).not.toBeInTheDocument();

    // Click Edit pencil on the Unit row -> verify QDE params include level, unitPropertyId, wingDetailId, and socialAttributeId
    const editBtns = screen.getAllByTitle('actions.edit');
    fireEvent.click(editBtns[editBtns.length - 1]);
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('level=Unit')
    );
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('unitPropertyId=2079050')
    );
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('wingDetailId=1530993')
    );
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('socialAttributeId=26')
    );
  });

  it('should only show loading spinner on the clicked row when multiple rows share the same documentGuid', () => {
    const mockData: DiscountData = {
      items: [
        {
          id: 101,
          propertyId: 2001,
          socialAttributeId: 26,
          bitValue: true,
          socialAttributeCode: 'STP',
          socialAttributeName: 'Sewage Treatment Plant',
          documentGuid: 'shared-bulk-guid-999',
          entityType: 'P',
          unitNo: '101',
          isActive: true,
          createdDate: '',
          updatedDate: null,
        } as PropertySocialDetailItem,
        {
          id: 102,
          propertyId: 2002,
          socialAttributeId: 26,
          bitValue: true,
          socialAttributeCode: 'STP',
          socialAttributeName: 'Sewage Treatment Plant',
          documentGuid: 'shared-bulk-guid-999',
          entityType: 'P',
          unitNo: '102',
          isActive: true,
          createdDate: '',
          updatedDate: null,
        } as PropertySocialDetailItem,
      ],
    };

    render(
      <DiscountDataTab
        propertyId={0}
        initialData={mockData}
        societyDetailId={1507857}
        isApartmentScreen={true}
      />
    );

    const viewButtons = screen.getAllByRole('button', { name: 'View Document' });
    expect(viewButtons.length).toBe(2);

    // Click the first eye view button
    fireEvent.click(viewButtons[0]);

    // The first button should now contain the animate-spin loader
    expect(viewButtons[0].querySelector('.animate-spin')).toBeInTheDocument();

    // The second button should NOT have the animate-spin loader
    expect(viewButtons[1].querySelector('.animate-spin')).not.toBeInTheDocument();
  });
});


