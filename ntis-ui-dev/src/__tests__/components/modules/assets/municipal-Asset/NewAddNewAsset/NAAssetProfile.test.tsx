import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NAAssetProfile } from '@/components/modules/assets/municipal-Asset/NewAddNewAsset/components/NAAssetProfile';
import enTranslations from '@/i18n/locales/en/newAddNewAsset.json';

import type { BuildingBasicInfoFormData } from '@/types/asset/municipal-Asset/new-add-new-asset/buildBasicInfo.types';
import type { NAAssetProfileProps } from '@/types/asset/municipal-Asset/new-add-new-asset/buildBasicInfo.types';

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return path;
    }
  }
  return typeof current === 'string' ? current : path;
}

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    let text = getNestedValue(enTranslations, key);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  },
  useLocale: () => 'en',
}));

describe('NAAssetProfile Component', () => {
  const mockFormData = {
    category: 'Building',
    assetType: 'Municipal School',
    zone: '1',
    ward: '2',
    propertyNumber: 'PROP-001',
    partitionNo: 'PART-1',
    upicId: 'UPIC-999',
    mouja: '3',
    subzone: '4',
    surveyNumber: 'CSN-555',
    length: '20',
    width: '15',
    landArea: '300.00',
    plotNumber: 'P-12',
    mpmsNo: 'MPMS-888',
    condition: '1',
    encroachmentStatus: 'Clean',
  } as unknown as BuildingBasicInfoFormData;

  const defaultProps: NAAssetProfileProps = {
    formData: mockFormData,
    errors: {},
    showError: vi.fn(() => false),
    handleChange: vi.fn(),
    updateFormData: vi.fn(),
    zones: [{ id: 1, zoneNo: '1', zoneName: 'North Zone' }],
    wards: [{ id: 2, wardName: 'Ward 10' }],
    moujas: [{ id: 3, moujaName: 'Central Mouja' }],
    subzones: [{ id: 4, subZoneName: 'Subzone Alpha' }],
    assetConditions: [
      { id: 1, conditionName: 'Good', conditionCategory: 'General', categoryId: 1 },
      { id: 2, conditionName: 'Average', conditionCategory: 'General', categoryId: 1 },
      { id: 3, conditionName: 'Poor', conditionCategory: 'General', categoryId: 1 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders localized card title and read-only category and type', () => {
    render(<NAAssetProfile {...defaultProps} />);

    expect(screen.getByText('Asset Details')).toBeInTheDocument();
    expect(screen.getByText('Asset Category')).toBeInTheDocument();
    expect(screen.getByText('Building')).toBeInTheDocument();
    expect(screen.getByText('Asset Type')).toBeInTheDocument();
    expect(screen.getByText('Municipal School')).toBeInTheDocument();
  });

  it('renders administrative fields with options and placeholders', () => {
    render(<NAAssetProfile {...defaultProps} />);

    expect(screen.getByText('Zone')).toBeInTheDocument();
    expect(screen.getByText('North Zone')).toBeInTheDocument();

    expect(screen.getByText('Ward')).toBeInTheDocument();
    expect(screen.getByText('Ward 10')).toBeInTheDocument();

    expect(screen.getByText('Property No')).toBeInTheDocument();
    expect(screen.getByText('Partition No.')).toBeInTheDocument();
    expect(screen.getByText('UPIC ID')).toBeInTheDocument();

    expect(screen.getByText('Mouja')).toBeInTheDocument();
    expect(screen.getByText('Central Mouja')).toBeInTheDocument();

    expect(screen.getByText('Subzone')).toBeInTheDocument();
    expect(screen.getByText('Subzone Alpha')).toBeInTheDocument();

    expect(screen.getByText('CSN No.')).toBeInTheDocument();
  });

  it('renders plot dimensions and auto-calculates Total Plot Area on change', () => {
    const updateFormDataMock = vi.fn();
    const handleChangeMock = vi.fn();

    render(
      <NAAssetProfile
        {...defaultProps}
        updateFormData={updateFormDataMock}
        handleChange={handleChangeMock}
      />
    );

    expect(screen.getByText('Plot Length (Sq. Mtr)')).toBeInTheDocument();
    expect(screen.getByText('Plot Width (Sq. Mtr)')).toBeInTheDocument();
    expect(screen.getByText('Total Plot Area (Sq. Mtr)')).toBeInTheDocument();

    // Find the plot length input
    const lengthInput = screen.getByDisplayValue('20');
    fireEvent.change(lengthInput, { target: { name: 'length', value: '25' } });

    expect(handleChangeMock).toHaveBeenCalled();
    // 25 * 15 = 375.00
    expect(updateFormDataMock).toHaveBeenCalledWith(expect.objectContaining({ landArea: '375.00' }));
  });

  it('renders condition and encroachment dropdowns with localized options', () => {
    render(<NAAssetProfile {...defaultProps} />);

    expect(screen.getByText('Asset Condition')).toBeInTheDocument();
    expect(screen.getByText('Encroachment Status')).toBeInTheDocument();
    expect(screen.getByText('Clean')).toBeInTheDocument();

    const encroachmentSelect = screen.getByRole('combobox', { name: 'Select Encroachment Status' });
    fireEvent.click(encroachmentSelect);

    expect(screen.getByText('Partially Encroached')).toBeInTheDocument();
    expect(screen.getByText('Fully Encroached')).toBeInTheDocument();
  });
});
