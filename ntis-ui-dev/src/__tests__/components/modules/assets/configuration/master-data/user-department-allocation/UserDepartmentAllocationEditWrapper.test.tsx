import { vi, describe, test, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { UserDepartmentAllocationEditWrapper } from "@/components/modules/assets/configuration/master-data/user-department-allocation/UserDepartmentAllocationEditWrapper";
import type { AssetUserListItem } from "@/types/asset-masters/user-department-allocation.types";

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string) => `${ns}.${key}`,
  useLocale: () => "en",
}));

vi.mock("@/components/common", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@/components/common");
  return {
    ...actual,
    LoadingPage: () => <div data-testid="nextjs-loading-page">NextJsLoadingPage</div>,
  };
});

vi.mock("@/app/[locale]/assets/configuration/master-data/user-department-allocation/action", () => ({
  fetchUserAllocationsByIdAction: vi.fn().mockResolvedValue([]),
  saveUserAllocationAction: vi.fn().mockResolvedValue({ ok: true }),
  fetchGrievanceWorkflowStagesAction: vi.fn().mockResolvedValue([]),
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

describe("UserDepartmentAllocationEditWrapper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    user: sampleUser,
    owningDepartments: [
      { id: 10, owningDepartmentName: "Health Department", isActive: true },
    ],
    zones: [
      { id: 20, zoneNo: "ZN-01", isActive: true },
    ],
  };

  test("renders the allocation drawer initially", () => {
    render(<UserDepartmentAllocationEditWrapper {...defaultProps} />);

    expect(screen.getByText("Health Department")).toBeDefined();
  });

  test("navigates back to master list when Cancel button is clicked", () => {
    vi.useFakeTimers();
    render(<UserDepartmentAllocationEditWrapper {...defaultProps} />);

    const cancelButton = screen.getByText("userDepartmentAllocation.drawer.cancel");
    fireEvent.click(cancelButton);

    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("/assets/configuration/master-data/user-department-allocation")
    );
    vi.useRealTimers();
  });
});
