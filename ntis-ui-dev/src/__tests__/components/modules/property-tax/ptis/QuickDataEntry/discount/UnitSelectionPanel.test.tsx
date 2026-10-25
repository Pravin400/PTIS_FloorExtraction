import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { UnitSelectionPanel } from '@/components/modules/property-tax/ptis/QuickDataEntry/discount/UnitSelectionPanel';
import type { useDiscountLevelState } from '@/hooks/useDiscountLevelState';
import type { PropertySocialDetailsDto } from '@/types/property-social-details.types';
import { toast } from 'sonner';

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock ConfirmProvider
const mockConfirm = vi.fn();
vi.mock('@/components/common/ConfirmProvider', () => ({
  useConfirm: () => ({
    confirm: mockConfirm,
  }),
}));

// Mock delete server action
const mockDeleteAction = vi.fn().mockResolvedValue({ success: true });
vi.mock('@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/Discount/discount-actions', () => ({
  deletePropertySocialDetailsByHierarchyAction: (...args: unknown[]) => mockDeleteAction(...args),
}));

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockSearchParams = new URLSearchParams('level=Unit&wingDetailId=10');
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  usePathname: () => '/en/property-tax/ptis/QuickDataEntry/123/Discount',
  useSearchParams: () => mockSearchParams,
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}));

