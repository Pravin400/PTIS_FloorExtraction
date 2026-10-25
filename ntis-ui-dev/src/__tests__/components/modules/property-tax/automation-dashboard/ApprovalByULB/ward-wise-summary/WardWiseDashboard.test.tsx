import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import WardWiseDashboard from "@/components/modules/property-tax/automation-dashboard/ApprovalByULB/ward-wise-summary/WardWiseDashboard";
import { ApprovalByUlbItems } from "@/types/automation-dashboard/approval-by-ulb/approval-by-ulb.type";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/mock-path",
}));

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

// Mock AutomationTable component to simplify testing
vi.mock("@/components/common/AutomationTable", () => ({
  AutomationTable: ({ data }: { data: Array<{ zoneName?: string; wardName?: string }> }) => (
    <div data-testid="automation-table">
      {data.map((row, idx) => (
        <div key={idx} data-testid={`table-row-${idx}`}>
          {row.zoneName || row.wardName}
        </div>
      ))}
    </div>
  ),
}));

describe("WardWiseDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockServerData: ApprovalByUlbItems = {
    zoneData: [
      {
        zoneId: 1,
        zoneNo: "1",
        zoneName: "Zone 1",
        wardId: 10,
        wardName: "Ward 10",
        totalStructure: 100,
        totalUnit: 50,
        classifications: [],
      },
    ],
    totalRow: {
      zoneId: null,
      zoneNo: "Total",
      zoneName: "total",
      wardId: null,
      wardName: null,
      totalStructure: 100,
      totalUnit: 50,
      classifications: [],
    },
    grandTotalRow: null,
  };

  it("renders correctly with empty data", () => {
    render(<WardWiseDashboard zoneId="1" serverData={null} />);
    expect(screen.getByText("backToDivisions")).toBeInTheDocument();
    expect(screen.queryByTestId("table-row-0")).not.toBeInTheDocument();
  });

  it("renders table with data and total row correctly", () => {
    render(<WardWiseDashboard zoneId="1" serverData={mockServerData} />);
    
    expect(screen.getByText("Approval by ULB - Ward-wise (1 - Zone 1)")).toBeInTheDocument();
    
    // Check if table rows are rendered
    expect(screen.getByTestId("table-row-0")).toHaveTextContent("Zone 1");
    
    // Check if total row is rendered
    expect(screen.getByTestId("table-row-1")).toHaveTextContent("total");
  });

  it("navigates back when back button is clicked", () => {
    render(<WardWiseDashboard zoneId="1" serverData={mockServerData} />);
    
    const backButton = screen.getByText("backToDivisions");
    fireEvent.click(backButton);
    
    expect(mockPush).toHaveBeenCalledWith("/en/property-tax/automation-dashboard/approval-by-ulb");
  });
});
