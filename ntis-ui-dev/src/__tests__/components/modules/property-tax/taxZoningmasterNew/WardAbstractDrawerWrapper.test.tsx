/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WardAbstractDrawerWrapper from '@/components/modules/property-tax/taxZoningmasterNew/WardAbstractDrawerWrapper';

const pushMock = vi.fn();
const backMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, back: backMock, replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/property-tax/taxzoningmaster/ward-abstract',
  useParams: () => ({ locale: 'en' }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/components/common/Drawer', () => ({
  Drawer: ({ open, title, headerActions, children, onClose }: any) => (open ? (
    <div data-testid="drawer">
      <div data-testid="drawer-title">{title}</div>
      <div data-testid="drawer-header-actions">{headerActions}</div>
      <div data-testid="drawer-body">{children}</div>
      <button data-testid="drawer-close" onClick={onClose}>Close</button>
    </div>
  ) : null),
}));

vi.mock('@/components/common/SearchInput', () => ({
  SearchInput: ({ value, onChange, onEnter, placeholder }: any) => (
    <input
      data-testid="search-input"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') onEnter(); }}
    />
  ),
}));

vi.mock('@/components/common/ActionButtons', () => ({
  SearchButton: ({ onClick, ...p }: any) => <button data-testid="search-btn" onClick={onClick} {...p}>Search</button>,
  ExportButton: ({ label, onClick, ...p }: any) => <button data-testid="export-btn" onClick={onClick} {...p}>{label}</button>,
}));

vi.mock('@/components/modules/property-tax/taxZoningmasterNew/WardAbstractDrawer', () => ({
  default: ({ searchInput }: any) => <div data-testid="ward-abstract-drawer">{searchInput}</div>,
}));

const downloadTaxZoningExportMock = vi.fn();
vi.mock('@/lib/api/taxZoningRange/taxZoningRange-export.client', () => ({
  downloadTaxZoningExport: (...args: any[]) => downloadTaxZoningExportMock(...args),
}));

const baseProps = {
  data: [],
  pageNumber: 1,
  pageSize: 10,
  totalCount: 0,
  totalPages: 1,
  searchTerm: '',
  zoneLabels: [],
  ulbName: 'Test ULB',
  overallTotalProperties: 0,
  overallCoveredProperties: 0,
  overallPendingProperties: 0,
  overallCoveragePercent: 0,
};

describe('WardAbstractDrawerWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('clicking the close button navigates to the taxzoningmaster screen', () => {
    render(<WardAbstractDrawerWrapper {...baseProps} />);
    fireEvent.click(screen.getByTestId('drawer-close'));
    expect(pushMock).toHaveBeenCalledWith('/en/property-tax/taxzoningmaster');
    expect(backMock).not.toHaveBeenCalled();
  });

  it('clicking Export Excel calls downloadTaxZoningExport with ulbName only when search empty', () => {
    render(<WardAbstractDrawerWrapper {...baseProps} />);
    fireEvent.click(screen.getByTestId('export-btn'));
    expect(downloadTaxZoningExportMock).toHaveBeenCalledWith('ward-abstract-excel', { ulbName: 'Test ULB' });
  });

  it('clicking Export Excel includes SearchTerm when search non-empty', () => {
    render(<WardAbstractDrawerWrapper {...baseProps} searchTerm="foo" />);
    fireEvent.click(screen.getByTestId('export-btn'));
    expect(downloadTaxZoningExportMock).toHaveBeenCalledWith('ward-abstract-excel', { SearchTerm: 'foo', ulbName: 'Test ULB' });
  });

  it('typing in the search input updates value', () => {
    render(<WardAbstractDrawerWrapper {...baseProps} />);
    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(input).toHaveValue('abc');
  });

  it('clearing the search input navigates back to page 1 with no search param', () => {
    render(<WardAbstractDrawerWrapper {...baseProps} searchTerm="foo" />);
    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'foo' } });
    pushMock.mockClear();
    fireEvent.change(input, { target: { value: '' } });
    expect(pushMock).toHaveBeenCalled();
    const calledUrl = pushMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('pageNumber=1');
    expect(calledUrl).not.toContain('search=');
  });

  it('clicking Search button navigates with search param set', () => {
    render(<WardAbstractDrawerWrapper {...baseProps} />);
    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'bar' } });
    fireEvent.click(screen.getByTestId('search-btn'));
    expect(pushMock).toHaveBeenCalled();
    const calledUrl = pushMock.mock.calls[pushMock.mock.calls.length - 1][0] as string;
    expect(calledUrl).toContain('search=bar');
  });

  it('pressing Enter in search input navigates with search param set', () => {
    render(<WardAbstractDrawerWrapper {...baseProps} />);
    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'baz' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(pushMock).toHaveBeenCalled();
    const calledUrl = pushMock.mock.calls[pushMock.mock.calls.length - 1][0] as string;
    expect(calledUrl).toContain('search=baz');
  });
});
