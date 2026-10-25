import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RateFrequencySection } from "@/components/modules/property-tax/RVRateMaster/components/RateFrequencySection";
import { toast } from "sonner";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

describe("RateFrequencySection", () => {
  const mockOnRateFrequencyChange = vi.fn();
  const mockOnRateUnitChange = vi.fn();
  const mockOnDownloadTemplate = vi.fn();
  const mockOnUploadClick = vi.fn();
  const mockOnFileChange = vi.fn();
  const mockFileInputRef = { current: null };

  const mockT = (key: string) => {
    const translations: Record<string, string> = {
      "sections.rateFrequency": "Rate Frequency:",
      "sections.rateUnit": "Rate Unit:",
      "sections.quickImport": "Quick Import:",
      "options.monthly": "Monthly",
      "options.yearly": "Yearly",
      "options.sqMeter": "Sq.Meter",
      "options.sqFeet": "Sq.Feet",
      "buttons.downloadTemplate": "Download Template",
      "buttons.upload": "Upload",
      "messages.cannotChangeConfiguredValue": "Cannot change configured value. Please update in Policy Configuration.",
    };
    return translations[key] || key;
  };

  const getDefaultProps = () => ({
    rateFrequency: "Monthly" as const,
    onRateFrequencyChange: mockOnRateFrequencyChange,
    rateUnit: "SqMeter" as const,
    onRateUnitChange: mockOnRateUnitChange,
    mode: "add" as const,
    onDownloadTemplate: mockOnDownloadTemplate,
    onUploadClick: mockOnUploadClick,
    fileInputRef: mockFileInputRef,
    onFileChange: mockOnFileChange,
    isDisabled: false,
    isFrequencyLocked: false,
    isUnitLocked: false,
    t: mockT as unknown as ReturnType<typeof import("next-intl").useTranslations>,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rate Frequency Selection", () => {
    it("should render rate frequency tabs", () => {
      render(<RateFrequencySection {...getDefaultProps()} />);

      expect(screen.getByText("Monthly")).toBeInTheDocument();
      expect(screen.getByText("Yearly")).toBeInTheDocument();
    });

    it("should call onRateFrequencyChange when frequency tab is clicked in add mode", () => {
      render(<RateFrequencySection {...getDefaultProps()} />);

      const yearlyButton = screen.getByText("Yearly");
      fireEvent.click(yearlyButton);

      expect(mockOnRateFrequencyChange).toHaveBeenCalledWith("Yearly");
      expect(toast.error).not.toHaveBeenCalled();
    });

    it("should show toast error when trying to change frequency in edit mode", () => {
      const props = { ...getDefaultProps(), mode: "edit" as const };
      render(<RateFrequencySection {...props} />);

      const yearlyButton = screen.getByText("Yearly");
      fireEvent.click(yearlyButton);

      expect(toast.error).toHaveBeenCalledWith("Cannot change configured value. Please update in Policy Configuration.");
      expect(mockOnRateFrequencyChange).not.toHaveBeenCalled();
    });

    it("should show toast error when trying to change frequency in delete mode", () => {
      const props = { ...getDefaultProps(), mode: "delete" as const };
      render(<RateFrequencySection {...props} />);

      const yearlyButton = screen.getByText("Yearly");
      fireEvent.click(yearlyButton);

      expect(toast.error).toHaveBeenCalledWith("Cannot change configured value. Please update in Policy Configuration.");
      expect(mockOnRateFrequencyChange).not.toHaveBeenCalled();
    });

    it("should show toast error when frequency is locked in add mode", () => {
      const props = { ...getDefaultProps(), isFrequencyLocked: true };
      render(<RateFrequencySection {...props} />);

      const yearlyButton = screen.getByText("Yearly");
      fireEvent.click(yearlyButton);

      expect(toast.error).toHaveBeenCalledWith("Cannot change configured value. Please update in Policy Configuration.");
      expect(mockOnRateFrequencyChange).not.toHaveBeenCalled();
    });

    it("should not show toast when clicking the currently selected frequency tab", () => {
      const props = { ...getDefaultProps(), mode: "edit" as const, rateFrequency: "Monthly" as const };
      render(<RateFrequencySection {...props} />);

      const monthlyButton = screen.getByText("Monthly");
      fireEvent.click(monthlyButton);

      expect(toast.error).not.toHaveBeenCalled();
      expect(mockOnRateFrequencyChange).toHaveBeenCalledWith("Monthly");
    });
  });

  describe("Rate Unit Selection", () => {
    it("should render rate unit tabs", () => {
      render(<RateFrequencySection {...getDefaultProps()} />);

      expect(screen.getByText("Sq.Meter")).toBeInTheDocument();
      expect(screen.getByText("Sq.Feet")).toBeInTheDocument();
    });

    it("should call onRateUnitChange when unit tab is clicked in add mode", () => {
      render(<RateFrequencySection {...getDefaultProps()} />);

      const sqFeetButton = screen.getByText("Sq.Feet");
      fireEvent.click(sqFeetButton);

      expect(mockOnRateUnitChange).toHaveBeenCalledWith("SqFeet");
      expect(toast.error).not.toHaveBeenCalled();
    });

    it("should show toast error when trying to change unit in edit mode", () => {
      const props = { ...getDefaultProps(), mode: "edit" as const };
      render(<RateFrequencySection {...props} />);

      const sqFeetButton = screen.getByText("Sq.Feet");
      fireEvent.click(sqFeetButton);

      expect(toast.error).toHaveBeenCalledWith("Cannot change configured value. Please update in Policy Configuration.");
      expect(mockOnRateUnitChange).not.toHaveBeenCalled();
    });

    it("should show toast error when trying to change unit in delete mode", () => {
      const props = { ...getDefaultProps(), mode: "delete" as const };
      render(<RateFrequencySection {...props} />);

      const sqFeetButton = screen.getByText("Sq.Feet");
      fireEvent.click(sqFeetButton);

      expect(toast.error).toHaveBeenCalledWith("Cannot change configured value. Please update in Policy Configuration.");
      expect(mockOnRateUnitChange).not.toHaveBeenCalled();
    });

    it("should show toast error when unit is locked in add mode", () => {
      const props = { ...getDefaultProps(), isUnitLocked: true };
      render(<RateFrequencySection {...props} />);

      const sqFeetButton = screen.getByText("Sq.Feet");
      fireEvent.click(sqFeetButton);

      expect(toast.error).toHaveBeenCalledWith("Cannot change configured value. Please update in Policy Configuration.");
      expect(mockOnRateUnitChange).not.toHaveBeenCalled();
    });

    it("should not show toast when clicking the currently selected unit tab", () => {
      const props = { ...getDefaultProps(), mode: "edit" as const, rateUnit: "SqMeter" as const };
      render(<RateFrequencySection {...props} />);

      const sqMeterButton = screen.getByText("Sq.Meter");
      fireEvent.click(sqMeterButton);

      expect(toast.error).not.toHaveBeenCalled();
      expect(mockOnRateUnitChange).toHaveBeenCalledWith("SqMeter");
    });
  });

  describe("Combined Lock Behavior", () => {
    it("should show toast for both frequency and unit when both are locked", () => {
      const props = {
        ...getDefaultProps(),
        isFrequencyLocked: true,
        isUnitLocked: true,
      };
      render(<RateFrequencySection {...props} />);

      const yearlyButton = screen.getByText("Yearly");
      fireEvent.click(yearlyButton);

      expect(toast.error).toHaveBeenCalledWith("Cannot change configured value. Please update in Policy Configuration.");

      vi.clearAllMocks();

      const sqFeetButton = screen.getByText("Sq.Feet");
      fireEvent.click(sqFeetButton);

      expect(toast.error).toHaveBeenCalledWith("Cannot change configured value. Please update in Policy Configuration.");
    });

    it("should allow frequency change when only unit is locked", () => {
      const props = {
        ...getDefaultProps(),
        isFrequencyLocked: false,
        isUnitLocked: true,
      };
      render(<RateFrequencySection {...props} />);

      const yearlyButton = screen.getByText("Yearly");
      fireEvent.click(yearlyButton);

      expect(mockOnRateFrequencyChange).toHaveBeenCalledWith("Yearly");
      expect(toast.error).not.toHaveBeenCalled();
    });

    it("should allow unit change when only frequency is locked", () => {
      const props = {
        ...getDefaultProps(),
        isFrequencyLocked: true,
        isUnitLocked: false,
      };
      render(<RateFrequencySection {...props} />);

      const sqFeetButton = screen.getByText("Sq.Feet");
      fireEvent.click(sqFeetButton);

      expect(mockOnRateUnitChange).toHaveBeenCalledWith("SqFeet");
      expect(toast.error).not.toHaveBeenCalled();
    });
  });

  describe("Mode-Specific Behavior", () => {
    it("should make both tabs read-only in edit mode regardless of lock status", () => {
      const props = {
        ...getDefaultProps(),
        mode: "edit" as const,
        isFrequencyLocked: false,
        isUnitLocked: false,
      };
      render(<RateFrequencySection {...props} />);

      const yearlyButton = screen.getByText("Yearly");
      fireEvent.click(yearlyButton);

      expect(toast.error).toHaveBeenCalled();
      expect(mockOnRateFrequencyChange).not.toHaveBeenCalled();
    });

    it("should make both tabs read-only in delete mode regardless of lock status", () => {
      const props = {
        ...getDefaultProps(),
        mode: "delete" as const,
        isFrequencyLocked: false,
        isUnitLocked: false,
      };
      render(<RateFrequencySection {...props} />);

      const sqFeetButton = screen.getByText("Sq.Feet");
      fireEvent.click(sqFeetButton);

      expect(toast.error).toHaveBeenCalled();
      expect(mockOnRateUnitChange).not.toHaveBeenCalled();
    });

    it("should allow changes in add mode when not locked", () => {
      const props = {
        ...getDefaultProps(),
        mode: "add" as const,
        isFrequencyLocked: false,
        isUnitLocked: false,
      };
      render(<RateFrequencySection {...props} />);

      const yearlyButton = screen.getByText("Yearly");
      fireEvent.click(yearlyButton);

      expect(mockOnRateFrequencyChange).toHaveBeenCalledWith("Yearly");
      expect(toast.error).not.toHaveBeenCalled();

      const sqFeetButton = screen.getByText("Sq.Feet");
      fireEvent.click(sqFeetButton);

      expect(mockOnRateUnitChange).toHaveBeenCalledWith("SqFeet");
      expect(toast.error).not.toHaveBeenCalled();
    });
  });

  describe("Quick Import Section", () => {
    it("should render Quick Import section in add mode", () => {
      render(<RateFrequencySection {...getDefaultProps()} />);

      expect(screen.getByText("Quick Import:")).toBeInTheDocument();
      expect(screen.getByText("Download Template")).toBeInTheDocument();
    });

    it("should not render Quick Import section in edit mode", () => {
      const props = { ...getDefaultProps(), mode: "edit" as const };
      render(<RateFrequencySection {...props} />);

      expect(screen.queryByText("Quick Import:")).not.toBeInTheDocument();
    });

    it("should not render Quick Import section in delete mode", () => {
      const props = { ...getDefaultProps(), mode: "delete" as const };
      render(<RateFrequencySection {...props} />);

      expect(screen.queryByText("Quick Import:")).not.toBeInTheDocument();
    });

    it("should call onDownloadTemplate when download button is clicked", () => {
      render(<RateFrequencySection {...getDefaultProps()} />);

      const downloadButton = screen.getByText("Download Template");
      fireEvent.click(downloadButton);

      expect(mockOnDownloadTemplate).toHaveBeenCalled();
    });
  });

  describe("Visual Feedback", () => {
    it("should apply opacity styling when frequency is read-only", () => {
      const props = { ...getDefaultProps(), mode: "edit" as const };
      const { container } = render(<RateFrequencySection {...props} />);

      const tabsContainer = container.querySelector('.opacity-70.cursor-not-allowed');
      expect(tabsContainer).toBeInTheDocument();
    });

    it("should apply opacity styling when unit is locked", () => {
      const props = { ...getDefaultProps(), isUnitLocked: true };
      const { container } = render(<RateFrequencySection {...props} />);

      // There should be one locked tabs container (unit)
      const lockedContainers = container.querySelectorAll('.opacity-70.cursor-not-allowed');
      expect(lockedContainers.length).toBeGreaterThanOrEqual(1);
    });

    it("should apply opacity styling to both when both are locked", () => {
      const props = {
        ...getDefaultProps(),
        mode: "edit" as const,
        isFrequencyLocked: true,
        isUnitLocked: true,
      };
      const { container } = render(<RateFrequencySection {...props} />);

      // Both frequency and unit tabs should have the locked styling
      const lockedContainers = container.querySelectorAll('.opacity-70.cursor-not-allowed');
      expect(lockedContainers.length).toBe(2);
    });
  });
});
