import { vi, describe, test, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OwningDepartmentMaster } from "@/components/modules/assets/configuration/master-data/owning-department/OwningDepartmentMaster";
import type { OwningDepartment } from "@/types/asset-masters/owning-department.types";

// Mock useToast from @/components/common
vi.mock("@/components/common", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/components/common")>();
  return {
    ...original,
    useToast: () => ({
      success: vi.fn(),
      error: vi.fn(),
    }),
  };
});

const mockConfirm = vi.fn().mockImplementation((options?: { onConfirm?: () => void }) => {
  if (options && typeof options.onConfirm === "function") {
    options.onConfirm();
  }
});
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
  }),
  usePathname: () => "/en/assets/configuration/master-data/owning-department",
  useSearchParams: () => ({
    get: () => null,
  }),
}));

// Mock useConfirm
vi.mock("@/components/common/ConfirmProvider", () => ({
  useConfirm: () => ({
    confirm: mockConfirm,
  }),
}));

// Mock action
vi.mock("@/app/[locale]/assets/configuration/master-data/owning-department/action", () => ({
  deleteOwningDepartmentAction: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock useSearchNavigation
vi.mock("@/hooks/useSearchNavigation", () => ({
  useSearchNavigation: vi.fn().mockReturnValue({
    searchTerm: "",
    handleSearchChange: vi.fn(),
    handlePageChange: vi.fn(),
    handlePageSizeChange: vi.fn(),
    handleSort: vi.fn(),
  }),
}));

describe("OwningDepartmentMaster Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockData: OwningDepartment[] = [
    {
      id: 1,
      owningDepartmentName: "General Admin",
      description: "Admin department",
      isActive: true,
      createdDate: null,
      updatedDate: null,
    },
  ];

  test("renders list table headers and data correctly", () => {
    render(
      <OwningDepartmentMaster
        data={mockData}
        pageNumber={1}
        pageSize={10}
        totalCount={1}
        totalPages={1}
        searchTerm=""
      />
    );

    expect(screen.getByText("owningDepartment.title")).toBeInTheDocument();
    expect(screen.getByText("General Admin")).toBeInTheDocument();
    expect(screen.getByText("Admin department")).toBeInTheDocument();
  });

  test("triggers page redirect on Add click", () => {
    render(
      <OwningDepartmentMaster
        data={mockData}
        pageNumber={1}
        pageSize={10}
        totalCount={1}
        totalPages={1}
      />
    );

    const addButton = screen.getByRole("button", { name: "owningDepartment.add" });
    fireEvent.click(addButton);

    expect(mockPush).toHaveBeenCalledWith("/en/assets/configuration/master-data/owning-department/add");
  });

  test("triggers confirmation dialog on Delete click and executes deletion", async () => {
    render(
      <OwningDepartmentMaster
        data={mockData}
        pageNumber={1}
        pageSize={10}
        totalCount={1}
        totalPages={1}
      />
    );

    const deleteButton = screen.getByRole("button", { name: "owningDepartment.delete" });
    fireEvent.click(deleteButton);

    expect(mockConfirm).toHaveBeenCalled();
    const { deleteOwningDepartmentAction } = await import("@/app/[locale]/assets/configuration/master-data/owning-department/action");
    expect(deleteOwningDepartmentAction).toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
  });
});
