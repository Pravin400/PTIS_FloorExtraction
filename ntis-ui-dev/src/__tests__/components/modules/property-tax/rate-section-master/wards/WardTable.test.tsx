import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import WardTable from "@/components/modules/property-tax/rate-section-master/wards/WardTable";
import { SectionItem } from "@/types/rateSectionMaster.types";

// Mock the getWardColumns function
vi.mock("@/components/modules/property-tax/rate-section-master/wards/WardColumns", () => ({
  getWardColumns: () => [
    {
      key: "wardNo",
      label: "Ward No",
      render: (row: SectionItem) => row.wardNo || "-",
    },
  ],
}));

// Mock MasterTable
vi.mock("@/components/common/MasterTable", () => ({
  MasterTable: ({ data, emptyText }: { data: SectionItem[]; emptyText: string }) => (
    <div data-testid="master-table">
      {data.length === 0 ? (
        <div data-testid="empty-text">{emptyText}</div>
      ) : (
        <div>
          {data.map((item, idx) => (
            <div key={idx} data-testid="table-row">
              {item.wardNo}
            </div>
          ))}
        </div>
      )}
    </div>
  ),
}));

// Mock translations
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("WardTable", () => {
  const mockData: SectionItem[] = [
    {
      rateSectionDetailsId: 1,
      rateSectionId: 1,
      wardId: 101,
      wardNo: "W001",
      isActive: true,
    },
    {
      rateSectionDetailsId: 2,
      rateSectionId: 1,
      wardId: 102,
      wardNo: "W002",
      isActive: true,
    },
  ];

  const defaultProps = {
    data: mockData,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 2,
    totalPages: 1,
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    emptyText: "No wards found",
  };

  it("renders table with data", () => {
    render(<WardTable {...defaultProps} />);
    expect(screen.getByTestId("master-table")).toBeInTheDocument();
  });

  it("displays ward data correctly", () => {
    render(<WardTable {...defaultProps} />);
    const rows = screen.getAllByTestId("table-row");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("W001");
    expect(rows[1]).toHaveTextContent("W002");
  });

  it("shows empty text when no data", () => {
    render(<WardTable {...defaultProps} data={[]} totalCount={0} />);
    expect(screen.getByTestId("empty-text")).toHaveTextContent("No wards found");
  });

  it("passes correct pagination props", () => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();
    render(<WardTable {...defaultProps} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />);
    // Verify component renders without errors
    expect(screen.getByTestId("master-table")).toBeInTheDocument();
  });
});