describe('UnitSelectionPanel', () => {
  const mockTranslate = (key: string, values?: Record<string, unknown>) => {
    const translations: Record<string, string> = {
      'building.selectUnits': 'SELECT UNITS',
      'building.unit': 'Unit',
      'building.wing': 'Wing',
      'building.coverageStatus': 'Coverage Status',
      'building.statusAppliedDirect': 'Applied (Direct)',
      'building.statusWingCovered': 'Wing Covered',
      'building.statusApartmentCovered': 'Apartment Covered',
      'building.statusNotApplied': 'Not Applied',
      'building.unitAlreadyAppliedHint': 'This unit is already applied. Click the edit icon to modify its details.',
      'building.unitAlreadyAppliedTooltip': 'Unit is already applied. Click Edit icon to modify.',
      'building.currentlyEditingUnit': 'Currently editing this applied unit',
      'building.editing': 'Editing',
      'building.uploaded': 'Applied',
      'common.edit': 'Edit',
      'common.actions': 'Action',
      'building.editAppliedData': 'Edit Applied Data',
      'building.noUnitsSelectedTitle': 'No units selected',
      'building.noUnitsSelectedHint': 'Please click on one or more units in the table above to configure or attach their data.',
      'building.configuringForUnits': `Configuring Certificate for ${values?.count ?? 0} Units (${values?.units ?? ''})`,
      'building.editingAppliedUnit': `Editing applied details for unit (${values?.unit ?? ''})`,
      'building.cancelEdit': 'Cancel Edit',
      'building.allStatus': 'All Status',
      'building.appliedOnly': 'Applied (Direct)',
      'building.wingCoveredOnly': 'Wing Covered',
      'building.apartmentCoveredOnly': 'Apartment Covered',
      'building.notAppliedOnly': 'Not Applied',
      'building.selectAllAppliedForDeleteTooltip': 'Select all applied units for deletion',
      'building.selectUnitToDeleteTooltip': `Select unit ${values?.unit ?? ''} to delete applied data`,
      'building.unitNotAppliedDeleteTooltip': 'Unit is not applied (cannot delete)',
      'building.bulkDeleteSelected': `Delete Selected (${values?.count ?? 0})`,
      'building.confirmBulkDeleteTitle': 'Delete Applied Unit Data',
      'building.confirmBulkDeleteDesc': `Are you sure you want to delete applied data for ${values?.count ?? 0} selected unit(s)? This action cannot be undone.`,
      'building.deleteConfirmOk': 'Yes, Delete',
      'building.deleteConfirmCancel': 'Cancel',
      'building.bulkDeleteSuccess': 'Applied data deleted successfully for selected units.',
      'building.bulkDeleteError': 'Failed to delete applied data for selected units.',
      'building.clear': 'Clear',
      'building.filterAppliedTooltip': 'Filter applied units',
      'building.appliedSeparately': `${values?.count ?? 0} Applied Separately`,
    };
    return translations[key] || key;
  };

  const createMockLevelState = (overrides?: Partial<ReturnType<typeof useDiscountLevelState>>) => {
    const selectedUnitIds = new Set<number>();
    return {
      level: 'Unit' as const,
      setLevel: vi.fn(),
      selectedWingDetailId: 10,
      setSelectedWingDetailId: vi.fn(),
      unitSearchQuery: '',
      setUnitSearchQuery: vi.fn(),
      wingFilter: 'all',
      setWingFilter: vi.fn(),
      floorFilter: 'all',
      setFloorFilter: vi.fn(),
      useFilter: 'all',
      setUseFilter: vi.fn(),
      selectedUnitIds,
      setSelectedUnitIds: vi.fn((cb) => {
        if (typeof cb === 'function') {
          const next = cb(selectedUnitIds);
          selectedUnitIds.clear();
          next.forEach((id: number) => selectedUnitIds.add(id));
        }
      }),
      selectedUnitsCount: selectedUnitIds.size,
      wings: [{ wingDetailId: 10, wingName: 'Wing D' }],
      availableFloors: ['Floor 1'],
      availableUses: ['Residential'],
      filteredUnits: [
        {
          propertyDetailsId: 101,
          propertyId: 101,
          unitNo: 'D3',
          wingName: 'D',
          wingDetailId: 10,
          floorName: 'Floor 1',
          useName: 'Residential',
        },
        {
          propertyDetailsId: 102,
          propertyId: 102,
          unitNo: 'D4',
          wingName: 'D',
          wingDetailId: 10,
          floorName: 'Floor 1',
          useName: 'Residential',
        },
        {
          propertyDetailsId: 103,
          propertyId: 103,
          unitNo: 'D5',
          wingName: 'D',
          wingDetailId: 10,
          floorName: 'Floor 1',
          useName: 'Residential',
        },
      ],
      isAllUnitsSelected: false,
      toggleUnitSelection: vi.fn(),
      toggleAllUnits: vi.fn(),
      totalUnitsCount: 3,
      hasMoreUnits: false,
      isLoadingMoreUnits: false,
      loadNextUnitsPage: vi.fn(),
      ...overrides,
    } as unknown as ReturnType<typeof useDiscountLevelState>;
  };

  // Unit 102 (D4) is applied directly for attribute 45
  const mockSavedDetails: PropertySocialDetailsDto[] = [
    {
      id: 501,
      propertyId: 102,
      socialAttributeId: 45,
      entityType: 'P',
      bitValue: true,
      remark: 'D-wing D-4 UNIT',
      documentGuid: 'doc-guid-4',
    } as PropertySocialDetailsDto,
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('disables the assign checkbox for already applied units, while enabling delete checkbox for already applied units', () => {
    const levelState = createMockLevelState();
    render(
      <UnitSelectionPanel
        levelState={levelState}
        t={mockTranslate}
        savedPropertyDetails={mockSavedDetails}
        activeSelectedId={45}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    // Header checkboxes: 0 = Assign select all, 1 = Delete select all
    // Row D3: 2 = Assign checkbox, 3 = Delete checkbox
    // Row D4: 4 = Assign checkbox, 5 = Delete checkbox
    // Row D5: 6 = Assign checkbox, 7 = Delete checkbox

    const assignD3 = checkboxes[2];
    const deleteD3 = checkboxes[3];
    const assignD4 = checkboxes[4];
    const deleteD4 = checkboxes[5];
    const assignD5 = checkboxes[6];
    const deleteD5 = checkboxes[7];

    // D3 (unapplied): Assign is enabled, Delete is disabled
    expect(assignD3).not.toBeDisabled();
    expect(deleteD3).toBeDisabled();

    // D4 (applied): Assign is disabled, Delete is enabled
    expect(assignD4).toBeDisabled();
    expect(deleteD4).not.toBeDisabled();

    // D5 (unapplied): Assign is enabled, Delete is disabled
    expect(assignD5).not.toBeDisabled();
    expect(deleteD5).toBeDisabled();
  });

  it('prevents selecting already applied unit on row click and shows toast hint', () => {
    const levelState = createMockLevelState();
    render(
      <UnitSelectionPanel
        levelState={levelState}
        t={mockTranslate}
        savedPropertyDetails={mockSavedDetails}
        activeSelectedId={45}
      />
    );

    // Clicking row for D4 (applied)
    const rowD4 = screen.getByText('D4').closest('tr')!;
    fireEvent.click(rowD4);

    expect(levelState.toggleUnitSelection).not.toHaveBeenCalled();
    expect(toast.info).toHaveBeenCalledWith(
      'This unit is already applied. Click the edit icon to modify its details.'
    );

    // Clicking row for D3 (unapplied) calls toggleUnitSelection
    const rowD3 = screen.getByText('D3').closest('tr')!;
    fireEvent.click(rowD3);
    expect(levelState.toggleUnitSelection).toHaveBeenCalledWith(101);
  });

  it('allows editing an applied unit when user clicks the edit icon', () => {
    const levelState = createMockLevelState();
    const onEditUnit = vi.fn();
    const onUrlUpdate = vi.fn();

    render(
      <UnitSelectionPanel
        levelState={levelState}
        t={mockTranslate}
        savedPropertyDetails={mockSavedDetails}
        activeSelectedId={45}
        onEditUnit={onEditUnit}
        onUrlUpdate={onUrlUpdate}
      />
    );

    const editButtons = screen.getAllByTitle('Edit Applied Data');
    expect(editButtons.length).toBe(1); // Only D4 has Edit Applied Data title

    fireEvent.click(editButtons[0]);

    expect(levelState.setSelectedUnitIds).toHaveBeenCalled();
    expect(onEditUnit).toHaveBeenCalledWith(
      expect.objectContaining({ unitNo: 'D4', propertyId: 102 })
    );
    expect(onUrlUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        get: expect.any(Function),
      })
    );
  });

  it('selects only unapplied units when Select All header checkbox on the left is clicked', () => {
    const levelState = createMockLevelState();
    render(
      <UnitSelectionPanel
        levelState={levelState}
        t={mockTranslate}
        savedPropertyDetails={mockSavedDetails}
        activeSelectedId={45}
      />
    );

    const leftHeaderCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(leftHeaderCheckbox);

    // D3 (101) and D5 (103) should be selected, but D4 (102) should not be selected
    expect(levelState.setSelectedUnitIds).toHaveBeenCalled();
    const updater = (levelState.setSelectedUnitIds as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][0] as (prev: Set<number>) => Set<number>;
    const resultSet = updater(new Set());

    expect(resultSet.has(101)).toBe(true);
    expect(resultSet.has(102)).toBe(false); // D4 is skipped!
    expect(resultSet.has(103)).toBe(true);
  });

  it('selects applied units for bulk delete and shows bulk delete button', async () => {
    const levelState = createMockLevelState();
    render(
      <UnitSelectionPanel
        levelState={levelState}
        t={mockTranslate}
        savedPropertyDetails={mockSavedDetails}
        activeSelectedId={45}
        propertyId="123"
        societyDetailId={5}
        wingDetailId={10}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    // Checkbox 5 is D4 delete checkbox
    const deleteCheckboxD4 = checkboxes[5];
    expect(deleteCheckboxD4).not.toBeDisabled();

    // Check D4 for deletion
    fireEvent.click(deleteCheckboxD4);

    // Now the toolbar should display "Delete Selected (1)" button
    const deleteButton = screen.getByTitle('Delete applied data for selected units');
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).toHaveTextContent('Delete Selected (1)');

    // Click bulk delete button
    fireEvent.click(deleteButton);

    // Confirm dialog should be shown
    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Delete Applied Unit Data',
        variant: 'delete',
        onConfirm: expect.any(Function),
      })
    );

    // Execute the onConfirm callback
    const confirmOptions = mockConfirm.mock.calls[0][0] as { onConfirm: () => Promise<void> };
    await waitFor(async () => {
      await confirmOptions.onConfirm();
    });

    expect(mockDeleteAction).toHaveBeenCalledWith(
      {
        entityType: 'P',
        socialAttributeId: 45,
        societyDetailsId: 5,
        wingDetailId: 10,
        propertyIds: [102],
      },
      '123',
      'en'
    );
    expect(toast.success).toHaveBeenCalledWith('Applied data deleted successfully for selected units.');
  });

  it('selects all applied units when clicking the delete header checkbox', () => {
    const levelState = createMockLevelState();
    render(
      <UnitSelectionPanel
        levelState={levelState}
        t={mockTranslate}
        savedPropertyDetails={mockSavedDetails}
        activeSelectedId={45}
      />
    );

    // Header checkbox 1 is the delete select-all checkbox
    const deleteHeaderCheckbox = screen.getAllByRole('checkbox')[1];
    expect(deleteHeaderCheckbox).not.toBeDisabled();

    fireEvent.click(deleteHeaderCheckbox);

    // Delete button should appear with count 1 (D4)
    const deleteButton = screen.getByTitle('Delete applied data for selected units');
    expect(deleteButton).toHaveTextContent('Delete Selected (1)');
  });

  it('renders Applied (Direct) coverage status badge for unit with direct applied details', () => {
    const levelState = createMockLevelState();
    render(
      <UnitSelectionPanel
        levelState={levelState}
        t={mockTranslate}
        savedPropertyDetails={mockSavedDetails}
        activeSelectedId={45}
      />
    );

    // Row D4 should show Applied (Direct) badge
    expect(screen.getByText('Applied (Direct)')).toBeInTheDocument();
  });

  it('filters table to only show applied units when Applied (Direct) quick filter is clicked', () => {
    const levelState = createMockLevelState();
    render(
      <UnitSelectionPanel
        levelState={levelState}
        t={mockTranslate}
        savedPropertyDetails={mockSavedDetails}
        activeSelectedId={45}
      />
    );

    // Initially all 3 units (D3, D4, D5) are in the table
    expect(screen.getByText('D3')).toBeInTheDocument();
    expect(screen.getByText('D4')).toBeInTheDocument();
    expect(screen.getByText('D5')).toBeInTheDocument();

    // Click the "1 Applied Separately" quick filter button
    const quickFilterBtn = screen.getByTitle('Filter applied units');
    fireEvent.click(quickFilterBtn);

    // After clicking filter, only D4 should remain visible
    expect(screen.getByText('D4')).toBeInTheDocument();
    expect(screen.queryByText('D3')).not.toBeInTheDocument();
    expect(screen.queryByText('D5')).not.toBeInTheDocument();
  });
});
