import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeptMasterTable, type DeptMasterTableProps } from '@/components/modules/payroll/MasterModule/OrganizationMaster/DepartmentMaster/DeptMasterTable';
import type { DeptMasterItem } from '@/types/payroll/MasterModule';

const deptTranslations: Record<string, string> = {
  'form.fields.departmentCode': 'Department Code',
  'form.fields.departmentName': 'Department Name',
  'form.fields.departmentNameLocal': 'Department Name (Regional)',
  'form.fields.departmentDescription': 'Description',
  'form.fields.status': 'Status',
  'list.table.actions': 'Actions',
  'list.buttons.editTitle': 'Edit Department',
  'list.buttons.deleteTitle': 'Delete Department',
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
    return deptTranslations[key] ?? key;
  },
}));

const mockData: DeptMasterItem[] = [
  {
    id: 1,
    departmentId: 'DEPT-1',
    departmentCode: 'GEN_ADMIN',
    departmentName: 'General Administration',
    departmentNameMarathi: 'सामान्य प्रशासन',
    description: 'Administration department',
    isActive: true,
  },
  {
    id: 2,
    departmentId: 'DEPT-2',
    departmentCode: 'FINANCE',
    departmentName: 'Finance & Accounts',
    departmentNameMarathi: '',
    description: '',
    isActive: false,
  },
];

describe('DeptMasterTable', () => {
  const mockOnPageChange = vi.fn();
  const mockOnPageSizeChange = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  const defaultProps: DeptMasterTableProps = {
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

  it('renders all table headers and department data rows', () => {
    render(<DeptMasterTable {...defaultProps} />);

    // Table Headers
    expect(screen.getByText('Department Code')).toBeInTheDocument();
    expect(screen.getByText('Department Name')).toBeInTheDocument();
    expect(screen.getByText('Department Name (Regional)')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();

    // Row 1
    expect(screen.getByText('GEN_ADMIN')).toBeInTheDocument();
    expect(screen.getByText('General Administration')).toBeInTheDocument();
    expect(screen.getByText('सामान्य प्रशासन')).toBeInTheDocument();
    expect(screen.getByText('Administration department')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();

    // Row 2
    expect(screen.getByText('FINANCE')).toBeInTheDocument();
    expect(screen.getByText('Finance & Accounts')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('renders fallback dash when Marathi name or description is empty', () => {
    render(<DeptMasterTable {...defaultProps} />);

    // Row 2 has empty Marathi name and description, should render '—'
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it('calls onEdit with the correct department item when edit button is clicked', () => {
    render(<DeptMasterTable {...defaultProps} />);

    const editButtons = screen.getAllByTitle('Edit Department');
    expect(editButtons).toHaveLength(2);

    fireEvent.click(editButtons[0]);
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledWith(mockData[0]);

    fireEvent.click(editButtons[1]);
    expect(mockOnEdit).toHaveBeenCalledTimes(2);
    expect(mockOnEdit).toHaveBeenCalledWith(mockData[1]);
  });

  it('calls onDelete with the correct department item when delete button is clicked', () => {
    render(<DeptMasterTable {...defaultProps} />);

    const deleteButtons = screen.getAllByTitle('Delete Department');
    expect(deleteButtons).toHaveLength(2);

    fireEvent.click(deleteButtons[0]);
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith(mockData[0]);

    fireEvent.click(deleteButtons[1]);
    expect(mockOnDelete).toHaveBeenCalledTimes(2);
    expect(mockOnDelete).toHaveBeenCalledWith(mockData[1]);
  });

  it('renders empty table without crashing when data array is empty', () => {
    render(<DeptMasterTable {...defaultProps} data={[]} totalCount={0} totalPages={0} />);

    expect(screen.getByText('Department Code')).toBeInTheDocument();
    expect(screen.queryByText('GEN_ADMIN')).not.toBeInTheDocument();
  });

  it('handles loading state properly', () => {
    render(<DeptMasterTable {...defaultProps} isLoading={true} />);

    // Table container renders properly under loading
    expect(screen.getByText('Department Code')).toBeInTheDocument();
  });

  it('renders PTIS common pagination footer with showing info and rows per page selector', () => {
    render(<DeptMasterTable {...defaultProps} />);

    expect(screen.getByText(/Showing 1 to 2 of 2 entries/i)).toBeInTheDocument();
    const rowsPerPageSelect = screen.getByLabelText(/Rows per page/i);
    expect(rowsPerPageSelect).toBeInTheDocument();
    fireEvent.change(rowsPerPageSelect, { target: { value: '20' } });
    expect(mockOnPageSizeChange).toHaveBeenCalledWith(20);
  });
});
