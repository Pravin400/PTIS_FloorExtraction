import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FloorQCTable } from '@/components/modules/property-tax/ptis/appartmentQC/appartmentQCDrawer/FloorSubmissionDrawer/FloorSubmissionTable';
import type { Column } from '@/components/common/MasterTable';
import type { FloorSubmissionRow } from '@/types/apartmentQC.types';

vi.mock('@/components/common/Tabs', () => {
  const TabsRoot = ({ children, onChange }: { children: React.ReactNode; onChange: (v: string) => void }) => (
    <div data-testid="tabs-root">
      <button type="button" onClick={() => onChange('capital')}>switch-capital</button>
      {children}
    </div>
  );

  const TabsApi = Object.assign(TabsRoot, {
    TabList: ({ children }: { children: React.ReactNode }) => <div data-testid="tab-list">{children}</div>,
    Tab: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button>,
    TabPanel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  });

  return { Tabs: TabsApi };
});

vi.mock('@/components/common/MasterTable', () => ({
  MasterTable: ({ data }: { data: FloorSubmissionRow[] }) => (
    <div data-testid="master-table">rows:{data.length}</div>
  ),
}));

describe('FloorQCTable', () => {
  const t = (key: string) => key;

  const floorColumns: Column<FloorSubmissionRow>[] = [
    { key: 'floorId', label: 'Floor' },
  ];

  const tableStyle = (col: Column<FloorSubmissionRow>): Column<FloorSubmissionRow> => col;

  const row: FloorSubmissionRow = {
    id: 'row-1',
    pdnId: 1,
    floorId: 'GF',
    conYear: '2010',
    asstYear: '2011',
    constructionTypeId: 'RCC',
    typeOfUseId: 'Residential',
    subTypeOfUseId: 'Self',
    noOfRooms: '2',
    area: '100',
    rentMY: '0/0',
    rateMY: '0/0',
    rentalValue: '0',
    depreciation: '0',
    alv: '0',
    mr: '0',
    rv: '0',
    sdrr: '0',
    baseValue: '0',
    floorFactor: '0',
    ageFactor: '0',
    ntbFactor: '0',
    useFactor: '0',
    capitalValue: '0',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dual-method tabs and switches sub-tab', () => {
    const setDualMethodTab = vi.fn();
    render(
      <FloorQCTable
        hook={{
          subTab: 'dual-method',
          dualMethodTab: 'rateable',
          setDualMethodTab,
          floorData: [row],
          isLoadingFloorQCData: false,
        }}
        t={t}
        floorColumns={floorColumns}
        tableStyle={tableStyle}
      />
    );

    expect(screen.getByTestId('tabs-root')).toBeInTheDocument();
    expect(screen.getAllByTestId('master-table')).toHaveLength(2);

    fireEvent.click(screen.getByText('switch-capital'));
    expect(setDualMethodTab).toHaveBeenCalledWith('capital');
  });

  it('renders single table for non dual-method tab', () => {
    render(
      <FloorQCTable
        hook={{
          subTab: 'rateable',
          dualMethodTab: 'rateable',
          setDualMethodTab: vi.fn(),
          floorData: [row],
          isLoadingFloorQCData: false,
        }}
        t={t}
        floorColumns={floorColumns}
        tableStyle={tableStyle}
      />
    );

    expect(screen.queryByTestId('tabs-root')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('master-table')).toHaveLength(1);
  });
});
