import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  QualificationMasterTable,
  type QualificationMasterTableProps,
} from '@/components/modules/payroll/MasterModule/OrganizationMaster/QualificationMaster/QualificationMasterTable';
import type { QualificationMasterItem } from '@/types/payroll/MasterModule';

const qualTranslations: Record<string, string> = {
  'list.table.qualificationCode': 'Qualification Code',
  'list.table.qualificationName': 'Qualification Name',
  'list.table.qualificationNameLocal': 'Qualification Name (Regional)',
  'list.table.qualificationDescription': 'Description',
  'list.table.status': 'Status',
  'list.table.actions': 'Actions',
  'list.buttons.editTitle': 'Edit Qualification',
  'list.buttons.deleteTitle': 'Delete Qualification',
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
    return qualTranslations[key] ?? key;
  },
}));

const mockData: QualificationMasterItem[] = [
  {
    id: 1,
    qualificationId: 'QUAL-1',
    qualificationCode: 'BCOM',
    qualificationName: 'Bachelor of Commerce',
    qualificationNameRegional: 'वाणिज्य पदवी',
    description: 'Commerce undergraduate degree',
    isActive: true,
  },
  {
    id: 2,
    qualificationId: 'QUAL-2',
    qualificationCode: 'BE_CIVIL',
    qualificationName: 'Bachelor of Engineering (Civil)',
    qualificationNameRegional: '',
    description: '',
    isActive: false,
  },
];

describe('QualificationMasterTable', () => {
  const defaultProps: QualificationMasterTableProps = {
    data: mockData,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 2,
    totalPages: 1,
    isLoading: false,
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders table columns correctly', () => {
    render(<QualificationMasterTable {...defaultProps} />);

    expect(screen.getByText('Qualification Code')).toBeInTheDocument();
    expect(screen.getByText('Qualification Name')).toBeInTheDocument();
    expect(screen.getByText('Qualification Name (Regional)')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('renders qualification rows with correct values', () => {
    render(<QualificationMasterTable {...defaultProps} />);

    expect(screen.getByText('BCOM')).toBeInTheDocument();
    expect(screen.getByText('Bachelor of Commerce')).toBeInTheDocument();
    expect(screen.getByText('वाणिज्य पदवी')).toBeInTheDocument();
    expect(screen.getByText('BE_CIVIL')).toBeInTheDocument();
    expect(screen.getByText('Bachelor of Engineering (Civil)')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(<QualificationMasterTable {...defaultProps} />);

    const editButtons = screen.getAllByTitle('Edit Qualification');
    expect(editButtons.length).toBeGreaterThan(0);
    fireEvent.click(editButtons[0]);

    expect(defaultProps.onEdit).toHaveBeenCalledTimes(1);
    expect(defaultProps.onEdit).toHaveBeenCalledWith(mockData[0]);
  });

  it('calls onDelete when delete button is clicked', () => {
    render(<QualificationMasterTable {...defaultProps} />);

    const deleteButtons = screen.getAllByTitle('Delete Qualification');
    expect(deleteButtons.length).toBeGreaterThan(0);
    fireEvent.click(deleteButtons[0]);

    expect(defaultProps.onDelete).toHaveBeenCalledTimes(1);
    expect(defaultProps.onDelete).toHaveBeenCalledWith(mockData[0]);
  });

  it('handles loading state properly', () => {
    render(<QualificationMasterTable {...defaultProps} isLoading={true} />);
    expect(screen.getByText('Qualification Code')).toBeInTheDocument();
  });
});

