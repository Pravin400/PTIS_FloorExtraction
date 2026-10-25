import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/documents/[guid]/[action]/route';
import { getDocument } from '@/lib/api/document.service';
import { cookies } from 'next/headers';

vi.mock('@/lib/api/document.service', () => ({
  getDocument: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('Document Proxy GET Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 Unauthorized with private no-cache header when auth token is missing', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as unknown as Awaited<ReturnType<typeof cookies>>);

    const request = new Request('http://localhost:3000/api/documents/guid-123/view');
    const response = await GET(request, {
      params: Promise.resolve({ guid: 'guid-123', action: 'view' }),
    });

    expect(response.status).toBe(401);
    expect(response.headers.get('Cache-Control')).toBe(
      'private, no-cache, no-store, must-revalidate, max-age=0'
    );
  });

  it('returns 400 when guid is invalid or empty', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'valid-token' }),
    } as unknown as Awaited<ReturnType<typeof cookies>>);

    const request = new Request('http://localhost:3000/api/documents/undefined/view');
    const response = await GET(request, {
      params: Promise.resolve({ guid: 'undefined', action: 'view' }),
    });

    expect(response.status).toBe(400);
  });

  it('returns 200 with private no-cache Cache-Control for successfully retrieved documents', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'valid-token' }),
    } as unknown as Awaited<ReturnType<typeof cookies>>);

    vi.mocked(getDocument).mockResolvedValue({
      buffer: new ArrayBuffer(8),
      contentType: 'application/pdf',
      contentDisposition: 'inline',
    });

    const request = new Request('http://localhost:3000/api/documents/valid-doc-guid/view');
    const response = await GET(request, {
      params: Promise.resolve({ guid: 'valid-doc-guid', action: 'view' }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Cache-Control')).toBe(
      'private, no-cache, no-store, must-revalidate, max-age=0'
    );
    expect(response.headers.get('Pragma')).toBe('no-cache');
    expect(response.headers.get('Expires')).toBe('0');
  });

  it('returns 404 with private no-cache Cache-Control when document is not found or service errors', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'valid-token' }),
    } as unknown as Awaited<ReturnType<typeof cookies>>);

    vi.mocked(getDocument).mockRejectedValue(new Error('Document not found in backend'));

    const request = new Request('http://localhost:3000/api/documents/missing-guid/view');
    const response = await GET(request, {
      params: Promise.resolve({ guid: 'missing-guid', action: 'view' }),
    });

    expect(response.status).toBe(404);
    expect(response.headers.get('Cache-Control')).toBe(
      'private, no-cache, no-store, must-revalidate, max-age=0'
    );
  });
});
