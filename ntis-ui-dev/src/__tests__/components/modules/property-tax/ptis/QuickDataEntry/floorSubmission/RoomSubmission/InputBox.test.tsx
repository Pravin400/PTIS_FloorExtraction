import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { InputBox } from '@/components/modules/property-tax/ptis/QuickDataEntry/floorSubmission/RoomSubmission/InputBox';

// Mock translations
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock sub-components
vi.mock('@/components/modules/property-tax/ptis/QuickDataEntry/floorSubmission/RoomSubmission/components/RoomInputBox/RoomTypeShapeFields', () => ({
  RoomTypeShapeFields: () => <div data-testid="room-type-shape-fields" />,
}));
vi.mock('@/components/modules/property-tax/ptis/QuickDataEntry/floorSubmission/RoomSubmission/components/RoomInputBox/DimensionAreaFields', () => ({
  DimensionAreaFields: () => <div data-testid="dimension-area-fields" />,
}));
vi.mock('@/components/modules/property-tax/ptis/QuickDataEntry/floorSubmission/RoomSubmission/components/RoomInputBox/OffsetOuterFields', () => ({
  OffsetOuterFields: () => <div data-testid="offset-outer-fields" />,
}));
vi.mock('@/components/modules/property-tax/ptis/QuickDataEntry/floorSubmission/RoomSubmission/components/RoomInputBox/TotalActionFields', () => ({
  TotalActionFields: () => <div data-testid="total-action-fields" />,
}));

describe('InputBox', () => {
  const mockProps = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formData: { roomCount: '1', outer: 'No' } as any,
    handleInputChange: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rooms: [] as any[],
    isEditMode: false,
    validationErrors: {},
    calculateArea: vi.fn(() => 10),
    setOffsetModalOpen: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentRoomOffsets: [] as any[],
    setOffsetList: vi.fn(),
    setOffsetData: vi.fn(),
    setSelectedOperation: vi.fn(),
    setCurrentRoomOffsets: vi.fn(),
    handleUpdateRoom: vi.fn(),
    handleAddRoom: vi.fn(),
    calculateTotal: vi.fn(() => 10),
    maxRooms: 10,
    availableRooms: 10,
    setSelectedShape: vi.fn(),
    handleEdit: vi.fn(),
    offsetModalOpen: false,
    editingIndex: null,
    areaUnit: 'sq.m',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    focusRefs: { current: {} } as any,
  };

  it('renders all field sections', () => {
    render(<InputBox {...mockProps} />);
    
    expect(screen.getByTestId('room-type-shape-fields')).toBeInTheDocument();
    expect(screen.getByTestId('dimension-area-fields')).toBeInTheDocument();
    expect(screen.getByTestId('offset-outer-fields')).toBeInTheDocument();
    expect(screen.getByTestId('total-action-fields')).toBeInTheDocument();
  });

  it('displays table headers', () => {
    render(<InputBox {...mockProps} />);
    
    expect(screen.getByText('roomSubmission.table.roomNo')).toBeInTheDocument();
    expect(screen.getByText('roomSubmission.table.roomType')).toBeInTheDocument();
  });
});
