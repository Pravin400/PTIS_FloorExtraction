import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFloorSubmissionState } from '@/hooks/apartmentQc/useFloorSubmissionState';
import type { ApartmentQCDetail } from '@/types/apartmentQC.types';

describe('useFloorSubmissionState', () => {
  it('maps incoming floor data into floor submission rows', () => {
    const initialFloorData = [
      {
        pdnId: 206147,
        floor: 'GF',
        constructionYear: '2010',
        assessmentYear: '2011',
        constructionType: 'RCC',
        typeOfUse: 'Residential',
        subTypeOfUse: 'Self',
        noOfRooms: 3,
        carpetASqMtr: 120,
        rentMonthly: 100,
        rentYearly: 1200,
        monthlyRate: 10,
        yearlyRate: 120,
        annualRentalValue: 1500,
        maintenance: 100,
        rateableValue: 900,
        rVorCVValue: 950,
      } as unknown as ApartmentQCDetail,
    ];

    const { result } = renderHook(() => useFloorSubmissionState(initialFloorData, 'rateable'));

    expect(result.current.subTab).toBe('rateable');
    expect(result.current.floorData).toHaveLength(1);
    expect(result.current.floorData[0]).toMatchObject({
      id: 'row-206147',
      pdnId: 206147,
      floorId: 'GF',
      conYear: '2010',
      asstYear: '2011',
      area: '120',
      rentMY: '100/1200',
      rateMY: '10/120',
      rv: '900',
      capitalValue: '950',
    });
  });

  it('updates dual method tab state', () => {
    const { result } = renderHook(() => useFloorSubmissionState([], 'dual-method'));

    expect(result.current.dualMethodTab).toBe('rateable');

    act(() => {
      result.current.setDualMethodTab('capital');
    });

    expect(result.current.dualMethodTab).toBe('capital');
  });
});
