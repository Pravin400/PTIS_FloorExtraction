import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { BuildingPreviewModal } from "@/components/modules/property-tax/zone-master/properties/BuildingPreviewModal";
import { createBulkBuildingPropertiesAction } from "@/app/[locale]/property-tax/zone-master/actions";

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

// Mock Modal component
vi.mock("@/components/common/Modal", () => ({
  Modal: ({ children, open, onClose, title, footer }: { children: React.ReactNode; open: boolean; onClose: () => void; title: string; footer?: React.ReactNode }) => (
    open ? (
      <div data-testid="modal">
        <h1>{title}</h1>
        <button onClick={onClose}>Close</button>
        {children}
        {footer && <div data-testid="modal-footer">{footer}</div>}
      </div>
    ) : null
  ),
}));

// Mock server action
vi.mock("@/app/[locale]/property-tax/zone-master/actions", () => ({
  createBulkBuildingPropertiesAction: vi.fn(),
}));

describe("BuildingPreviewModal", () => {
  const mockOnClose = vi.fn();
  const mockOnGenerateSuccess = vi.fn();
  const mockBuildingData = [
    {
      wardId: 10,
      propertyNo: "PR001",
      wingId: 1,
      rowNo: 1,
      floorNo: 0,
      floorCode: "0",
      propertyFloorId: 1,
      unitNo: 1,
      flatNo: "101",
      partitionNo: "P1",
      generationType: "auto"
    },
    {
      wardId: 10,
      propertyNo: "PR001",
      wingId: 1,
      rowNo: 2,
      floorNo: 0,
      floorCode: "0",
      propertyFloorId: 1,
      unitNo: 2,
      flatNo: "102",
      partitionNo: "P2",
      generationType: "auto"
    },
  ];

  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    buildingData: mockBuildingData,
    wingLetter: "A",
    propertyNo: "PR001",
    taxZoneId: 1,
    wardId: 10,
    propertyTypeId: 5,
    categoryId: 2,
    societyDetailId: 100,
    wingDetailId: 200,
    onGenerateSuccess: mockOnGenerateSuccess,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render correctly when open", () => {
    const { getByTestId, getByText } = render(<BuildingPreviewModal {...defaultProps} />);
    expect(getByTestId("modal")).toBeDefined();
    expect(getByText(/partitionForm.wing.preview.title/)).toBeDefined();
  });

  it("should not render when closed", () => {
    const { queryByTestId } = render(<BuildingPreviewModal {...defaultProps} open={false} />);
    expect(queryByTestId("modal")).toBeNull();
  });

  it("should display organized building data summary", () => {
    const { getByText, getAllByText } = render(<BuildingPreviewModal {...defaultProps} />);
    // Total units is 2, find the one next to the label
    const totalUnitsLabel = getByText(/partitionForm.wing.preview.totalUnits/i);
    expect(totalUnitsLabel).toBeDefined();
    // Check if the value 2 is present (it appears multiple times, so we use getAll)
    const twoElements = getAllByText((content, element) => {
      return element?.tagName.toLowerCase() === 'p' && content === '2';
    });
    expect(twoElements.length).toBeGreaterThan(0);
  });

  it("should call onClose when close button is clicked", () => {
    const { getByText } = render(<BuildingPreviewModal {...defaultProps} />);
    fireEvent.click(getByText("Close"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should handle successful property generation", async () => {
    (createBulkBuildingPropertiesAction as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: { allSucceeded: true, successCount: 2, failedCount: 0 }
    });

    const { getByRole } = render(<BuildingPreviewModal {...defaultProps} />);
    const generateButton = getByRole("button", { name: /partitionForm.wing.generate.button/i });

    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(createBulkBuildingPropertiesAction).toHaveBeenCalled();
      expect(mockOnGenerateSuccess).toHaveBeenCalled();
    });
  });

  it("should handle failed property generation", async () => {
    (createBulkBuildingPropertiesAction as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: false,
      error: "Generation failed"
    });

    const { getByRole } = render(<BuildingPreviewModal {...defaultProps} />);
    const generateButton = getByRole("button", { name: /partitionForm.wing.generate.button/i });

    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(createBulkBuildingPropertiesAction).toHaveBeenCalled();
    });
  });
});
