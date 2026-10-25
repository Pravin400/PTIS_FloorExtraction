/**
 * Tests for AddConnectionDrawer component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';

// Mock sonner toast
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

// Mock server actions
vi.mock('@/app/[locale]/property-tax/waterconnection/action', () => ({
  saveWaterConnectionAction: vi.fn(),
  getConnectionLookupsAction: vi.fn(),
}));

import { AddConnectionDrawer } from '@/components/modules/property-tax/waterconnection/AddConnectionDrawer';
import {
  saveWaterConnectionAction,
  getConnectionLookupsAction,
} from '@/app/[locale]/property-tax/waterconnection/action';
import {
  mockTypeOptions,
  mockSizeOptions,
  mockStatusOptions,
  mockRateMasters,
  createMockWaterConnection,
  createMockHandlers,
  waterConnectionMessages,
} from '@/__tests__/utils/waterConnectionTestUtils';

const renderWithIntl = (ui: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={waterConnectionMessages}>
      {ui}
    </NextIntlClientProvider>
  );
};

describe('AddConnectionDrawer', () => {
  let handlers: ReturnType<typeof createMockHandlers>;

  const defaultProps = {
    open: true,
    propertyId: 123,
    editingConnection: null,
    typeOptions: mockTypeOptions,
    sizeOptions: mockSizeOptions,
    statusOptions: mockStatusOptions,
    rateMasters: mockRateMasters,
    saveWaterConnectionAction: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = createMockHandlers();

    // Default mock for getConnectionLookupsAction
    (getConnectionLookupsAction as ReturnType<typeof vi.fn>).mockResolvedValue({
      typeOptions: mockTypeOptions,
      sizeOptions: mockSizeOptions,
      statusOptions: mockStatusOptions,
      rateMasters: mockRateMasters,
    });
  });

  describe('rendering', () => {
    it('should render drawer when open is true', () => {
      renderWithIntl(
        <AddConnectionDrawer
          {...defaultProps}
          onClose={handlers.onClose}
          onSaved={handlers.onSaved}
        />
      );

      expect(screen.getByText(/add water connection/i)).toBeInTheDocument();
    });

    it('should not render drawer content when open is false', () => {
      renderWithIntl(
        <AddConnectionDrawer
          {...defaultProps}
          open={false}
          onClose={handlers.onClose}
          onSaved={handlers.onSaved}
        />
      );

      expect(screen.queryByText(/add water connection/i)).not.toBeInTheDocument();
    });

    it('should show edit title when editing existing connection', () => {
      const editingConnection = createMockWaterConnection();

      renderWithIntl(
        <AddConnectionDrawer
          {...defaultProps}
          editingConnection={editingConnection}
          onClose={handlers.onClose}
          onSaved={handlers.onSaved}
        />
      );

      expect(screen.getByText(/edit water connection/i)).toBeInTheDocument();
    });
  });

  describe('form initialization', () => {
    it('should initialize with empty form for new connection', () => {
      renderWithIntl(
        <AddConnectionDrawer
          {...defaultProps}
          onClose={handlers.onClose}
          onSaved={handlers.onSaved}
        />
      );

      const connectionNoInput = screen.getByRole('textbox', { name: /connection no/i });
      expect(connectionNoInput).toHaveValue('');
    });

    it('should populate form with existing data when editing', () => {
      const editingConnection = createMockWaterConnection({
        connectionNo: 'WC-EDIT-001',
        meterNo: 'MTR-EDIT-001',
      });

      renderWithIntl(
        <AddConnectionDrawer
          {...defaultProps}
          editingConnection={editingConnection}
          onClose={handlers.onClose}
          onSaved={handlers.onSaved}
        />
      );

      expect(screen.getByDisplayValue('WC-EDIT-001')).toBeInTheDocument();
      expect(screen.getByDisplayValue('MTR-EDIT-001')).toBeInTheDocument();
    });


  });

  describe('form validation', () => {
    it('should not call save action when form is empty', async () => {
      renderWithIntl(
        <AddConnectionDrawer
          {...defaultProps}
          onClose={handlers.onClose}
          onSaved={handlers.onSaved}
        />
      );

      // Find and click add button (for new connection)
      const addButton = screen.getByRole('button', { name: /add/i });
      fireEvent.click(addButton);

      // The save action should not be called because validation fails
      expect(saveWaterConnectionAction).not.toHaveBeenCalled();
    });

    it('should not call save action when type is not selected', async () => {
      renderWithIntl(
        <AddConnectionDrawer
          {...defaultProps}
          onClose={handlers.onClose}
          onSaved={handlers.onSaved}
        />
      );

      // Fill connection number but not type
      const inputs = screen.getAllByRole('textbox');
      fireEvent.change(inputs[0], { target: { name: 'connectionNo', value: 'WC-001' } });

      const addButton = screen.getByRole('button', { name: /add/i });
      fireEvent.click(addButton);

      // The save action should not be called because type is not selected
      expect(saveWaterConnectionAction).not.toHaveBeenCalled();
    });
  });

  describe('form submission', () => {
    it.skip('should call saveWaterConnectionAction on valid submission', async () => {
      // Requires interacting with controlled Select components — implement with userEvent
    });

    it.skip('should show success toast on successful save', async () => {
      // Requires full form submission via Select components — implement with userEvent
    });

    it.skip('should show error toast on failed save', async () => {
      // Requires full form submission via Select components — implement with userEvent
    });

    it.skip('should call onSaved and onClose on successful save', async () => {
      // Requires full form submission via Select components — implement with userEvent
    });
  });

  describe('cancel button', () => {
    it('should call onClose when cancel button is clicked', () => {
      renderWithIntl(
        <AddConnectionDrawer
          {...defaultProps}
          onClose={handlers.onClose}
          onSaved={handlers.onSaved}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(handlers.onClose).toHaveBeenCalled();
    });
  });

  describe('status toggle', () => {
    it('should render drawer with form elements', () => {
      renderWithIntl(
        <AddConnectionDrawer
          {...defaultProps}
          onClose={handlers.onClose}
          onSaved={handlers.onSaved}
        />
      );

      // Drawer should have the form structure
      const drawer = screen.getByRole('dialog') || screen.getByText(/add water connection/i);
      expect(drawer).toBeInTheDocument();
    });
  });

  describe('applicable rate calculation', () => {
    it.skip('should show rate error when no matching rate found', async () => {
      // Requires selecting type+size with no matching rate via Select components — implement with userEvent
    });
  });

  describe('form reset', () => {
    it('should reset form when drawer closes and reopens', async () => {
      const { rerender } = renderWithIntl(
        <AddConnectionDrawer
          {...defaultProps}
          onClose={handlers.onClose}
          onSaved={handlers.onSaved}
        />
      );

      // Close drawer
      rerender(
        <NextIntlClientProvider locale="en" messages={waterConnectionMessages}>
          <AddConnectionDrawer
            {...defaultProps}
            open={false}
            onClose={handlers.onClose}
            onSaved={handlers.onSaved}
          />
        </NextIntlClientProvider>
      );

      // Reopen drawer
      rerender(
        <NextIntlClientProvider locale="en" messages={waterConnectionMessages}>
          <AddConnectionDrawer
            {...defaultProps}
            open={true}
            editingConnection={null}
            onClose={handlers.onClose}
            onSaved={handlers.onSaved}
          />
        </NextIntlClientProvider>
      );

      // Form should be reset
      const connectionNoInput = screen.getByRole('textbox', { name: /connection no/i });
      expect(connectionNoInput).toHaveValue('');
    });
  });
});
