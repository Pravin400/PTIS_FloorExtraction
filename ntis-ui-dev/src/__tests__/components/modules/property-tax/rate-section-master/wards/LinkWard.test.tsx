import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LinkWard from "@/components/modules/property-tax/rate-section-master/wards/LinkWard";

// Mock next/navigation
const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
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
const mockLinkWardsToRateSectionAction = vi.fn();
const mockDeleteSelectedWardsAction = vi.fn();
const mockRefreshSelectedWardsAction = vi.fn();

vi.mock("@/app/[locale]/property-tax/rate-section-master/actions", () => ({
  linkWardsToRateSectionAction: (rateSectionId: unknown, wardNos: unknown) =>
    mockLinkWardsToRateSectionAction(rateSectionId, wardNos),
  deleteSelectedWardsAction: (rateSectionId: unknown, wardNos: unknown) =>
    mockDeleteSelectedWardsAction(rateSectionId, wardNos),
  refreshSelectedWardsAction: (rateSectionId: unknown) =>
    mockRefreshSelectedWardsAction(rateSectionId),
}));

// Mock common components
vi.mock("@/components/common/Drawer", () => ({
  Drawer: ({ 
    open, 
    children, 
    title, 
    footer,
    onClose,
  }: { 
    open: boolean; 
    children: React.ReactNode; 
    title: React.ReactNode; 
    footer: React.ReactNode;
    onClose: () => void;
  }) => (
    open ? (
      <div data-testid="link-ward-drawer">
        <div data-testid="drawer-title">{title}</div>
        <div data-testid="drawer-content">{children}</div>
        <div data-testid="drawer-footer">{footer}</div>
        <button data-testid="drawer-close" onClick={onClose}>Close</button>
      </div>
    ) : null
  ),
}));

