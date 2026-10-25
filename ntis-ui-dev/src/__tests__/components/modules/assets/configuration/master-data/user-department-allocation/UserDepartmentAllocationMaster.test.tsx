import { vi, describe, test, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UserDepartmentAllocationMaster } from "@/components/modules/assets/configuration/master-data/user-department-allocation/UserDepartmentAllocationMaster";
import type { AssetUserListItem } from "@/types/asset-masters/user-department-allocation.types";

const mockPush = vi.fn();
const mockRefresh = vi.fn();

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string) => `${ns}.${key}`,
  useLocale: () => "en",
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    prefetch: vi.fn(),
  }),
  usePathname: () => "/en/assets/configuration/master-data/user-department-allocation",
  useSearchParams: () => ({
    get: (key: string) => (key === "q" ? "" : null),
    toString: () => "",
  }),
}));

vi.mock("@/hooks/useDebounce", () => ({
  useDebounce: (val: string) => val,
}));

const sampleUsers: AssetUserListItem[] = [
  {
    id: 1,
    userName: "awais.beldar",
    firstName: "Awais",
    lastName: "Beldar",
    userCode: "USR001",
    email: "awais@example.com",
    mobileNo: "9876543210",
    isActive: true,
    departments: [
      { id: 1, userId: 1, departmentId: 10, departmentName: "Property Tax", isActive: true },
    ],
    roleAllocations: [
      { id: 1, userId: 1, departmentId: 10, userRoleId: 2, departmentName: "Property Tax", userRoleName: "Manager", isActive: true },
    ],
    owningDepartments: [
      { id: 1, userId: 1, owningDepartmentId: 10, owningDepartmentName: "Property Tax", isActive: true },
    ],
    zoneAllocations: [
      { id: 101, userId: 1, zoneId: 5, zoneNo: "ZN-01", zoneDescription: "Central Zone", isActive: true },
    ],
    stageAccess: [],
    accessAllocations: [],
  },
  {
    id: 2,
    userName: "john.doe",
    firstName: "John",
    lastName: "Doe",
    userCode: "USR002",
    email: "john@example.com",
    mobileNo: "9123456789",
    isActive: true,
    departments: [],
    roleAllocations: [],
    accessAllocations: [],
  },
];

describe("UserDepartmentAllocationMaster", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    data: sampleUsers,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 2,
    totalPages: 1,
    owningDepartments: [
      { id: 10, departmentName: "Property Tax", owningDepartmentName: "Property Tax", isActive: true },
    ],
    zones: [
      { id: 5, zoneNo: "ZN-01", description: "Central Zone", isActive: true },
    ],
  };

  test("renders the table with user rows and action buttons (Update for allocated, Allocate for unallocated)", () => {
    render(<UserDepartmentAllocationMaster {...defaultProps} />);

    expect(screen.getByText("awais.beldar")).toBeDefined();
    expect(screen.getByText("john.doe")).toBeDefined();
    // awais.beldar has allocation -> Update button
    expect(screen.getByTitle(/userDepartmentAllocation.updateButton - awais.beldar/i)).toBeDefined();
    // john.doe has no allocation -> Allocate button
    expect(screen.getByTitle(/userDepartmentAllocation.allocateButton - john.doe/i)).toBeDefined();
  });

  test("handles search input typing and triggers router.push", () => {
    render(<UserDepartmentAllocationMaster {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("userDepartmentAllocation.searchPlaceholder");
    expect(searchInput).toBeDefined();

    // Type in search input
    fireEvent.change(searchInput, { target: { value: "awais" } });
    expect((searchInput as HTMLInputElement).value).toBe("awais");

    // Check router.push was triggered with ?page=1&pageSize=10&q=awais
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("q=awais")
    );
  });

  test("navigates to dedicated edit/[id] route on clicking allocate or update button", () => {
    render(<UserDepartmentAllocationMaster {...defaultProps} />);

    const updateButton = screen.getByTitle(/userDepartmentAllocation.updateButton - awais.beldar/i);
    fireEvent.click(updateButton);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("/assets/configuration/master-data/user-department-allocation/edit/1")
    );
  });

  test("navigates to edit route when allocate button is clicked for unallocated user", () => {
    render(<UserDepartmentAllocationMaster {...defaultProps} />);

    const allocateButton = screen.getByTitle(/userDepartmentAllocation.allocateButton - john.doe/i);
    fireEvent.click(allocateButton);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("/assets/configuration/master-data/user-department-allocation/edit/2")
    );
  });
});
