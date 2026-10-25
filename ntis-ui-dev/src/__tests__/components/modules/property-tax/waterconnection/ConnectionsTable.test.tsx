/**
 * Tests for ConnectionsTable component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import { ConnectionsTable } from '@/components/modules/property-tax/waterconnection/ConnectionsTable';
import {
  mockWaterConnections,
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

describe('ConnectionsTable', () => {
  let handlers: ReturnType<typeof createMockHandlers>;

  const defaultProps = {
    propertyNo: 'FR09-2024-001',
    connections: mockWaterConnections,
    totalCount: mockWaterConnections.length,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 1,
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
  };

  beforeEach(() => {
    handlers = createMockHandlers();
  });

  describe('rendering', () => {
    it('should render table with connections', () => {
      renderWithIntl(
        <ConnectionsTable
          {...defaultProps}
          onAdd={handlers.onAdd}
          onEdit={handlers.onEdit}
          onDelete={handlers.onDelete}
        />
      );

      // Should show connection count badge
      expect(screen.getByText(/2 connections/i)).toBeInTheDocument();
    });

    it('should render section header with title', () => {
      renderWithIntl(
        <ConnectionsTable
          {...defaultProps}
          onAdd={handlers.onAdd}
          onEdit={handlers.onEdit}
          onDelete={handlers.onDelete}
        />
      );

      // The title is "Connections" from the i18n messages
      expect(screen.getByText('Connections')).toBeInTheDocument();
    });

    it('should render property number in subtitle', () => {
      renderWithIntl(
        <ConnectionsTable
          {...defaultProps}
          onAdd={handlers.onAdd}
          onEdit={handlers.onEdit}
          onDelete={handlers.onDelete}
        />
      );

      expect(screen.getByText(/FR09-2024-001/)).toBeInTheDocument();
    });

    it('should render add button', () => {
      renderWithIntl(
        <ConnectionsTable
          {...defaultProps}
          onAdd={handlers.onAdd}
          onEdit={handlers.onEdit}
          onDelete={handlers.onDelete}
        />
      );

      expect(screen.getByRole('button', { name: /add connection/i })).toBeInTheDocument();
    });

    it('should render connection data in table rows', () => {
      renderWithIntl(
        <ConnectionsTable
          {...defaultProps}
          onAdd={handlers.onAdd}
          onEdit={handlers.onEdit}
          onDelete={handlers.onDelete}
        />
      );

      // Check for connection numbers from mock data
      expect(screen.getByText('WC-001')).toBeInTheDocument();
      expect(screen.getByText('WC-002')).toBeInTheDocument();
    });

    it('should render edit and delete buttons for each row', () => {
      renderWithIntl(
        <ConnectionsTable
          {...defaultProps}
          onAdd={handlers.onAdd}
          onEdit={handlers.onEdit}
          onDelete={handlers.onDelete}
        />
      );

      // Should have edit buttons (one per row)
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      expect(editButtons.length).toBeGreaterThanOrEqual(2);

      // Should have delete buttons (one per row)
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      expect(deleteButtons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('empty state', () => {
    it('should handle empty connections array', () => {
      renderWithIntl(
        <ConnectionsTable
          {...defaultProps}
          connections={[]}
          totalCount={0}
          onAdd={handlers.onAdd}
          onEdit={handlers.onEdit}
          onDelete={handlers.onDelete}
        />
      );

      expect(screen.getByText(/0 connections/i)).toBeInTheDocument();
    });
  });

  describe('event handlers', () => {
    it('should call onAdd when add button is clicked', () => {
      renderWithIntl(
        <ConnectionsTable
          {...defaultProps}
          onAdd={handlers.onAdd}
          onEdit={handlers.onEdit}
          onDelete={handlers.onDelete}
        />
      );

      const addButton = screen.getByRole('button', { name: /add connection/i });
      fireEvent.click(addButton);

      expect(handlers.onAdd).toHaveBeenCalledTimes(1);
    });

    it('should call onEdit with connection data when edit button is clicked', () => {
      renderWithIntl(
        <ConnectionsTable
          {...defaultProps}
          onAdd={handlers.onAdd}
          onEdit={handlers.onEdit}
          onDelete={handlers.onDelete}
        />
      );

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      fireEvent.click(editButtons[0]);

      expect(handlers.onEdit).toHaveBeenCalledTimes(1);
      expect(handlers.onEdit).toHaveBeenCalledWith(expect.objectContaining({
        connectionNo: 'WC-001',
      }));
    });

    it('should call onDelete with connection data when delete button is clicked', () => {
      renderWithIntl(
        <ConnectionsTable
          {...defaultProps}
          onAdd={handlers.onAdd}
          onEdit={handlers.onEdit}
          onDelete={handlers.onDelete}
        />
      );

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[0]);

      expect(handlers.onDelete).toHaveBeenCalledTimes(1);
      expect(handlers.onDelete).toHaveBeenCalledWith(expect.objectContaining({
        connectionNo: 'WC-001',
      }));
    });
  });

  describe('table columns', () => {
    it('should display connection type', () => {
      renderWithIntl(
        <ConnectionsTable
          {...defaultProps}
          onAdd={handlers.onAdd}
          onEdit={handlers.onEdit}
          onDelete={handlers.onDelete}
        />
      );

      // Type comes from the mock data's type field
      const domesticElements = screen.getAllByText('Domestic');
      expect(domesticElements.length).toBeGreaterThan(0);
    });

    it('should display tap size', () => {
      renderWithIntl(
        <ConnectionsTable
          {...defaultProps}
          onAdd={handlers.onAdd}
          onEdit={handlers.onEdit}
          onDelete={handlers.onDelete}
        />
      );

      expect(screen.getByText('0.5 Inch')).toBeInTheDocument();
      expect(screen.getByText('0.75 Inch')).toBeInTheDocument();
    });

    it('should display active/stopped status badges', () => {
      renderWithIntl(
        <ConnectionsTable
          {...defaultProps}
          onAdd={handlers.onAdd}
          onEdit={handlers.onEdit}
          onDelete={handlers.onDelete}
        />
      );

      // Status badges from i18n - Active and Stopped (not Running/Stopped from statusName)
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should not display the category column', () => {
      renderWithIntl(
        <ConnectionsTable
          {...defaultProps}
          onAdd={handlers.onAdd}
          onEdit={handlers.onEdit}
          onDelete={handlers.onDelete}
        />
      );

      expect(screen.queryByText('Category')).not.toBeInTheDocument();
      expect(screen.queryByText('Residential')).not.toBeInTheDocument();
    });
  });

  describe('active/inactive status', () => {
    it('should display active badge for active connections', () => {
      const activeConnection = createMockWaterConnection({ isActive: true });

      renderWithIntl(
        <ConnectionsTable
          {...defaultProps}
          connections={[activeConnection]}
          onAdd={handlers.onAdd}
          onEdit={handlers.onEdit}
          onDelete={handlers.onDelete}
        />
      );

      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should display inactive badge for inactive connections', () => {
      const inactiveConnection = createMockWaterConnection({ isActive: false });

      renderWithIntl(
        <ConnectionsTable
          {...defaultProps}
          connections={[inactiveConnection]}
          totalCount={1}
          onAdd={handlers.onAdd}
          onEdit={handlers.onEdit}
          onDelete={handlers.onDelete}
        />
      );

      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });
  });

  describe('single connection', () => {
    it('should render correctly with single connection', () => {
      const singleConnection = createMockWaterConnection();

      renderWithIntl(
        <ConnectionsTable
          {...defaultProps}
          connections={[singleConnection]}
          totalCount={1}
          onAdd={handlers.onAdd}
          onEdit={handlers.onEdit}
          onDelete={handlers.onDelete}
        />
      );

      expect(screen.getByText(/1 connections/i)).toBeInTheDocument();
    });
  });

  describe('many connections', () => {
    it('should render correctly with many connections', () => {
      const manyConnections = Array.from({ length: 10 }, (_, i) =>
        createMockWaterConnection({
          id: i + 1,
          connectionNo: `WC-${String(i + 1).padStart(3, '0')}`,
        })
      );

      renderWithIntl(
        <ConnectionsTable
          {...defaultProps}
          connections={manyConnections}
          totalCount={10}
          onAdd={handlers.onAdd}
          onEdit={handlers.onEdit}
          onDelete={handlers.onDelete}
        />
      );

      expect(screen.getByText(/10 connections/i)).toBeInTheDocument();
    });
  });
});
