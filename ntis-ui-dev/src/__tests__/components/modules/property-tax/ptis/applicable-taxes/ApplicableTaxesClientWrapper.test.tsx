import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import ApplicableTaxesClientWrapper, { useApplicableTaxesCloseContext } from '@/components/modules/property-tax/ptis/applicable-taxes/ApplicableTaxesClientWrapper';
import { usePathname, useSearchParams, useParams } from 'next/navigation';
import { useQdeSaveContext } from '@/hooks/ptis/QuickDataEntry/useQdeSaveTracker';

// Mock next/navigation
const mockPush = vi.fn();
const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
  useParams: vi.fn(),
}));

// Mock Drawer component
interface MockDrawerProps {
  children: React.ReactNode;
  onClose: () => void;
  open: boolean;
}

vi.mock('@/components/common/Drawer', () => ({
  Drawer: ({ children, onClose, open }: MockDrawerProps) => {
    if (!open) return null;
    return (
      <div data-testid="drawer">
        <button data-testid="drawer-close-btn" onClick={onClose}>Close</button>
        {children}
      </div>
    );
  },
}));

describe('ApplicableTaxesClientWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children inside the drawer when open', () => {
    (usePathname as Mock).mockReturnValue('/en/property-tax/ptis/applicable-taxes');
    (useParams as Mock).mockReturnValue({ locale: 'en' });
    (useSearchParams as Mock).mockReturnValue(new URLSearchParams('propertyId=123&wardNo=W01'));

    render(
      <ApplicableTaxesClientWrapper>
        <div data-testid="child-content">Content Inside Drawer</div>
      </ApplicableTaxesClientWrapper>
    );

    expect(screen.getByTestId('drawer')).toBeInTheDocument();
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('navigates back immediately and hides drawer when close is triggered with history > 1 and no saved changes', () => {
    (usePathname as Mock).mockReturnValue('/en/property-tax/ptis/applicable-taxes');
    (useParams as Mock).mockReturnValue({ locale: 'en' });
    (useSearchParams as Mock).mockReturnValue(new URLSearchParams('propertyId=123&wardNo=W01&propertyNo=P01'));

    const originalLength = window.history.length;
    Object.defineProperty(window.history, 'length', { value: 3, configurable: true });

    const CloseConsumer = () => {
      const handleClose = useApplicableTaxesCloseContext();
      return (
        <button data-testid="inner-close-btn" onClick={() => handleClose?.()}>
          Inner Close
        </button>
      );
    };

    render(
      <ApplicableTaxesClientWrapper>
        <CloseConsumer />
      </ApplicableTaxesClientWrapper>
    );

    fireEvent.click(screen.getByTestId('inner-close-btn'));

    expect(mockBack).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();

    Object.defineProperty(window.history, 'length', { value: originalLength, configurable: true });
  });

  it('calls doClose() with router.push when history <= 1', () => {
    (usePathname as Mock).mockReturnValue('/en/property-tax/ptis/applicable-taxes');
    (useParams as Mock).mockReturnValue({ locale: 'en' });
    (useSearchParams as Mock).mockReturnValue(new URLSearchParams('propertyId=123&wardNo=W01&propertyNo=P01'));

    const originalLength = window.history.length;
    Object.defineProperty(window.history, 'length', { value: 1, configurable: true });

    render(
      <ApplicableTaxesClientWrapper>
        <div>Content</div>
      </ApplicableTaxesClientWrapper>
    );

    fireEvent.click(screen.getByTestId('drawer-close-btn'));

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/en/property-tax/ptis?'));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('propertyId=123'));
    expect(mockBack).not.toHaveBeenCalled();

    Object.defineProperty(window.history, 'length', { value: originalLength, configurable: true });
  });

  it('calls doClose() with router.push when closing after changes were saved', () => {
    (usePathname as Mock).mockReturnValue('/en/property-tax/ptis/applicable-taxes');
    (useParams as Mock).mockReturnValue({ locale: 'en' });
    (useSearchParams as Mock).mockReturnValue(new URLSearchParams('propertyId=123&wardNo=W01&propertyNo=P01&returnTab=individual'));

    const originalLength = window.history.length;
    Object.defineProperty(window.history, 'length', { value: 3, configurable: true });

    const SaveSimulator = () => {
      const saveTracker = useQdeSaveContext();
      const handleClose = useApplicableTaxesCloseContext();
      return (
        <>
          <button data-testid="save-btn" onClick={() => saveTracker?.markChangesSaved()}>
            Save
          </button>
          <button data-testid="close-btn" onClick={() => handleClose?.()}>
            Close
          </button>
        </>
      );
    };

    render(
      <ApplicableTaxesClientWrapper>
        <SaveSimulator />
      </ApplicableTaxesClientWrapper>
    );

    fireEvent.click(screen.getByTestId('save-btn'));
    fireEvent.click(screen.getByTestId('close-btn'));

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/en/property-tax/ptis/individual?'));
    expect(mockBack).not.toHaveBeenCalled();

    Object.defineProperty(window.history, 'length', { value: originalLength, configurable: true });
  });
});
