/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { FloorWiseValuationSection } from '@/components/modules/assets/municipal-Asset/sub-asset-detail-view/FloorWiseValuationSection';
import { vi, beforeEach, describe, it, expect } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('FloorWiseValuationSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    const mockData = {
      floorWiseRows: [
        { 
          sNo: 1, floor: 'G', yearOfConstruction: 2010, constructionType: 'RCC', 
          usage: 'Commercial', carpetArea: '50', builtupArea: '60', 
          rrRate: 1000, baseValue: 50000, floorFactor: 1, ageFactor: 1, 
          ntbFactor: 1, useFactor: 1, capitalValue: 500000 
        }
      ]
    } as any;
    render(<FloorWiseValuationSection data={mockData} />);
    expect(screen.getByText(/Commercial/i)).toBeInTheDocument();
  });
});
