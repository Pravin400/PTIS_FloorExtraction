import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useAgeFactorCvSessionTracking } from '@/hooks/weightageMaster/ageFactorCv/useAgeFactorCvSessionTracking';
import { AgeFactorCVMaster } from '@/types/ageFactorCv.types';

describe('useAgeFactorCvSessionTracking', () => {
  const mockData: AgeFactorCVMaster[] = [
    { id: 1, constructionTypeId: 1, ageFrom: 0, ageTo: 5, factor: 1.0, yearRangeCVId: 2024, isActive: true },
  ];

  it('should initialize with empty edits and session UIDs', () => {
    const { result } = renderHook(() => useAgeFactorCvSessionTracking({ data: mockData }));

    expect(result.current.editableRows).toEqual({});
    expect(result.current.sessionCreatedUids.size).toBe(0);
  });

  it('getRowUid should return id string for existing records', () => {
    const { result } = renderHook(() => useAgeFactorCvSessionTracking({ data: mockData }));
    const uid = result.current.getRowUid(mockData[0]);
    expect(uid).toBe('1');
  });

  it('getRowUid should return composite string for new records', () => {
    const { result } = renderHook(() => useAgeFactorCvSessionTracking({ data: mockData }));
    const newRow = { ...mockData[0], id: 0 };
    const uid = result.current.getRowUid(newRow);
    expect(uid).toContain('0-1-2024-0-5');
  });

  it('findRowByUid should find existing row', () => {
    const { result } = renderHook(() => useAgeFactorCvSessionTracking({ data: mockData }));
    const row = result.current.findRowByUid('1');
    expect(row).toEqual(mockData[0]);
  });
});
