import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TabNavigation } from '@/components/modules/property-tax/ptis/QuickDataEntry/TabNavigation';
import { TABS } from '@/components/modules/property-tax/ptis/QuickDataEntry/navigation-constants';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      'tabs.Property': 'Property',
      'tabs.Kyc': 'KYC',
      'tabs.Society': 'Society',
      'tabs.SocietyDetails': 'Society Details',
      'tabs.Wing': 'Wing Details',
      'tabs.BuildingPermission': 'Building Permission',
      'tabs.Discount': 'Discount & Social Data',
      'tabs.FloorSubmission': 'Floor',
      'tabs.OldDetails': 'Old Details',
      'photos.showPropertyPhotos': 'Property Photos',
    };
    return map[key] || key;
  },
}));

const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams('propertyId=101&wardNo=1&propertyNo=101&partitionNo=0');

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: vi.fn(),
  }),
  usePathname: () => '/en/property-tax/ptis/QuickDataEntry/101/Wing',
  useSearchParams: () => mockSearchParams,
  useParams: () => ({ propertyId: '101', locale: 'en' }),
}));

vi.mock('@/components/common/ConfirmProvider', () => ({
  useConfirm: () => ({
    confirm: vi.fn(),
  }),
}));

describe('TabNavigation Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams('propertyId=101&wardNo=1&propertyNo=101&partitionNo=0');
  });

  it('renders all 8 tabs in the correct sequence with Wing positioned to the left of BuildingPermission', () => {
    render(<TabNavigation />);

    // Check tab order in TABS array
    const labels = TABS.map((t) => t.label);
    expect(labels).toEqual([
      'Property',
      'Kyc',
      'Society',
      'Wing',
      'BuildingPermission',
      'Discount',
      'FloorSubmission',
      'OldDetails',
    ]);

    // Check index of Wing is directly before BuildingPermission
    const wingIndex = labels.indexOf('Wing');
    const buildingIndex = labels.indexOf('BuildingPermission');
    expect(wingIndex).toBe(3);
    expect(buildingIndex).toBe(4);
    expect(wingIndex).toBe(buildingIndex - 1);

    // Verify all tabs render on screen
    expect(screen.getByText('Property')).toBeInTheDocument();
    expect(screen.getByText('KYC')).toBeInTheDocument();
    expect(screen.getByText('Society')).toBeInTheDocument();
    expect(screen.getByText('Wing Details')).toBeInTheDocument();
    expect(screen.getByText('Building Permission')).toBeInTheDocument();
    expect(screen.getByText('Discount & Social Data')).toBeInTheDocument();
    expect(screen.getByText('Floor')).toBeInTheDocument();
    expect(screen.getByText('Old Details')).toBeInTheDocument();
  });

  it('hides Wing Details tab and shows Society Details when opened from Society Edit in redesign', () => {
    mockSearchParams = new URLSearchParams('propertyId=101&returnTab=apartment&fromSocietyEdit=true');

    render(<TabNavigation />);

    expect(screen.queryByText('Property')).not.toBeInTheDocument();
    expect(screen.queryByText('KYC')).not.toBeInTheDocument();
    expect(screen.queryByText('Wing Details')).not.toBeInTheDocument();
    expect(screen.getByText('Society Details')).toBeInTheDocument();
    expect(screen.getByText('Building Permission')).toBeInTheDocument();
    expect(screen.getByText('Discount & Social Data')).toBeInTheDocument();
    expect(screen.getByText('Old Details')).toBeInTheDocument();
  });

  it('hides Society Details tab and shows Wing Details when opened from Wing Edit in redesign', () => {
    mockSearchParams = new URLSearchParams('propertyId=101&returnTab=apartment&fromWingEdit=true&hideSociety=true');

    render(<TabNavigation />);

    expect(screen.queryByText('Property')).not.toBeInTheDocument();
    expect(screen.queryByText('KYC')).not.toBeInTheDocument();
    expect(screen.queryByText('Society Details')).not.toBeInTheDocument();
    expect(screen.queryByText('Society')).not.toBeInTheDocument();
    expect(screen.getByText('Wing Details')).toBeInTheDocument();
    expect(screen.getByText('Building Permission')).toBeInTheDocument();
    expect(screen.getByText('Discount & Social Data')).toBeInTheDocument();
    expect(screen.getByText('Old Details')).toBeInTheDocument();
  });

  it('hides both Society and Wing tabs when opened from Footer Edit in standard PTIS', () => {
    mockSearchParams = new URLSearchParams('propertyId=101&fromFooterEdit=true&hideWing=true&hideSociety=true');

    render(<TabNavigation />);

    expect(screen.getByText('Property')).toBeInTheDocument();
    expect(screen.getByText('KYC')).toBeInTheDocument();
    expect(screen.queryByText('Society')).not.toBeInTheDocument();
    expect(screen.queryByText('Society Details')).not.toBeInTheDocument();
    expect(screen.queryByText('Wing Details')).not.toBeInTheDocument();
    expect(screen.getByText('Building Permission')).toBeInTheDocument();
    expect(screen.getByText('Discount & Social Data')).toBeInTheDocument();
    expect(screen.getByText('Old Details')).toBeInTheDocument();
  });

  it('hides Property, KYC, Society and Wing tabs when opened from Footer Edit in redesign', () => {
    mockSearchParams = new URLSearchParams('propertyId=101&returnTab=apartment&fromFooterEdit=true&hideWing=true&hideSociety=true');

    render(<TabNavigation />);

    expect(screen.queryByText('Property')).not.toBeInTheDocument();
    expect(screen.queryByText('KYC')).not.toBeInTheDocument();
    expect(screen.queryByText('Society')).not.toBeInTheDocument();
    expect(screen.queryByText('Society Details')).not.toBeInTheDocument();
    expect(screen.queryByText('Wing Details')).not.toBeInTheDocument();
    expect(screen.getByText('Building Permission')).toBeInTheDocument();
    expect(screen.getByText('Discount & Social Data')).toBeInTheDocument();
    expect(screen.getByText('Old Details')).toBeInTheDocument();
  });

  it('renders and handles media panel toggle button always in blue highlight', () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <TabNavigation onToggleMediaPanel={onToggle} isMediaPanelOpen={false} />
    );

    const toggleBtn = screen.getByRole('button', { name: /Property Photos/i });
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn.className).toContain('from-blue-500 to-blue-600');
    expect(toggleBtn.className).not.toContain('ring-2 ring-blue-400');

    toggleBtn.click();
    expect(onToggle).toHaveBeenCalledTimes(1);

    rerender(<TabNavigation onToggleMediaPanel={onToggle} isMediaPanelOpen={true} />);
    const activeToggleBtn = screen.getByRole('button', { name: /Property Photos/i });
    expect(activeToggleBtn.className).toContain('from-blue-500 to-blue-600');
    expect(activeToggleBtn.className).toContain('ring-2 ring-blue-400');
  });

  it('hides Society, Wing, and Old Details tabs when opened for Individual property', () => {
    mockSearchParams = new URLSearchParams('propertyId=101&returnTab=individual&from=individual');

    render(<TabNavigation categoryName="Individual" />);

    expect(screen.getByText('Property')).toBeInTheDocument();
    expect(screen.getByText('KYC')).toBeInTheDocument();
    expect(screen.queryByText('Society')).not.toBeInTheDocument();
    expect(screen.queryByText('Wing Details')).not.toBeInTheDocument();
    expect(screen.getByText('Building Permission')).toBeInTheDocument();
    expect(screen.getByText('Discount & Social Data')).toBeInTheDocument();
    expect(screen.getByText('Floor')).toBeInTheDocument();
    expect(screen.queryByText('Old Details')).not.toBeInTheDocument();
  });
});
