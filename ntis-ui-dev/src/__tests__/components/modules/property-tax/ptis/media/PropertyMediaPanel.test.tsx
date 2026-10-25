import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PropertyMediaPanel from '@/components/modules/property-tax/ptis/media/PropertyMediaPanel';
import { MediaPanelProvider } from '@/hooks/ptis/photoplan/useMediaPanelVisibility';
import { toast } from 'sonner';

const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/en/property-tax/ptis',
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/app/[locale]/property-tax/ptis/PhotoPlan.action', () => ({
  launchPhotoPlanDrawingToolAction: vi.fn(),
}));

vi.mock('@/lib/api/property.service', () => ({
  getPropertyDrawPlanStatus: vi.fn().mockResolvedValue({ success: true, data: { isIndividualOrAmenity: true } }),
}));

vi.mock('@/components/common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/common')>();
  return {
    ...actual,
    useConfirm: () => ({
      confirm: vi.fn(),
    }),
  };
});

vi.mock('@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/document.actions', () => ({
  getDocumentAction: vi.fn(),
}));

vi.mock('@/components/modules/property-tax/ptis/media/PropertyMediaPanelContent', () => ({
  PropertyMediaPanelContent: ({ openDrawer }: { openDrawer: (categoryIndex: number) => void }) => (
    <div>
      <button onClick={() => openDrawer(0)}>media.propertyPhoto</button>
      <button>media.photoPlan</button>
      <button>media.satelliteView</button>
    </div>
  ),
}));

vi.mock('@/components/modules/property-tax/ptis/media/PhotoPlanDrawer', () => ({
  PhotoPlanDrawer: ({ open }: { open: boolean }) => (open ? <div data-testid="photo-plan-drawer">Photo Plan Drawer</div> : null),
}));

describe('PropertyMediaPanel', () => {
  const mockProps = {
    propertyId: 42,
    wardNo: 'NK14',
    propertyNo: '25',
    partitionNo: '0',
    initialPhotoSlots: [],
    initialPhotos: [],
    loading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props: React.ComponentProps<typeof PropertyMediaPanel> = mockProps) => {
    return render(
      <MediaPanelProvider initialVisible={true}>
        <PropertyMediaPanel {...props} />
      </MediaPanelProvider>
    );
  };

  it('renders property media panel cards correctly', () => {
    renderComponent();

    expect(screen.getByText('media.propertyPhoto')).toBeInTheDocument();
    expect(screen.getByText('media.photoPlan')).toBeInTheDocument();
    expect(screen.getByText('media.satelliteView')).toBeInTheDocument();
  });

  it('triggers drawer open when clicking property photo card with valid propertyId', () => {
    renderComponent();

    const propertyCard = screen.getByText('media.propertyPhoto');
    fireEvent.click(propertyCard);

    expect(screen.getByTestId('photo-plan-drawer')).toBeInTheDocument();
  });

  it('shows error notification and blocks drawer navigation when clicking card without property selection', () => {
    renderComponent({ ...mockProps, propertyId: undefined });

    const propertyCard = screen.getByText('media.propertyPhoto');
    fireEvent.click(propertyCard);

    expect(toast.error).toHaveBeenCalledWith('Please select a property first.');
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('sets aria-busy when loading prop is true without rendering circle spinner', () => {
    const { container } = renderComponent({ ...mockProps, loading: true });

    const busyContainer = container.querySelector('[aria-busy="true"]');
    expect(busyContainer).toBeInTheDocument();
    expect(container.querySelector('.animate-spin')).not.toBeInTheDocument();
  });
});
