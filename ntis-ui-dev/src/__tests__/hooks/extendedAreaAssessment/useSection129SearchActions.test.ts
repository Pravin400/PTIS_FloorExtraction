import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useSection129SearchActions } from '@/hooks/extendedAreaAssessment/useSection129SearchActions';
import { emptyForm, emptyResult } from '@/hooks/extendedAreaAssessment/mapSection129Api';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const t = ((key: string) => key) as unknown as Parameters<typeof useSection129SearchActions>[0]['t'];

describe('useSection129SearchActions', () => {
  const push = vi.fn();
  const setPropertyId = vi.fn();
  const setForm = vi.fn();
  const setResult = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push } as never);
    vi.mocked(usePathname).mockReturnValue('/en/property-tax/extended-area-assesment/single-assessment');
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams('wardId=1') as never);
  });

  function setup(
    formOverrides: Partial<ReturnType<typeof emptyForm>> = {},
    lastEditedField: 'upic' | 'oldGpNo' | null = null
  ) {
    return renderHook(() =>
      useSection129SearchActions({
        form: { ...emptyForm(), ...formOverrides },
        t,
        initialCurrentFinancialYear: '2026-27',
        setPropertyId,
        setForm,
        setResult,
        lastEditedField,
      })
    );
  }

  describe('handleSearch', () => {
    it('errors and does not navigate when the UPIC query is empty', () => {
      const { result } = setup({ upic: '' });
      act(() => result.current.handleSearch(undefined, 'upic'));
      expect(toast.error).toHaveBeenCalledWith('messages.enterUpic');
      expect(push).not.toHaveBeenCalled();
    });

    it('errors with the Old GP message when searching that field empty', () => {
      const { result } = setup({ oldGpNo: '' });
      act(() => result.current.handleSearch(undefined, 'oldGpNo'));
      expect(toast.error).toHaveBeenCalledWith('messages.enterOldGpNo');
    });

    it('navigates with upic set and oldGpNo removed when searching by UPIC', () => {
      const { result } = setup();
      act(() => result.current.handleSearch('MM1100150000', 'upic'));
      expect(push).toHaveBeenCalledWith('/en/property-tax/extended-area-assesment/single-assessment?upic=MM1100150000');
    });

    it('also clears any leftover ward/property dropdown selection, so page.tsx re-resolves them fresh from this search instead of keeping a stale selection', () => {
      vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams('wardId=1&propertyId=10&other=keep') as never);
      const { result } = setup();
      act(() => result.current.handleSearch('MM1100150000', 'upic'));
      const url = push.mock.calls[0][0] as string;
      expect(url).toContain('other=keep');
      expect(url).not.toContain('wardId=');
      expect(url).not.toContain('propertyId=');
    });

    it('navigates with oldGpNo set and upic removed when searching by Old GP Number', () => {
      vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams('wardId=1&upic=MM1') as never);
      const { result } = setup();
      act(() => result.current.handleSearch('MM11001000', 'oldGpNo'));
      const url = push.mock.calls[0][0] as string;
      expect(url).toContain('oldGpNo=MM11001000');
      expect(url).not.toContain('upic=');
    });

    it('falls back to the form field value when no override query is given', () => {
      const { result } = setup({ upic: 'MM1100150000' });
      act(() => result.current.handleSearch());
      expect(push).toHaveBeenCalledWith(expect.stringContaining('upic=MM1100150000'));
    });
  });

  describe('handleSearchAny', () => {
    it('errors when both upic and oldGpNo are empty', () => {
      const { result } = setup({ upic: '', oldGpNo: '' });
      act(() => result.current.handleSearchAny());
      expect(toast.error).toHaveBeenCalledWith('messages.enterUpicOrOldGpNo');
      expect(push).not.toHaveBeenCalled();
    });

    it('prefers UPIC when both fields have a value and neither was explicitly last-edited', () => {
      // Both fields can be non-empty simply because a prior successful search auto-filled the
      // other field (the resolved property's own UPIC/Old GP Number) — UPIC is the sensible
      // default in that case, not whichever field happens to still hold a value.
      const { result } = setup({ upic: 'U1', oldGpNo: 'G1' });
      act(() => result.current.handleSearchAny());
      expect(push).toHaveBeenCalledWith(expect.stringContaining('upic=U1'));
    });

    it('searches by UPIC when only UPIC has a value', () => {
      const { result } = setup({ upic: 'U1', oldGpNo: '' });
      act(() => result.current.handleSearchAny());
      expect(push).toHaveBeenCalledWith(expect.stringContaining('upic=U1'));
    });

    it('searches by Old GP Number when both have a value but Old GP Number was explicitly last-edited', () => {
      const { result } = setup({ upic: 'U1', oldGpNo: 'G1' }, 'oldGpNo');
      act(() => result.current.handleSearchAny());
      expect(push).toHaveBeenCalledWith(expect.stringContaining('oldGpNo=G1'));
    });

    it('searches by Old GP Number when only Old GP Number has a value, regardless of lastEditedField', () => {
      const { result } = setup({ upic: '', oldGpNo: 'G1' }, 'upic');
      act(() => result.current.handleSearchAny());
      expect(push).toHaveBeenCalledWith(expect.stringContaining('oldGpNo=G1'));
    });
  });

  describe('handleReset', () => {
    it('clears every search-related query param and resets local state', () => {
      vi.mocked(useSearchParams).mockReturnValue(
        new URLSearchParams('upic=U1&oldGpNo=G1&wardId=1&propertyId=10&other=keep') as never
      );
      const { result } = setup();
      act(() => result.current.handleReset());

      const url = push.mock.calls[0][0] as string;
      expect(url).toContain('other=keep');
      expect(url).not.toContain('upic=');
      expect(url).not.toContain('wardId=');

      expect(setPropertyId).toHaveBeenCalledWith(null);
      expect(setForm).toHaveBeenCalledWith(emptyForm());
      expect(setResult).toHaveBeenCalledWith(emptyResult('2026-27'));
      expect(toast.success).toHaveBeenCalledWith('messages.formReset');
    });

    it('navigates to the bare pathname when no query params remain', () => {
      vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams('upic=U1') as never);
      const { result } = setup();
      act(() => result.current.handleReset());
      expect(push).toHaveBeenCalledWith('/en/property-tax/extended-area-assesment/single-assessment');
    });
  });
});
