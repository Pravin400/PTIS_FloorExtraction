import { render, screen, fireEvent } from '@testing-library/react';
import {
  PtisNavigationProvider,
  usePtisNavigation,
  cleanParamsForTargetProperty,
  getTargetPropertyRoute,
} from '@/components/modules/property-tax/ptis/shared/PtisNavigationContext';
import type { PropertyListItem } from '@/types/ptis.types';

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockPrefetch = vi.fn();

const mockPendingRef = vi.hoisted(() => ({ current: false }));

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useTransition: () => {
      if (mockPendingRef.current) {
        return [true, vi.fn((cb: () => void) => cb())] as const;
      }
      return actual.useTransition();
    },
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: mockPrefetch,
  }),
  useSearchParams: () => new URLSearchParams('wardNo=W1&propertyId=101&propertyNo=P101'),
  usePathname: () => '/en/property-tax/ptis/individual',
}));

const mockProperties: PropertyListItem[] = [
  {
    propertyId: 101,
    propertyNo: 'P101',
    partitionNo: '0',
    ownerName: 'Owner 1',
    category: 2,
    categoryLabel: 'Individual',
  } as unknown as PropertyListItem,
  {
    propertyId: 102,
    propertyNo: 'P102',
    partitionNo: '0',
    ownerName: 'Owner 2',
    category: 2,
    categoryLabel: 'Individual',
  } as unknown as PropertyListItem,
];

function TestConsumer() {
  const { currentPage, totalPages, navigateToPage, isPending } = usePtisNavigation();

  return (
    <div>
      <span data-testid="page-info">
        {currentPage} of {totalPages}
      </span>
      <span data-testid="pending-state">{isPending ? 'pending' : 'idle'}</span>
      <button onClick={() => navigateToPage(2)} data-testid="nav-btn">
        Go to Page 2
      </button>
    </div>
  );
}

describe('PtisNavigationContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides correct pagination details to consumer', () => {
    render(
      <PtisNavigationProvider properties={mockProperties}>
        <TestConsumer />
      </PtisNavigationProvider>
    );

    expect(screen.getByTestId('page-info')).toHaveTextContent('1 of 2');
    expect(screen.getByTestId('pending-state')).toHaveTextContent('idle');
  });

  it('triggers router navigation when navigateToPage is called', () => {
    render(
      <PtisNavigationProvider properties={mockProperties}>
        <TestConsumer />
      </PtisNavigationProvider>
    );

    const btn = screen.getByTestId('nav-btn');
    fireEvent.click(btn);

    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining('propertyId=102'),
      expect.anything()
    );
  });

  it('renders navigation blocker when a property transition is pending', () => {
    mockPendingRef.current = true;

    render(
      <PtisNavigationProvider properties={mockProperties}>
        <TestConsumer />
      </PtisNavigationProvider>
    );

    expect(document.getElementById('ptis-property-nav-blocker')).toBeInTheDocument();
    expect(screen.getByTestId('pending-state')).toHaveTextContent('pending');

    mockPendingRef.current = false;
  });

  describe('cleanParamsForTargetProperty', () => {
    it('removes stale category, society, wing, and tab parameters from the previous property', () => {
      const currentParams = new URLSearchParams(
        'wardNo=MM1&wardId=108&propertyId=101&propertyNo=15&partitionNo=0&category=2&categoryLabel=Individual+Property&societyDetailId=50&wingDetailId=5&wingName=A&type=apartment&valuationTab=rateable&tab=olddetails'
      );
      const target: PropertyListItem = {
        propertyId: 202,
        propertyNo: '16',
        partitionNo: '0',
        wardId: 108,
        wardNo: 'MM1',
        ownerName: 'Target Owner',
        category: 0,
        categoryLabel: 'Apartment Society Property',
        societyDetailId: 99,
      } as unknown as PropertyListItem;

      const result = cleanParamsForTargetProperty(currentParams, target);

      expect(result.get('propertyId')).toBe('202');
      expect(result.get('propertyNo')).toBe('16');
      expect(result.get('partitionNo')).toBe('0');
      expect(result.get('wardId')).toBe('108');
      expect(result.get('wardNo')).toBe('MM1');
      // Updated to target values
      expect(result.get('category')).toBe('0');
      expect(result.get('categoryLabel')).toBe('Apartment Society Property');
      expect(result.get('societyDetailId')).toBe('99');
      // Stale params cleared
      expect(result.get('wingDetailId')).toBeNull();
      expect(result.get('wingName')).toBeNull();
      expect(result.get('type')).toBeNull();
      expect(result.get('valuationTab')).toBeNull();
    });
  });

  describe('getTargetPropertyRoute', () => {
    it('routes partitioned properties to individual view', () => {
      const target: PropertyListItem = {
        propertyId: 301,
        propertyNo: '15',
        partitionNo: '1',
      } as unknown as PropertyListItem;

      expect(getTargetPropertyRoute(target, '/en/property-tax/ptis/apartment')).toBe(
        '/en/property-tax/ptis/individual'
      );
    });

    it('routes explicit apartment society properties to apartment view', () => {
      const target: PropertyListItem = {
        propertyId: 302,
        propertyNo: '15',
        partitionNo: '0',
        category: 0,
        categoryLabel: 'Apartment Society Property',
      } as unknown as PropertyListItem;

      expect(getTargetPropertyRoute(target, '/en/property-tax/ptis/individual')).toBe(
        '/en/property-tax/ptis/apartment'
      );
    });

    it('routes explicit individual properties to individual view', () => {
      const target: PropertyListItem = {
        propertyId: 303,
        propertyNo: '15',
        partitionNo: '0',
        category: 2,
        categoryLabel: 'Individual Property',
      } as unknown as PropertyListItem;

      expect(getTargetPropertyRoute(target, '/en/property-tax/ptis/apartment')).toBe(
        '/en/property-tax/ptis/individual'
      );
    });

    it('preserves current route context when target metadata is not explicit', () => {
      const target: PropertyListItem = {
        propertyId: 304,
        propertyNo: '15',
        partitionNo: '0',
      } as unknown as PropertyListItem;

      expect(getTargetPropertyRoute(target, '/en/property-tax/ptis/apartment')).toBe(
        '/en/property-tax/ptis/apartment'
      );
      expect(getTargetPropertyRoute(target, '/en/property-tax/ptis/individual')).toBe(
        '/en/property-tax/ptis/individual'
      );
    });
  });
});
