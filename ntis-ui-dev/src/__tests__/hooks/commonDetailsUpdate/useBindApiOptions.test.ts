/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBindApiOptions } from '@/hooks/commonDetailsUpdate/useBindApiOptions';
import { getDynamicOptionsAction } from '@/app/[locale]/property-tax/common-details-update/actions';

// Mock the API action
vi.mock('@/app/[locale]/property-tax/common-details-update/actions', () => ({
  getDynamicOptionsAction: vi.fn(),
}));

describe('useBindApiOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty maps if no fieldConfigs are provided', () => {
    const emptyArray: any[] = [];
    const { result } = renderHook(() => useBindApiOptions(emptyArray));
    expect(result.current.optionsMap).toEqual({});
    expect(result.current.loadingMap).toEqual({});
  });

  it('should fetch options when bindApi is provided and field is focused', async () => {
    const mockData = [
      { id: 1, name: 'Option A' },
      { id: 2, name: 'Option B' },
    ];

    vi.mocked(getDynamicOptionsAction).mockResolvedValue({
      success: true,
      data: mockData,
    });

    const fieldConfigs = [
      {
        fieldName: 'testField',
        bindApi: '/api/test',
        apiResponse: '{"key":"id", "value":"name"}',
      },
    ];

    const { result } = renderHook(() => useBindApiOptions(fieldConfigs as any));

    act(() => {
      result.current.onFocus('testField');
    });

    // Wait for the hook to finish fetching
    await waitFor(() => {
      expect(result.current.loadingMap.testField).toBe(false);
    });

    expect(result.current.optionsMap.testField).toEqual([
      { label: 'Option A', value: '1' },
      { label: 'Option B', value: '2' },
    ]);
    expect(getDynamicOptionsAction).toHaveBeenCalledWith('/api/test', {
      SearchTerm: '',
      PageSize: 10,
      PageNumber: 1,
    });
  });

  it('should handle malformed JSON in apiResponse using regex fallback', async () => {
    const mockData = [
      { code: 'X', title: 'Option X' },
    ];

    vi.mocked(getDynamicOptionsAction).mockResolvedValue({
      success: true,
      data: mockData,
    });

    const fieldConfigs = [
      {
        fieldName: 'fallbackField',
        bindApi: '/api/fallback',
        // Malformed JSON that fails JSON.parse but regex can catch
        apiResponse: '{"key":"code" "Value":"title"}',
      },
    ];

    const { result } = renderHook(() => useBindApiOptions(fieldConfigs as any));

    act(() => {
      result.current.onFocus('fallbackField');
    });

    await waitFor(() => {
      expect(result.current.loadingMap.fallbackField).toBe(false);
    });

    expect(result.current.optionsMap.fallbackField).toEqual([
      { label: 'Option X', value: 'X' },
    ]);
  });

  it('should handle API failure gracefully', async () => {
    vi.mocked(getDynamicOptionsAction).mockRejectedValue(new Error('API Error'));

    const fieldConfigs = [
      {
        fieldName: 'errorField',
        bindApi: '/api/error',
      },
    ];

    const { result } = renderHook(() => useBindApiOptions(fieldConfigs as any));

    act(() => {
      result.current.onFocus('errorField');
    });

    await waitFor(() => {
      expect(result.current.loadingMap.errorField).toBe(false);
    });

    expect(result.current.optionsMap.errorField).toEqual([]);
  });
});
