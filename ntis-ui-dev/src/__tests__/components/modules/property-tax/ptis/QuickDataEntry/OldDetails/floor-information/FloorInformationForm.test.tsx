import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FloorInformationForm from '@/components/modules/property-tax/ptis/QuickDataEntry/old-details/FloorInformation/FloorInformationForm';
import { useConfirm } from '@/components/common/ConfirmProvider';

import { OldFloorDetail } from '@/types/OldDetails/property-old-details.types';
import { useFloorInformationForm } from '@/hooks/ptis/QuickDataEntry/Olddetails/useFloorInformationForm';

// Mock dependencies
vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ propertyId: '123', locale: 'en' }),
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('@/hooks/ptis/QuickDataEntry/Olddetails/useFloorInformationForm', () => ({
  useFloorInformationForm: vi.fn(),
}));

vi.mock('@/components/common/ConfirmProvider', () => ({
  useConfirm: vi.fn(),
}));

describe('FloorInformationForm Component', () => {
  const mockConfirm = vi.fn();
  const mockSetFormData = vi.fn();
  const mockHandleSave = vi.fn();
  const mockHandleEdit = vi.fn();
  const mockHandleDelete = vi.fn();
  const mockHandleReset = vi.fn();
  const mockHandleUseTypeChange = vi.fn();

  const defaultHookData = {
    formData: {
      id: null,
      oldFloorId: "",
      oldSubFloorId: "",
      oldConstructionYear: "",
      oldConstructionTypeId: "",
      oldTypeOfUseId: "",
      oldSubTypeOfUseId: "",
      oldCarpetAreaSqFeet: "",
    },
    setFormData: mockSetFormData,
    subUseTypeOptions: [],
    isSubmitting: false,
    errors: {},
    showError: vi.fn(() => false),
    handleUseTypeChange: mockHandleUseTypeChange,
    handleEdit: mockHandleEdit,
    handleReset: mockHandleReset,
    handleSave: mockHandleSave,
    handleDelete: mockHandleDelete,
    isPending: false,
    handleOpenDropdown: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useConfirm).mockReturnValue({ confirm: mockConfirm } as unknown as { confirm: Mock });
    vi.mocked(useFloorInformationForm).mockReturnValue(defaultHookData as unknown as ReturnType<typeof useFloorInformationForm>);
  });

  it('renders correctly with initial state', () => {
    render(<FloorInformationForm />);
    
    expect(screen.getByText('quickDataEntry.oldDetails.floorDetailsTitle')).toBeInTheDocument();
    expect(screen.getAllByText(/quickDataEntry.floor.floorLabel/i)[0]).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /quickDataEntry.oldDetails.button.add/i })).toBeInTheDocument();
  });

  it('shows update title when id is present in formData', () => {
    vi.mocked(useFloorInformationForm).mockReturnValue({
      ...defaultHookData,
      formData: { ...defaultHookData.formData, id: 1 },
    } as unknown as ReturnType<typeof useFloorInformationForm>);

    render(<FloorInformationForm />);
    expect(screen.getByText('quickDataEntry.oldDetails.updateFloorDetailsTitle')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /quickDataEntry.commonbuttonmessages.UpdateChanges/i })).toBeInTheDocument();
  });

  it('calls handleSave when add button is clicked', async () => {
    render(<FloorInformationForm />);
    
    const addButton = screen.getByRole('button', { name: /quickDataEntry.oldDetails.button.add/i });
    fireEvent.click(addButton);
    
    expect(mockHandleSave).toHaveBeenCalledTimes(1);
  });

  it('calls handleReset when clear button is clicked in edit mode', () => {
    vi.mocked(useFloorInformationForm).mockReturnValue({
      ...defaultHookData,
      formData: { ...defaultHookData.formData, id: 1 },
    } as unknown as ReturnType<typeof useFloorInformationForm>);

    render(<FloorInformationForm />);
    
    const clearButton = screen.getByRole('button', { name: /quickDataEntry.commonbuttonmessages.clear/i });
    fireEvent.click(clearButton);
    
    expect(mockHandleReset).toHaveBeenCalledTimes(1);
  });

  it('renders the MasterTable with correct data', () => {
    const existingFloorDetails = [
      {
        id: 1,
        floorDescription: 'Ground Floor',
        oldConstructionYear: '2020',
        constructionTypeDescription: 'RCC',
        typeOfUseDescription: 'Residential',
        oldCarpetAreaSqFeet: 1000,
      }
    ];

    render(<FloorInformationForm existingFloorDetails={existingFloorDetails as unknown as OldFloorDetail[]} />);
    
    // Check if table cells contain the data
    expect(screen.getByText('Ground Floor')).toBeInTheDocument();
    expect(screen.getByText('2020')).toBeInTheDocument();
    expect(screen.getByText(/1,000\.00/)).toBeInTheDocument();
    expect(screen.getAllByText(/0\.00/).length).toBeGreaterThan(0);
  });
});
