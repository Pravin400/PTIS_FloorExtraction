import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FloorSubmissionScreen } from '@/components/modules/property-tax/ptis/appartmentQC/appartmentQCDrawer/FloorSubmissionDrawer/FloorSubmissionScreen';
import type { FloorSubmissionRow, ApartmentQCDetail } from '@/types/apartmentQC.types';

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  usePathname: () => '/en/property-tax/ptis/appartmentQC',
  useSearchParams: () => ({
    get: (key: string) => (key === 'editRowId' ? 'row-1' : null),
    toString: () => 'editRowId=row-1',
  }),
}));

const hookState = {
  subTab: 'rateable',
  dualMethodTab: 'rateable' as const,
  setDualMethodTab: vi.fn(),
  floorData: [
    {
      id: 'row-1',
      pdnId: 101,
      floorId: 'GF',
      conYear: '2010',
      asstYear: '2011',
      constructionTypeId: 'RCC',
      typeOfUseId: 'Residential',
      subTypeOfUseId: 'Self',
      noOfRooms: '2',
      area: '100',
      rentMY: '0/0',
      rateMY: '0/0',
      rentalValue: '0',
      depreciation: '0',
      alv: '0',
      mr: '0',
      rv: '0',
      sdrr: '0',
      baseValue: '0',
      floorFactor: '0',
      ageFactor: '0',
      ntbFactor: '0',
      useFactor: '0',
      capitalValue: '0',
    } as FloorSubmissionRow,
  ],
  isLoadingFloorQCData: false,
};

vi.mock('@/hooks/apartmentQc/useFloorSubmissionState', () => ({
  useFloorSubmissionState: () => hookState,
}));

vi.mock('@/components/modules/property-tax/ptis/appartmentQC/appartmentQCDrawer/FloorSubmissionDrawer/FloorSubmissionColumns', () => ({
  useFloorSubmissionColumns: () => [{ key: 'floorId', label: 'Floor' }],
}));

vi.mock('@/components/modules/property-tax/ptis/appartmentQC/appartmentQCDrawer/FloorSubmissionDrawer/FloorSubmissionTable', () => ({
  FloorQCTable: () => <div data-testid="floor-qc-table">table</div>,
}));

vi.mock('@/components/modules/property-tax/ptis/appartmentQC/appartmentQCDrawer/FloorSubmissionDrawer/FloorSubmissionForm', () => ({
  FloorSubmissionForm: ({ initialRow }: { initialRow: FloorSubmissionRow }) => (
    <div data-testid="floor-submission-form">editing:{initialRow.id}</div>
  ),
}));

vi.mock('@/components/modules/property-tax/ptis/appartmentQC/appartmentQCDrawer/FloorSubmissionDrawer/PropertyPhotoViewer', () => ({
  PropertyPhotoViewer: ({ propertyId }: { propertyId: number | null }) => (
    <div data-testid="photo-viewer">photo:{String(propertyId)}</div>
  ),
}));

vi.mock('@/components/modules/property-tax/ptis/appartmentQC/appartmentQCDrawer/FloorSubmissionDrawer/PropertyPhotoToggle', () => ({
  PropertyPhotoToggle: ({ onClick }: { onClick: () => void }) => (
    <button type="button" onClick={onClick} data-testid="photo-toggle">toggle-photo</button>
  ),
}));

describe('FloorSubmissionScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders table and edit form when editRowId matches row', () => {
    render(
      <FloorSubmissionScreen
        initialFloorData={[{ pdnId: 101 } as unknown as ApartmentQCDetail]}
        initialSubTab="rateable"
        propertyId={101}
      />
    );

    expect(screen.getByTestId('floor-qc-table')).toBeInTheDocument();
    expect(screen.getByTestId('floor-submission-form')).toHaveTextContent('editing:row-1');
  });

  it('opens property photo viewer when toggle is clicked', () => {
    render(
      <FloorSubmissionScreen
        initialFloorData={[{ pdnId: 101 } as unknown as ApartmentQCDetail]}
        initialSubTab="rateable"
        propertyId={101}
      />
    );

    expect(screen.queryByTestId('photo-viewer')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('photo-toggle'));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('photo=true'), { scroll: false });
  });
});
