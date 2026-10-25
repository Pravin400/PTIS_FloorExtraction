import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PendingStructuresWardWise from "@/components/modules/property-tax/automation-dashboard/ApprovalByULB/PendingStructuresDashboard/PendingStructuresWardWise";
import { BuildingWisePagination } from "@/types/automation-dashboard/approval-by-ulb/approval-by-ulb.type";

// Mock next/navigation
const mockPush = vi.fn();
const mockBack = vi.fn();
const mockSearchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/en/property-tax/automation-dashboard/approval-by-ulb/pending-structures-ward-wise/1",
}));

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock AutomationTable component to simplify testing
vi.mock("@/components/common/AutomationTable", () => ({
  AutomationTable: ({ data }: { data: Array<{ buildingNo?: string }> }) => (
    <div data-testid="automation-table">
      {data.map((row, idx) => (
        <div key={idx} data-testid={`table-row-${idx}`}>
          {row.buildingNo}
        </div>
      ))}
    </div>
  ),
}));

describe("PendingStructuresWardWise", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockServerData = {
    items: [
      {
        buildingNo: "Bldg-01",
        noticeNo: "Notice-01",
        units: 10,
        totalDemand: 5000,
        authoritySignatures: [],
      },
    ],
    totalCount: 1,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 1,
    hasPrevious: false,
    hasNext: false,
    totalRow: {
      buildingNo: "Total",
      noticeNo: "",
      units: 10,
      totalDemand: 5000,
      demand: 5000,
      authoritySignatures: [],
    }
  } as unknown as BuildingWisePagination;

  it("renders correctly with empty data", () => {
    render(<PendingStructuresWardWise wardId="1" serverData={null} />);
    expect(screen.getByPlaceholderText("searchPlaceholder")).toBeInTheDocument();
    expect(screen.queryByTestId("table-row-0")).not.toBeInTheDocument();
  });

  it("renders table with data and total row correctly", () => {
    render(<PendingStructuresWardWise wardId="1" serverData={mockServerData} />);
    
    // Check if table rows are rendered
    expect(screen.getByTestId("table-row-0")).toHaveTextContent("Bldg-01");
    
    // Check if total row is rendered
    expect(screen.getByTestId("table-row-1")).toHaveTextContent("Total");
  });

  it("navigates back when back button is clicked", () => {
    // Override search params temporarily by mutating our mock
    mockSearchParams.set("returnUrl", "/en/property-tax");
    
    render(<PendingStructuresWardWise wardId="1" serverData={null} />);
    
    const backButton = screen.getByRole("button", { name: /backToWardWise/i });
    fireEvent.click(backButton);
    
    expect(mockPush).toHaveBeenCalledWith("/en/property-tax");
    mockSearchParams.delete("returnUrl");
  });
});
