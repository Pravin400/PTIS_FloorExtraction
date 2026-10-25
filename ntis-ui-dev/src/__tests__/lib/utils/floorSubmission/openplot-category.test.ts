import { describe, it, expect } from 'vitest';
import {
  filterOpenPlotCategories,
} from '@/lib/utils/floorSubmission/openplot-category';

describe('filterOpenPlotCategories Utility Tests', () => {
  it('should return empty array when input is empty or undefined', () => {
    expect(filterOpenPlotCategories()).toEqual([]);
    expect(filterOpenPlotCategories([])).toEqual([]);
  });

  it('should filter records where typeOfUseCategoryId === 4', () => {
    const rawData = [
      {
        id: 50,
        typeOfUseCode: 'OPC',
        description: 'खुला भूखंड अनिवासी',
        typeOfUseCategoryId: 4,
        isActive: true,
      },
      {
        id: 99,
        typeOfUseCode: 'OTHER',
        description: 'Other Usage',
        typeOfUseCategoryId: 1,
        isActive: true,
      },
    ];

    const result = filterOpenPlotCategories(rawData);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(50);
    expect(result[0].typeOfUseCode).toBe('OPC');
  });

  it('should map typeOfUseCategoryId=4 API records dynamically', () => {
    const rawData = [
      {
        id: 10,
        typeOfUseCode: 'OP',
        description: 'खुला भूखंड निवासी',
        typeOfUseCategoryId: 4,
        isActive: true,
      },
      {
        id: 15111,
        typeOfUseCode: 'OPI',
        description: 'खुला भूखंड औद्योगिक',
        typeOfUseCategoryId: 4,
        isActive: true,
      },
    ];

    const result = filterOpenPlotCategories(rawData);
    expect(result).toHaveLength(2);
    expect(result[0].typeOfUseCode).toBe('OP');
    expect(result[0].description).toBe('खुला भूखंड निवासी');
    expect(result[1].typeOfUseCode).toBe('OPI');
  });
});
