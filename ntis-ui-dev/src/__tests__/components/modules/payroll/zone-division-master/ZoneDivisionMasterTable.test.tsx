import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ZoneDivisionMasterTable,
  type ZoneDivisionMasterTableProps,
} from '@/components/modules/payroll/MasterModule/OrganizationMaster/ZoneDivisionMaster/ZoneDivisionMasterTable';
import type { ZoneDivisionMasterItem } from '@/types/payroll/MasterModule';

const zoneTranslations: Record<string, string> = {
  'table.columns.officeCode': 'Office Code',
  'table.columns.officeName': 'Office Name',
  'table.columns.officeNameRegional': 'Office Name (Regional)',
  'table.columns.address': 'Address',
  'table.columns.status': 'Status',
  'table.columns.actions': 'Actions',
  'drawer.editTitle': 'Edit Zone / Office',
  'deleteModal.title': 'Delete Zone / Office',
};

const commonTranslations: Record<string, string> = {
  'status.active': 'Active',
  'status.inactive': 'Inactive',
  'table.noData': 'No records found',
  'table.showing': 'Showing',
  'table.to': 'to',
  'table.of': 'of',
  'table.rowsPerPage': 'Rows per page',
  'table.showingEntries': 'Showing {start} to {end} of {total} entries',
};

vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => (key: string, values?: Record<string, unknown>) => {
    if (namespace === 'common') {
      let str = commonTranslations[key] ?? key;
      if (values) {
        Object.entries(values).forEach(([k, v]) => {
          str = str.replace(`{${k}}`, String(v));
        });
      }
      return str;
    }
    if (namespace === 'payrollZoneDivisionMaster.table.columns') {
      return zoneTranslations[`table.columns.${key}`] ?? key;
    }
    return zoneTranslations[key] ?? key;
  },
}));

const mockData: ZoneDivisionMasterItem[] = [
  {
    zoneDivisionId: 'ZONE-001',
    zoneDivisionCode: 'DIV-EAST',
    zoneDivisionName: 'East Division Administrative Office',
    zoneDivisionNameRegional: 'पूर्व विभाग प्रशासकीय कार्यालय',
    address: 'Near Shivaji Statue, Old Agra Road',
    isActive: true,
  },
  {
    zoneDivisionId: 'ZONE-002',
    zoneDivisionCode: 'HQ-1',
    zoneDivisionName: 'Municipal Headquarters',
    zoneDivisionNameRegional: '',
    address: 'Main Municipal Building',
    isActive: false,
  },
];

describe('ZoneDivisionMasterTable', () => {
  const mockOnPageChange = vi.fn();
  const mockOnPageSizeChange = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  const defaultProps: ZoneDivisionMasterTableProps = {
    data: mockData,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 2,
    totalPages: 1,
    isLoading: false,
    onPageChange: mockOnPageChange,
    onPageSizeChange: mockOnPageSizeChange,
    onEdit: mockOnEdit,
    onDelete: mockOnDelete,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all table headers and zone division office rows', () => {
    render(<ZoneDivisionMasterTable {...defaultProps} />);

    expect(screen.getByText('Office Code')).toBeInTheDocument();
    expect(screen.getByText('Office Name')).toBeInTheDocument();
    expect(screen.getByText('Office Name (Regional)')).toBeInTheDocument();
    expect(screen.getByText('Address')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();

    // Row 1
    expect(screen.getByText('DIV-EAST')).toBeInTheDocument();
    expect(screen.getByText('East Division Administrative Office')).toBeInTheDocument();
    expect(screen.getByText('पूर्व विभाग प्रशासकीय कार्यालय')).toBeInTheDocument();
    expect(screen.getByText('Near Shivaji Statue, Old Agra Road')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();

    // Row 2
    expect(screen.getByText('HQ-1')).toBeInTheDocument();
    expect(screen.getByText('Municipal Headquarters')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('renders fallback dash when Marathi name is empty', () => {
    render(<ZoneDivisionMasterTable {...defaultProps} />);

    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });

  it('calls onEdit with the correct item when edit button is clicked', () => {
    render(<ZoneDivisionMasterTable {...defaultProps} />);

    const editButtons = screen.getAllByTitle('Edit Zone / Office');
    expect(editButtons).toHaveLength(2);

    fireEvent.click(editButtons[0]);
    expect(mockOnEdit).toHaveBeenCalledWith(mockData[0]);
  });

  it('calls onDelete with the correct item when delete button is clicked', () => {
    render(<ZoneDivisionMasterTable {...defaultProps} />);

    const deleteButtons = screen.getAllByTitle('Delete Zone / Office');
    expect(deleteButtons).toHaveLength(2);

    fireEvent.click(deleteButtons[0]);
    expect(mockOnDelete).toHaveBeenCalledWith(mockData[0]);
  });

  it('renders pagination footer with showing info and rows per page selector', () => {
    render(<ZoneDivisionMasterTable {...defaultProps} />);

    expect(screen.getByText(/Showing 1 to 2 of 2 entries/i)).toBeInTheDocument();
    const rowsPerPageSelect = screen.getByLabelText(/Rows per page/i);
    expect(rowsPerPageSelect).toBeInTheDocument();
    fireEvent.change(rowsPerPageSelect, { target: { value: '20' } });
    expect(mockOnPageSizeChange).toHaveBeenCalledWith(20);
  });
});
