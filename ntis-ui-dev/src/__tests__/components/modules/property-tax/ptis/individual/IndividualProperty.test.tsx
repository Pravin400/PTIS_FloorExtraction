import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, act, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IndividualMasterHeader } from '@/components/modules/property-tax/ptis/individual/individual-tabSection/components/IndividualMasterHeader';
import { IndividualMasterDetailsGrid } from '@/components/modules/property-tax/ptis/individual/individual-tabSection/components/IndividualMasterDetailsGrid';
import { IndividualPropertyMasterCard } from '@/components/modules/property-tax/ptis/individual/individual-tabSection/IndividualPropertyMasterCard';
import { IndividualContainer } from '@/components/modules/property-tax/ptis/individual/IndividualContainer';
import { IndividualFloorTopNav } from '@/components/modules/property-tax/ptis/individual/individual-floor/IndividualFloorTopNav';
import { useIndividualPropertySearch } from '@/hooks/property-tax/individual/useIndividualPropertySearch';
import type { IndividualPropertyMasterData } from '@/types/property-tax/individual';
import type { PtisInitialData } from '@/types/ptis.types';

const mockPush = vi.fn();
const mockUpdateUrl = vi.fn();
const mockHandleSearchProperty = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/en/property-tax/ptis/individual',
  useSearchParams: () => new URLSearchParams('propertyId=501&wardNo=W01'),
  useParams: () => ({ locale: 'en' }),
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => {
    const fn = (key: string) => {
      const map: Record<string, string> = {
        'header.propertyNo': 'PROPERTY NO.:',
        'header.upicId': 'UPIC ID:',
        'header.ownerName': 'OWNER NAME:',
        'header.copyUpic': 'Copy UPIC',
        'header.edit': 'Edit',
        'header.editOwner': 'Edit Property / Owner Details',
        'photo.noPhoto': 'No Photo',
        'grid.owner': 'Owner',
        'grid.propertyHolder': 'Property Holder',
        'appliedRules.buttonLabel': 'Applied Rules',
      };
      return map[key] || key;
    };
    fn.has = () => true;
    return fn;
  },
}));

vi.mock('@/lib/utils/document-utils', () => ({
  getViewDocumentUrl: (guid: string) => `https://test.docs.com/view/${guid}`,
}));

vi.mock('@/hooks/ptis/tab/useSyncedSearchParams', () => ({
  useSyncedSearchParams: () => ({
    wardId: 10,
    wardNo: 'W-10',
    propertyNo: '101',
    partitionNo: '',
    propertyId: '1001',
  }),
}));

vi.mock('@/hooks/ptis/tab/usePropertySearch', () => ({
  usePropertySearch: () => ({
    isSearching: false,
    handleSearchProperty: mockHandleSearchProperty,
    updateUrl: mockUpdateUrl,
  }),
}));

vi.mock('@/components/modules/property-tax/ptis/tabs/components/PropertySearchBar', () => ({
  PropertySearchBar: (props: { wardNo?: string; ownerName?: string }) => (
    <div data-testid="mock-property-search-bar">
      <span>Search Bar Ward: {props.wardNo || '-'}</span>
      <span>Search Bar Owner: {props.ownerName || '-'}</span>
    </div>
  ),
}));

