import { vi, describe, test, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { UserDepartmentAllocationDrawer } from "@/components/modules/assets/configuration/master-data/user-department-allocation/UserDepartmentAllocationDrawer";
import * as actions from "@/app/[locale]/assets/configuration/master-data/user-department-allocation/action";
import type { AssetUserListItem } from "@/types/asset-masters/user-department-allocation.types";

vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string) => `${ns}.${key}`,
  useLocale: () => "en",
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/app/[locale]/assets/configuration/master-data/user-department-allocation/action", () => ({
  saveUserAllocationAction: vi.fn(),
  fetchUserAllocationsByIdAction: vi.fn(),
  fetchGrievanceWorkflowStagesAction: vi.fn(),
  fetchWardsByZoneAction: vi.fn().mockResolvedValue([]),
}));

const sampleUser: AssetUserListItem = {
  id: 1,
  userName: "test.user",
  firstName: "Test",
  lastName: "User",
  isActive: true,
  departments: [],
  roleAllocations: [],
  accessAllocations: [],
};

const sampleDepartments = [
  { id: 101, owningDepartmentName: "Health Department", isActive: true },
  { id: 102, owningDepartmentName: "Revenue Department", isActive: true },
];

const sampleZones = [
  { id: 201, zoneNo: "ZN-1", description: "Zone 1", isActive: true },
  { id: 202, zoneNo: "ZN-2", description: "Zone 2", isActive: true },
];

describe("UserDepartmentAllocationDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(actions.fetchUserAllocationsByIdAction).mockResolvedValue([]);
    vi.mocked(actions.saveUserAllocationAction).mockResolvedValue({ ok: true });
    vi.mocked(actions.fetchGrievanceWorkflowStagesAction).mockResolvedValue([]);
  });

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    user: sampleUser,
    owningDepartments: sampleDepartments,
    zones: sampleZones,
    t: (key: string) => key,
    onSuccess: vi.fn(),
  };

  test("renders Step 1 with departments list and mandatory status", () => {
    render(<UserDepartmentAllocationDrawer {...defaultProps} />);

    expect(screen.getByText("Health Department")).toBeDefined();
    expect(screen.getByText("Revenue Department")).toBeDefined();
  });

  test("shows validation error if Next button is clicked without selecting any department", () => {
    render(<UserDepartmentAllocationDrawer {...defaultProps} />);

    const nextButton = screen.getByText("drawer.next");
    fireEvent.click(nextButton);

    expect(screen.getByText("drawer.validationDepartmentRequired")).toBeDefined();
  });

  test("navigates to Step 2 when department is selected and Next button is clicked", () => {
    render(<UserDepartmentAllocationDrawer {...defaultProps} />);

    // Click on Health Department to select it
    const deptItem = screen.getByText("Health Department");
    fireEvent.click(deptItem);

    // Click Next
    const nextButton = screen.getByText("drawer.next");
    fireEvent.click(nextButton);

    // Should now see Zones in Step 2
    expect(screen.getByText("ZN-1")).toBeDefined();
    expect(screen.getByText("ZN-2")).toBeDefined();
  });

  test("submits allocation successfully and calls onSuccess and onClose", async () => {
    const onSuccessMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <UserDepartmentAllocationDrawer
        {...defaultProps}
        onSuccess={onSuccessMock}
        onClose={onCloseMock}
      />
    );

    // Select department
    fireEvent.click(screen.getByText("Health Department"));

    // Go to step 2
    fireEvent.click(screen.getByText("drawer.next"));

    // Select zone ZN-1
    fireEvent.click(screen.getByText("ZN-1"));

    // Go to step 3 (Grievance Stage Access)
    fireEvent.click(screen.getByText("drawer.nextToStages"));

    // Click Save button on the final step
    const saveButton = screen.getByText("drawer.save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(actions.saveUserAllocationAction).toHaveBeenCalledWith(
        1,
        [101],
        expect.any(Array),
        false,
        expect.any(Object),
        "WARD",
        expect.any(Array)
      );
      expect(onCloseMock).toHaveBeenCalled();
      expect(onSuccessMock).toHaveBeenCalled();
    });
  });

  test("renders user summary card with user details correctly", () => {
    const activeTestUser: AssetUserListItem = {
      ...sampleUser,
      id: 99,
      userName: "active.tester",
      userCode: "USR99",
      isActive: true,
    };

    render(
      <UserDepartmentAllocationDrawer
        {...defaultProps}
        user={activeTestUser}
      />
    );

    // Shows user details
    expect(screen.getByText("Test User")).toBeDefined();
    expect(screen.getByText(/USR99/)).toBeDefined();

    // Next button is present
    const nextButton = screen.getByText("drawer.next").closest("button");
    expect(nextButton).toBeDefined();
  });
});
