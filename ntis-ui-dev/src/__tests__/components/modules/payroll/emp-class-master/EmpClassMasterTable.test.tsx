import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmpClassMasterTable, type EmpClassMasterTableProps } from '@/components/modules/payroll/MasterModule/OrganizationMaster/EmpClassMaster/EmpClassMasterTable';
import type { EmpClassMasterItem } from '@/types/payroll/MasterModule';

const empClassTranslations: Record<string, string> = {
  'table.columns.classCode': 'Class Code',
  'table.columns.className': 'Employee Class',
  'drawer.labels.classNameLocal': 'Employee Class (Regional)',
  'table.columns.description': 'Description',
  'table.columns.status': 'Status',
  'table.columns.actions': 'Actions',
  'drawer.editTitle': 'Edit Employee Class',
  'deleteModal.title': 'Delete Employee Class',
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
    if (namespace === 'payrollEmployeeClassMaster.table.columns') {
      return empClassTranslations[`table.columns.${key}`] ?? key;
    }
    return empClassTranslations[key] ?? key;
  },
}));

const mockData: EmpClassMasterItem[] = [
  {
    employeeClassId: 'CLASS-001',
    classCode: 'CLASS-I',
    className: 'Class I (Group A)',
    classNameMarathi: 'वर्ग १ (गट अ)',
    description: 'Senior municipal executives',
    isActive: true,
  },
  {
    employeeClassId: 'CLASS-002',
    classCode: 'CLASS-II',
    className: 'Class II (Group B)',
    classNameMarathi: '',
    description: '',
    isActive: false,
  },
];

describe('EmpClassMasterTable', () => {
  const mockOnPageChange = vi.fn();
  const mockOnPageSizeChange = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  const defaultProps: EmpClassMasterTableProps = {
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

  it('renders all table headers and employee class data rows', () => {
    render(<EmpClassMasterTable {...defaultProps} />);

    expect(screen.getByText('Class Code')).toBeInTheDocument();
    expect(screen.getByText('Employee Class')).toBeInTheDocument();
    expect(screen.getByText('Employee Class (Regional)')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();

    // Row 1
    expect(screen.getByText('CLASS-I')).toBeInTheDocument();
    expect(screen.getByText('Class I (Group A)')).toBeInTheDocument();
    expect(screen.getByText('वर्ग १ (गट अ)')).toBeInTheDocument();
    expect(screen.getByText('Senior municipal executives')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();

    // Row 2
    expect(screen.getByText('CLASS-II')).toBeInTheDocument();
    expect(screen.getByText('Class II (Group B)')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('renders fallback dash when Marathi name and description are empty', () => {
    render(<EmpClassMasterTable {...defaultProps} />);

    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });

  it('calls onEdit with the correct item when edit button is clicked', () => {
    render(<EmpClassMasterTable {...defaultProps} />);

    const editButtons = screen.getAllByTitle('Edit Employee Class');
    expect(editButtons).toHaveLength(2);

    fireEvent.click(editButtons[0]);
    expect(mockOnEdit).toHaveBeenCalledWith(mockData[0]);
  });

  it('calls onDelete with the correct item when delete button is clicked', () => {
    render(<EmpClassMasterTable {...defaultProps} />);

    const deleteButtons = screen.getAllByTitle('Delete Employee Class');
    expect(deleteButtons).toHaveLength(2);

    fireEvent.click(deleteButtons[0]);
    expect(mockOnDelete).toHaveBeenCalledWith(mockData[0]);
  });

  it('renders PTIS common pagination footer with showing info and rows per page selector', () => {
    render(<EmpClassMasterTable {...defaultProps} />);

    expect(screen.getByText(/Showing 1 to 2 of 2 entries/i)).toBeInTheDocument();
    const rowsPerPageSelect = screen.getByLabelText(/Rows per page/i);
    expect(rowsPerPageSelect).toBeInTheDocument();
    fireEvent.change(rowsPerPageSelect, { target: { value: '20' } });
    expect(mockOnPageSizeChange).toHaveBeenCalledWith(20);
  });
});