describe('Individual Property - Components & Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockData: IndividualPropertyMasterData = {
    propertyId: 501,
    propertyNo: '101',
    wardNo: 'W01',
    upic: 'UPIC-501',
    ownerName: 'Amitabh Bachchan',
    owner: 'Amitabh Bachchan',
    propertyHolder: 'Amitabh Bachchan',
    holderRegional: 'अमिताभ बच्चन',
    occupierName: 'Amitabh Bachchan',
    occupierRegional: 'अमिताभ बच्चन',
    ownerCategory: 'INDIVIDUAL',
    division: 'Juhu',
    moujaName: 'Juhu Mouja',
    surveyNo: '10',
    taxZone: 'Zone-1',
    taxZoneAndName: 'Zone-1',
    plotNo: '1',
    aadharNo: '123456789012',
    title: 'Mr',
    ownerTitle: 'Mr',
    aadharWithTitle: '1234 5678 9012',
    mobileNo: '9820198201',
    emailId: 'ab@jalsa.com',
    societyAddress: 'Jalsa, Juhu, Mumbai',
    address: 'Jalsa, Juhu, Mumbai',
    plotAreaFtMtr: '5000 Ft',
    carpetAreaFtMtr: '4000 Ft',
    builtUpAreaFtMtr: '4500 Ft',
    status: 'ACTIVE PROPERTY',
    category: 'RESIDENTIAL',
    propertyDescription: 'Bungalow',
    propertyDescriptionRegional: 'बंगला',
    societyBuildingPhotoGuid: 'photo-guid-999',
    imageUrl: 'https://test.docs.com/view/photo-guid-999',
    performance: {
      thisAssessmentRevenue: '₹1,50,000',
      revenueGrowthPct: '15%',
      isGrowthNegative: false,
      currentTax: '₹1,20,000',
      retroTax: '₹30,000',
      totalTax: '₹1,50,000',
      totalDemand: '₹1,50,000',
      currentDemand: '₹1,20,000',
      pendingDemand: '₹30,000',
      collectionPercent: '100%',
      collectionAmount: '₹1,50,000',
      totalBalance: '₹0',
      differenceAmount: '₹20,000',
      rawDifferenceAmount: 20000,
      oldCurrentTax: '₹1,30,000',
      changePercent: 15,
    },
  };

  // ==========================================
  // 1. HEADER TESTS
  // ==========================================
  describe('IndividualMasterHeader', () => {
    it('renders header details and handles UPIC copy and edit callbacks', async () => {
      const onEdit = vi.fn();
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText: writeTextMock } });

      render(
        <IndividualMasterHeader
          propertyNo="W01-100"
          upicId="UPIC-12345"
          ownerName="John Doe"
          onEdit={onEdit}
        />
      );

      expect(screen.getByText('W01-100')).toBeInTheDocument();
      expect(screen.getByText('UPIC-12345')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();

      const copyBtn = screen.getByTitle('Copy UPIC');
      await act(async () => {
        fireEvent.click(copyBtn);
      });
      expect(writeTextMock).toHaveBeenCalledWith('UPIC-12345');

      const editBtn = screen.getByRole('button', { name: /edit/i });
      fireEvent.click(editBtn);
      expect(onEdit).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================
  // 2. DETAILS GRID TESTS
  // ==========================================
  describe('IndividualMasterDetailsGrid', () => {
    it('renders details attributes and handles empty data gracefully', () => {
      render(<IndividualMasterDetailsGrid data={mockData} />);
      expect(screen.getAllByText('Amitabh Bachchan').length).toBeGreaterThan(0);
      expect(screen.getByText('Jalsa, Juhu, Mumbai')).toBeInTheDocument();
      expect(screen.getByText('1234 5678 9012')).toBeInTheDocument();

      render(<IndividualMasterDetailsGrid data={undefined} />);
      const dashes = screen.getAllByText('-');
      expect(dashes.length).toBeGreaterThan(5);
    });

    it('renders address concatenated with wingName and pinCode, omitting null values cleanly', () => {
      const { rerender } = render(
        <IndividualMasterDetailsGrid
          data={{
            ...mockData,
            address: 'Bhivandi Road, Thane',
            wingName: 'Wing A',
            pinCode: '400608',
          }}
        />
      );
      expect(screen.getByText('Wing A - Bhivandi Road, Thane - 400608')).toBeInTheDocument();

      // Wing only (pin is null)
      rerender(
        <IndividualMasterDetailsGrid
          data={{
            ...mockData,
            address: 'Bhivandi Road, Thane',
            wingName: 'Wing B',
            pinCode: undefined,
          }}
        />
      );
      expect(screen.getByText('Wing B - Bhivandi Road, Thane')).toBeInTheDocument();

      // Pin only (wing is null)
      rerender(
        <IndividualMasterDetailsGrid
          data={{
            ...mockData,
            address: 'Bhivandi Road, Thane',
            wingName: undefined,
            pinCode: '400608',
          }}
        />
      );
      expect(screen.getByText('Bhivandi Road, Thane - 400608')).toBeInTheDocument();

      // Neither wing nor pin
      rerender(
        <IndividualMasterDetailsGrid
          data={{
            ...mockData,
            address: 'Bhivandi Road, Thane',
            wingName: undefined,
            pinCode: undefined,
          }}
        />
      );
      expect(screen.getByText('Bhivandi Road, Thane')).toBeInTheDocument();
    });
  });

  // ==========================================
  // 3. MASTER CARD TESTS
  // ==========================================
  describe('IndividualPropertyMasterCard', () => {
    it('renders skeleton on loading and full card when loaded', () => {
      const { container } = render(<IndividualPropertyMasterCard isLoading={true} />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();

      render(<IndividualPropertyMasterCard data={mockData} wardNo="W01" />);
      expect(screen.getByText('W01-101')).toBeInTheDocument();
      expect(screen.getByText('UPIC-501')).toBeInTheDocument();
      expect(screen.getAllByText('₹1,50,000').length).toBeGreaterThan(0);
    });

    it('navigates to QuickDataEntry with returnTab=individual on edit click', () => {
      render(<IndividualPropertyMasterCard data={mockData} propertyId={501} />);
      const editBtn = screen.getByRole('button', { name: /edit/i });
      fireEvent.click(editBtn);

      expect(mockPush).toHaveBeenCalledTimes(1);
      const destination = mockPush.mock.calls[0][0];
      expect(destination).toContain('/en/property-tax/ptis/QuickDataEntry/501/Property');
      expect(destination).toContain('returnTab=individual');
    });

    it('renders updated data when props update from server revalidation', () => {
      const { rerender } = render(<IndividualPropertyMasterCard data={mockData} />);
      expect(screen.getAllByText('Amitabh Bachchan').length).toBeGreaterThan(0);

      rerender(<IndividualPropertyMasterCard data={{ ...mockData, ownerName: 'Abhishek Bachchan' }} />);
      expect(screen.getAllByText('Abhishek Bachchan').length).toBeGreaterThan(0);
    });

    it('synchronizes and clears photo thumbnail in real-time when photo is uploaded or deleted', async () => {
      const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      render(
        <IndividualPropertyMasterCard data={{ ...mockData, imageUrl: dataUri }} />
      );
      expect(await screen.findByAltText(/photo\.propertyPhoto|Property Photo/i)).toBeInTheDocument();

      // Simulate photo deletion event from photo plan section
      act(() => {
        window.dispatchEvent(
          new CustomEvent('ptis:sync-thumbnail', {
            detail: {
              propertyId: 501,
              documentGuid: undefined,
              photoUrl: undefined,
              photoTypeCode: 'PROPERTY_FRONT',
              category: 'Property Front Photo',
              hasPhoto: false,
            },
          })
        );
      });

      // After deletion, the thumbnail image should be replaced with "No Photo" fallback
      expect(screen.queryByAltText(/photo\.propertyPhoto|Property Photo/i)).toBeNull();
      expect(screen.getByText(/photo\.noPhoto|No Photo/i)).toBeInTheDocument();

      // Simulate photo re-upload event
      act(() => {
        window.dispatchEvent(
          new CustomEvent('ptis:sync-thumbnail', {
            detail: {
              propertyId: 501,
              documentGuid: 'new-front-guid',
              photoUrl: dataUri,
              photoTypeCode: 'PROPERTY_FRONT',
              category: 'Property Front Photo',
              hasPhoto: true,
            },
          })
        );
      });

      expect(await screen.findByAltText(/photo\.propertyPhoto|Property Photo/i)).toBeInTheDocument();

      // Simulate media update for non-front photo (e.g. PHOTO_PLAN) - should not overwrite front photo
      act(() => {
        window.dispatchEvent(
          new CustomEvent('ptis:media-updated', {
            detail: {
              propertyId: 501,
              documentGuid: 'plan-guid',
              photoUrl: 'https://test.docs.com/view/plan-guid',
              photoTypeCode: 'PHOTO_PLAN',
              category: 'Photo Plan',
            },
          })
        );
      });

      // Front photo remains intact
      const photoImg = await screen.findByAltText(/photo\.propertyPhoto|Property Photo/i);
      expect(photoImg).toHaveAttribute('src', expect.stringContaining(dataUri));
    });
  });

  // ==========================================
  // 4. CONTAINER TESTS
  // ==========================================
  describe('IndividualContainer', () => {
    it('renders container with search bar and master card', () => {
      const mockInitial: PtisInitialData = {
        wardOptions: [{ label: 'Ward 1', value: '1' }],
        propertyOptions: [],
        rawPropertyData: [],
      };
      render(
        <IndividualContainer
          initialData={mockInitial}
          initialWardId={1}
          initialPropertyMasterData={mockData}
        />
      );
      expect(screen.getByTestId('mock-property-search-bar')).toBeInTheDocument();
      expect(screen.getByText('Search Bar Owner: Amitabh Bachchan')).toBeInTheDocument();
    });

    it('renders container with status metrics header below tab section', () => {
      const mockInitial: PtisInitialData = {
        wardOptions: [{ label: 'Ward 1', value: '1' }],
        propertyOptions: [],
        rawPropertyData: [],
      };
      const mockBelowFlex = {
        propertyId: 501,
        workflowStages: [
          { stageId: 1, stageName: 'GIS Verified', isCompleted: true },
          { stageId: 2, stageName: 'Assessment', isCompleted: true },
        ],
        certificateTypes: [
          { certificateTypeId: 1, certificateTypeName: 'Fire NOC', isIssued: false },
        ],
      };
      render(
        <IndividualContainer
          initialData={mockInitial}
          initialWardId={1}
          initialPropertyMasterData={mockData}
          initialQcTopSectionBelowFlex={mockBelowFlex}
        />
      );
      expect(screen.getByTitle('Scroll Left')).toBeInTheDocument();
      expect(screen.getByTitle('Scroll Right')).toBeInTheDocument();
      expect(screen.getByText('GIS Verified')).toBeInTheDocument();
      expect(screen.getByText('Assessment')).toBeInTheDocument();
      expect(screen.getByText('Fire NOC')).toBeInTheDocument();
    });

    it('renders container with applied rules button in floor top nav', () => {
      const mockInitial: PtisInitialData = {
        wardOptions: [{ label: 'Ward 1', value: '1' }],
        propertyOptions: [],
        rawPropertyData: [],
      };
      render(
        <IndividualContainer
          initialData={mockInitial}
          initialWardId={1}
          initialPropertyMasterData={mockData}
          hasAppliedRules={true}
        />
      );
      expect(screen.getByRole('button', { name: /applied rules/i })).toBeInTheDocument();
    });
  });

  // ==========================================
  // 5. TOP NAV TESTS
  // ==========================================
  describe('IndividualFloorTopNav', () => {
    it('renders Applied Rules button and fires onOpenAppliedRules callback', () => {
      const onOpenMock = vi.fn();
      render(
        <IndividualFloorTopNav
          activeSection="floor"
          onToggleSection={vi.fn()}
          onOpenAppliedRules={onOpenMock}
        />
      );
      const appliedRulesBtn = screen.getByRole('button', { name: /applied rules/i });
      expect(appliedRulesBtn).toBeInTheDocument();
      fireEvent.click(appliedRulesBtn);
      expect(onOpenMock).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================
  // 5. HOOK TESTS
  // ==========================================
  describe('useIndividualPropertySearch', () => {
    it('initializes hook state, resolves propertyId, and handles ward commit', () => {
      const mockInitial: PtisInitialData = {
        wardOptions: [{ label: 'Ward 10', value: '10' }],
        propertyOptions: [],
        rawPropertyData: [
          {
            propertyId: 1001,
            propertyNo: '101',
            partitionNo: '',
            upicId: 'UPIC-1001',
            ownerName: 'Test Owner',
            address: 'Test Address',
            displayProperty: '101',
            category: 2,
            categoryLabel: 'Individual',
          },
        ],
        tabHeaderInfo: {
          propertyId: 1001,
          statusName: 'ACTIVE',
          oldWardNo: null,
          oldPropertyNo: null,
          oldPartitionNo: null,
          description: null,
          type: null,
          category: null,
          upicId: null,
          ownerName: 'Test',
          address: null,
          typeOfUse: null,
        },
      };

      const { result } = renderHook(() =>
        useIndividualPropertySearch(mockInitial, 10, { ...mockData, propertyId: 1001 })
      );

      expect(result.current.propertyId).toBe(1001);
      expect(result.current.draft.wardId).toBe(10);
      expect(result.current.propertyOptions).toBeDefined();

      act(() => {
        result.current.onWardChangeCommit(20, 'W-20');
      });

      expect(mockUpdateUrl).toHaveBeenCalledWith({
        wardNo: 'W-20',
        wardId: '20',
        propertyNo: null,
        partitionNo: null,
        propertyId: null,
      });
    });
  });
});
