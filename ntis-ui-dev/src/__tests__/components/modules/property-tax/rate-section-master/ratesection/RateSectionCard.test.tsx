import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RateSectionCard from "@/components/modules/property-tax/rate-section-master/ratesection/RateSectionCard";
import { RateItem } from "@/types/rateSectionMaster.types";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock common components
vi.mock("@/components/common", () => ({
  Card: ({ children, onClick, className }: { children: React.ReactNode; onClick: () => void; className: string }) => (
    <div data-testid="card" onClick={onClick} className={className}>
      {children}
    </div>
  ),
  EditButton: ({ onClick }: { onClick: (e: React.MouseEvent) => void }) => (
    <button data-testid="edit-button" onClick={onClick}>
      Edit
    </button>
  ),
  DeleteButton: ({ onClick, disabled }: { onClick: (e: React.MouseEvent) => void; disabled?: boolean }) => (
    <button data-testid="delete-button" onClick={onClick} disabled={disabled}>
      Delete
    </button>
  ),
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/common/StatusBadge", () => ({
  StatusBadge: ({ value }: { value: string }) => <span data-testid="status-badge">{value}</span>,
}));

describe("RateSectionCard", () => {
  const mockRate: RateItem = {
    id: 1,
    rateSectionNo: "RS001",
    description: "Rate Section 1",
    isActive: true,
  };

  const defaultProps = {
    rate: mockRate,
    index: 0,
    serialNo: 1,
    isSelected: false,
    isNewlyCreated: false,
    onDelete: vi.fn(),
    deletingId: null,
    searchParams: new URLSearchParams(),
    pathname: "/en/property-tax/rate-section-master",
    t: (key: string) => key,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders rate section card", () => {
    render(<RateSectionCard {...defaultProps} />);
    expect(screen.getByTestId("card")).toBeInTheDocument();
    // Card now displays rate.id (1) instead of rateSectionNo
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Rate Section 1")).toBeInTheDocument();
  });

  it("shows active status badge", () => {
    render(<RateSectionCard {...defaultProps} />);
    expect(screen.getByTestId("status-badge")).toHaveTextContent("active");
  });

  it("shows inactive status badge", () => {
    render(<RateSectionCard {...defaultProps} rate={{ ...mockRate, isActive: false }} />);
    expect(screen.getByTestId("status-badge")).toHaveTextContent("inactive");
  });

  it("applies selected styling when isSelected is true", () => {
    render(<RateSectionCard {...defaultProps} isSelected={true} />);
    const card = screen.getByTestId("card");
    expect(card.className).toContain("from-[#E8EFF8]");
  });

  it("applies newly created styling when isNewlyCreated is true", () => {
    render(<RateSectionCard {...defaultProps} isNewlyCreated={true} />);
    const card = screen.getByTestId("card");
    expect(card.className).toContain("from-emerald-100");
  });

  it("navigates to zone on card click", () => {
    render(<RateSectionCard {...defaultProps} />);
    fireEvent.click(screen.getByTestId("card"));
    // Now navigates with zone=id (1) instead of rateSectionNo
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("zone=1")
    );
  });

  it("navigates to edit page on edit button click", () => {
    Object.defineProperty(window, "location", {
      value: { pathname: "/en/property-tax/rate-section-master" },
      writable: true,
    });
    render(<RateSectionCard {...defaultProps} />);
    fireEvent.click(screen.getByTestId("edit-button"));
    expect(mockPush).toHaveBeenCalledWith(
      "/en/property-tax/rate-section-master/edit/1"
    );
  });

  it("calls onDelete on delete button click", () => {
    const onDelete = vi.fn();
    render(<RateSectionCard {...defaultProps} onDelete={onDelete} />);
    fireEvent.click(screen.getByTestId("delete-button"));
    // Third argument (rateNo) is now removed, it only expects 2 arguments
    expect(onDelete).toHaveBeenCalledWith("1", "Rate Section 1");
  });

  it("disables delete button when deletingId matches", () => {
    render(<RateSectionCard {...defaultProps} deletingId="1" />);
    expect(screen.getByTestId("delete-button")).toBeDisabled();
  });
});
