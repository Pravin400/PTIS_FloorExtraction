import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AvailableWards from "@/components/modules/property-tax/rate-section-master/wards/AvailableWards";
import { RateSectionWardItem } from "@/types/rateSectionMaster.types";

// Mock translations
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock common components
vi.mock("@/components/common", () => ({
  SearchInput: ({ value, onChange }: { value: string; onChange: (val: string) => void }) => (
    <input data-testid="search-input" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
  Checkbox: ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: () => void }) => (
    <input
      type="checkbox"
      data-testid="checkbox"
      checked={checked}
      onChange={onCheckedChange}
    />
  ),
  Select: ({ value, onChange }: { value: string; onChange: (val: string) => void }) => (
    <select data-testid="page-size-select" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="5">5</option>
      <option value="10">10</option>
    </select>
  ),
}));

vi.mock("@/components/common/ActionButtons", () => ({
  PrevPageButton: ({ onClick, disabled }: { onClick: () => void; disabled: boolean }) => (
    <button data-testid="prev-button" onClick={onClick} disabled={disabled}>
      Prev
    </button>
  ),
  NextPageButton: ({ onClick, disabled }: { onClick: () => void; disabled: boolean }) => (
    <button data-testid="next-button" onClick={onClick} disabled={disabled}>
      Next
    </button>
  ),
}));

vi.mock("@/components/common/label", () => ({
  Label: ({ children, className }: { children: React.ReactNode; className: string }) => (
    <label className={className}>{children}</label>
  ),
}));

describe("AvailableWards", () => {
  const mockWards: RateSectionWardItem[] = [
    { id: "1", wardNo: "W001", name: "Ward 1" },
    { id: "2", wardNo: "W002", name: "Ward 2" },
  ];

  const defaultProps = {
    allAvailableWards: mockWards,
    wardAssignments: {},
    selectedWards: [],
    availableSearch: "",
    availablePage: 1,
    availablePageSize: 10,
    checkedAvailable: new Set<string>(),
    loading: false,
    onSearch: vi.fn(),
    onToggle: vi.fn(),
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders available wards component", () => {
    render(<AvailableWards {...defaultProps} />);
    expect(screen.getByTestId("search-input")).toBeInTheDocument();
  });

  it("displays unassigned wards", () => {
    render(<AvailableWards {...defaultProps} />);
    expect(screen.getByText("W001")).toBeInTheDocument();
    expect(screen.getByText("W002")).toBeInTheDocument();
  });

  it("filters out assigned wards", () => {
    const props = {
      ...defaultProps,
      wardAssignments: { W001: { rateSectionNo: "RS001" } },
    };
    render(<AvailableWards {...props} />);
    expect(screen.queryByText("W001")).not.toBeInTheDocument();
    expect(screen.getByText("W002")).toBeInTheDocument();
  });

  it("filters out selected wards", () => {
    const props = {
      ...defaultProps,
      selectedWards: ["W001"],
    };
    render(<AvailableWards {...props} />);
    expect(screen.queryByText("W001")).not.toBeInTheDocument();
    expect(screen.getByText("W002")).toBeInTheDocument();
  });

  it("filters wards by search term", () => {
    render(<AvailableWards {...defaultProps} availableSearch="W001" />);
    expect(screen.getByText("W001")).toBeInTheDocument();
    expect(screen.queryByText("W002")).not.toBeInTheDocument();
  });

  it("calls onSearch when search input changes", () => {
    const onSearch = vi.fn();
    render(<AvailableWards {...defaultProps} onSearch={onSearch} />);
    fireEvent.change(screen.getByTestId("search-input"), { target: { value: "W001" } });
    expect(onSearch).toHaveBeenCalledWith("W001");
  });

  it("calls onToggle when checkbox is clicked", () => {
    const onToggle = vi.fn();
    render(<AvailableWards {...defaultProps} onToggle={onToggle} />);
    const checkboxes = screen.getAllByTestId("checkbox");
    fireEvent.click(checkboxes[0]);
    expect(onToggle).toHaveBeenCalled();
  });

  it("shows empty state when no wards available", () => {
    render(<AvailableWards {...defaultProps} allAvailableWards={[]} />);
    expect(screen.getByText("wards.noAvailableWards")).toBeInTheDocument();
  });

  it("paginates wards correctly", () => {
    const manyWards = Array.from({ length: 15 }, (_, i) => ({
      id: String(i + 1),
      wardNo: `W${String(i + 1).padStart(3, "0")}`,
      name: `Ward ${i + 1}`,
    }));
    render(<AvailableWards {...defaultProps} allAvailableWards={manyWards} availablePageSize={10} />);
    // Should only show first 10
    expect(screen.getByText("W001")).toBeInTheDocument();
    expect(screen.queryByText("W011")).not.toBeInTheDocument();
  });

  it("calls onPageChange when pagination buttons are clicked", () => {
    const manyWards = Array.from({ length: 15 }, (_, i) => ({
      id: String(i + 1),
      wardNo: `W${String(i + 1).padStart(3, "0")}`,
      name: `Ward ${i + 1}`,
    }));
    const onPageChange = vi.fn();
    render(<AvailableWards {...defaultProps} allAvailableWards={manyWards} availablePageSize={10} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByTestId("next-button"));
    expect(onPageChange).toHaveBeenCalled();
  });
});
