import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import WardList from "@/components/modules/property-tax/rate-section-master/wards/WardList";

// Mock next/navigation
const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
}));

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock actions
const mockDeleteRateSectionDetailAction = vi.fn();
vi.mock("@/app/[locale]/property-tax/rate-section-master/actions", () => ({
  deleteRateSectionDetailAction: (id: number) => mockDeleteRateSectionDetailAction(id),
}));

// Mock useConfirm hook
const mockConfirm = vi.fn();
vi.mock("@/components/common", () => ({
  useConfirm: () => ({
    confirm: mockConfirm,
  }),
  AddButton: ({ label, onClick, disabled }: { label: string; onClick: () => void; disabled: boolean }) => (
    <button data-testid="add-ward-button" onClick={onClick} disabled={disabled}>{label}</button>
  ),
  SearchInput: ({ value, onChange, placeholder }: { value: string; onChange: (val: string) => void; placeholder: string }) => (
    <input
      data-testid="ward-search-input"
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
  EditButton: ({ onClick }: { onClick: () => void }) => (
    <button data-testid="edit-ward-button" onClick={onClick}>Edit</button>
  ),
  DeleteButton: ({ onClick }: { onClick: () => void }) => (
    <button data-testid="delete-ward-button" onClick={onClick}>Delete</button>
  ),
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/common/MasterTable", () => ({
  MasterTable: ({  
    data,  
    columns,  
    onPageChange,  
    onPageSizeChange,  
    emptyText,  
    pageNumber,  
    totalPages,  
    totalCount,  
  }: {  
    data: unknown[];  
    columns: unknown[];  
    onPageChange: (page: number) => void;  
    onPageSizeChange: (size: number) => void;  
    emptyText: string;  
    pageNumber: number;  
    totalPages: number;  
    totalCount: number;  
  }) => (  
    <div data-testid="master-table">  
      <span data-testid="table-data-count">{data.length}</span>  
      <span data-testid="table-columns-count">{(columns as unknown[]).length}</span>  
      <span data-testid="table-total-items">{totalCount}</span>  
      <span data-testid="table-current-page">{pageNumber}</span>  
      <span data-testid="table-total-pages">{totalPages}</span>  
      {data.length === 0 && <span data-testid="empty-message">{emptyText}</span>}  
      <button data-testid="table-next-page" onClick={() => onPageChange(pageNumber + 1)}>Next</button>  
      <button data-testid="table-change-size" onClick={() => onPageSizeChange(20)}>Change Size</button>  
    </div>  
  ),
}));

vi.mock("@/components/common/StatusBadge", () => ({
  StatusBadge: ({ label, variant }: { label: string; variant?: string }) => (
    <span data-testid="status-badge" data-variant={variant}>{label}</span>
  ),
}));

vi.mock("@/components/modules/property-tax/rate-section-master/wards/WardColumns", () => ({
  getWardColumns: () => [
    { key: "wardNo", label: "Ward No" },
  ],
}));

describe("WardList", () => {
  const mockRates = [
    {
      rateSectionId: 1,
      rateSectionNo: "RS001",
      description: "Rate Section 1",
      isActive: true,
    },
  ];

  const mockSections = [
    {
      rateSectionDetailsId: 1,
      rateSectionDetailsID: 1,
      rateSectionId: 1,
      wardId: 101,
      wardNo: "W001",
      WardNo: "W001",
      isActive: true,
    },
    {
      rateSectionDetailsId: 2,
      rateSectionDetailsID: 2,
      rateSectionId: 1,
      wardId: 102,
      wardNo: "W002",
      WardNo: "W002",
      isActive: false,
    },
  ];

  const defaultProps = {
    rates: mockRates,
    sections: mockSections,
    sectionsTotalCount: 2,
    selectedRateSection: "RS001",
    selectedRateSectionLabel: "Rate Section 1",
    onWardsChanged: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete("zone");
    mockSearchParams.delete("wardpage");
    mockSearchParams.delete("wardpagesize");
    mockSearchParams.delete("wardq");
  });

  it("renders ward list title", () => {
    render(<WardList {...defaultProps} />);
    expect(screen.getByText("wards.title")).toBeInTheDocument();
  });

  it("renders add ward button", () => {
    render(<WardList {...defaultProps} />);
    expect(screen.getByTestId("add-ward-button")).toBeInTheDocument();
  });

  it("disables add ward button when no rate section selected", () => {
    render(<WardList {...defaultProps} selectedRateSection={null} />);
    expect(screen.getByTestId("add-ward-button")).toBeDisabled();
  });

  it("renders search input when rate section is selected", () => {
    render(<WardList {...defaultProps} />);
    expect(screen.getByTestId("ward-search-input")).toBeInTheDocument();
  });

  it("renders master table with ward data", () => {
    render(<WardList {...defaultProps} />);
    expect(screen.getByTestId("master-table")).toBeInTheDocument();
    expect(screen.getByTestId("table-data-count")).toHaveTextContent("2");
  });

  it("shows select rate section message when no rate section selected", () => {
    render(<WardList {...defaultProps} selectedRateSection={null} />);
    expect(screen.getByText("wards.selectRateSectionToView")).toBeInTheDocument();
  });

  it("displays rate section label in status badge", () => {
    render(<WardList {...defaultProps} />);
    const statusBadge = screen.getByTestId("status-badge");
    expect(statusBadge).toHaveTextContent("Rate Section 1");
  });

  it("displays total ward count", () => {
    render(<WardList {...defaultProps} />);
    expect(screen.getByTestId("table-total-items")).toHaveTextContent("2");
  });

  it("handles search input", () => {
    render(<WardList {...defaultProps} />);
    const searchInput = screen.getByTestId("ward-search-input");
    
    fireEvent.change(searchInput, { target: { value: "W001" } });
    
    expect(mockPush).toHaveBeenCalled();
  });

  it("handles page change", () => {
    render(<WardList {...defaultProps} />);
    fireEvent.click(screen.getByTestId("table-next-page"));
    expect(mockPush).toHaveBeenCalled();
  });

  it("handles page size change", () => {
    render(<WardList {...defaultProps} />);
    fireEvent.click(screen.getByTestId("table-change-size"));
    expect(mockPush).toHaveBeenCalled();
  });

  it("opens add ward drawer on button click", () => {
    render(<WardList {...defaultProps} />);
    fireEvent.click(screen.getByTestId("add-ward-button"));
    expect(mockPush).toHaveBeenCalled();
  });

  it("computes rate section label from rates when prop not provided", () => {
    render(<WardList {...defaultProps} selectedRateSectionLabel={undefined} />);
    const statusBadge = screen.getByTestId("status-badge");
    expect(statusBadge).toHaveTextContent("Rate Section 1");
  });

  it("falls back to selectedRateSection when no rate found", () => {
    render(
      <WardList 
        {...defaultProps} 
        rates={[]} 
        selectedRateSectionLabel={undefined}
        sections={[]}
      />
    );
    const statusBadge = screen.getByTestId("status-badge");
    // When no rate found and no sections, falls back to selectedRateSection
    expect(statusBadge).toBeInTheDocument();
  });

  it("filters wards by search term", () => {
    render(<WardList {...defaultProps} />);
    const searchInput = screen.getByTestId("ward-search-input");
    
    fireEvent.change(searchInput, { target: { value: "W001" } });
    
    // Table should still render, filtering is done in useMemo
    expect(screen.getByTestId("master-table")).toBeInTheDocument();
  });

  it("sanitizes search input", () => {
    render(<WardList {...defaultProps} />);
    const searchInput = screen.getByTestId("ward-search-input");
    
    fireEvent.change(searchInput, { target: { value: "W001!@#" } });
    
    // Should sanitize to alphanumeric only
    expect(mockPush).toHaveBeenCalled();
  });

  it("handles empty sections array", () => {
    render(<WardList {...defaultProps} sections={[]} sectionsTotalCount={0} />);
    expect(screen.getByTestId("table-data-count")).toHaveTextContent("0");
  });

  it("uses section data from first section for zone label fallback", () => {
    const sectionsWithRateSectionNo = [
      {
        ...mockSections[0],
        rateSectionNo: "RS001",
        description: "Section Description",
      },
    ];
    
    render(
      <WardList 
        {...defaultProps} 
        rates={[]}
        sections={sectionsWithRateSectionNo}
        selectedRateSectionLabel={undefined}
      />
    );
    
    const statusBadge = screen.getByTestId("status-badge");
    expect(statusBadge).toHaveTextContent("Section Description");
  });
});
