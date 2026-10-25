import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DesignationMasterTable, type DesignationMasterTableProps } from '@/components/modules/payroll/MasterModule/OrganizationMaster/DesignationMaster/DesignationMasterTable';
import type { DesignationMasterItem } from '@/types/payroll/MasterModule';

const designationTranslations: Record<string, string> = {
  'form.fields.designationCode.label': 'Designation Code',
  'form.fields.designationName.label': 'Designation Name',
  'form.fields.designationLocal.label': 'Designation Name (Regional)',
  'form.fields.designationDescription.label': 'Description',
  'form.status.label': 'Status',
  'list.table.actions': 'Actions',
  'list.buttons.editTitle': 'Edit Designation',
  'list.buttons.deleteTitle': 'Delete Designation',
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
    return designationTranslations[key] ?? key;
  },
}));

const mockData: DesignationMasterItem[] = [
  {
    id: 1,
    designationId: 'DESIG-1',
    designationCode: 'COMMISSIONER',
    designationName: 'Municipal Commissioner',
    designationNameMarathi: 'महानगरपालिका आयुक्त',
    description: 'Executive municipal head',
    isActive: true,
  },
  {
    id: 2,
    designationId: 'DESIG-2',
    designationCode: 'OFFICER',
    designationName: 'Section Officer',
    designationNameMarathi: '',
    description: '',
    isActive: false,
  },
];

describe('DesignationMasterTable', () => {
  const mockOnPageChange = vi.fn();
  const mockOnPageSizeChange = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  const defaultProps: DesignationMasterTableProps = {
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

  it('renders all table headers and designation data rows', () => {
    render(<DesignationMasterTable {...defaultProps} />);

    // Table Headers
    expect(screen.getByText('Designation Code')).toBeInTheDocument();
    expect(screen.getByText('Designation Name')).toBeInTheDocument();
    expect(screen.getByText('Designation Name (Regional)')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();

    // Row 1
    expect(screen.getByText('COMMISSIONER')).toBeInTheDocument();
    expect(screen.getByText('Municipal Commissioner')).toBeInTheDocument();
    expect(screen.getByText('महानगरपालिका आयुक्त')).toBeInTheDocument();
    expect(screen.getByText('Executive municipal head')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();

    // Row 2
    expect(screen.getByText('OFFICER')).toBeInTheDocument();
    expect(screen.getByText('Section Officer')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('renders fallback dash when Marathi name or description is empty', () => {
    render(<DesignationMasterTable {...defaultProps} />);

    // Row 2 has empty Marathi name and description, should render '—'
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it('falls back to designationId if designationCode is missing', () => {
    const dataWithoutCode: DesignationMasterItem[] = [
      {
        id: 3,
        designationId: 'FALLBACK-ID',
        designationCode: '',
        designationName: 'Fallback Officer',
        designationNameMarathi: 'अधिकारी',
        description: 'Test',
        isActive: true,
      },
    ];

    render(<DesignationMasterTable {...defaultProps} data={dataWithoutCode} totalCount={1} />);

    expect(screen.getByText('FALLBACK-ID')).toBeInTheDocument();
  });

  it('calls onEdit with the correct designation item when edit button is clicked', () => {
    render(<DesignationMasterTable {...defaultProps} />);

    const editButtons = screen.getAllByTitle('Edit Designation');
    expect(editButtons).toHaveLength(2);

    fireEvent.click(editButtons[0]);
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledWith(mockData[0]);

    fireEvent.click(editButtons[1]);
    expect(mockOnEdit).toHaveBeenCalledTimes(2);
    expect(mockOnEdit).toHaveBeenCalledWith(mockData[1]);
  });

  it('calls onDelete with the correct designation item when delete button is clicked', () => {
    render(<DesignationMasterTable {...defaultProps} />);

    const deleteButtons = screen.getAllByTitle('Delete Designation');
    expect(deleteButtons).toHaveLength(2);

    fireEvent.click(deleteButtons[0]);
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith(mockData[0]);

    fireEvent.click(deleteButtons[1]);
    expect(mockOnDelete).toHaveBeenCalledTimes(2);
    expect(mockOnDelete).toHaveBeenCalledWith(mockData[1]);
  });

  it('renders empty table without crashing when data array is empty', () => {
    render(<DesignationMasterTable {...defaultProps} data={[]} totalCount={0} totalPages={0} />);

    expect(screen.getByText('Designation Code')).toBeInTheDocument();
    expect(screen.queryByText('COMMISSIONER')).not.toBeInTheDocument();
  });

  it('handles loading state properly', () => {
    render(<DesignationMasterTable {...defaultProps} isLoading={true} />);

    expect(screen.getByText('Designation Code')).toBeInTheDocument();
  });

  it('renders PTIS common pagination footer with showing info and rows per page selector', () => {
    render(<DesignationMasterTable {...defaultProps} />);

    expect(screen.getByText(/Showing 1 to 2 of 2 entries/i)).toBeInTheDocument();
    const rowsPerPageSelect = screen.getByLabelText(/Rows per page/i);
    expect(rowsPerPageSelect).toBeInTheDocument();
    fireEvent.change(rowsPerPageSelect, { target: { value: '20' } });
    expect(mockOnPageSizeChange).toHaveBeenCalledWith(20);
  });
});
