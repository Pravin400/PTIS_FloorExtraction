import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import BuildingwiseProperty from "@/components/modules/property-tax/automation-dashboard/ApprovalByULB/Building-wise-Property/BuildingwiseProperty";
import { PropertyWisePagination } from "@/types/automation-dashboard/approval-by-ulb/approval-by-ulb.type";

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
  usePathname: () => "/en/property-tax/automation-dashboard/approval-by-ulb/building-wise-property/123",
}));

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock AutomationTable component to simplify testing
vi.mock("@/components/common/AutomationTable", () => ({
  AutomationTable: ({ data }: { data: Array<{ propertyNo?: string }> }) => (
    <div data-testid="automation-table">
      {data.map((row, idx) => (
        <div key={idx} data-testid={`table-row-${idx}`}>
          {row.propertyNo}
        </div>
      ))}
    </div>
  ),
}));

describe("BuildingwiseProperty", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockServerData = {
    items: [
      {
        propertyNo: "PROP-01",
        ownerName: "Owner 1",
        builderName: "Builder 1",
        wingNo: "A",
        flatNo: "101",
        oldRecord: {},
        newRecord: {},
        propertyType: "Residential",
        totalDemand: 1000,
        clerkSign: 1,
        taxInspectorSign: 1,
        assistantCommissionerSign: 0,
        deputyCommissionerSign: 0,
        additionalCommissionerSign: 0,
        authoritySignatures: []
      }
    ],
    totalCount: 1,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 1,
    hasPrevious: false,
    hasNext: false,
  } as unknown as PropertyWisePagination;

  it("renders correctly with empty data", () => {
    render(<BuildingwiseProperty propertyNo="BLDG-1" serverData={null} />);
    expect(screen.getByRole("button", { name: /back/i })).toBeInTheDocument();
    expect(screen.queryByTestId("table-row-0")).not.toBeInTheDocument();
  });

  it("renders table with data correctly", () => {
    render(<BuildingwiseProperty propertyNo="BLDG-1" serverData={mockServerData} />);
    
    // Check if table rows are rendered
    expect(screen.getByTestId("table-row-0")).toHaveTextContent("PROP-01");
  });

  it("navigates back when back button is clicked", () => {
    render(<BuildingwiseProperty propertyNo="BLDG-1" serverData={null} />);
    
    const backButton = screen.getByRole("button", { name: /back/i });
    fireEvent.click(backButton);
    
    expect(mockPush).toHaveBeenCalledWith("/en/property-tax/automation-dashboard/approval-by-ulb");
  });
});
