import { describe, it, expect, vi, beforeEach } from 'vitest';
import { photoPlanService } from '@/lib/api/ptis/photoplan/photoplan.service';

describe('photoPlanService.launchDrawingTool', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('successfully authenticates and retrieves launch URL via POST request', async () => {
    const mockFetch = vi.fn()
      // Auth POST response
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'mock-jwt-token-123' }),
      })
      // Launch POST response
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ launchUrl: 'https://ptisplanapp.tabamc.in/draw?token=mock-jwt-token-123' }),
      });

    globalThis.fetch = mockFetch;

    const result = await photoPlanService.launchDrawingTool({
      propertyId: 101,
      councilName: 'THANE_Survey',
      returnUrl: 'https://ptisthane.scipl.info/en/property-tax/ptis',
      ptisUsername: 'tejas',
      ptisDisplayName: 'Tejas%20Kishor',
      ptisUserId: '42',
      wardNo: 'UK1',
      propertyNo: '182',
      partitionNo: null,
      ptisBackendUri: 'https://ptisthaneapi.scipl.info.in',
    });

    expect(result).toEqual({
      success: true,
      launchUrl: 'https://ptisplanapp.tabamc.in/draw?token=mock-jwt-token-123',
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);

    // Verify Auth Request with static credentials
    expect(mockFetch.mock.calls[0][0]).toBe('https://apiptisplanapp.tabamc.in/api/auth/login');
    const authBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(authBody).toEqual({
      username: 'tejas.d',
      password: '123456',
      councilName: 'THANE_Survey',
    });

    // Verify Launch Request with JSON payload
    expect(mockFetch.mock.calls[1][0]).toBe('https://apiptisplanapp.tabamc.in/api/plans/ptis/launch');
    const launchBody = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(launchBody).toEqual({
      councilName: 'THANE_Survey',
      wardNo: 'UK1',
      propertyNo: '182',
      partitionNo: null,
      mode: 'draw',
      returnUrl: 'https://ptisthane.scipl.info/en/property-tax/ptis',
      ptisBackendUri: 'https://ptisthaneapi.scipl.info.in',
      ptisUsername: 'tejas',
      ptisDisplayName: 'Tejas Kishor',
      ptisUserId: '42',
      entityType: 'P',
      societyDetailId: null,
      wingDetailId: null,
      photoTypeId: 1,
      propertyId: '101',
    });
  });

  it('falls back to GET request when POST endpoint returns 405 or 404', async () => {
    const mockFetch = vi.fn()
      // Auth POST response
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'fallback-token-456' }),
      })
      // Launch POST response (405 Method Not Allowed)
      .mockResolvedValueOnce({
        ok: false,
        status: 405,
      })
      // Launch GET response
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://ptisplanapp.tabamc.in/draw?fallback=true' }),
      });

    globalThis.fetch = mockFetch;

    const baseParams = {
      ptisUsername: 'testuser',
      ptisDisplayName: 'Test User',
      ptisUserId: '101',
    };

    const result = await photoPlanService.launchDrawingTool({
      ...baseParams,
      propertyId: 202,
      councilName: 'THANE_Survey',
      returnUrl: '/en/property-tax/ptis',
      wardNo: 'MM11',
      propertyNo: '1',
      partitionNo: '',
    });

    expect(result).toEqual({
      success: true,
      launchUrl: 'https://ptisplanapp.tabamc.in/draw?fallback=true',
    });

    expect(mockFetch).toHaveBeenCalledTimes(3);
    const getUrl = new URL(mockFetch.mock.calls[2][0]);
    expect(getUrl.origin + getUrl.pathname).toBe('https://apiptisplanapp.tabamc.in/api/plans/ptis/launch');
    expect(getUrl.searchParams.get('councilName')).toBe('THANE_Survey');
    expect(getUrl.searchParams.get('wardNo')).toBe('MM11');
    expect(getUrl.searchParams.get('propertyNo')).toBe('1');
    expect(getUrl.searchParams.get('partitionNo')).toBe('null');
    expect(getUrl.searchParams.get('mode')).toBe('draw');
  });

  it('tries secondary auth endpoint when primary auth endpoint returns 404', async () => {
    const mockFetch = vi.fn()
      // First auth attempt fails (404)
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
      })
      // Second auth attempt succeeds
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { token: 'secondary-token-789' } }),
      })
      // Launch POST succeeds
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { launchUrl: 'https://ptisplanapp.tabamc.in/secondary' } }),
      });

    globalThis.fetch = mockFetch;

    const result = await photoPlanService.launchDrawingTool({
      ptisUsername: 'testuser',
      ptisUserId: '101',
      propertyId: 303,
      councilName: 'THANE_Survey',
      returnUrl: 'https://ptisthane.scipl.info',
    });

    expect(result).toEqual({
      success: true,
      launchUrl: 'https://ptisplanapp.tabamc.in/secondary',
    });

    expect(mockFetch.mock.calls[0][0]).toBe('https://apiptisplanapp.tabamc.in/api/auth/login');
    expect(mockFetch.mock.calls[1][0]).toBe('https://apiptisplanapp.tabamc.in/api/api/auth/login');
  });

  it('fails gracefully when both auth endpoints fail', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({ ok: false, status: 500 });

    globalThis.fetch = mockFetch;

    const result = await photoPlanService.launchDrawingTool({
      ptisUsername: 'testuser',
      ptisUserId: '101',
      propertyId: 404,
      councilName: 'THANE_Survey',
      returnUrl: 'https://ptisthane.scipl.info',
    });

    expect(result).toEqual({
      success: false,
      error: 'Failed to authenticate drawing tool API: 500',
    });
  });

  it('fails gracefully when auth response lacks token', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false }),
    });

    globalThis.fetch = mockFetch;

    const result = await photoPlanService.launchDrawingTool({
      ptisUsername: 'testuser',
      ptisUserId: '101',
      propertyId: 500,
      councilName: 'THANE_Survey',
      returnUrl: 'https://ptisthane.scipl.info',
    });

    expect(result).toEqual({
      success: false,
      error: 'Failed to retrieve authentication token.',
    });
  });

  it('handles launch API error responses with error or message string', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'valid-token' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Council not registered' }),
      });

    globalThis.fetch = mockFetch;

    const result = await photoPlanService.launchDrawingTool({
      ptisUsername: 'testuser',
      ptisUserId: '101',
      propertyId: 600,
      councilName: 'THANE_Survey',
      returnUrl: 'https://ptisthane.scipl.info',
    });

    expect(result).toEqual({
      success: false,
      error: 'Council not registered',
    });
  });

  it('handles launch API error responses with message property or non-json error', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'valid-token' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({ message: 'Service temporarily unavailable' }),
      });

    globalThis.fetch = mockFetch;

    const result = await photoPlanService.launchDrawingTool({
      ptisUsername: 'testuser',
      ptisUserId: '101',
      propertyId: 601,
      councilName: 'THANE_Survey',
      returnUrl: 'https://ptisthane.scipl.info',
    });

    expect(result).toEqual({
      success: false,
      error: 'Service temporarily unavailable',
    });
  });

  it('handles launch API returning missing launchUrl in response payload', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'valid-token' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok' }),
      });

    globalThis.fetch = mockFetch;

    const result = await photoPlanService.launchDrawingTool({
      ptisUsername: 'testuser',
      ptisUserId: '101',
      propertyId: 700,
      councilName: 'THANE_Survey',
      returnUrl: 'https://ptisthane.scipl.info',
    });

    expect(result).toEqual({
      success: false,
      error: 'Launch URL not found in response.',
    });
  });

  it('catches network exceptions during fetch execution', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network connection timed out'));

    const result = await photoPlanService.launchDrawingTool({
      ptisUsername: 'testuser',
      ptisUserId: '101',
      propertyId: 800,
      councilName: 'THANE_Survey',
      returnUrl: 'https://ptisthane.scipl.info',
    });

    expect(result).toEqual({
      success: false,
      error: 'Network connection timed out',
    });
  });

  it('handles default values when optional parameters are empty or omitted', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'default-token' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ launchUrl: 'https://ptisplanapp.tabamc.in/default' }),
      });

    globalThis.fetch = mockFetch;

    const result = await photoPlanService.launchDrawingTool({
      ptisUsername: 'testuser',
      ptisUserId: '101',
      propertyId: 900,
      councilName: '',
      returnUrl: '',
    });

    expect(result.success).toBe(true);
    const launchBody = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(launchBody.councilName).toBe('');
    expect(launchBody.ptisUsername).toBe('testuser');
    expect(launchBody.ptisDisplayName).toBe('Tejas Kishor');
    expect(launchBody.ptisUserId).toBe('101');
  });

  it('dynamically uses councilName from process.env.NEXT_PUBLIC_COUNCIL_NAME when not explicitly provided', async () => {
    const originalEnv = process.env.NEXT_PUBLIC_COUNCIL_NAME;
    process.env.NEXT_PUBLIC_COUNCIL_NAME = 'JALNA_survey';

    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'mock-jwt-token' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ launchUrl: 'https://ptisplanapp.tabamc.in/draw?token=mock-jwt-token' }),
      });

    globalThis.fetch = mockFetch;

    try {
      const result = await photoPlanService.launchDrawingTool({
        propertyId: 101,
        councilName: '',
        wardNo: 'JCMC10A',
        propertyNo: '10',
        returnUrl: 'https://www.google.com/',
        ptisUsername: 'tejas',
        ptisDisplayName: 'Tejas Kishor',
        ptisUserId: '42',
      });

      expect(result.success).toBe(true);

      // Verify Auth Request uses dynamic councilName
      const authBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(authBody.councilName).toBe('JALNA_survey');

      // Verify Launch Request uses dynamic councilName
      const launchBody = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(launchBody.councilName).toBe('JALNA_survey');
      expect(launchBody.wardNo).toBe('JCMC10A');
      expect(launchBody.propertyNo).toBe('10');
    } finally {
      if (originalEnv !== undefined) {
        process.env.NEXT_PUBLIC_COUNCIL_NAME = originalEnv;
      } else {
        delete process.env.NEXT_PUBLIC_COUNCIL_NAME;
      }
    }
  });
});
