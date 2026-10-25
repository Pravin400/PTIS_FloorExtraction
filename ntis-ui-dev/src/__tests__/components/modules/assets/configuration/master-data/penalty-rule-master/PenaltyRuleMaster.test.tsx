import { vi, describe, test, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PenaltyRuleMaster } from "@/components/modules/assets/configuration/master-data/penalty-rule-master/PenaltyRuleMaster";
import type { PenaltyRule as PenaltyRuleType } from "@/types/asset-masters/penalty-rule-master.types";

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
  usePathname: () => "/en/assets/configuration/master-data/penalty-rule-master",
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

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock("@/components/common", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/common")>();
  return {
    ...actual,
    useToast: () => ({
      success: mockToastSuccess,
      error: mockToastError,
    }),
  };
});

// Mock action
vi.mock("@/app/[locale]/assets/configuration/master-data/penalty-rule-master/action", () => ({
  deletePenaltyRuleAction: vi.fn(),
}));

// Mock useSearchNavigation
vi.mock("@/hooks/useSearchNavigation", () => ({
  useSearchNavigation: vi.fn(),
}));

describe("PenaltyRuleMaster List Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockData: PenaltyRuleType[] = [
    {
      id: 1,
      penaltyCode: "LATE_RENT",
      penaltyName: "Late Rent",
      calculationType: "Percentage",
      penaltyValue: 10,
      gracePeriodDays: 5,
      isActive: true,
    },
  ];

  test("renders master list table with correct headers and search placeholders", () => {
    render(
      <PenaltyRuleMaster
        data={mockData}
        pageNumber={1}
        pageSize={10}
        totalCount={1}
        totalPages={1}
        searchTerm=""
      />
    );

    expect(screen.getByText("penaltyRuleMaster.title")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("penaltyRuleMaster.searchPlaceholder")).toBeInTheDocument();
    expect(screen.getByText("LATE_RENT")).toBeInTheDocument();
    expect(screen.getByText("Late Rent")).toBeInTheDocument();
    expect(screen.getByText("10%")).toBeInTheDocument(); // Formatted percentage
    expect(screen.getByText("5")).toBeInTheDocument(); // Formatted grace period
  });

  test("triggers page redirect on Add Penalty Rule click", () => {
    render(
      <PenaltyRuleMaster
        data={mockData}
        pageNumber={1}
        pageSize={10}
        totalCount={1}
        totalPages={1}
      />
    );

    const addButton = screen.getByRole("button", { name: "penaltyRuleMaster.add" });
    fireEvent.click(addButton);

    expect(mockPush).toHaveBeenCalledWith("/en/assets/configuration/master-data/penalty-rule-master/add");
  });

  test("triggers confirmation dialog on Delete click and executes deletion successfully", async () => {
    const { deletePenaltyRuleAction } = await import("@/app/[locale]/assets/configuration/master-data/penalty-rule-master/action");
    vi.mocked(deletePenaltyRuleAction).mockResolvedValue({ success: true });

    render(
      <PenaltyRuleMaster
        data={mockData}
        pageNumber={1}
        pageSize={10}
        totalCount={1}
        totalPages={1}
      />
    );

    const deleteButton = screen.getByRole("button", { name: "penaltyRuleMaster.delete" });
    fireEvent.click(deleteButton);

    expect(mockConfirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(deletePenaltyRuleAction).toHaveBeenCalled();
      expect(mockToastSuccess).toHaveBeenCalledWith("penaltyRuleMaster.form.messages.deleteSuccess");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  test("triggers confirmation dialog on Delete click and displays error message from backend when deletion fails", async () => {
    const { deletePenaltyRuleAction } = await import("@/app/[locale]/assets/configuration/master-data/penalty-rule-master/action");
    const errorMessage = "Cannot delete Penalty Rule as it is linked to active lease agreements";
    vi.mocked(deletePenaltyRuleAction).mockResolvedValue({ success: false, message: errorMessage });

    render(
      <PenaltyRuleMaster
        data={mockData}
        pageNumber={1}
        pageSize={10}
        totalCount={1}
        totalPages={1}
      />
    );

    const deleteButton = screen.getByRole("button", { name: "penaltyRuleMaster.delete" });
    fireEvent.click(deleteButton);

    expect(mockConfirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(deletePenaltyRuleAction).toHaveBeenCalled();
      expect(mockToastError).toHaveBeenCalledWith(errorMessage);
      expect(mockRefresh).not.toHaveBeenCalled();
    });
  });

  test("triggers column sort when header sort buttons are clicked", () => {
    render(
      <PenaltyRuleMaster
        data={mockData}
        pageNumber={1}
        pageSize={10}
        totalCount={1}
        totalPages={1}
      />
    );

    const sortBtn = screen.getByRole("button", { name: /common.table.sort.by penaltyRuleMaster.penaltyCode/i });
    fireEvent.click(sortBtn);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("sortBy=penaltyCode")
    );
  });

  test("triggers page change when pagination numbers are clicked", () => {
    render(
      <PenaltyRuleMaster
        data={mockData}
        pageNumber={1}
        pageSize={10}
        totalCount={25}
        totalPages={3}
      />
    );

    const page2Button = screen.getByRole("button", { name: "Go to page 2" });
    fireEvent.click(page2Button);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("page=2")
    );
  });

  test("triggers page size change when rows per page selector is changed", () => {
    render(
      <PenaltyRuleMaster
        data={mockData}
        pageNumber={1}
        pageSize={10}
        totalCount={25}
        totalPages={3}
      />
    );

    const select = screen.getByRole("combobox", { name: /common.table.rowsPerPage/i });
    fireEvent.click(select);

    const option = screen.getByRole("option", { name: "20" });
    fireEvent.click(option);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("pageSize=20")
    );
  });
});
