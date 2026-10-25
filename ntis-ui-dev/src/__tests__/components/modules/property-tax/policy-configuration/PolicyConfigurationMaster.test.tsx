import { render, screen, fireEvent, act } from "@testing-library/react";
import { useRouter } from "next/navigation";
import type { PolicyConfiguration } from "@/types/policy-configuration.types";
import PolicyConfigurationMaster from "@/components/modules/property-tax/policy-configuration/PolicyConfigurationMaster";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(() => ({
    get: vi.fn(() => ""),
  })),
  redirect: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: vi.fn((ns?: string) => (key: string) => ns ? `${ns}.${key}` : key),
  useLocale: vi.fn(() => "en"),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const mockRouterPush = vi.fn();
const mockRouterRefresh = vi.fn();
vi.mocked(useRouter).mockImplementation(() => ({
  push: mockRouterPush,
  refresh: mockRouterRefresh,
  back: vi.fn(),
  forward: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
} as unknown as ReturnType<typeof useRouter>));

const defaultProps = {
  data: [
    {
      id: 1,
      policyCode: "PT_RATE_1",
      category: "TAX",
      displayName: "Policy Rate 1",
      description: "Description 1",
      dataType: "Number",
      policyValue: "15",
      defaultValue: "10",
      unit: "%",
      effectiveFrom: "2026-06-03T00:00:00Z",
      effectiveTo: null,
      isActive: true,
    },
    {
      id: 2,
      policyCode: "PT_RATE_2",
      category: "TAX",
      displayName: "Policy Rate 2",
      description: "Description 2",
      dataType: "Number",
      policyValue: "20",
      defaultValue: "10",
      unit: "%",
      effectiveFrom: "2026-06-03T00:00:00Z",
      effectiveTo: null,
      isActive: false,
    },
  ] as PolicyConfiguration[],
  pageNumber: 1,
  pageSize: 10,
  totalCount: 2,
  totalPages: 1,
  search: "",
};

describe("PolicyConfigurationMaster", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders table with data", () => {
    render(<PolicyConfigurationMaster {...defaultProps} />);
    expect(screen.getByText("policyConfiguration.list.title")).toBeInTheDocument();
    expect(screen.getByText("Policy Rate 1")).toBeInTheDocument();
    expect(screen.getByText("Policy Rate 2")).toBeInTheDocument();
  });

  it("navigates to edit page on edit click and does not render delete button", () => {
    render(<PolicyConfigurationMaster {...defaultProps} />);
    const editButtons = screen.getAllByRole("button", { name: "common.table.actions.edit" });
    fireEvent.click(editButtons[0]);
    expect(mockRouterPush).toHaveBeenCalledWith("/en/property-tax/policy-configuration/edit/1");
    expect(screen.queryByRole("button", { name: "common.table.actions.delete" })).not.toBeInTheDocument();
  });

  it("updates URL on search with debounced change", () => {
    vi.useFakeTimers();
    try {
      mockRouterPush.mockClear();
      render(<PolicyConfigurationMaster {...defaultProps} />);
      const searchInput = screen.getByPlaceholderText("policyConfiguration.list.filters.search");
      fireEvent.change(searchInput, { target: { value: "Rate 2" } });
      act(() => {
        vi.runAllTimers();
      });
      expect(mockRouterPush).toHaveBeenCalledWith(
        "/en/property-tax/policy-configuration?page=1&pageSize=10&search=Rate%202"
      );
    } finally {
      vi.useRealTimers();
    }
  });
});
