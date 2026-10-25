import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ptisSuggestionsClient } from '@/lib/api/ptis/tab/ptis-suggestions-client';

describe('ptisSuggestionsClient', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        success: true,
        data: [
          {
            propertyId: 1,
            propertyNo: 'P-1',
            partitionNo: 'A',
            displayLabel: 'P-1-A',
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('keeps the existing non-paginated suggestion request unchanged', async () => {
    await ptisSuggestionsClient.getSuggestions({ wardId: 7, propertyNo: 'P-1' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/ptis/suggestions?wardId=7&propertyNo=P-1',
      { cache: 'no-store' }
    );
  });

  it('adds page parameters for report property load-more', async () => {
    await ptisSuggestionsClient.getSuggestionsPage({
      wardId: 7,
      pageNumber: 2,
      pageSize: 100,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/ptis/suggestions?wardId=7&pageNumber=2&pageSize=100',
      { cache: 'no-store' }
    );
  });
});
