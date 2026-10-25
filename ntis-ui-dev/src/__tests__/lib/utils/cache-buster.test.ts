import { describe, it, expect } from 'vitest';
import { withCacheBuster } from '@/lib/utils/cache-buster';

describe('withCacheBuster', () => {
  it('should return empty string for null, undefined, or empty inputs', () => {
    expect(withCacheBuster(null)).toBe('');
    expect(withCacheBuster(undefined)).toBe('');
    expect(withCacheBuster('')).toBe('');
    expect(withCacheBuster('   ')).toBe('');
  });

  it('should strictly leave data: Base64 image URLs unchanged without appending timestamp', () => {
    const dataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...';
    expect(withCacheBuster(dataUrl)).toBe(dataUrl);
    expect(withCacheBuster(dataUrl, 12345)).toBe(dataUrl);
  });

  it('should strictly leave blob: Object URLs unchanged without appending timestamp', () => {
    const blobUrl = 'blob:http://localhost:3000/a5f6e8b2-1234-5678-9abc-def012345678';
    expect(withCacheBuster(blobUrl)).toBe(blobUrl);
    expect(withCacheBuster(blobUrl, 99999)).toBe(blobUrl);
  });

  it('should append ?t=<timestamp> to relative network URLs without existing query params', () => {
    const relativeUrl = '/api/documents/guid-12345/view';
    const timestamp = 1728480000000;
    expect(withCacheBuster(relativeUrl, timestamp)).toBe('/api/documents/guid-12345/view?t=1728480000000');
  });

  it('should append &t=<timestamp> to URLs with existing query parameters', () => {
    const urlWithParams = '/api/documents/view?documentGuid=abc-123';
    const timestamp = 1728480000000;
    expect(withCacheBuster(urlWithParams, timestamp)).toBe('/api/documents/view?documentGuid=abc-123&t=1728480000000');
  });

  it('should preserve URLs that already contain a t= timestamp parameter without duplicate params', () => {
    const alreadyTimestamped = '/api/documents/view?documentGuid=abc-123&t=1728480000000';
    expect(withCacheBuster(alreadyTimestamped, 999999999)).toBe(alreadyTimestamped);
  });

  it('should append ?t=<timestamp> to http:// and https:// URLs', () => {
    const httpUrl = 'https://example.com/images/property-front.jpg';
    const timestamp = 1728480000000;
    expect(withCacheBuster(httpUrl, timestamp)).toBe('https://example.com/images/property-front.jpg?t=1728480000000');
  });
});
