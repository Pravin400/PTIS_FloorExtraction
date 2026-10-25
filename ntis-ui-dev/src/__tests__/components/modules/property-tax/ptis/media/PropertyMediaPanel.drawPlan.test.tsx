import { render as rtlRender, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PropertyMediaPanel from '@/components/modules/property-tax/ptis/media/PropertyMediaPanel';
import { ConfirmProvider } from '@/components/common/ConfirmProvider';
import { toast } from 'sonner';

const render = (ui: React.ReactElement) => rtlRender(<ConfirmProvider>{ui}</ConfirmProvider>);

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('sonner', () => ({
  toast: {
    loading: vi.fn(() => 'toast-id-123'),
    success: vi.fn(),
    error: vi.fn(),
    dismiss: vi.fn(),
  },
}));

const mockLaunchPhotoPlanDrawingToolAction = vi.fn();
vi.mock('@/app/[locale]/property-tax/ptis/PhotoPlan.action', () => ({
  launchPhotoPlanDrawingToolAction: (...args: unknown[]) => mockLaunchPhotoPlanDrawingToolAction(...args),
}));

const mockGetPropertyDrawPlanStatus = vi.fn();
vi.mock('@/lib/api/property.service', () => ({
  getPropertyDrawPlanStatus: (...args: unknown[]) => mockGetPropertyDrawPlanStatus(...args),
}));

const mockSavePlanTypeAction = vi.fn();
vi.mock('@/app/[locale]/property-tax/ptis/property-type.action', () => ({
  getMaxTypeForSocietyAction: vi.fn().mockResolvedValue({ success: true, maxType: 1 }),
  setPropertyTypeAction: vi.fn().mockResolvedValue({ success: true, message: 'Type updated successfully' }),
  getPlanTypesForPropertyAction: vi.fn().mockResolvedValue({ success: true, data: [] }),
  getNextPlanTypeAction: vi.fn().mockResolvedValue({ success: true, data: '1' }),
  savePlanTypeAction: (...args: unknown[]) => mockSavePlanTypeAction(...args),
  getExistingTypesAction: vi.fn().mockResolvedValue({ success: true, data: [] }),
}));

vi.mock('@/hooks/ptis/photoplan/useMediaDrawerState', () => ({
  useMediaDrawerState: () => ({
    isDrawerOpen: false,
    drawerInitialCategoryIndex: 0,
    openDrawer: vi.fn(),
    closeDrawer: vi.fn(),
  }),
}));

vi.mock('@/hooks/ptis/photoplan/useMediaPanelVisibility', () => ({
  useMediaPanel: () => ({
    togglePanel: vi.fn(),
  }),
}));

vi.mock('@/hooks/ptis/photoplan/usePropertyMedia', () => ({
  usePropertyMedia: () => ({
    showMoreImages: false,
    setShowMoreImages: vi.fn(),
    hoverPreview: null,
    resetHoverPreview: vi.fn(),
    categories: [
      {
        photoTypeId: 1,
        photoTypeCode: 'PHOTO_PLAN',
        photoTypeName: 'Photo Plan',
        hasPhoto: false,
        images: [],
      },
    ],
    handleCategoriesChange: vi.fn(),
    photoPlanCategory: {
      photoTypeId: 1,
      photoTypeCode: 'PHOTO_PLAN',
      photoTypeName: 'Photo Plan',
      hasPhoto: false,
      images: [],
    },
    propertyPhotoCategory: null,
    photoPlanPhoto: null,
    propertyPhoto: null,
    remainingImages: [],
    handleImageHover: vi.fn(),
    handleImageLeave: vi.fn(),
    cancelImageLeave: vi.fn(),
    fullyLoadedIds: [],
    setFullyLoadedIds: vi.fn(),
    setPhotos: vi.fn(),
    gisPhoto: null,
    t: (key: string) => key,
  }),
}));

describe('PropertyMediaPanel - Draw Plan & Type Assignment Workflow', () => {
  const assignMock = vi.fn();
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSavePlanTypeAction.mockResolvedValue({ success: true, message: 'Type updated successfully' });
    mockLaunchPhotoPlanDrawingToolAction.mockImplementation(async (id: number) => ({
      success: true,
      data: { launchUrl: `https://ptisplanapp.tabamc.in/launch?id=${id}` },
    }));
    mockGetPropertyDrawPlanStatus.mockImplementation(async (id: number) => {
      if (id === 205) return { success: true, data: { isAmenity: true, isIndividualOrAmenity: true, propertyTypeId: 140 } };
      if (id === 301) return { success: true, data: { currentType: '3', hasType: true } };
      if (id === 505) return { success: true, data: { categoryId: 2, isIndividualOrAmenity: true } };
      return { success: true, data: { currentType: null, hasType: false, isIndividualOrAmenity: false } };
    });
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000/en/property-tax/ptis?wardNo=UK1&propertyNo=182&propertyId=101',
        assign: assignMock,
      },
      writable: true,
      configurable: true,
    });
    global.fetch = vi.fn();
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it('hides the + Draw button if the property is the root/main property (isMainProperty === true)', () => {
    render(
      <PropertyMediaPanel
        property={{
          id: 101,
          isMainProperty: true,
          categoryId: 1,
          propertyTypeId: 1,
        }}
      />
    );

    const drawButtons = screen.queryAllByRole('button', { name: /Create new plan|Draw Plan/i });
    expect(drawButtons).toHaveLength(0);
  });

  it('renders the + Draw button for inner properties (isMainProperty === false)', () => {
    render(
      <PropertyMediaPanel
        property={{
          id: 102,
          isMainProperty: false,
          categoryId: 1,
          propertyTypeId: 1,
          type: '1',
        }}
      />
    );

    const drawButtons = screen.getAllByRole('button', { name: /Create new plan|Draw Plan/i });
    expect(drawButtons.length).toBeGreaterThan(0);
  });

  it('redirects directly with isAmenity=true if Apartment (CategoryId=1) and Amenity (PropertyTypeId=140)', async () => {
    mockLaunchPhotoPlanDrawingToolAction.mockResolvedValue({
      success: true,
      data: { launchUrl: 'https://ptisplanapp.tabamc.in/launch?id=205&isAmenity=true' },
    });

    render(
      <PropertyMediaPanel
        property={{
          id: 205,
          isMainProperty: false,
          categoryId: 1,
          propertyTypeId: 140,
          societyDetailId: 50,
        }}
      />
    );

    const drawButton = screen.getByRole('button', { name: /Create new plan/i });
    fireEvent.click(drawButton);

    await waitFor(() => {
      expect(mockLaunchPhotoPlanDrawingToolAction).toHaveBeenCalled();
      expect(assignMock).toHaveBeenCalledWith('https://ptisplanapp.tabamc.in/launch?id=205&isAmenity=true');
    });
  });

  it('redirects directly to drawing app with type if non-amenity unit has Type populated', async () => {
    mockLaunchPhotoPlanDrawingToolAction.mockResolvedValue({
      success: true,
      data: { launchUrl: 'https://ptisplanapp.tabamc.in/launch?id=301&type=3' },
    });

    render(
      <PropertyMediaPanel
        property={{
          id: 301,
          isMainProperty: false,
          categoryId: 1,
          propertyTypeId: 10,
          type: '3',
          societyDetailId: 50,
        }}
      />
    );

    const drawButton = screen.getByRole('button', { name: /Create new plan/i });
    fireEvent.click(drawButton);

    await waitFor(() => {
      expect(mockLaunchPhotoPlanDrawingToolAction).toHaveBeenCalled();
      expect(assignMock).toHaveBeenCalledWith('https://ptisplanapp.tabamc.in/launch?id=301&type=3');
    });
  });

  it('redirects directly to drawing app without opening Type modal if Category is Individual (CategoryId !== 1)', async () => {
    mockLaunchPhotoPlanDrawingToolAction.mockResolvedValue({
      success: true,
      data: { launchUrl: 'https://ptisplanapp.tabamc.in/launch?id=505' },
    });

    render(
      <PropertyMediaPanel
        property={{
          id: 505,
          isMainProperty: false,
          categoryId: 2,
          propertyTypeId: 10,
          type: null,
        }}
      />
    );

    const drawButton = screen.getByRole('button', { name: /Create new plan/i });
    fireEvent.click(drawButton);

    await waitFor(() => {
      expect(mockLaunchPhotoPlanDrawingToolAction).toHaveBeenCalled();
      expect(assignMock).toHaveBeenCalledWith('https://ptisplanapp.tabamc.in/launch?id=505');
    });
  });

  it('opens Modal when Type is NULL for inner unit, fetches suggested max-type, and allows saving', async () => {
    mockLaunchPhotoPlanDrawingToolAction.mockResolvedValue({
      success: true,
      data: { launchUrl: 'https://ptisplanapp.tabamc.in/launch?id=402&type=1' },
    });
    mockSavePlanTypeAction.mockResolvedValue({
      success: true,
      message: 'Type updated successfully',
    });

    render(
      <PropertyMediaPanel
        property={{
          id: 402,
          isMainProperty: false,
          categoryId: 1,
          propertyTypeId: 10,
          type: null,
          societyDetailId: 50,
        }}
      />
    );

    const drawButton = screen.getByRole('button', { name: /Create new plan/i });
    fireEvent.click(drawButton);

    // Modal should appear
    expect(await screen.findByText('media.assignTypeTitle')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('media.fetchingBuildingPlanTypes')).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole('button', { name: /media.proceed/i })).not.toBeDisabled());

    // Submit the modal with the default selected type
    const proceedButton = screen.getByRole('button', { name: /media.proceed/i });
    fireEvent.click(proceedButton);

    await waitFor(() => {
      expect(mockSavePlanTypeAction).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('media.typeAssignedSuccess', expect.anything());
      expect(assignMock).toHaveBeenCalledWith('https://ptisplanapp.tabamc.in/launch?id=402&type=1');
    });
  });

  it('shows error toast when set-type API fails with error', async () => {
    mockGetPropertyDrawPlanStatus.mockResolvedValue({
      success: true,
      data: { hasType: false },
    });
    mockSavePlanTypeAction.mockResolvedValue({
      success: false,
      error: 'Type already exists',
    });

    render(
      <PropertyMediaPanel
        property={{
          id: 403,
          isMainProperty: false,
          categoryId: 1,
          propertyTypeId: 10,
          type: null,
          societyDetailId: 50,
        }}
      />
    );

    const drawButton = screen.getByRole('button', { name: /Create new plan/i });
    fireEvent.click(drawButton);

    expect(await screen.findByText('media.assignTypeTitle')).toBeInTheDocument();
    expect(await screen.findByText('media.assignedPlanType')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: /media.proceed/i })).not.toBeDisabled());

    const proceedButton = screen.getByRole('button', { name: /media.proceed/i });
    fireEvent.click(proceedButton);

    await waitFor(() => {
      expect(mockSavePlanTypeAction).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Type already exists', expect.anything());
    });
    expect(assignMock).not.toHaveBeenCalled();
  });
});
