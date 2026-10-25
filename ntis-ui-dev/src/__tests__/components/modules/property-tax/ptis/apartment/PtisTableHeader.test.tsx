import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PtisTableHeader, formatPtisHeaderLabel, type PtisColumnDef } from '@/components/modules/property-tax/ptis/apartment/tables/PtisTableHeader';

vi.mock('@/components/common/Tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const col = (key: string, label: string, className = 'px-2'): PtisColumnDef => ({
  key, labelKey: key, titleKey: `${key}Title`, defaultLabel: label, defaultTitle: label, className,
});

const columns = [
  col('action', '#'),
  col('prop', 'PROP NO'),
  col('cty', 'CONST TYPE'),
  col('cpt', 'CARPET (FT/M)', 'px-3 text-right'),
  col('tax', 'TAX'),
  col('rules', 'RULES'),
];

const renderHeader = (props: Partial<React.ComponentProps<typeof PtisTableHeader>> = {}) =>
  render(
    <table>
      <PtisTableHeader
        panel="survey"
        columns={columns}
        translate={() => ''}
        theadClassName="t"
        rowClassName="r"
        resetSortLabel="Reset sort"
        {...props}
      />
    </table>,
  );

describe('PtisTableHeader', () => {
  it('makes every data column a sort button and leaves the icon-only columns plain', () => {
    renderHeader({ onSort: vi.fn() });

    expect(screen.getByRole('button', { name: /PROP NO/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /TAX/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /RULES/ })).not.toBeInTheDocument();
    expect(screen.getByText('RULES')).toBeInTheDocument();
  });

  it('splits multi-word column headers into two stacked lines with formatPtisHeaderLabel', () => {
    const { container: propContainer } = render(<>{formatPtisHeaderLabel('PROP NO', 'left')}</>);
    expect(propContainer.textContent).toContain('PROP NO');
    expect(propContainer.querySelectorAll('span span')).toHaveLength(2);
    expect(propContainer.querySelectorAll('span span')[0].textContent).toBe('PROP');
    expect(propContainer.querySelectorAll('span span')[1].textContent).toBe('NO');

    const { container: constContainer } = render(<>{formatPtisHeaderLabel('CONST TYPE', 'left')}</>);
    expect(constContainer.querySelectorAll('span span')[0].textContent).toBe('CONST');
    expect(constContainer.querySelectorAll('span span')[1].textContent).toBe('TYPE');

    const { container: carpetContainer } = render(<>{formatPtisHeaderLabel('CARPET (FT/M)', 'right')}</>);
    expect(carpetContainer.querySelectorAll('span span')[0].textContent).toBe('CARPET');
    expect(carpetContainer.querySelectorAll('span span')[1].textContent).toBe('(FT/M)');
    expect(carpetContainer.firstElementChild).toHaveClass('items-end', 'text-right');

    const { container: singleContainer } = render(<>{formatPtisHeaderLabel('TAX', 'right')}</>);
    expect(singleContainer.querySelectorAll('span span')).toHaveLength(0);
    expect(singleContainer.textContent).toBe('TAX');
  });

  it('reports the clicked table and column', () => {
    const onSort = vi.fn();
    renderHeader({ onSort });

    fireEvent.click(screen.getByRole('button', { name: /TAX/ }));

    expect(onSort).toHaveBeenCalledWith('survey', 'tax');
  });

  it('tells assistive technology which column is sorted and how', () => {
    renderHeader({ onSort: vi.fn(), sort: { panel: 'survey', column: 'tax', direction: 'desc' } });

    expect(screen.getByRole('columnheader', { name: /TAX/ })).toHaveAttribute('aria-sort', 'descending');
    expect(screen.getByRole('columnheader', { name: /PROP NO/ })).toHaveAttribute('aria-sort', 'none');
  });

  it('does not mark a column of another table as sorted', () => {
    renderHeader({ onSort: vi.fn(), sort: { panel: 'existing', column: 'tax', direction: 'asc' } });

    expect(screen.getByRole('columnheader', { name: /TAX/ })).toHaveAttribute('aria-sort', 'none');
  });

  it('shows a reset button on the # column only while a sort is active', () => {
    const onClearSort = vi.fn();
    const { unmount } = renderHeader({ onSort: vi.fn(), onClearSort });
    expect(screen.queryByRole('button', { name: 'Reset sort' })).not.toBeInTheDocument();
    unmount();

    renderHeader({ onSort: vi.fn(), onClearSort, sort: { panel: 'survey', column: 'prop', direction: 'asc' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset sort' }));

    expect(onClearSort).toHaveBeenCalled();
  });

  it('shows no sort buttons at all without an onSort handler', () => {
    renderHeader();

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
