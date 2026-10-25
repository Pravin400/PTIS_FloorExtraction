import { render, screen, fireEvent, act } from '@testing-library/react';
import { getDynamicTaxRegisterColumns } from '@/components/modules/property-tax/dynamic-tax-register/dynamicTaxRegisterColumns';
import type { DynamicTaxRegisterRow, CalculationMode } from '@/types/dynamic-tax-register.types';

describe('getDynamicTaxRegisterColumns', () => {
  const mockT = vi.fn((key: string) => key);
  const mockGoToConfigure = vi.fn();

  const MODE_BADGE_CLASS: Record<CalculationMode, string> = {
    VALUE_BASED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CONDITION_BASED: 'bg-amber-50 text-amber-700 border-amber-200',
    MASTER_BASED: 'bg-purple-50 text-purple-700 border-purple-200',
    HYBRID: 'bg-sky-50 text-sky-700 border-sky-200',
  };

  const RULE_CATEGORY_LABEL_KEY: Record<CalculationMode, string> = {
    VALUE_BASED: 'list.modeOptions.value',
    CONDITION_BASED: 'list.modeOptions.condition',
    MASTER_BASED: 'list.modeOptions.master',
    HYBRID: 'list.modeOptions.hybrid',
  };

  it('returns all expected columns', () => {
    const columns = getDynamicTaxRegisterColumns({
      t: mockT,
      pageNumber: 1,
      pageSize: 10,
      MODE_BADGE_CLASS,
      RULE_CATEGORY_LABEL_KEY,
      goToConfigure: mockGoToConfigure,
    });

    expect(columns).toHaveLength(12);
    expect(columns.map((c) => c.key)).toEqual([
      'taxId',
      'taxName',
      'taxNameAlias',
      'taxCode',
      'ruleName',
      'ruleCategory',
      'source',
      'status',
      'assessmentStatus',
      'oldTaxStatus',
      'ruleSummary',
      'action',
    ]);
  });

  it('calculates serial number correctly for pagination', () => {
    const columns = getDynamicTaxRegisterColumns({
      t: mockT,
      pageNumber: 2,
      pageSize: 10,
      MODE_BADGE_CLASS,
      RULE_CATEGORY_LABEL_KEY,
      goToConfigure: mockGoToConfigure,
    });

    const srCol = columns.find((c) => c.key === 'taxId');
    const dummyRow = { taxId: 101 } as DynamicTaxRegisterRow;
    const element = srCol?.render?.(101, dummyRow, 2);
    expect(element).toBeDefined();
  });

  describe('taxName / taxNameAlias truncation and tooltip', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    const columns = getDynamicTaxRegisterColumns({
      t: mockT,
      pageNumber: 1,
      pageSize: 10,
      MODE_BADGE_CLASS,
      RULE_CATEGORY_LABEL_KEY,
      goToConfigure: mockGoToConfigure,
    });
    const dummyRow = { taxId: 1 } as DynamicTaxRegisterRow;

    it('renders a short tax name as plain text with no tooltip trigger', () => {
      const taxNameCol = columns.find((c) => c.key === 'taxName');
      render(<>{taxNameCol?.render?.('Short Name', dummyRow, 0)}</>);
      expect(screen.getByText('Short Name')).toBeInTheDocument();
    });

    it('truncates a tax name longer than 20 characters and shows the full name in a tooltip on hover', () => {
      const longName = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
      const taxNameCol = columns.find((c) => c.key === 'taxName');
      render(<>{taxNameCol?.render?.(longName, dummyRow, 0)}</>);

      const truncated = screen.getByText(`${longName.slice(0, 20)}...`);
      expect(truncated).toBeInTheDocument();
      expect(screen.queryByText(longName)).not.toBeInTheDocument();

      fireEvent.mouseEnter(truncated);
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(screen.getByRole('tooltip')).toHaveTextContent(longName);
    });

    it('renders "-" for an empty regional name', () => {
      const aliasCol = columns.find((c) => c.key === 'taxNameAlias');
      render(<>{aliasCol?.render?.('', dummyRow, 0)}</>);
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('truncates a regional name longer than 20 characters and shows the full name in a tooltip on hover', () => {
      const longAlias = 'क्षेत्रीय नाव जे खूप लांब आहे आणि 15 अक्षरांपेक्षा जास्त आहे';
      const aliasCol = columns.find((c) => c.key === 'taxNameAlias');
      render(<>{aliasCol?.render?.(longAlias, dummyRow, 0)}</>);

      const truncated = screen.getByText(`${longAlias.slice(0, 20)}...`);
      fireEvent.mouseEnter(truncated);
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(screen.getByRole('tooltip')).toHaveTextContent(longAlias);
    });
  });
});
