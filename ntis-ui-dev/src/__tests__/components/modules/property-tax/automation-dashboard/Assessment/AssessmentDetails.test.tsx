import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import AssessmentDetails from "@/components/modules/property-tax/automation-dashboard/Assessment/AssessmentDetails";
import { AssessmentGridItems } from "@/types/automation-dashboard/assessment/assessmentgrid.type";

// Mock next/navigation
const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/en/property-tax/automation-dashboard/assessment",
}));

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

// Mock AutomationTable component to simplify testing
vi.mock("@/components/common/AutomationTable", () => ({
  AutomationTable: ({ data, headerExtra }: { data: Array<{ zoneName?: string }>; headerExtra?: ReactNode }) => (
    <div data-testid="automation-table">
      {headerExtra}
      {data.map((row, idx) => (
        <div key={idx} data-testid={`table-row-${idx}`}>
          {row.zoneName}
        </div>
      ))}
    </div>
  ),
}));

describe("AssessmentDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockServerData: AssessmentGridItems = {
    zoneData: [
      {
        zoneId: 1,
        zoneName: "Zone 1",
        zoneNo: "Z1",
        totalStructure: 100,
        totalUnit: 50,
        classifications: [
          {
            type: "Residential",
            structure: 100,
            unit: 50,
            oldDemand: 0,
            currentDemand: 0,
            retroDemand: 0,
            totalDemand: 0,
            additionalRevenueGenerated: 0,
          },
        ],
      },
    ],
    totalRow: {
      zoneId: null,
      zoneName: "total",
      zoneNo: "Total",
      totalStructure: 100,
      totalUnit: 50,
      classifications: [
        {
          type: "Total",
          structure: 100,
          unit: 50,
          oldDemand: 0,
          currentDemand: 0,
          retroDemand: 0,
          totalDemand: 0,
          additionalRevenueGenerated: 0,
        },
      ],
    },
    grandTotalRow: {
      zoneId: null,
      zoneName: "grandTotal",
      zoneNo: "Grand Total",
      totalStructure: 100,
      totalUnit: 50,
      classifications: [
        {
          type: "Grand Total",
          structure: 100,
          unit: 50,
          oldDemand: 0,
          currentDemand: 0,
          retroDemand: 0,
          totalDemand: 0,
          additionalRevenueGenerated: 0,
        },
      ],
    },
  };

  it("renders correctly with empty data", () => {
    render(<AssessmentDetails serverData={null} />);
    expect(screen.getByText("tabs.total")).toBeInTheDocument();
    expect(screen.getByText("tabs.assessed")).toBeInTheDocument();
    expect(screen.queryByTestId("table-row-0")).not.toBeInTheDocument();
  });

  it("renders table with data correctly", () => {
    render(<AssessmentDetails serverData={mockServerData} />);
    
    // Check if table rows are rendered
    expect(screen.getByTestId("table-row-0")).toHaveTextContent("Zone 1");
    // Check if total row is rendered
    expect(screen.getByTestId("table-row-1")).toHaveTextContent("total");
  });

  it("updates query params when tab changes", () => {
    render(<AssessmentDetails serverData={null} />);
    
    const unassessedTab = screen.getByText("tabs.unassessed");
    fireEvent.click(unassessedTab);
    
    expect(mockPush).toHaveBeenCalledWith("/en/property-tax/automation-dashboard/assessment?tab=Unassessed&type=Unassessed", { scroll: false });
  });
});
