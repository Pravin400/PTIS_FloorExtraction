import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RoomWiseSubmission from '@/components/modules/property-tax/ptis/QuickDataEntry/floorSubmission/RoomSubmission/RoomWiseSubmission';
import React from 'react';

// Mock hooks
vi.mock('@/hooks/ptis/RoomSubmission/useRoomSubmissionState', () => ({
  useRoomSubmissionState: vi.fn(() => ({
    mounted: true,
    areaUnit: 'sq.m',
    availableRooms: 5,
    grandTotal: 100,
    isUpdating: false,
    rooms: [],
    setRooms: vi.fn(),
    setValidationErrors: vi.fn(),
    setEditingIndex: vi.fn(),
    setIsEditMode: vi.fn(),
    setOffsetModalOpen: vi.fn(),
    formData: {},
    offsetModalOpen: false,
    selectedOperation: 'subtract',
    isShakingSubtract: false,
    offsetData: { area: 0 },
    setOffsetValidationError: vi.fn(),
    setSelectedOperation: vi.fn(),
    offsetValidationError: '',
    selectedShape: 'Rectangle',
    offsetList: [],
    shouldShake: false,
    deletingOffsetIndex: null,
    setInternalAreaUnit: vi.fn(),
  })),
}));

vi.mock('@/hooks/ptis/RoomSubmission/useRoomActions', () => ({
  useRoomActions: vi.fn(() => ({
    handleEdit: vi.fn(),
    handleUpdate: vi.fn(),
  })),
}));

vi.mock('@/hooks/ptis/RoomSubmission/useOffsetActions', () => ({
  useOffsetActions: vi.fn(() => ({
    calculateAdjustedRoomTotal: vi.fn(() => 100),
    handleSubtractClick: vi.fn(),
    handleShapeChange: vi.fn(),
    handleOffsetInputChange: vi.fn(),
    handleDeleteOffset: vi.fn(),
    handleAddOffset: vi.fn(),
    handleOffsetOk: vi.fn(),
  })),
}));

vi.mock('@/hooks/ptis/RoomSubmission/useRoomInitialization', () => ({
  useRoomInitialization: vi.fn(),
}));

// Mock components
vi.mock('@/components/modules/property-tax/ptis/QuickDataEntry/floorSubmission/RoomSubmission/components/RoomSubmissionHeader', () => ({
  RoomSubmissionHeader: ({ displayMode }: { displayMode: string }) => 
    displayMode === 'modal' ? <div data-testid="room-header">Header</div> : null,
}));

vi.mock('@/components/modules/property-tax/ptis/QuickDataEntry/floorSubmission/RoomSubmission/components/RoomSubmissionFooter', () => ({
  RoomSubmissionFooter: ({ onSave, onClose }: { onSave: () => void; onClose: () => void }) => (
    <div data-testid="room-footer">
      <button onClick={onSave}>Save</button>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

vi.mock('@/components/modules/property-tax/ptis/QuickDataEntry/floorSubmission/RoomSubmission/components/RoomSubmissionLayout', () => ({
  RoomSubmissionLayout: () => <div data-testid="room-layout">Layout</div>,
}));

vi.mock('@/components/modules/property-tax/ptis/QuickDataEntry/floorSubmission/OffSet', () => ({
  OffSetSidebar: () => <div data-testid="offset-sidebar">Offset Sidebar</div>,
}));

// Mock createPortal
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

describe('RoomWiseSubmission', () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    floorNumber: '1',
    maxRooms: 10,
    displayMode: 'modal' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly when open', () => {
    render(<RoomWiseSubmission {...mockProps} />);
    
    expect(screen.getByTestId('room-header')).toBeInTheDocument();
    expect(screen.getByTestId('room-layout')).toBeInTheDocument();
    expect(screen.getByTestId('room-footer')).toBeInTheDocument();
    expect(screen.getByTestId('offset-sidebar')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<RoomWiseSubmission {...mockProps} isOpen={false} />);
    
    expect(screen.queryByTestId('room-header')).not.toBeInTheDocument();
  });

  it('calls onClose when footer close is clicked', () => {
    render(<RoomWiseSubmission {...mockProps} />);
    
    fireEvent.click(screen.getByText('Close'));
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('renders in inline mode correctly', () => {
    render(<RoomWiseSubmission {...mockProps} displayMode="inline" />);
    
    expect(screen.queryByTestId('room-header')).not.toBeInTheDocument();
    // Portal check is implicit as we mocked createPortal to return node directly
  });
});
