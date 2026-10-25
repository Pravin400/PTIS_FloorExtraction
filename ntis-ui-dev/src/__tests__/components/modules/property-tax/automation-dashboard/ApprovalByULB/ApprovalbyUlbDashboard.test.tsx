import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ApprovalbyUlbDashboard from "@/components/modules/property-tax/automation-dashboard/ApprovalByULB/ApprovalbyUlbDashboard";
import { ApprovalByUlbItems } from "@/types/automation-dashboard/approval-by-ulb/approval-by-ulb.type";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

// Mock AutomationTable component to simplify testing
vi.mock("@/components/common/AutomationTable", () => ({
  AutomationTable: ({ data, headerExtra }: { data: Array<{ zoneName?: string }>, headerExtra?: React.ReactNode }) => (
    <div data-testid="automation-table">
      {headerExtra && <div data-testid="header-extra">{headerExtra}</div>}
      {data.map((row, idx) => (
        <div key={idx} data-testid={`table-row-${idx}`}>
          {row.zoneName}
        </div>
      ))}
    </div>
  ),
}));

describe("ApprovalbyUlbDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockServerData: ApprovalByUlbItems = {
    zoneData: [
      {
        zoneId: 1,
        zoneNo: "1",
        zoneName: "Zone 1",
        wardId: null,
        wardName: null,
        totalStructure: 100,
        totalUnit: 50,
        classifications: [],
      },
      {
        zoneId: 2,
        zoneNo: "2",
        zoneName: "Zone 2",
        wardId: null,
        wardName: null,
        totalStructure: 200,
        totalUnit: 100,
        classifications: [],
      },
    ],
    totalRow: {
      zoneId: null,
      zoneNo: "Total",
      zoneName: "total",
      wardId: null,
      wardName: null,
      totalStructure: 300,
      totalUnit: 150,
      classifications: [],
    },
    grandTotalRow: null,
  };

  it("renders correctly with empty data", () => {
    render(<ApprovalbyUlbDashboard serverData={null} />);
    expect(screen.getByText("updatePending")).toBeInTheDocument();
    expect(screen.queryByTestId("table-row-0")).not.toBeInTheDocument();
  });

  it("renders table with data and total row correctly", () => {
    render(<ApprovalbyUlbDashboard serverData={mockServerData} />);
    
    // Check if table rows are rendered
    expect(screen.getByTestId("table-row-0")).toHaveTextContent("Zone 1");
    expect(screen.getByTestId("table-row-1")).toHaveTextContent("Zone 2");
    
    // Check if total row is rendered
    expect(screen.getByTestId("table-row-2")).toHaveTextContent("total");
  });
});
