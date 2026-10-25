import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FloorQCEditDrawer } from '@/components/modules/property-tax/ptis/appartmentQC/FloorQCEditDrawer';
import type { DrawerFloorDataRow } from '@/types/propertyEditScreenDrawer.types';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock common components
vi.mock('@/components/common/Drawer', () => ({
  Drawer: ({ children, open, title, footer, ...props }: { children: React.ReactNode, open: boolean, title: React.ReactNode, footer: React.ReactNode, [key: string]: unknown }) =>
    open ? (
      <div data-testid="drawer" {...props}>
        <div data-testid="drawer-title">{title}</div>
        {children}
        <div data-testid="drawer-footer">{footer}</div>
      </div>
    ) : null,
}));

vi.mock('@/components/common', () => ({
  CancelButton: ({ onClick, label }: { onClick: () => void, label: React.ReactNode }) => <button onClick={onClick} data-testid="cancel-button">{label}</button>,
  SaveButton: ({ onClick, label }: { onClick: () => void, label: React.ReactNode }) => <button onClick={onClick} data-testid="save-button">{label}</button>,
}));

vi.mock('@/components/modules/property-tax/ptis/appartmentQC/PropertyEditDrawerInputs', () => ({
  EditableInput: ({ label, value, onChange, error }: { label: string, value: string, onChange: (val: string) => void, error?: string }) => (
    <div data-testid={`input-${label}`}>
      <input 
        value={value || ''} 
        onChange={(e) => onChange(e.target.value)} 
        aria-label={label}
      />
      {error && <span data-testid={`error-${label}`}>{error}</span>}
    </div>
  ),
  EditableSelect: ({ label, value, onChange, error }: { label: string, value: string, onChange: (val: string) => void, error?: string }) => (
    <div data-testid={`select-${label}`}>
      <select value={value || ''} onChange={(e) => onChange(e.target.value)} aria-label={label}>
        <option value={value || ''}>{value || ''}</option>
        <option value="test-value">Test Value</option>
      </select>
      {error && <span data-testid={`error-${label}`}>{error}</span>}
    </div>
  ),
}));

describe('FloorQCEditDrawer', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    row: { id: 'row-2', pdnId: 102, floorId: '2', conYear: '2010', asstYear: '2011', constructionTypeId: '1', typeOfUseId: '1', subTypeOfUseId: '4' } as unknown as DrawerFloorDataRow,
    floorOptions: [{ value: '1', label: 'Ground Floor' }],
    conTypeOptions: [{ value: '2', label: 'RCC' }],
    useTypeOptions: [{ value: '3', label: 'Residential' }],
    getSubTypeOptions: vi.fn().mockReturnValue([{ value: '4', label: 'Self Occupied' }]),
    isLoadingFloors: false,
    isLoadingConTypes: false,
    isLoadingUseTypes: false,
    handleFloorDropdownClick: vi.fn(),
    handleConTypeDropdownClick: vi.fn(),
    handleUseTypeDropdownClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly when open', () => {
    render(<FloorQCEditDrawer {...defaultProps} />);
    expect(screen.getByTestId('drawer')).toBeInTheDocument();
    expect(screen.getByTestId('drawer-title')).toHaveTextContent('floorQC.columns.editFloorQC');
  });

  it('does not render when closed', () => {
    render(<FloorQCEditDrawer {...defaultProps} open={false} />);
    expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();
  });

  it('initializes form data with row data', () => {
    render(<FloorQCEditDrawer {...defaultProps} />);
    expect(screen.getByLabelText('floorQC.columns.floor')).toHaveValue('2');
    expect(screen.getByLabelText('floorQC.columns.conYear')).toHaveValue('2010');
    expect(screen.getByLabelText('floorQC.columns.asstYear')).toHaveValue('2011');
  });

  it('calls onClose when cancel button is clicked', async () => {
    render(<FloorQCEditDrawer {...defaultProps} />);
    const user = userEvent.setup();
    await user.click(screen.getByTestId('cancel-button'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('validates required fields on save', async () => {
    const emptyRowProps = {
      ...defaultProps,
      row: {
        id: 'row-1',
        pdnId: 101,
        floorId: '',
        conYear: '',
        asstYear: '',
        constructionTypeId: '',
        typeOfUseId: '',
      } as unknown as DrawerFloorDataRow
    };
    render(<FloorQCEditDrawer {...emptyRowProps} />);
    const user = userEvent.setup();
    
    await user.click(screen.getByTestId('save-button'));
    
    // Check validation errors are displayed
    expect(screen.getByTestId('error-floorQC.columns.floor')).toBeInTheDocument();
    expect(screen.getByTestId('error-floorQC.columns.conYear')).toBeInTheDocument();
    expect(screen.getByTestId('error-floorQC.columns.asstYear')).toBeInTheDocument();
    expect(screen.getByTestId('error-floorQC.columns.conType')).toBeInTheDocument();
    expect(screen.getByTestId('error-floorQC.columns.use')).toBeInTheDocument();
    
    // Save should not be called
    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  it('validates year length on save', async () => {
    const invalidYearProps = {
      ...defaultProps,
      row: { ...defaultProps.row, conYear: '202', asstYear: '123' } as unknown as DrawerFloorDataRow
    };
    render(<FloorQCEditDrawer {...invalidYearProps} />);
    const user = userEvent.setup();
    
    await user.click(screen.getByTestId('save-button'));
    
    expect(screen.getByTestId('error-floorQC.columns.conYear')).toHaveTextContent('floorQC.validation.conYearInvalid');
    expect(screen.getByTestId('error-floorQC.columns.asstYear')).toHaveTextContent('floorQC.validation.asstYearInvalid');
    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  it('clears error when field is updated', async () => {
    const emptyRowProps = {
      ...defaultProps,
      row: { ...defaultProps.row, conYear: '' } as unknown as DrawerFloorDataRow
    };
    render(<FloorQCEditDrawer {...emptyRowProps} />);
    const user = userEvent.setup();
    
    // Save to trigger error
    await user.click(screen.getByTestId('save-button'));
    expect(screen.getByTestId('error-floorQC.columns.conYear')).toBeInTheDocument();
    
    // Type in input to clear error
    const input = screen.getByLabelText('floorQC.columns.conYear');
    await user.type(input, '2023');
    
    // Error should be removed
    expect(screen.queryByTestId('error-floorQC.columns.conYear')).not.toBeInTheDocument();
  });

  it('calls onSave with updated data when valid', async () => {
    render(<FloorQCEditDrawer {...defaultProps} />);
    const user = userEvent.setup();
    
    const input = screen.getByLabelText('floorQC.columns.conYear');
    await user.clear(input);
    await user.type(input, '2024');
    
    await user.click(screen.getByTestId('save-button'));
    
    expect(defaultProps.onSave).toHaveBeenCalledWith(expect.objectContaining({
      ...defaultProps.row,
      conYear: '2024'
    }));
  });
});
