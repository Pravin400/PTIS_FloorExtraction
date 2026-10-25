import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FloorForm from '@/components/modules/property-tax/ptis/QuickDataEntry/floorSubmission/FloorForm';
import { floorFormSchema } from '@/lib/validations/floor-form.schema';
import { INITIAL_FORM_STATE } from '@/hooks/ptis/floorSubmission/useFloorFormState';
import { FloorData } from '@/types/room-details.types';

// Mock all section components
vi.mock('@/components/modules/property-tax/ptis/QuickDataEntry/floorSubmission/components', () => ({
  BasicInfoSection: () => <div data-testid="basic-info-section">Basic Info</div>,
  UsageSection: () => <div data-testid="usage-section">Usage</div>,
  RenterSection: () => <div data-testid="renter-section">Renter</div>,
  AreaSection: () => <div data-testid="area-section">Area</div>,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

vi.mock('@/components/common', () => ({
  Button: ({ label, children, onClick, disabled, isLoading }: { label?: string; children?: React.ReactNode; onClick: () => void; disabled?: boolean; isLoading?: boolean }) => (
    <button onClick={onClick} disabled={disabled || isLoading}>{children || label}</button>
  ),
  IconButton: ({ onClick, icon: Icon }: { onClick: () => void; icon: React.ComponentType }) => (
    <button onClick={onClick} data-testid="icon-button"><Icon /></button>
  ),
  SearchSelect: ({ id, name, options, value, onChange }: { id: string; name: string; options: { label: string; value: string }[]; value: string; onChange: (name: string, value: string) => void }) => (
    <select
      id={id}
      name={name}
      value={value}
      onChange={(e) => onChange(name, e.target.value)}
      data-testid="search-select"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
  useConfirm: () => ({ confirm: vi.fn() }),
}));

vi.mock('lucide-react', () => ({
  Edit2: () => <div>Edit Icon</div>,
  X: () => <div>X Icon</div>,
}));

describe('FloorForm', () => {
  const mockProps = {
    t: (key: string) => key,
    isAddingNewFloor: false,
    selectedFloor: { id: 1, floor: 'Ground Floor', subFloor: 'None', conYr: '2020', asstYr: '2021', conTyp: 'RCC', use: 'Residential', subTyp: 'Apartment', rooms: '5', areaSqFt: '1000', areaSqM: '92.9', builtupAreaSqFt: '1200', builtupAreaSqM: '111.5', renter: false } as unknown as FloorData,
    editingFloorForm: {
      floor: 'Ground Floor',
      subFloor: 'None',
      conYr: '2020',
      asstYr: '2021',
      conTyp: 'RCC',
      use: 'Residential',
      subTyp: 'Apartment',
      rooms: '5',
      areaSqFt: '1000',
      areaSqM: '92.9',
      builtupAreaSqFt: '1200',
      builtupAreaSqM: '111.5',
      renter: false,
    },
    setEditingFloorForm: vi.fn(),
    formErrors: {},
    setFormErrors: vi.fn(),
    resetForm: vi.fn(),
    handleOpenDropdown: vi.fn(),
    handleOpenRenterManagement: vi.fn(),
    updateUrlParams: vi.fn(),
    isOperationLoading: false,
    startTransition: vi.fn((fn: () => void) => fn()),
    roomsInputRef: { current: null },
    areaInputRef: { current: null },
    floorOptions: ['Ground Floor', 'First Floor'],
    floorLookup: [],
    subFloorOptions: ['None', 'Mezzanine'],
    subFloorLookup: [],
    constructionTypeOptions: ['RCC', 'PCC'],
    constructionLookup: [],
    useOptions: ['Residential', 'Commercial'],
    useLookup: [],
    subTypeOptionsFromData: ['Apartment', 'Villa'],
    subTypeData: [],
    setShowRoomSubmission: vi.fn(),
    onSave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form sections', () => {
    render(<FloorForm {...mockProps} />);

    expect(screen.getByTestId('basic-info-section')).toBeInTheDocument();
    expect(screen.getByTestId('usage-section')).toBeInTheDocument();
    expect(screen.getByTestId('renter-section')).toBeInTheDocument();
    expect(screen.getByTestId('area-section')).toBeInTheDocument();
  });

  it('displays correct title when adding new floor', () => {
    const propsForAdding = { ...mockProps, isAddingNewFloor: true, selectedFloor: null };
    render(<FloorForm {...propsForAdding} />);

    expect(screen.getByText('floor.addFloorDetails')).toBeInTheDocument();
  });

  it('displays correct title when adding new open plot', () => {
    const propsForAdding = { ...mockProps, isAddingNewFloor: true, selectedFloor: null, selectedFloorType: 'OpenPlot' as const };
    render(<FloorForm {...propsForAdding} />);

    expect(screen.getByText('floor.addOpenPlotDetails')).toBeInTheDocument();
  });

  it('displays correct title when editing floor', () => {
    render(<FloorForm {...mockProps} />);

    expect(screen.getByText('floor.editFloorDetails')).toBeInTheDocument();
  });

  it('displays correct title when editing open plot', () => {
    render(<FloorForm {...mockProps} selectedFloorType="OpenPlot" />);

    expect(screen.getByText('floor.editOpenPlotDetails')).toBeInTheDocument();
  });

  it('renders save button', () => {
    render(<FloorForm {...mockProps} />);

    expect(screen.getByText('floor.updateFloor')).toBeInTheDocument();
  });

  it('renders cancel button', () => {
    render(<FloorForm {...mockProps} />);

    const cancelButtons = screen.getAllByRole('button');
    expect(cancelButtons.length).toBeGreaterThan(0);
  });

  it('calls onSave when save button is clicked', () => {
    render(<FloorForm {...mockProps} />);

    const saveButton = screen.getByText('floor.updateFloor');
    fireEvent.click(saveButton);

    expect(mockProps.onSave).toHaveBeenCalled();
  });

  it('calls resetForm when cancel button is clicked', () => {
    render(<FloorForm {...mockProps} />);

    // Find X icon button (cancel button)
    const cancelButton = screen.getByTestId('icon-button');
    fireEvent.click(cancelButton);

    expect(mockProps.resetForm).toHaveBeenCalled();
  });

  it('disables save button when operation is loading', () => {
    const propsWithLoading = { ...mockProps, isOperationLoading: true };
    render(<FloorForm {...propsWithLoading} />);

    const saveButton = screen.getByText('floor.updateFloor');
    expect(saveButton).toBeDisabled();
  });

  it('shows correct button text when saving', () => {
    const propsWithLoading = { ...mockProps, isOperationLoading: true };
    render(<FloorForm {...propsWithLoading} />);

    // Button text stays the same but shows loading spinner
    expect(screen.getByText('floor.updateFloor')).toBeInTheDocument();
    expect(screen.getByText('floor.updateFloor')).toBeDisabled();
  });

  it('uses correct button label for new floor', () => {
    const propsForAdding = { ...mockProps, isAddingNewFloor: true };
    render(<FloorForm {...propsForAdding} />);

    expect(screen.getByText('floor.add')).toBeInTheDocument();
  });

  it('validates Zod schema starting from INITIAL_FORM_STATE', () => {
    const userFormData = {
      ...INITIAL_FORM_STATE,
      isTaxable: 'Yes',
      floor: '2 - दुसरा मजला',
      floorId: '2',
      subFloor: 'Attic - ATTIC',
      subFloorId: 'Attic',
      conYr: '2026',
      asstYr: '2026',
      conTyp: 'A - सीमेंट काँक्रीट संरचना',
      constructionTypeId: 'A',
      use: 'UC - बांधकाम चालू',
      typeOfUseId: 'UC',
      subTyp: 'चालू बांधकाम',
      subTypeOfUseId: 'चालू बांधकाम',
      renter: 'No',
      rooms: '1',
      areaSqFt: '197141.02',
      areaSqM: '18315.00',
      builtupAreaSqFt: '0.00',
      builtupAreaSqM: '0.00',
    };
    const result = floorFormSchema.safeParse(userFormData);
    expect(result.success).toBe(true);
  });

  it('validates Zod schema with user screenshot 2 values', () => {
    const userFormData = {
      ...INITIAL_FORM_STATE,
      id: 123, // simulating an update
      isTaxable: 'Yes',
      floor: '1 - पहिला मजला',
      floorId: '1',
      subFloor: 'Attic - ATTIC',
      subFloorId: 'Attic',
      conYr: '2026',
      asstYr: '2026',
      conTyp: 'B - सीमेंट/चुना/दगड/विटांची भिंत व स्लॅब',
      constructionTypeId: 'B',
      use: 'R - R',
      typeOfUseId: 'R',
      subTyp: 'टॉयलेट बाथ',
      subTypeOfUseId: 'टॉयलेट बाथ',
      renter: 'No',
      rooms: '1',
      areaSqFt: '6512.17',
      areaSqM: '605',
      builtupAreaSqFt: '7814.6',
      builtupAreaSqM: '726',
      nonCalculateRentMonthly: '',
    };
    const result = floorFormSchema.safeParse(userFormData);
    expect(result.success).toBe(true);
  });

  it('fails Zod schema validation with id 123 and floor/conTyp as select placeholders', () => {
    const userFormData = {
      ...INITIAL_FORM_STATE,
      id: 123,
      isAddingNewFloor: false,
      floor: 'Select floor',
      conTyp: 'Select type',
    };
    const result = floorFormSchema.safeParse(userFormData);
    expect(result.success).toBe(false);
  });

  it('fails Zod schema validation simulating user screenshot exactly', () => {
    const userFormData = {
      ...INITIAL_FORM_STATE,
      id: 123,
      isAddingNewFloor: false,
      isTaxable: 'Yes',
      floor: '',
      floorId: '',
      subFloor: 'Attic - ATTIC',
      subFloorId: 'Attic',
      conYr: '2026',
      asstYr: '2026',
      conTyp: '',
      constructionTypeId: '',
      use: 'GR - शासकीय निवासी',
      typeOfUseId: 'GR',
      subTyp: 'कॉर्टर',
      subTypeOfUseId: 'कॉर्टर',
      renter: 'No',
      rooms: '1',
      areaSqFt: '20236.15',
      areaSqM: '1880',
      builtupAreaSqFt: '24283.38',
      builtupAreaSqM: '2256',
    };
    const result = floorFormSchema.safeParse(userFormData);
    expect(result.success).toBe(false);
  });

  it('validates Zod schema with mockProps editingFloorForm', () => {
    const result = floorFormSchema.safeParse(mockProps.editingFloorForm);
    expect(result.success).toBe(true);
  });

  it('does NOT bypass year validation refinement when isAddingNewFloor is false', () => {
    const userFormData = {
      ...INITIAL_FORM_STATE,
      isAddingNewFloor: false, // update mode
      isTaxable: 'Yes',
      floor: '1 - पहिला मजला',
      floorId: '1',
      subFloor: 'Attic - ATTIC',
      subFloorId: 'Attic',
      conYr: '2026',
      asstYr: '2024', // less than construction year
      conTyp: 'B - सीमेंट/चुना/दगड/विटांची भिंत व स्लॅब',
      constructionTypeId: 'B',
      use: 'R - R',
      typeOfUseId: 'R',
      subTyp: 'टॉयलेट बाथ',
      subTypeOfUseId: 'टॉयलेट बाथ',
      renter: 'No',
      rooms: '1',
      areaSqFt: '6512.17',
      areaSqM: '605',
      builtupAreaSqFt: '7814.6',
      builtupAreaSqM: '726',
    };
    const result = floorFormSchema.safeParse(userFormData);
    expect(result.success).toBe(false);
  });

  it('enforces year validation refinement when isAddingNewFloor is true', () => {
    const userFormData = {
      ...INITIAL_FORM_STATE,
      isAddingNewFloor: true, // create mode
      isTaxable: 'Yes',
      floor: '1 - पहिला मजला',
      floorId: '1',
      subFloor: 'Attic - ATTIC',
      subFloorId: 'Attic',
      conYr: '2026',
      asstYr: '2024', // less than construction year
      conTyp: 'B - सीमेंट/चुना/दगड/विटांची भिंत व स्लॅब',
      constructionTypeId: 'B',
      use: 'R - R',
      typeOfUseId: 'R',
      subTyp: 'टॉयलेट बाथ',
      subTypeOfUseId: 'टॉयलेट बाथ',
      renter: 'No',
      rooms: '1',
      areaSqFt: '6512.17',
      areaSqM: '605',
      builtupAreaSqFt: '7814.6',
      builtupAreaSqM: '726',
    };
    const result = floorFormSchema.safeParse(userFormData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Assessment year cannot be less than construction year');
    }
  });

  it('fails Zod schema validation when conTyp is empty or has Select type', () => {
    const userFormData = {
      ...INITIAL_FORM_STATE,
      isTaxable: 'Yes',
      floor: '1 - पहिला मजला',
      floorId: '1',
      subFloor: 'Attic - ATTIC',
      subFloorId: 'Attic',
      conYr: '2026',
      asstYr: '2026',
      conTyp: '',
      constructionTypeId: '',
      use: 'R - R',
      typeOfUseId: 'R',
      subTyp: 'टॉयलेट बाथ',
      subTypeOfUseId: 'टॉयलेट बाथ',
      renter: 'No',
      rooms: '1',
      areaSqFt: '6512.17',
      areaSqM: '605',
      builtupAreaSqFt: '7814.6',
      builtupAreaSqM: '726',
    };
    const result = floorFormSchema.safeParse(userFormData);
    expect(result.success).toBe(false);
  });

  it('fails Zod schema validation when conTyp is empty and isAddingNewFloor is false', () => {
    const userFormData = {
      ...INITIAL_FORM_STATE,
      isAddingNewFloor: false,
      isTaxable: 'Yes',
      floor: '1 - पहिला मजला',
      floorId: '1',
      subFloor: 'Attic - ATTIC',
      subFloorId: 'Attic',
      conYr: '2026',
      asstYr: '2026',
      conTyp: '',
      constructionTypeId: '',
      use: 'R - R',
      typeOfUseId: 'R',
      subTyp: 'टॉयलेट बाथ',
      subTypeOfUseId: 'टॉयलेट बाथ',
      renter: 'No',
      rooms: '1',
      areaSqFt: '6512.17',
      areaSqM: '605',
      builtupAreaSqFt: '7814.6',
      builtupAreaSqM: '726',
    };
    const result = floorFormSchema.safeParse(userFormData);
    expect(result.success).toBe(false);
  });

  it('fails Zod schema validation when conTyp contains placeholder text across locales', () => {
    const placeholders = [
      'Select type',
      'Select',
      'प्रकार निवडा', // Marathi placeholder
      'प्रकार चुनें', // Hindi placeholder
    ];

    placeholders.forEach((placeholder) => {
      const userFormData = {
        ...INITIAL_FORM_STATE,
        isTaxable: 'Yes',
        floor: '1 - पहिला मजला',
        floorId: '1',
        subFloor: 'Attic - ATTIC',
        subFloorId: 'Attic',
        conYr: '2026',
        asstYr: '2026',
        conTyp: placeholder,
        constructionTypeId: '',
        use: 'R - R',
        typeOfUseId: 'R',
        subTyp: 'टॉयलेट बाथ',
        subTypeOfUseId: 'टॉयलेट बाथ',
        renter: 'No',
        rooms: '1',
        areaSqFt: '6512.17',
        areaSqM: '605',
        builtupAreaSqFt: '7814.6',
        builtupAreaSqM: '726',
      };
      const result = floorFormSchema.safeParse(userFormData);
      expect(result.success).toBe(false);
    });
  });

  it('fails Zod schema validation when floor contains placeholder text', () => {
    const userFormData = {
      ...INITIAL_FORM_STATE,
      isTaxable: 'Yes',
      floor: 'Select floor',
      floorId: '',
      subFloor: 'Attic - ATTIC',
      subFloorId: 'Attic',
      conYr: '2026',
      asstYr: '2026',
      conTyp: 'B - सीमेंट/चुना/दगड/विटांची भिंत व स्लॅब',
      constructionTypeId: 'B',
      use: 'R - R',
      typeOfUseId: 'R',
      subTyp: 'टॉयलेट बाथ',
      subTypeOfUseId: 'टॉयलेट बाथ',
      renter: 'No',
      rooms: '1',
      areaSqFt: '6512.17',
      areaSqM: '605',
      builtupAreaSqFt: '7814.6',
      builtupAreaSqM: '726',
    };
    const result = floorFormSchema.safeParse(userFormData);
    expect(result.success).toBe(false);
  });

  it('fails Zod schema validation when use contains placeholder text', () => {
    const userFormData = {
      ...INITIAL_FORM_STATE,
      isTaxable: 'Yes',
      floor: '1 - पहिला मजला',
      floorId: '1',
      subFloor: 'Attic - ATTIC',
      subFloorId: 'Attic',
      conYr: '2026',
      asstYr: '2026',
      conTyp: 'B - सीमेंट/चुना/दगड/विटांची भिंत व स्लॅब',
      constructionTypeId: 'B',
      use: 'Select construction first',
      typeOfUseId: '',
      subTyp: 'टॉयलेट बाथ',
      subTypeOfUseId: 'टॉयलेट बाथ',
      renter: 'No',
      rooms: '1',
      areaSqFt: '6512.17',
      areaSqM: '605',
      builtupAreaSqFt: '7814.6',
      builtupAreaSqM: '726',
    };
    const result = floorFormSchema.safeParse(userFormData);
    expect(result.success).toBe(false);
  });

  it('fails Zod schema validation when selectedFloorType is OpenPlot and constructionTypeId is missing', () => {
    const userFormData = {
      ...INITIAL_FORM_STATE,
      selectedFloorType: 'OpenPlot',
      isTaxable: 'Yes',
      length: '10',
      width: '12',
      areaSqFt: '120',
      areaSqM: '11.14',
      use: 'Residential',
      typeOfUseId: 'R',
      constructionTypeId: '',
      asstYr: '2026',
    };
    const result = floorFormSchema.safeParse(userFormData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(issue => issue.path.includes('constructionTypeId'))).toBe(true);
    }
  });

  it('passes Zod schema validation when selectedFloorType is OpenPlot and constructionTypeId is present', () => {
    const userFormData = {
      ...INITIAL_FORM_STATE,
      selectedFloorType: 'OpenPlot',
      isTaxable: 'Yes',
      length: '10',
      width: '12',
      areaSqFt: '120',
      areaSqM: '11.14',
      use: 'Residential',
      typeOfUseId: 'R',
      constructionTypeId: '12',
      asstYr: '2026',
    };
    const result = floorFormSchema.safeParse(userFormData);
    expect(result.success).toBe(true);
  });
});


