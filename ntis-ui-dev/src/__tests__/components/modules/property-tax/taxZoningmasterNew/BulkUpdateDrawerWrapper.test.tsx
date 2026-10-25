/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BulkUpdateDrawerWrapper from '@/components/modules/property-tax/taxZoningmasterNew/BulkUpdateDrawerWrapper';

const backMock = vi.fn();
const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: backMock, push: pushMock, replace: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({ locale: 'en' }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/components/common/Drawer', () => ({
  Drawer: ({ open, children, onClose }: any) => (open ? (
    <div data-testid="drawer">
      {children}
      <button data-testid="drawer-close" onClick={onClose}>Close</button>
    </div>
  ) : null),
}));

vi.mock('@/components/modules/property-tax/taxZoningmasterNew/BulkUpdateDrawer', () => ({
  default: ({ onApply, onClose }: any) => (
    <>
      <button data-testid="apply-btn" onClick={onApply}>Apply</button>
      <button data-testid="inner-close-btn" onClick={onClose}>Cancel</button>
    </>
  ),
}));

const handleDownloadTemplateMock = vi.fn();
const handleImportFileMock = vi.fn();
const toCreatePayloadsMock = vi.fn();
let fileState: any;

vi.mock('@/hooks/taxZoningRange/useTaxZoningRangeFile', () => ({
  useTaxZoningRangeFile: () => fileState,
}));

const handleBulkApplyMock = vi.fn();
let actionsState: any;
vi.mock('@/hooks/taxZoningRange/useTaxZoningRangeActions', () => ({
  useTaxZoningRangeActions: () => actionsState,
}));

describe('BulkUpdateDrawerWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fileState = {
      rows: [],
      fileName: null,
      importing: false,
      hasValidRows: false,
      hasInvalidRows: false,
      handleDownloadTemplate: handleDownloadTemplateMock,
      handleImportFile: handleImportFileMock,
      toCreatePayloads: toCreatePayloadsMock,
    };
    actionsState = { saving: false, handleBulkApply: handleBulkApplyMock };
  });

  it('clicking Apply calls toCreatePayloads then handleBulkApply, and success navigates to the taxzoningmaster screen', async () => {
    const fixedPayloads = [{ wardIds: [1], taxZoneId: 2, zoneDescription: 'd' }];
    toCreatePayloadsMock.mockReturnValue(fixedPayloads);
    handleBulkApplyMock.mockImplementation(async (_payloads: any, onSuccess: () => void) => {
      onSuccess();
    });

    render(<BulkUpdateDrawerWrapper wardsData={[]} taxZones={[]} />);
    fireEvent.click(screen.getByTestId('apply-btn'));

    expect(toCreatePayloadsMock).toHaveBeenCalled();
    await vi.waitFor(() => {
      expect(handleBulkApplyMock).toHaveBeenCalledWith(fixedPayloads, expect.any(Function));
    });
    expect(pushMock).toHaveBeenCalledWith('/en/property-tax/taxzoningmaster');
    expect(backMock).not.toHaveBeenCalled();
  });

  it('clicking the drawer close button navigates to the taxzoningmaster screen', () => {
    render(<BulkUpdateDrawerWrapper wardsData={[]} taxZones={[]} />);
    fireEvent.click(screen.getByTestId('drawer-close'));
    expect(pushMock).toHaveBeenCalledWith('/en/property-tax/taxzoningmaster');
    expect(backMock).not.toHaveBeenCalled();
  });

  it('clicking the inner drawer close/cancel button navigates to the taxzoningmaster screen', () => {
    render(<BulkUpdateDrawerWrapper wardsData={[]} taxZones={[]} />);
    fireEvent.click(screen.getByTestId('inner-close-btn'));
    expect(pushMock).toHaveBeenCalledWith('/en/property-tax/taxzoningmaster');
    expect(backMock).not.toHaveBeenCalled();
  });
});
