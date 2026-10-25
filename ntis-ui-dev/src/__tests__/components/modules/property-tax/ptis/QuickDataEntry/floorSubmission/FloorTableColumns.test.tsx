import { renderHook, render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useFloorTableColumns } from '@/components/modules/property-tax/ptis/QuickDataEntry/floorSubmission/FloorTableColumns';
import { FloorData } from '@/types/room-details.types';

vi.mock('@/lib/providers/AliasLabelsProvider', () => ({
  useAliasLabel: (_alias: string, fallback: string) => fallback,
}));

vi.mock('@/components/common', () => ({
  Tooltip: ({ children, content }: { children: React.ReactNode; content: string }) => (
    <div data-testid="tooltip" data-content={content}>
      {children}
    </div>
  ),
  DeleteButton: () => <button>Delete</button>,
}));

describe('useFloorTableColumns - Code only display in table columns', () => {
  const floorLookup = [
    { floorId: 4, floorCode: '4', description: 'चौथा मजला' },
    { floorId: 67, floorCode: 'G', description: 'तळमजला' },
  ];

  const subFloorLookup = [
    { subFloorId: 10, subFloorCode: 'B1', description: 'बेसमेंट १' },
  ];

  const constructionLookup = [
    { constructionTypeId: 1, constructionCode: 'A', description: 'सिमेंट काँक्रीट संरचनाA' },
  ];

  const useLookup = [
    { typeOfUseId: 5, typeOfUseCode: 'R', description: 'निवासी' },
  ];

  const subTypeData = [
    { id: 1, description: 'फ्लॅट' },
  ];

  const t = (key: string) => key;

  it('renders only floorCode, constructionCode, typeOfUseCode, and subFloorCode in columns with tooltips', () => {
    const { result } = renderHook(() =>
      useFloorTableColumns({
        t,
        floorLookup,
        subFloorLookup,
        constructionLookup,
        useLookup,
        subTypeData,
      })
    );

    const columns = result.current;
    const floorCol = columns.find((c) => c.key === 'floor');
    const conTypCol = columns.find((c) => c.key === 'conTyp');
    const useCol = columns.find((c) => c.key === 'use');
    const subFloorCol = columns.find((c) => c.key === 'subFloor');

    expect(floorCol).toBeDefined();
    expect(conTypCol).toBeDefined();
    expect(useCol).toBeDefined();
    expect(subFloorCol).toBeDefined();

    const row: FloorData = {
      id: 1,
      floorId: 4,
      floorCode: '4',
      floorDescription: 'चौथा मजला',
      floor: '4 - चौथा मजला',
      subFloorId: 10,
      subFloorCode: 'B1',
      subFloorDescription: 'बेसमेंट १',
      subFloor: 'B1 - बेसमेंट १',
      constructionTypeId: 1,
      constructionCode: 'A',
      constructionTypeDescription: 'सिमेंट काँक्रीट संरचनाA',
      conTyp: 'A - सिमेंट काँक्रीट संरचनाA',
      typeOfUseId: 5,
      typeOfUseCode: 'R',
      typeOfUseDescription: 'निवासी',
      use: 'R - निवासी',
      conYr: '2005',
      asstYr: '2005',
      subTyp: '',
      rooms: 1,
      areaSqFt: 100,
      areaSqM: 9.29,
      builtupAreaSqFt: 120,
      builtupAreaSqM: 11.14,
      renter: 'No',
    };

    // 1. Floor Column: shows only '4', tooltip contains '4 - चौथा मजला'
    const { unmount: unmountFloor } = render(<div>{floorCol?.render ? floorCol.render(row.floor, row) : null}</div>);
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.queryByText('4 - चौथा मजला')).not.toBeInTheDocument();
    unmountFloor();

    // 2. Construction Type Column: shows only 'A'
    const { unmount: unmountConTyp } = render(<div>{conTypCol?.render ? conTypCol.render(row.conTyp, row) : null}</div>);
    expect(screen.getByText('A')).toBeInTheDocument();
    unmountConTyp();

    // 3. Use Column: shows only 'R'
    const { unmount: unmountUse } = render(<div>{useCol?.render ? useCol.render(row.use, row) : null}</div>);
    expect(screen.getByText('R')).toBeInTheDocument();
    unmountUse();

    // 4. Sub Floor Column: shows only 'B1'
    const { unmount: unmountSubFloor } = render(<div>{subFloorCol?.render ? subFloorCol.render(row.subFloor, row) : null}</div>);
    expect(screen.getByText('B1')).toBeInTheDocument();
    unmountSubFloor();
  });
});
