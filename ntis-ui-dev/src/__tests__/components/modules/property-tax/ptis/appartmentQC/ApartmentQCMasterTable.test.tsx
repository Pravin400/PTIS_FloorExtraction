import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  ApartmentQCMasterTable,
  type Column,
  type RowGroup,
} from '@/components/modules/property-tax/ptis/appartmentQC/ApartmentQCMasterTable';

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string, values?: Record<string, unknown>) => {
    if (namespace === 'common' && key === 'table.showingEntries') {
      return `Showing ${values?.start as number}-${values?.end as number} of ${values?.total as number}`;
    }

    const translations: Record<string, string> = {
      'appartmentQC:columns.kyc': 'KYC',
      'appartmentQC:tooltips.kyc': 'Know Your Customer details',
      'appartmentQC:tooltips.hideKycDetails': 'Hide KYC details',
      'appartmentQC:tooltips.viewKycDetails': 'View KYC details',
      'common:table.noData': 'No Data Found',
    };

    return translations[`${namespace}:${key}`] ?? key;
  },
}));

type TableRow = {
  srNo: number;
  'Type(Old/New)': string;
  propertyNo: string;
  constructionType: string;
  totalTax: string;
  bhk?: string;
  ownerName?: string;
};

const columns: Column<TableRow>[] = [
  { key: 'srNo', label: 'Sr.No' },
  { key: 'Type(Old/New)', label: 'Type(Old/New)' },
  { key: 'propertyNo', label: 'Property No' },
  { key: 'constructionType', label: 'Construction Type' },
  { key: 'totalTax', label: 'Total Tax' },
  { key: 'bhk', label: 'BHK' },
  { key: 'ownerName', label: 'Owner Name' },
];

const groupedData: RowGroup<TableRow>[] = [
  {
    srNo: 1,
    row2: {
      srNo: 1,
      'Type(Old/New)': 'New',
      propertyNo: 'P-001',
      constructionType: 'RCC',
      totalTax: '1200',
      bhk: '2',
      ownerName: 'Alice',
    },
    row1: {
      srNo: 1,
      'Type(Old/New)': 'Old',
      propertyNo: 'P-001',
      constructionType: 'RCC',
      totalTax: '1000',
      bhk: '1',
      ownerName: 'Alice Old',
    },
  },
];

function renderGroupedTable(overrides?: Partial<React.ComponentProps<typeof ApartmentQCMasterTable<TableRow>>>) {
  const defaultProps: React.ComponentProps<typeof ApartmentQCMasterTable<TableRow>> = {
    data: groupedData,
    columns,
    dataMode: 'grouped',
    pageNumber: 1,
    pageSize: 5,
    totalCount: 20,
    totalPages: 4,
  };

  return render(<ApartmentQCMasterTable<TableRow> {...defaultProps} {...overrides} />);
}

describe('ApartmentQCMasterTable', () => {
  it('shows empty state for grouped mode with no data', () => {
    renderGroupedTable({ data: [] });

    expect(screen.getByText('No Data Found')).toBeInTheDocument();
  });

  it('expands and collapses KYC columns when toggle is clicked', () => {
    renderGroupedTable();

    expect(screen.queryByText('BHK')).not.toBeInTheDocument();
    expect(screen.queryByText('Owner Name')).not.toBeInTheDocument();

    const openKycIcon = screen.getByTestId('chevronright-icon');
    fireEvent.click(openKycIcon);

    expect(screen.getByText('BHK')).toBeInTheDocument();
    expect(screen.getByText('Owner Name')).toBeInTheDocument();

    const closeKycIcon = screen.getByTestId('chevronleft-icon');
    fireEvent.click(closeKycIcon);

    expect(screen.queryByText('BHK')).not.toBeInTheDocument();
    expect(screen.queryByText('Owner Name')).not.toBeInTheDocument();
  });

  it('calls onRowClick for both new and old grouped rows', () => {
    const onRowClick = vi.fn();
    renderGroupedTable({ onRowClick });

    fireEvent.click(screen.getByText('New'));
    fireEvent.click(screen.getByText('Old'));

    expect(onRowClick).toHaveBeenNthCalledWith(1, groupedData[0].row2, 0);
    expect(onRowClick).toHaveBeenNthCalledWith(2, groupedData[0].row1, 0);
  });

  it('triggers page navigation and page size change callbacks', () => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();

    renderGroupedTable({
      onPageChange,
      onPageSizeChange,
      pageNumber: 2,
      pageSize: 5,
      totalCount: 23,
      totalPages: 5,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Go to next page' }));
    fireEvent.click(screen.getByRole('button', { name: 'Go to previous page' }));
    fireEvent.click(screen.getByRole('button', { name: 'Go to page 1' }));

    fireEvent.change(screen.getByLabelText('Rows per page'), { target: { value: '10' } });

    expect(onPageChange).toHaveBeenCalledWith(3);
    expect(onPageChange).toHaveBeenCalledWith(1);
    expect(onPageSizeChange).toHaveBeenCalledWith(10);
    expect(screen.getByText('Showing 6-10 of 23')).toBeInTheDocument();
  });
});
