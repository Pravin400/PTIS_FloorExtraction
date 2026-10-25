import { describe, it, expect } from 'vitest';
import { normalizePagedResponse } from '@/lib/api/taxZoning/taxzoning.utils';

describe('normalizePagedResponse', () => {
  it('should handle double-nested items structure', () => {
    const input = {
      success: true,
      message: 'Success',
      items: {
        items: [{ id: 1 }, { id: 2 }],
        totalCount: 2,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false
      }
    };
    
    const result = normalizePagedResponse<{ id: number }>(input);
    
    expect(result.items).toHaveLength(2);
    expect(result.totalCount).toBe(2);
    expect(result.items[0].id).toBe(1);
  });

  it('should handle single-nested items structure', () => {
    const input = {
      items: [{ id: 3 }],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 10,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false
    };
    
    const result = normalizePagedResponse<{ id: number }>(input);
    
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe(3);
  });

  it('should handle flat array response', () => {
    const input = [{ id: 4 }, { id: 5 }];
    
    const result = normalizePagedResponse<{ id: number }>(input);
    
    expect(result.items).toHaveLength(2);
    expect(result.totalCount).toBe(2);
    expect(result.pageNumber).toBe(1);
    expect(result.items[0].id).toBe(4);
  });

  it('should return original data if no normalization matches', () => {
    const input = { someOtherStructure: true } as unknown;
    const result = normalizePagedResponse(input);
    expect(result).toEqual(input);
  });

  it('should handle null or undefined input gracefully', () => {
    expect(normalizePagedResponse(null)).toBeNull();
    expect(normalizePagedResponse(undefined)).toBeUndefined();
  });
});
