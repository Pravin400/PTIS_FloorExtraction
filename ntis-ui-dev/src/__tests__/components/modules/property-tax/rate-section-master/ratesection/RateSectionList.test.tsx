import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RateSectionList from "@/components/modules/property-tax/rate-section-master/ratesection/RateSectionList";

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/property-tax/rate-section-master",
}));

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, string | number>) => {
    if (values) {
      return `${key}: ${JSON.stringify(values)}`;
    }
    return key;
  },
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
const mockDeleteRateSectionAction = vi.fn();
vi.mock("@/app/[locale]/property-tax/rate-section-master/actions", () => ({
  deleteRateSectionAction: (id: number) => mockDeleteRateSectionAction(id),
}));

// Mock useConfirm hook
const mockConfirm = vi.fn();
vi.mock("@/components/common", () => ({
  useConfirm: () => ({
    confirm: mockConfirm,
  }),
  AddButton: ({ label, onClick, disabled }: { label: string; onClick: () => void; disabled: boolean }) => (
    <button data-testid="add-button" onClick={onClick} disabled={disabled}>{label}</button>
  ),
  EditButton: ({ onClick, size }: { onClick: (e: React.MouseEvent) => void; size: string }) => (
    <button data-testid={`edit-button-${size}`} onClick={onClick}>Edit</button>
  ),
  DeleteButton: ({ onClick, disabled, size }: { onClick: (e: React.MouseEvent) => void; disabled: boolean; size: string }) => (
    <button data-testid={`delete-button-${size}`} onClick={onClick} disabled={disabled}>Delete</button>
  ),
  Card: ({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) => (
    <div data-testid="card" onClick={onClick} className={className}>{children}</div>
  ),
  SearchInput: ({ value, onChange, placeholder }: { value: string; onChange: (val: string) => void; placeholder: string }) => (
    <input
      data-testid="search-input"
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/common/CardList", () => ({
  CardList: ({ 
    data, 
    renderCard, 
    onPageChange, 
    onPageSizeChange,
    emptyText,
    pageNumber,
    totalPages,
  }: { 
    data: unknown[]; 
    renderCard: (item: unknown, index: number) => React.ReactNode;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    emptyText: string;
    pageNumber: number;
    totalPages: number;
  }) => (
    <div data-testid="card-list">
      {data.length === 0 ? (
        <div data-testid="empty-text">{emptyText}</div>
      ) : (
        data.map((item, index) => (
          <div key={index} data-testid={`card-item-${index}`}>
            {renderCard(item, index)}
          </div>
        ))
      )}
      <div data-testid="pagination">
        <span data-testid="current-page">{pageNumber}</span>
        <span data-testid="total-pages">{totalPages}</span>
        <button data-testid="prev-page" onClick={() => onPageChange(pageNumber - 1)}>Prev</button>
        <button data-testid="next-page" onClick={() => onPageChange(pageNumber + 1)}>Next</button>
        <button data-testid="change-page-size" onClick={() => onPageSizeChange(20)}>Change Size</button>
      </div>
    </div>
  ),
}));

vi.mock("@/components/common/StatusBadge", () => ({
  StatusBadge: ({ value }: { value: string }) => (
    <span data-testid="status-badge">{value}</span>
  ),
}));

describe("RateSectionList", () => {
  const mockRates = [
    {
      id: 1,
      rateSectionNo: "RS001",
      description: "Rate Section 1",
      isActive: true,
    },
    {
      id: 2,
      rateSectionNo: "RS002",
      description: "Rate Section 2",
      isActive: false,
    },
  ];

  const defaultProps = {
    rates: mockRates,
    selectedRateSection: "RS001",
    newlyCreatedRateNo: null,
    initialWardCounts: { RS001: 5, RS002: 3 },
    totalCount: 2,
    onDeleteSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders list title", () => {
    render(<RateSectionList {...defaultProps} />);
    expect(screen.getByText(/list\.title/)).toBeInTheDocument();
  });

  it("renders add button", () => {
    render(<RateSectionList {...defaultProps} />);
    expect(screen.getByTestId("add-button")).toBeInTheDocument();
  });

  it("renders search input", () => {
    render(<RateSectionList {...defaultProps} />);
    expect(screen.getByTestId("search-input")).toBeInTheDocument();
  });

  it("renders rate section cards", () => {
    render(<RateSectionList {...defaultProps} />);
    expect(screen.getByTestId("card-item-0")).toBeInTheDocument();
    expect(screen.getByTestId("card-item-1")).toBeInTheDocument();
  });

  it("shows empty text when no rates", () => {
    render(<RateSectionList {...defaultProps} rates={[]} />);
    expect(screen.getByTestId("empty-text")).toBeInTheDocument();
  });

  it("opens add rate section drawer on button click", () => {
    render(<RateSectionList {...defaultProps} />);
    fireEvent.click(screen.getByTestId("add-button"));
    expect(mockPush).toHaveBeenCalled();
  });

  it("handles search input change", async () => {
    render(<RateSectionList {...defaultProps} />);
    const searchInput = screen.getByTestId("search-input");
    
    fireEvent.change(searchInput, { target: { value: "RS001" } });
    
    // Verify search value is updated
    expect(searchInput).toHaveValue("RS001");
  });

  it("handles page change", () => {
    render(<RateSectionList {...defaultProps} />);
    fireEvent.click(screen.getByTestId("next-page"));
    expect(mockPush).toHaveBeenCalled();
  });

  it("handles page size change", () => {
    render(<RateSectionList {...defaultProps} />);
    fireEvent.click(screen.getByTestId("change-page-size"));
    expect(mockPush).toHaveBeenCalled();
  });

  it("displays status badge for each rate section", () => {
    render(<RateSectionList {...defaultProps} />);
    const statusBadges = screen.getAllByTestId("status-badge");
    expect(statusBadges.length).toBe(2);
  });


  it("handles delete confirmation", async () => {
    mockDeleteRateSectionAction.mockResolvedValue({ success: true });
    // Immediately call onConfirm synchronously for test reliability
    mockConfirm.mockImplementation(({ onConfirm }: { onConfirm: () => void }) => {
      onConfirm();
    });
    const onDeleteSuccess = vi.fn();
    render(<RateSectionList {...defaultProps} onDeleteSuccess={onDeleteSuccess} />);
    const deleteButtons = screen.getAllByTestId("delete-button-xs");
    fireEvent.click(deleteButtons[0]);
    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
      expect(mockDeleteRateSectionAction).toHaveBeenCalled();
      expect(onDeleteSuccess).toHaveBeenCalled();
    });
  });

  it("navigates to edit page on edit button click", async () => {
    mockPush.mockClear();
    // Mock window.location.pathname
    const locationSpy = vi.spyOn(window, "location", "get").mockReturnValue({
      pathname: "/en/property-tax/rate-section-master",
      hash: "",
      host: "localhost",
      hostname: "localhost",
      href: "http://localhost/en/property-tax/rate-section-master",
      origin: "http://localhost",
      port: "",
      protocol: "http:",
      search: "",
      ancestorOrigins: {} as DOMStringList,
      assign: vi.fn(),
      reload: vi.fn(),
      replace: vi.fn(),
    } as Location);
    render(<RateSectionList {...defaultProps} />);
    const editButtons = screen.getAllByTestId("edit-button-xs");
    fireEvent.click(editButtons[0]);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledTimes(1);
    });
    locationSpy.mockRestore();
  });

  it("selects zone on card click", () => {
    render(<RateSectionList {...defaultProps} />);
    
    const cards = screen.getAllByTestId("card");
    fireEvent.click(cards[1]); // Click second card
    
    expect(mockPush).toHaveBeenCalled();
  });

  it("sanitizes search input", () => {
    render(<RateSectionList {...defaultProps} />);
    const searchInput = screen.getByTestId("search-input");
    
    // Try to input special characters
    fireEvent.change(searchInput, { target: { value: "RS001!@#" } });
    
    // Should sanitize to alphanumeric only
    expect(searchInput).toHaveValue("RS001");
  });
});
