/**
 * Tests for WaterConnectionPage component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';

// Mock sonner toast
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

// Hoisted spies
const pushSpy = vi.hoisted(() => vi.fn());
const replaceSpy = vi.hoisted(() => vi.fn());
const refreshSpy = vi.hoisted(() => vi.fn());
const confirmSpy = vi.hoisted(() => vi.fn());

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushSpy,
    replace: replaceSpy,
    refresh: refreshSpy,
  }),
  useSearchParams: () => ({
    get: vi.fn(),
    getAll: vi.fn(),
    has: vi.fn(),
    forEach: vi.fn(),
    entries: vi.fn(),
    keys: vi.fn(),
    values: vi.fn(),
    toString: vi.fn(() => ''),
  }),
}));

// Mock ConfirmProvider
vi.mock('@/components/common/ConfirmProvider', () => ({
  useConfirm: () => ({ confirm: confirmSpy }),
}));

// Mock server actions
vi.mock('@/app/[locale]/property-tax/waterconnection/action', () => ({
  deleteWaterConnectionAction: vi.fn(),
  getConnectionLookupsAction: vi.fn(),
  getWaterConnectionPageData: vi.fn(),
  getWaterConnectionsOnlyAction: vi.fn(),
  getAllWaterConnectionsAction: vi.fn(() => Promise.resolve([])),
}));

import { toast } from 'sonner';
import WaterConnectionPage from '@/components/modules/property-tax/waterconnection/WaterConnectionPage';
import { deleteWaterConnectionAction, getConnectionLookupsAction, getWaterConnectionPageData, getWaterConnectionsOnlyAction, getAllWaterConnectionsAction } from '@/app/[locale]/property-tax/waterconnection/action';
import {
  createMockPageData,
  mockWaterConnections,
  mockTypeOptions,
  mockSizeOptions,
  mockStatusOptions,
  mockRateMasters,
  waterConnectionMessages,
} from '@/__tests__/utils/waterConnectionTestUtils';

const renderWithIntl = (ui: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={waterConnectionMessages}>
      {ui}
    </NextIntlClientProvider>
  );
};

describe('WaterConnectionPage', () => {
  const defaultProps = {
    initialData: createMockPageData(),
    propertyId: 123,
    initialPage: 1,
    initialPageSize: 10,
    saveWaterConnectionAction: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    confirmSpy.mockImplementation(({ onConfirm }) => onConfirm());
    (getConnectionLookupsAction as ReturnType<typeof vi.fn>).mockResolvedValue({
      typeOptions: mockTypeOptions,
      sizeOptions: mockSizeOptions,
      statusOptions: mockStatusOptions,
      rateMasters: mockRateMasters,
    });
    (getWaterConnectionPageData as ReturnType<typeof vi.fn>).mockResolvedValue(
      createMockPageData()
    );
    (getAllWaterConnectionsAction as ReturnType<typeof vi.fn>).mockResolvedValue(mockWaterConnections);
    (getWaterConnectionsOnlyAction as ReturnType<typeof vi.fn>).mockResolvedValue({
      connections: mockWaterConnections,
      totalCount: 2,
      totalPages: 1,
      pageNumber: 1,
      pageSize: 10,
    });
  });

  describe('rendering', () => {
    it('should render page title', () => {
      renderWithIntl(<WaterConnectionPage {...defaultProps} />);

      expect(screen.getByRole('heading', { name: /water connections/i })).toBeInTheDocument();
    });

    it('should render property number in subtitle', () => {
      renderWithIntl(<WaterConnectionPage {...defaultProps} />);

      // Property number appears multiple times, use getAllByText
      const propertyNos = screen.getAllByText(/FR09-2024-001/);
      expect(propertyNos.length).toBeGreaterThan(0);
    });

    it('should render stats cards', () => {
      renderWithIntl(<WaterConnectionPage {...defaultProps} />);

      expect(screen.getByText(/total connections/i)).toBeInTheDocument();
      expect(screen.getByText(/active connections/i)).toBeInTheDocument();
      expect(screen.getByText(/stopped connections/i)).toBeInTheDocument();
      expect(screen.getByText(/yearly revenue/i)).toBeInTheDocument();
    });

    it('should render property info card', () => {
      renderWithIntl(<WaterConnectionPage {...defaultProps} />);

      expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
      expect(screen.getByText(/rajesh.kumar@email.com/i)).toBeInTheDocument();
    });

    it('should render connections table', () => {
      renderWithIntl(<WaterConnectionPage {...defaultProps} />);

      expect(screen.getByText('WC-001')).toBeInTheDocument();
      expect(screen.getByText('WC-002')).toBeInTheDocument();
    });
  });

  describe('stats calculation', () => {
    it('should calculate correct total connections', () => {
      renderWithIntl(<WaterConnectionPage {...defaultProps} />);

      // 2 connections in mock data - the stats card shows "2"
      const totalCard = screen.getByText(/total connections/i).closest('div')?.parentElement;
      expect(totalCard).toHaveTextContent('2');
    });

    it('should calculate correct active connections', () => {
      const pageData = createMockPageData({
        connections: [
          { ...mockWaterConnections[0], isActive: true },
          { ...mockWaterConnections[1], isActive: false },
        ],
      });

      renderWithIntl(
        <WaterConnectionPage initialData={pageData} propertyId={123} initialPage={1} initialPageSize={10} saveWaterConnectionAction={vi.fn()} />
      );

      // 1 active connection - check the stats card
      const activeCard = screen.getByText(/active connections/i).closest('div')?.parentElement;
      expect(activeCard).toHaveTextContent('1');
    });

    it('should calculate yearly revenue from all connections (both active and inactive)', () => {
      const pageData = createMockPageData({
        connections: [
          { ...mockWaterConnections[0], isActive: true, applicableCharges: 1200 },
          { ...mockWaterConnections[1], isActive: false, applicableCharges: 1800 },
        ],
      });

      renderWithIntl(
        <WaterConnectionPage initialData={pageData} propertyId={123} initialPage={1} initialPageSize={10} saveWaterConnectionAction={vi.fn()} />
      );

      // Both active and inactive connections contribute to revenue (1200 + 1800 = 3000)
      const revenueCard = screen.getByText(/yearly revenue/i).closest('div')?.parentElement;
      expect(revenueCard).toHaveTextContent('3,000');
    });
  });

  describe('add connection flow', () => {
    it('should open drawer when add button is clicked', async () => {
      renderWithIntl(<WaterConnectionPage {...defaultProps} />);

      const addButton = screen.getByRole('button', { name: /add connection/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/add water connection/i)).toBeInTheDocument();
      });
    });
  });

  describe('edit connection flow', () => {
    it('should open drawer with connection data when edit is clicked', async () => {
      renderWithIntl(<WaterConnectionPage {...defaultProps} />);

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/edit water connection/i)).toBeInTheDocument();
      });
    });
  });

  describe('delete connection flow', () => {
    it('should show confirmation dialog when delete is clicked', async () => {
      renderWithIntl(<WaterConnectionPage {...defaultProps} />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[0]);

      expect(confirmSpy).toHaveBeenCalled();
    });

    it('should call deleteWaterConnectionAction on confirmation', async () => {
      (deleteWaterConnectionAction as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });

      renderWithIntl(<WaterConnectionPage {...defaultProps} />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(deleteWaterConnectionAction).toHaveBeenCalledWith(1); // First connection ID
      });
    });

    it('should show success toast on successful delete', async () => {
      (deleteWaterConnectionAction as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });

      renderWithIntl(<WaterConnectionPage {...defaultProps} />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      });
    });

    it('should re-fetch page data on successful delete', async () => {
      (deleteWaterConnectionAction as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });

      renderWithIntl(<WaterConnectionPage {...defaultProps} />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(getWaterConnectionsOnlyAction).toHaveBeenCalled();
      });
    });

    it('should show error toast on failed delete', async () => {
      (deleteWaterConnectionAction as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        error: 'Delete failed',
      });

      renderWithIntl(<WaterConnectionPage {...defaultProps} />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });

  describe('drawer close', () => {
    it('should close drawer when cancel is clicked', async () => {
      renderWithIntl(<WaterConnectionPage {...defaultProps} />);

      // Open drawer
      const addButton = screen.getByRole('button', { name: /add connection/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/add water connection/i)).toBeInTheDocument();
      });

      // Close drawer
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      // Drawer should close (title should not be visible)
      await waitFor(() => {
        expect(screen.queryByText(/add water connection/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('empty state', () => {
    it('should render correctly with no connections', () => {
      const pageData = createMockPageData({ connections: [], totalCount: 0 });

      renderWithIntl(
        <WaterConnectionPage initialData={pageData} propertyId={123} initialPage={1} initialPageSize={10} saveWaterConnectionAction={vi.fn()} />
      );

      expect(screen.getByText(/0 connections/i)).toBeInTheDocument();
    });

    it('should still show add button with no connections', () => {
      const pageData = createMockPageData({ connections: [] });

      renderWithIntl(
        <WaterConnectionPage initialData={pageData} propertyId={123} initialPage={1} initialPageSize={10} saveWaterConnectionAction={vi.fn()} />
      );

      expect(screen.getByRole('button', { name: /add connection/i })).toBeInTheDocument();
    });
  });

  describe('property info display', () => {
    it('should display owner name', () => {
      renderWithIntl(<WaterConnectionPage {...defaultProps} />);

      expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
    });

    it('should display contact information', () => {
      renderWithIntl(<WaterConnectionPage {...defaultProps} />);

      expect(screen.getByText(/\+91 90743 42210/)).toBeInTheDocument();
    });

    it('should display address', () => {
      renderWithIntl(<WaterConnectionPage {...defaultProps} />);

      expect(screen.getByText(/123 MG Road/)).toBeInTheDocument();
    });

    it('should display zone and ward', () => {
      renderWithIntl(<WaterConnectionPage {...defaultProps} />);

      expect(screen.getByText(/Zone-3/)).toBeInTheDocument();
      expect(screen.getByText(/Ward-21/)).toBeInTheDocument();
    });
  });
});
