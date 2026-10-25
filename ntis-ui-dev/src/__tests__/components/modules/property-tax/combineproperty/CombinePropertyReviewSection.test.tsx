import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CombinePropertyReviewSection } from '@/components/modules/property-tax/ptis/combineproperty/CombinePropertyReviewSection';

import { PropertyRow } from '@/components/modules/property-tax/ptis/combineproperty/combinePropertyColumns';

vi.mock('@/components/common/MasterTable', () => ({
  MasterTable: ({ data }: { data?: unknown[] }) => (
    <div data-testid="master-table">Rows: {data?.length}</div>
  )
}));

describe('CombinePropertyReviewSection', () => {
  const mockProps = {
    t: (k: string) => k,
    isReviewing: false,
    isPending: false,
    isSubmitting: false,
    selectedBasePropertyId: '',
    selectedPropertyNo: '',
    reviewDataLength: 0,
    checkedCount: 0,
    hasDifferentOwners: false,
    differentOwnerProps: '',
    columns: [],
    reviewData: [],
    remark: '',
    remarkError: false,
    setRemark: vi.fn()
  };

  it('renders empty state correctly', () => {
    render(<CombinePropertyReviewSection {...mockProps} />);
    expect(screen.getByText('noPropertiesSelected')).toBeDefined();
    expect(screen.getByText('emptyStateSubtitle')).toBeDefined();
  });

  it('renders review table when reviewing and has data', () => {
    render(<CombinePropertyReviewSection 
      {...mockProps} 
      isReviewing={true} 
      selectedBasePropertyId="1"
      reviewDataLength={1} 
      reviewData={[{ propertyId: 1 }] as unknown as PropertyRow[]} 
    />);
    expect(screen.getByTestId('master-table')).toBeDefined();
    expect(screen.getByText('reviewCombination')).toBeDefined();
  });

  it('shows owner mismatch warning', () => {
    render(<CombinePropertyReviewSection 
      {...mockProps} 
      isReviewing={true} 
      selectedBasePropertyId="1"
      reviewDataLength={2} 
      hasDifferentOwners={true}
      differentOwnerProps="Ward W1 Prop P2"
    />);
    expect(screen.getByText('warningDifferentOwners')).toBeDefined();
    expect(screen.getByText('• Ward W1 Prop P2')).toBeDefined();
  });

  it('renders remark textarea and handles changes', () => {
    render(<CombinePropertyReviewSection 
      {...mockProps} 
      isReviewing={true} 
      selectedBasePropertyId="1"
      reviewDataLength={1}
      remark="test remark"
    />);
    const textarea = screen.getByDisplayValue('test remark');
    expect(textarea).toBeDefined();

    fireEvent.change(textarea, { target: { value: 'updated remark' } });
    expect(mockProps.setRemark).toHaveBeenCalledWith('updated remark');
  });

  it('shows validation error for remark', () => {
    render(<CombinePropertyReviewSection 
      {...mockProps} 
      isReviewing={true} 
      selectedBasePropertyId="1"
      reviewDataLength={1}
      remarkError={true}
    />);
    expect(screen.getByText('remarkRequiredError')).toBeDefined();
  });
});