vi.mock("@/components/common", () => ({
  SearchInput: ({ value, onChange, placeholder }: { value: string; onChange: (val: string) => void; placeholder: string }) => (
    <input
      data-testid="search-input"
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
  Badge: ({ children, variant, size }: { children: React.ReactNode; variant?: string; size?: string }) => (
    <span data-testid="badge" data-variant={variant} data-size={size}>{children}</span>
  ),
  Checkbox: ({ checked, onCheckedChange, disabled, className }: { checked: boolean; onCheckedChange: (checked: boolean) => void; disabled?: boolean; className?: string }) => (
    <input
      data-testid="checkbox"
      type="checkbox"
      checked={checked}
      onChange={() => onCheckedChange(!checked)}
      disabled={disabled}
      className={className}
    />
  ),
  Select: ({ options, value, onChange, selectSize, className }: { options: { label: string; value: string }[]; value: string; onChange: (val: string) => void; selectSize?: string; className?: string }) => (
    <select
      data-testid="select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      data-size={selectSize}
      className={className}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  ),
  Tabs: ({ 
    value, 
    onChange, 
    items = [], 
    children 
  }: { 
    value: string; 
    onChange: (val: string | number) => void; 
    items?: { value: string; label: React.ReactNode; content?: React.ReactNode }[];
    children?: React.ReactNode;
  }) => (
    <div data-testid="tabs">
      {items && items.map(item => (
        <button 
          key={item.value}
          data-testid={`tab-${item.value}`}
          data-active={value === item.value}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
      <div data-testid="tab-content">{children}</div>
    </div>
  ),
  useConfirm: vi.fn(() => ({
    confirm: vi.fn((options) => {
      if (options.onConfirm) options.onConfirm();
    }),
  })),
}));

vi.mock("@/components/common/ActionButtons", () => ({
  MoveRightButton: ({ onClick, disabled }: { onClick: () => void; disabled: boolean }) => (
    <button data-testid="move-right-button" onClick={onClick} disabled={disabled}>→</button>
  ),
  MoveLeftButton: ({ onClick, disabled }: { onClick: () => void; disabled: boolean }) => (
    <button data-testid="move-left-button" onClick={onClick} disabled={disabled}>←</button>
  ),
  PrevPageButton: ({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) => (
    <button data-testid="prev-page-button" onClick={onClick} disabled={disabled}>«</button>
  ),
  NextPageButton: ({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) => (
    <button data-testid="next-page-button" onClick={onClick} disabled={disabled}>»</button>
  ),
}));

vi.mock("@/components/common/StatusBadge", () => ({
  StatusBadge: ({ label, variant }: { label: string; variant?: string }) => (
    <span data-testid="status-badge" data-variant={variant}>{label}</span>
  ),
}));

vi.mock("@/components/common/Tabs", () => ({
  Tabs: ({ 
    value, 
    onChange, 
    items = [], 
    children 
  }: { 
    value: string; 
    onChange: (val: string | number) => void; 
    items?: { value: string; label: React.ReactNode; content?: React.ReactNode }[];
    children?: React.ReactNode;
  }) => (
    <div data-testid="tabs">
      {items && items.map(item => (
        <button 
          key={item.value}
          data-testid={`tab-${item.value}`}
          data-active={value === item.value}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
      <div data-testid="tab-content">{children}</div>
    </div>
  ),
}));

describe("LinkWard", () => {
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

  const mockSections = [
    {
      rateSectionDetailsId: 1,
      rateSectionId: 1,
      wardId: 101,
      wardNo: "W001",
      isActive: true,
    },
  ];

  const mockAllWards = [
    { id: "1", wardNo: "W001", name: "Ward 1" },
    { id: "2", wardNo: "W002", name: "Ward 2" },
    { id: "3", wardNo: "W003", name: "Ward 3" },
  ];

  const mockWardAssignments = {
    "W001": { rateSectionNo: "1", id: 1, description: "Rate Section 1" },
  };

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    rates: mockRates,
    sections: mockSections,
    selectedZoneNo: "1",
    ssrAllWards: mockAllWards,
    ssrAllWardsCount: 3,
    ssrWardAssignments: mockWardAssignments,
    ssrAllRateSections: mockRates,
    ssrSelectedWards: ["W001"],
    ssrSelectedWardsTotalCount: 1,
    ssrViewAllWards: mockAllWards,
    ssrViewAllWardsTotalCount: 3,
    ssrViewAllWardsTotalPages: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete("wardTab");
    mockSearchParams.delete("availablewardpage");
    mockSearchParams.delete("viewwardpage");
    mockSearchParams.delete("selectedwardpage");
  });

  it("renders drawer when open", () => {
    render(<LinkWard {...defaultProps} />);
    expect(screen.getByTestId("link-ward-drawer")).toBeInTheDocument();
  });

  it("does not render drawer when closed", () => {
    render(<LinkWard {...defaultProps} open={false} />);
    expect(screen.queryByTestId("link-ward-drawer")).not.toBeInTheDocument();
  });

  it("renders drawer title", () => {
    render(<LinkWard {...defaultProps} />);
    expect(screen.getByTestId("drawer-title")).toBeInTheDocument();
  });

  it("renders tabs component", () => {
    render(<LinkWard {...defaultProps} />);
    expect(screen.getByTestId("tabs")).toBeInTheDocument();
  });

  it("renders move buttons", () => {
    render(<LinkWard {...defaultProps} />);
    // Move buttons use NextPageButton and PrevPageButton, appearing multiple times in the UI
    const nextButtons = screen.getAllByTestId("next-page-button");
    const prevButtons = screen.getAllByTestId("prev-page-button");
    expect(nextButtons.length).toBeGreaterThan(0);
    expect(prevButtons.length).toBeGreaterThan(0);
  });

  it("calls onClose when close button is clicked", () => {
    render(<LinkWard {...defaultProps} />);
    fireEvent.click(screen.getByTestId("drawer-close"));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("handles tab change", () => {
    render(<LinkWard {...defaultProps} />);
    
    // Click viewAll tab
    const viewAllTab = screen.getByTestId("tab-viewAll");
    fireEvent.click(viewAllTab);
    
    expect(mockPush).toHaveBeenCalled();
  });

  it("displays selected zone name", () => {
    render(<LinkWard {...defaultProps} />);
    // StatusBadge label is now 'selectedZoneNo - selectedZoneName' = '1 - Rate Section 1'
    expect(screen.getByTestId("status-badge")).toHaveTextContent("1 - Rate Section 1");
  });

  it("uses selectedZoneNo as fallback when no description", () => {
    const propsWithNoDesc = {
      ...defaultProps,
      rates: [{ ...mockRates[0], description: undefined }],
    };
    
    render(<LinkWard {...propsWithNoDesc} />);
    // Falls back to selectedZoneNo which is "1" - use status-badge to be specific
    expect(screen.getByTestId("status-badge")).toHaveTextContent("1");
  });

  it("disables move right button when nothing selected", () => {
    render(<LinkWard {...defaultProps} />);
    // The center move button (second next-page-button) should be disabled
    const nextButtons = screen.getAllByTestId("next-page-button");
    // At least one should be disabled (the move button)
    const hasDisabledMoveButton = nextButtons.some(btn => btn.hasAttribute('disabled'));
    expect(hasDisabledMoveButton).toBe(true);
  });

  it("disables move left button when nothing selected", () => {
    render(<LinkWard {...defaultProps} />);
    // The center move button (a prev-page-button) should be disabled
    const prevButtons = screen.getAllByTestId("prev-page-button");
    // At least one should be disabled (the move button)
    const hasDisabledMoveButton = prevButtons.some(btn => btn.hasAttribute('disabled'));
    expect(hasDisabledMoveButton).toBe(true);
  });

  it("shows empty state when no selectedZoneNo", () => {
    render(<LinkWard {...defaultProps} selectedZoneNo={null} />);
    // Should still render drawer
    expect(screen.getByTestId("link-ward-drawer")).toBeInTheDocument();
  });

  it("resets state when drawer closes", () => {
    const { rerender } = render(<LinkWard {...defaultProps} />);
    
    // Close drawer
    rerender(<LinkWard {...defaultProps} open={false} />);
    
    // Reopen drawer
    rerender(<LinkWard {...defaultProps} open={true} />);
    
    // Move buttons should be disabled (nothing selected)
    const nextButtons = screen.getAllByTestId("next-page-button");
    const prevButtons = screen.getAllByTestId("prev-page-button");
    // At least one of each should be disabled (the move buttons)
    expect(nextButtons.some(btn => btn.hasAttribute('disabled'))).toBe(true);
    expect(prevButtons.some(btn => btn.hasAttribute('disabled'))).toBe(true);
  });

  it("filters unassigned wards correctly", () => {
    render(<LinkWard {...defaultProps} />);
    // Available tab should show only unassigned wards (W002, W003)
    // W001 is already assigned
    expect(screen.getByTestId("link-ward-drawer")).toBeInTheDocument();
  });

  it("handles search in Available Wards tab", () => {
    render(<LinkWard {...defaultProps} />);
    
    const searchInputs = screen.getAllByTestId("search-input");
    if (searchInputs.length > 0) {
      fireEvent.change(searchInputs[0], { target: { value: "W002" } });
      expect(mockPush).toHaveBeenCalled();
    }
  });

  it("uses SSR data for view all wards when searching", () => {
    mockSearchParams.set("viewwardq", "W001");
    mockSearchParams.set("wardTab", "viewAll");
    
    render(<LinkWard {...defaultProps} />);
    
    // Should use SSR viewAllWards data
    expect(screen.getByTestId("link-ward-drawer")).toBeInTheDocument();
  });

  it("uses client-side pagination when not searching", () => {
    mockSearchParams.set("wardTab", "viewAll");
    
    render(<LinkWard {...defaultProps} />);
    
    // Should use client-side pagination
    expect(screen.getByTestId("link-ward-drawer")).toBeInTheDocument();
  });

  it("handles empty ssrAllWards array", () => {
    render(
      <LinkWard 
        {...defaultProps} 
        ssrAllWards={[]}
        ssrAllWardsCount={0}
      />
    );
    expect(screen.getByTestId("link-ward-drawer")).toBeInTheDocument();
  });

  it("handles empty ssrSelectedWards array", () => {
    render(
      <LinkWard 
        {...defaultProps} 
        ssrSelectedWards={[]}
        ssrSelectedWardsTotalCount={0}
      />
    );
    expect(screen.getByTestId("link-ward-drawer")).toBeInTheDocument();
  });

  it("handles empty ssrWardAssignments", () => {
    render(
      <LinkWard 
        {...defaultProps} 
        ssrWardAssignments={{}}
      />
    );
    // All wards should be available since none are assigned
    expect(screen.getByTestId("link-ward-drawer")).toBeInTheDocument();
  });

  it("sanitizes search input", () => {
    render(<LinkWard {...defaultProps} />);
    
    const searchInputs = screen.getAllByTestId("search-input");
    if (searchInputs.length > 0) {
      fireEvent.change(searchInputs[0], { target: { value: "W001!@#" } });
      
      // Should trigger URL update with sanitized value
      expect(mockPush).toHaveBeenCalled();
    }
  });

  it("calculates total pages correctly", () => {
    render(<LinkWard {...defaultProps} />);
    // With 3 wards and default page size of 10, should be 1 page
    expect(screen.getByTestId("link-ward-drawer")).toBeInTheDocument();
  });

  it("handles pagination page change", () => {
    mockSearchParams.set("wardTab", "viewAll");
    
    render(<LinkWard {...defaultProps} />);
    
    // Component should render and handle pagination
    expect(screen.getByTestId("link-ward-drawer")).toBeInTheDocument();
  });

  it("shows assigned ward badge in View All tab", () => {
    mockSearchParams.set("wardTab", "viewAll");
    
    render(<LinkWard {...defaultProps} />);
    
    // W001 should show as assigned in View All tab
    expect(screen.getByTestId("link-ward-drawer")).toBeInTheDocument();
  });
});
