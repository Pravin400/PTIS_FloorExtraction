import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useUserDepartmentAllocationDrawer } from "@/hooks/asset-masters/user-department-allocation/useUserDepartmentAllocationDrawer";
import type {
  AssetUserListItem,
  OwningDepartmentOption,
  ZoneOption,
} from "@/types/asset-masters/user-department-allocation.types";

const mockSaveUserAllocationAction = vi.fn();
const mockFetchUserAllocationsByIdAction = vi.fn();
const mockFetchGrievanceWorkflowStagesAction = vi.fn();
const mockFetchWardsByZoneAction = vi.fn().mockResolvedValue([]);

vi.mock(
  "@/app/[locale]/assets/configuration/master-data/user-department-allocation/action",
  () => ({
    saveUserAllocationAction: (...args: unknown[]) =>
      mockSaveUserAllocationAction(...args),
    fetchUserAllocationsByIdAction: (...args: unknown[]) =>
      mockFetchUserAllocationsByIdAction(...args),
    fetchGrievanceWorkflowStagesAction: (...args: unknown[]) =>
      mockFetchGrievanceWorkflowStagesAction(...args),
    fetchWardsByZoneAction: (...args: unknown[]) =>
      mockFetchWardsByZoneAction(...args),
  })
);

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useUserDepartmentAllocationDrawer", () => {
  const sampleUser: AssetUserListItem = {
    id: 10,
    userName: "alex",
    firstName: "Alex",
    lastName: "Smith",
    email: "alex@example.com",
    isActive: true,
    departments: [],
    roleAllocations: [],
    owningDepartments: [
      {
        id: 1,
        userId: 10,
        owningDepartmentId: 101,
        owningDepartmentName: "Health",
        isActive: true,
      },
    ],
    zoneAllocations: [
      {
        id: 1,
        userId: 10,
        zoneId: 201,
        zoneNo: "ZN-1",
        isActive: true,
      },
    ],
    stageAccess: [],
    accessAllocations: [],
  };

  const sampleDepts: OwningDepartmentOption[] = [
    { id: 101, owningDepartmentName: "Health Department", isActive: true },
    { id: 102, owningDepartmentName: "Water Works", isActive: true },
  ];

  const sampleZones: ZoneOption[] = [
    { id: 201, zoneNo: "ZN-1", description: "North Zone", isActive: true },
    { id: 202, zoneNo: "ZN-2", description: "South Zone", isActive: true },
  ];

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    user: sampleUser,
    owningDepartments: sampleDepts,
    zones: sampleZones,
    t: (key: string) => key,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchUserAllocationsByIdAction.mockResolvedValue([]);
    mockSaveUserAllocationAction.mockResolvedValue({ ok: true });
    mockFetchGrievanceWorkflowStagesAction.mockResolvedValue([
      { id: 1, stageCode: "STG_DOC_VERIFY", stageName: "Document Verification", isActive: true },
      { id: 2, stageCode: "STG_RESOLVE", stageName: "Resolution", isActive: true },
    ]);
  });

  it("initializes with user's existing allocations and step 1", () => {
    const { result } = renderHook(() =>
      useUserDepartmentAllocationDrawer(defaultProps)
    );

    expect(result.current.currentStep).toBe(1);
    expect(result.current.selectedDeptIds).toContain(101);
    expect(result.current.selectedZoneIds).toContain(201);
    expect(result.current.isUpdateMode).toBe(true);
  });

  it("handles department toggles, select all, and clear all", () => {
    const { result } = renderHook(() =>
      useUserDepartmentAllocationDrawer(defaultProps)
    );

    // Toggle off 101
    act(() => {
      result.current.toggleDept(101);
    });
    expect(result.current.selectedDeptIds).not.toContain(101);

    // Select all departments
    act(() => {
      result.current.selectAllDepts();
    });
    expect(result.current.selectedDeptIds).toEqual([101, 102]);

    // Clear all departments
    act(() => {
      result.current.clearAllDepts();
    });
    expect(result.current.selectedDeptIds).toEqual([]);
  });

  it("validates that at least one department is selected before proceeding to step 2", () => {
    const { result } = renderHook(() =>
      useUserDepartmentAllocationDrawer(defaultProps)
    );

    act(() => {
      result.current.clearAllDepts();
    });

    act(() => {
      result.current.handleProceedToZones();
    });

    expect(result.current.currentStep).toBe(1);
    expect(result.current.stepError).toBe("drawer.validationDepartmentRequired");
  });

  it("proceeds to step 2 when department is selected and steps back", () => {
    const { result } = renderHook(() =>
      useUserDepartmentAllocationDrawer(defaultProps)
    );

    act(() => {
      result.current.handleProceedToZones();
    });

    expect(result.current.currentStep).toBe(2);

    act(() => {
      result.current.handleBackToDepartments();
    });

    expect(result.current.currentStep).toBe(1);
  });

  it("calls save action with selected allocations", async () => {
    const mockOnClose = vi.fn();
    const mockOnSuccess = vi.fn();

    const { result } = renderHook(() =>
      useUserDepartmentAllocationDrawer({
        ...defaultProps,
        onClose: mockOnClose,
        onSuccess: mockOnSuccess,
      })
    );

    await act(async () => {
      await result.current.handleSave();
    });

    expect(mockSaveUserAllocationAction).toHaveBeenCalledWith(
      10,
      [101],
      expect.any(Array),
      true,
      expect.any(Object),
      "WARD",
      expect.any(Array)
    );
    expect(mockOnSuccess).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("navigates to step 3 and manages grievance stage selections", () => {
    const { result } = renderHook(() =>
      useUserDepartmentAllocationDrawer(defaultProps)
    );

    // Step 1 -> Step 2
    act(() => {
      result.current.handleProceedToZones();
    });
    expect(result.current.currentStep).toBe(2);

    // Step 2 -> Step 3
    act(() => {
      result.current.handleProceedToStages();
    });
    expect(result.current.currentStep).toBe(3);

    // Toggle stage 1
    act(() => {
      result.current.toggleStage(1);
    });
    expect(result.current.selectedStageIds).toContain(1);

    // Clear all stages
    act(() => {
      result.current.clearAllStages();
    });
    expect(result.current.selectedStageIds).toEqual([]);

    // Step back to zones
    act(() => {
      result.current.handleBackToZones();
    });
    expect(result.current.currentStep).toBe(2);
  });

  it("supports switching to Ward-wise mode and selecting specific ward", async () => {
    const { result } = renderHook(() =>
      useUserDepartmentAllocationDrawer(defaultProps)
    );

    expect(result.current.allocationMode).toBe("WARD");

    act(() => {
      result.current.handleSelectZoneWard(201, 555);
    });

    expect(result.current.selectedZoneWards[201]).toEqual([555]);
  });

  it("supports selecting multiple wards and preserving selections when switching zones in dropdown", () => {
    const { result } = renderHook(() =>
      useUserDepartmentAllocationDrawer(defaultProps)
    );

    act(() => {
      result.current.setAllocationMode("WARD");
      result.current.toggleWardSelection(201, 10);
      result.current.toggleWardSelection(201, 11);
    });

    expect(result.current.selectedZoneWards[201]).toEqual([10, 11]);

    // Switch to zone 202 in dropdown and select ward 20
    act(() => {
      result.current.setActiveWardZoneId(202);
      result.current.toggleWardSelection(202, 20);
    });

    // Check that zone 201 selections remain PRESERVED while zone 202 also has selections!
    expect(result.current.selectedZoneWards[201]).toEqual([10, 11]);
    expect(result.current.selectedZoneWards[202]).toEqual([20]);
    expect(result.current.totalSelectedWardsCount).toBe(3);
    expect(result.current.configuredZoneCount).toBe(2);
  });
});
