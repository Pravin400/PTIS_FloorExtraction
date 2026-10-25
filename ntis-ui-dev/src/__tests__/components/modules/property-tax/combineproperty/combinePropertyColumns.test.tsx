import { describe, it, expect, vi } from 'vitest';
import { getCombinePropertyColumns, getCombinePropertyHistoryColumns, PropertyRow } from '@/components/modules/property-tax/ptis/combineproperty/combinePropertyColumns';
import { render, fireEvent } from '@testing-library/react';

vi.mock('@/components/common/Tooltip', () => ({
  Tooltip: ({ children, content }: { children: React.ReactNode; content: React.ReactNode }) => (
    <span data-testid="mock-tooltip" data-content={String(content)}>
      {children}
    </span>
  ),
}));

describe('combinePropertyColumns', () => {
  const mockT = vi.fn((key) => key);

  const mockReviewData: PropertyRow[] = [
    { propertyId: 1, wardId: 1, wardNo: 'W1', propertyNo: 'P1', partitionNo: '1', oldPropertyNo: 'O1', ownerName: 'John Doe', occupierName: 'Jane Doe', taxAmount: 1000, pendingAmount: 500, propertyDescription: '', propertyTypeId: 1 },
    { propertyId: 2, wardId: 1, wardNo: 'W1', propertyNo: 'P2', partitionNo: '2', oldPropertyNo: 'O2', ownerName: 'John Doe', occupierName: '', taxAmount: 2000, pendingAmount: 1000, propertyDescription: '', propertyTypeId: 1 },
    { propertyId: 3, wardId: 1, wardNo: 'W1', propertyNo: 'P3', partitionNo: '3', oldPropertyNo: 'O3', ownerName: 'Mismatch Owner', occupierName: null as unknown as string, taxAmount: 3000, pendingAmount: 0, propertyDescription: '', propertyTypeId: 1 },
  ];

  it('should return correct number of columns', () => {
    const columns = getCombinePropertyColumns(mockT, mockReviewData);
    expect(columns.length).toBe(9);
  });

  it('should render serial number correctly', () => {
    const columns = getCombinePropertyColumns(mockT, mockReviewData);
    const srNoCol = columns.find(c => c.key === 'propertyId');
    expect(srNoCol).toBeDefined();

    if (srNoCol?.render) {
      const { container } = render(srNoCol.render(1, mockReviewData[0], 0) as React.ReactElement);
      expect(container.textContent).toBe('1');
    }
  });

  it('should render combined propertyNo correctly', () => {
    const columns = getCombinePropertyColumns(mockT, mockReviewData);
    const propNoCol = columns.find(c => c.key === 'propertyNo');
    expect(propNoCol).toBeDefined();

    if (propNoCol?.render) {
      const { container } = render(propNoCol.render('P1', mockReviewData[0], 0) as React.ReactElement);
      expect(container.textContent).toBe('W1-P1-1');
    }
  });

  it('should render ownerName correctly and highlight mismatches', () => {
    const columns = getCombinePropertyColumns(mockT, mockReviewData);
    const ownerCol = columns.find(c => c.key === 'ownerName');

    if (ownerCol?.render) {
      // First row (reference owner)
      const { container: container1 } = render(ownerCol.render('John Doe', mockReviewData[0], 0) as React.ReactElement);
      expect(container1.textContent).toBe('John Doe');
      expect(container1.querySelector('.text-red-500')).toBeNull();

      // Second row (matching owner)
      const { container: container2 } = render(ownerCol.render('John Doe', mockReviewData[1], 1) as React.ReactElement);
      expect(container2.querySelector('.text-red-500')).toBeNull();

      // Third row (mismatch owner)
      const { container: container3 } = render(ownerCol.render('Mismatch Owner', mockReviewData[2], 2) as React.ReactElement);
      expect(container3.querySelector('.text-red-500')).not.toBeNull();
    }
  });

  it('should format amounts correctly', () => {
    const columns = getCombinePropertyColumns(mockT, mockReviewData);
    const taxCol = columns.find(c => c.key === 'taxAmount');

    if (taxCol?.render) {
      const { container } = render(taxCol.render(1000, mockReviewData[0], 0) as React.ReactElement);
      // Depending on locale config, typically includes commas
      expect(container.textContent).toContain('₹1,000');
    }
  });

  it('should handle missing values gracefully', () => {
    const columns = getCombinePropertyColumns(mockT, mockReviewData);

    const occupierCol = columns.find(c => c.key === 'occupierName');
    if (occupierCol?.render) {
      const { container } = render(occupierCol.render(null, mockReviewData[2], 2) as React.ReactElement);
      expect(container.textContent).toBe('—');
    }


  });

  it('should render the checkbox column and wire toggle callbacks', () => {
    const mockOnToggleAll = vi.fn();
    const mockOnToggleCheck = vi.fn();
    const mockCheckedIds = new Set([1, 2]); // Only first two rows are checked

    const columns = getCombinePropertyColumns(
      mockT,
      mockReviewData,
      mockCheckedIds,
      mockOnToggleCheck,
      mockOnToggleAll
    );

    const checkboxCol = columns.find(c => c.key === '_checkbox');
    expect(checkboxCol).toBeDefined();

    // Test header (Select All) rendering & callback
    if (checkboxCol?.label) {
      const { container } = render(checkboxCol.label as React.ReactElement);
      const button = container.querySelector('button[role="checkbox"]');
      expect(button).toBeDefined();

      // Click header checkbox
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(mockOnToggleAll).toHaveBeenCalled();
    }

    // Test row rendering & callback
    if (checkboxCol?.render) {
      // Row 1 (Checked ID)
      const { container: container1 } = render(
        checkboxCol.render(null, mockReviewData[0], 0) as React.ReactElement
      );
      const btn1 = container1.querySelector('button[role="checkbox"]');
      expect(btn1?.getAttribute('data-state')).toBe('checked');
      btn1?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(mockOnToggleCheck).toHaveBeenCalledWith(1);

      // Row 3 (Unchecked ID)
      const { container: container3 } = render(
        checkboxCol.render(null, mockReviewData[2], 2) as React.ReactElement
      );
      const btn3 = container3.querySelector('button[role="checkbox"]');
      expect(btn3?.getAttribute('data-state')).toBe('unchecked');
      btn3?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(mockOnToggleCheck).toHaveBeenCalledWith(3);
    }
  });

  describe('getCombinePropertyHistoryColumns', () => {
    it('should return correct columns list including combineReason', () => {
      const columns = getCombinePropertyHistoryColumns(mockT);
      const reasonCol = columns.find(c => c.key === 'combineReason');
      expect(reasonCol).toBeDefined();
    });

    it('should render combined propertyNo correctly in history columns', () => {
      const columns = getCombinePropertyHistoryColumns(mockT);
      const propNoCol = columns.find(c => c.key === 'propertyNo');
      expect(propNoCol).toBeDefined();

      if (propNoCol?.render) {
        const { container } = render(propNoCol.render('P1', mockReviewData[0], 0) as React.ReactElement);
        expect(container.textContent).toBe('W1-P1-1');
      }
    });

    it('should not truncate short reasons (< 5 words)', () => {
      const columns = getCombinePropertyHistoryColumns(mockT);
      const reasonCol = columns.find(c => c.key === 'combineReason');
      
      if (reasonCol?.render) {
        const { container } = render(reasonCol.render('Short reason here', mockReviewData[0], 0) as React.ReactElement);
        expect(container.textContent).toBe('Short reason here');
        expect(container.querySelector('[data-testid="mock-tooltip"]')).toBeNull();
      }
    });

    it('should truncate reasons with more than 5 words and toggle on click', () => {
      const columns = getCombinePropertyHistoryColumns(mockT);
      const reasonCol = columns.find(c => c.key === 'combineReason');
      
      if (reasonCol?.render) {
        const { container } = render(
          reasonCol.render('one two three four five six seven', mockReviewData[0], 0) as React.ReactElement
        );
        
        // Initial state (truncated)
        const tooltip = container.querySelector('[data-testid="mock-tooltip"]');
        expect(tooltip).not.toBeNull();
        expect(tooltip?.getAttribute('data-content')).toBe('Click to expand');
        expect(container.textContent).toBe('one two three four five...');
        
        // Click to expand
        const span = container.querySelector('span[class*="cursor-pointer"]');
        if (span) {
          fireEvent.click(span);
        }
        
        // Check expanded state
        const expandedTooltip = container.querySelector('[data-testid="mock-tooltip"]');
        expect(expandedTooltip?.getAttribute('data-content')).toBe('Click to collapse');
        expect(container.textContent).toBe('one two three four five six seven');
      }
    });

    it('should truncate single extremely long words (> 25 characters) and toggle on click', () => {
      const columns = getCombinePropertyHistoryColumns(mockT);
      const reasonCol = columns.find(c => c.key === 'combineReason');
      
      if (reasonCol?.render) {
        const longWord = 'a'.repeat(30);
        const { container } = render(
          reasonCol.render(longWord, mockReviewData[0], 0) as React.ReactElement
        );
        
        // Initial state (truncated)
        const tooltip = container.querySelector('[data-testid="mock-tooltip"]');
        expect(tooltip).not.toBeNull();
        expect(tooltip?.getAttribute('data-content')).toBe('Click to expand');
        expect(container.textContent).toBe('a'.repeat(25) + '...');
        
        // Click to expand
        const span = container.querySelector('span[class*="cursor-pointer"]');
        if (span) {
          fireEvent.click(span);
        }
        
        // Check expanded state
        const expandedTooltip = container.querySelector('[data-testid="mock-tooltip"]');
        expect(expandedTooltip?.getAttribute('data-content')).toBe('Click to collapse');
        expect(container.textContent).toBe(longWord);
      }
    });
  });

  describe('getCombinePropertyColumns tooltips', () => {
    it('should render base property tooltip on the base property row', () => {
      const selectedBasePropertyId = '1';
      const columns = getCombinePropertyColumns(mockT, mockReviewData, undefined, undefined, undefined, selectedBasePropertyId);
      const propNoCol = columns.find(c => c.key === 'propertyNo');
      
      if (propNoCol?.render) {
        const { container } = render(propNoCol.render('P1', mockReviewData[0], 0) as React.ReactElement);
        const tooltip = container.querySelector('[data-testid="mock-tooltip"]');
        expect(tooltip).not.toBeNull();
        expect(tooltip?.getAttribute('data-content')).toBe('basePropertyTooltip');
      }
    });

    it('should render combine property tooltip on a non-base property row', () => {
      const selectedBasePropertyId = '1';
      const columns = getCombinePropertyColumns(mockT, mockReviewData, undefined, undefined, undefined, selectedBasePropertyId);
      const propNoCol = columns.find(c => c.key === 'propertyNo');
      
      if (propNoCol?.render) {
        // Row 2 is not the base property
        const { container } = render(propNoCol.render('P2', mockReviewData[1], 1) as React.ReactElement);
        const tooltip = container.querySelector('[data-testid="mock-tooltip"]');
        expect(tooltip).not.toBeNull();
        expect(tooltip?.getAttribute('data-content')).toBe('combinePropertyTooltip');
      }
    });
  });
});
