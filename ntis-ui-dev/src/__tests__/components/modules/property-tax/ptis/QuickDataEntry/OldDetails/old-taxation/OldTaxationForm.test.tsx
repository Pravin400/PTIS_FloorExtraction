import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OldTaxationForm from '@/components/modules/property-tax/ptis/QuickDataEntry/old-details/OldTaxation/OldTaxationForm';
import { useConfirm } from '@/components/common/ConfirmProvider';
import { updatePropertyOldDetailsAction } from '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/OldDetails/old-taxation/action';

import { PropertyOldDetailsApiItem } from '@/types/OldDetails/property-old-details.types';

// Mock dependencies
vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ propertyId: '123', locale: 'en' }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/components/common/ConfirmProvider', () => ({
  useConfirm: vi.fn(),
}));

vi.mock('@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/OldDetails/old-taxation/action', () => ({
  updatePropertyOldDetailsAction: vi.fn(),
}));

describe('OldTaxationForm Component', () => {
  const mockConfirm = vi.fn();
  const mockPropertyData = {
    propertyId: 123,
    oldZoneNo: 'Zone A',
    oldWardNo: 'Ward 1',
    oldPropertyNo: 'P-001',
    oldPartitionNo: '1',
    oldEgovNo: 'E-123',
    oldPlotArea: 500,
    oldPlotNo: 'Plot 1',
    oldCarpetAreaSqFeet: 1000,
    oldCarpetAreaSqMeter: 93,
    oldCSN: null,
    oldConstructionArea: 1201,
    oldConstructionYear: '2020',
    oldRV: 5000,
    oldALV: 6000,
    oldGeneralTax: 1202,
    oldTotalTax: 1500,
    oldConstructionTypeId: 1,
    oldTypeOfUseId: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useConfirm).mockReturnValue({ confirm: mockConfirm } as unknown as { confirm: Mock });
  });

  it('renders correctly with initial data', () => {
    render(<OldTaxationForm propertyOldDetails={mockPropertyData as unknown as PropertyOldDetailsApiItem} />);
    
    expect(screen.getByText('quickDataEntry.oldDetails.title')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Zone A')).toBeInTheDocument();
    expect(screen.getByDisplayValue('P-001')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Plot 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1201')).toBeInTheDocument(); // Construction Area
    expect(screen.getByDisplayValue('5000')).toBeInTheDocument(); // RV
  });

  it('handles input changes correctly', () => {
    render(<OldTaxationForm propertyOldDetails={mockPropertyData as unknown as PropertyOldDetailsApiItem} />);
    
    const plotNoInput = screen.getByPlaceholderText('quickDataEntry.oldDetails.plotNoPlaceholder');
    fireEvent.change(plotNoInput, { target: { value: 'Plot 2' } });
    
    expect(plotNoInput).toHaveValue('Plot 2');
  });

  it('allows entering Marathi/Devanagari characters in alphanumeric fields', () => {
    render(<OldTaxationForm propertyOldDetails={mockPropertyData as unknown as PropertyOldDetailsApiItem} />);
    
    const zoneNameInput = screen.getByPlaceholderText('quickDataEntry.oldDetails.zoneNamePlaceholder');
    fireEvent.change(zoneNameInput, { target: { value: 'औंध - बाणेर' } });
    
    expect(zoneNameInput).toHaveValue('औंध - बाणेर');
  });

  it('calls confirm dialog when update button is clicked', () => {
    render(<OldTaxationForm propertyOldDetails={mockPropertyData as unknown as PropertyOldDetailsApiItem} />);
    
    // Modify a field to enable the update button
    const plotNoInput = screen.getByPlaceholderText('quickDataEntry.oldDetails.plotNoPlaceholder');
    fireEvent.change(plotNoInput, { target: { value: 'Plot 2' } });

    const updateButton = screen.getByRole('button', { name: /quickDataEntry.commonbuttonmessages.UpdateChanges/i });
    fireEvent.click(updateButton);
    
    expect(mockConfirm).toHaveBeenCalledTimes(1);
    expect(mockConfirm).toHaveBeenCalledWith(expect.objectContaining({
      title: 'quickDataEntry.property.updateConfirmTitle',
    }));
  });

  it('triggers API call and shows success toast on successful confirmation', async () => {
    vi.mocked(updatePropertyOldDetailsAction).mockResolvedValue({ success: true, data: {} as unknown } as unknown as Awaited<ReturnType<typeof updatePropertyOldDetailsAction>>);
    
    // Simulate onConfirm call
    mockConfirm.mockImplementation(({ onConfirm }: { onConfirm: () => void }) => onConfirm());
    
    render(<OldTaxationForm propertyOldDetails={mockPropertyData as unknown as PropertyOldDetailsApiItem} />);
    
    // Modify a field to enable the update button
    const plotNoInput = screen.getByPlaceholderText('quickDataEntry.oldDetails.plotNoPlaceholder');
    fireEvent.change(plotNoInput, { target: { value: 'Plot 2' } });

    const updateButton = screen.getByRole('button', { name: /quickDataEntry.commonbuttonmessages.UpdateChanges/i });
    fireEvent.click(updateButton);
    
    await waitFor(() => {
      expect(updatePropertyOldDetailsAction).toHaveBeenCalled();
    });
  });

  it('allows entering Marathi/Devanagari numeric digits in decimal/area input fields', () => {
    render(<OldTaxationForm propertyOldDetails={mockPropertyData as unknown as PropertyOldDetailsApiItem} />);
    
    const plotAreaInput = screen.getByPlaceholderText('quickDataEntry.oldDetails.plotAreaPlaceholder');
    fireEvent.change(plotAreaInput, { target: { value: '१५००.५०' } });
    expect(plotAreaInput).toHaveValue('१५००.५०');

    const rvInput = screen.getByPlaceholderText('quickDataEntry.oldDetails.rvPlaceholder');
    fireEvent.change(rvInput, { target: { value: '५०००' } });
    expect(rvInput).toHaveValue('५०००');

    const propertyTaxInput = screen.getByPlaceholderText('quickDataEntry.oldDetails.propertyTaxPlaceholder');
    fireEvent.change(propertyTaxInput, { target: { value: '१२०२' } });
    expect(propertyTaxInput).toHaveValue('१२०२');
  });
});
