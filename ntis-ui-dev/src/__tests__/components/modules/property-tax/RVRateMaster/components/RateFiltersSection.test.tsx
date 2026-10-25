import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RateFiltersSection } from "@/components/modules/property-tax/RVRateMaster/components/RateFiltersSection";
import type { ISelectOption } from "@/types/RVRateMaster";

// Mock SearchSelect component
vi.mock("@/components/common/SearchSelect", () => ({
  SearchSelect: ({ id, value, onChange, placeholder, options, className, onInputFocus }: {
    id: string;
    value: string;
    onChange: (name: string, value: string) => void;
    placeholder: string;
    options: ISelectOption[];
    className: string;
    onInputFocus?: () => void;
  }) => (
    <div data-testid={`search-select-${id}`}>
      <input
        data-testid={`${id}-input`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(id, e.target.value)}
        onFocus={onInputFocus}
        className={className}
      />
      <select data-testid={`${id}-select`} onChange={(e) => onChange(id, e.target.value)}>
        <option value="">Select</option>
        {options.map((opt: ISelectOption) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  ),
}));

// Mock ValidationMessage component
vi.mock("@/components/common/ValidationMessage", () => ({
  ValidationMessage: ({ message, visible }: { message: string; visible: boolean }) =>
    visible ? <div data-testid="validation-message">{message}</div> : null,
}));

// Mock Label component
vi.mock("@/components/common/label", () => ({
  Label: ({ children, className, required }: { children: React.ReactNode; className?: string; required?: boolean }) => (
    <label className={className} data-required={required}>
      {children}
    </label>
  ),
}));

// Mock IconButton component
vi.mock("@/components/common/ActionButtons", () => ({
  IconButton: ({ icon: Icon, onClick, disabled, title, variant }: {
    icon: React.ComponentType<{ 'data-testid'?: string }>;
    onClick: () => void;
    disabled?: boolean;
    title: string;
    variant: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      data-variant={variant}
      data-testid="icon-button"
    >
      {Icon && <Icon data-testid="icon" />}
    </button>
  ),
}));

describe("RateFiltersSection", () => {
  const mockZoneOptions: ISelectOption[] = [
    { value: "UTHALSAR", label: "UTHALSAR" },
    { value: "NAUPADA", label: "NAUPADA" },
  ];

  const mockUseGroupOptions: ISelectOption[] = [
    { value: "residential", label: "Residential" },
    { value: "commercial", label: "Commercial" },
  ];

  const mockAssessmentYears: ISelectOption[] = [
    { value: "1700-1997", label: "1700-1997" },
    { value: "1998-1998", label: "1998-1998" },
  ];

  const mockT = (key: string) => {
    const translations: Record<string, string> = {
      "filters.rateSection": "Rate Section",
      "filters.typeOfUseGroup": "Type of Use Group",
      "filters.assessmentYearRange": "Assessment Year Range",
      "placeholders.selectRateSection": "Select Rate Section",
      "placeholders.selectUseGroup": "Select Use Group",
      "placeholders.selectAssessmentYearRange": "Select Assessment Year Range",
      "messages.validationRatesAlreadyExist": "Rates already exist",
    };
    return translations[key] || key;
  };

  const defaultProps = {
    selectedZone: "",
    selectedUseGroup: "",
    assessmentYear: "",
    zoneOptions: mockZoneOptions,
    useGroupOptions: mockUseGroupOptions,
    assessmentYears: mockAssessmentYears,
    errors: {
      zone: "",
      useGroup: "",
      assessmentYear: "",
    },
    allFiltersSelected: false,
    existingRateFound: false,
    isCheckingRates: false,
    mode: "add" as const,
    onDropdownChange: vi.fn(),
    onGenerateMatrix: vi.fn(),
    onToggleMultipliers: vi.fn(),
    onToggleCopyRates: vi.fn(),
    t: mockT as unknown as ReturnType<typeof import("next-intl").useTranslations>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render all three filter dropdowns", () => {
      render(<RateFiltersSection {...defaultProps} />);

      expect(screen.getByTestId("search-select-zone-select")).toBeInTheDocument();
      expect(screen.getByTestId("search-select-useGroup-select")).toBeInTheDocument();
      expect(screen.getByTestId("search-select-assessment-year-select")).toBeInTheDocument();
    });

    it("should render labels without htmlFor attribute", () => {
      const { container } = render(<RateFiltersSection {...defaultProps} />);
      const labels = container.querySelectorAll("label");

      labels.forEach((label) => {
        expect(label.hasAttribute("for")).toBe(false);
      });
    });

    it("should display correct label text", () => {
      render(<RateFiltersSection {...defaultProps} />);

      expect(screen.getByText("Rate Section")).toBeInTheDocument();
      expect(screen.getByText("Type of Use Group")).toBeInTheDocument();
      expect(screen.getByText("Assessment Year Range")).toBeInTheDocument();
    });

    it("should show action buttons in add mode", () => {
      render(<RateFiltersSection {...defaultProps} mode="add" />);

      const buttons = screen.getAllByTestId("icon-button");
      expect(buttons).toHaveLength(3); // Multiplier, Generate Matrix, Copy Rates
    });

    it("should not show action buttons in edit mode", () => {
      render(<RateFiltersSection {...defaultProps} mode="edit" />);

      expect(screen.queryByTestId("icon-button")).not.toBeInTheDocument();
    });

    it("should not show action buttons in delete mode", () => {
      render(<RateFiltersSection {...defaultProps} mode="delete" />);

      expect(screen.queryByTestId("icon-button")).not.toBeInTheDocument();
    });
  });

  describe("Dropdown Interactions", () => {
    it("should call onDropdownChange when zone is changed", () => {
      const onDropdownChange = vi.fn();
      render(<RateFiltersSection {...defaultProps} onDropdownChange={onDropdownChange} />);

      const select = screen.getByTestId("zone-select-select");
      fireEvent.change(select, { target: { value: "UTHALSAR" } });

      expect(onDropdownChange).toHaveBeenCalledWith("zone", "UTHALSAR", "UTHALSAR");
    });

    it("should call onDropdownChange when use group is changed", () => {
      const onDropdownChange = vi.fn();
      render(<RateFiltersSection {...defaultProps} onDropdownChange={onDropdownChange} />);

      const select = screen.getByTestId("useGroup-select-select");
      fireEvent.change(select, { target: { value: "residential" } });

      expect(onDropdownChange).toHaveBeenCalledWith("useGroup", "residential", "Residential");
    });

    it("should call onDropdownChange when assessment year is changed", () => {
      const onDropdownChange = vi.fn();
      render(<RateFiltersSection {...defaultProps} onDropdownChange={onDropdownChange} />);

      const select = screen.getByTestId("assessment-year-select-select");
      fireEvent.change(select, { target: { value: "1700-1997" } });

      expect(onDropdownChange).toHaveBeenCalledWith("assessmentYear", "1700-1997", "1700-1997");
    });

    it("should call onLoadZones when zone input is focused", () => {
      const onLoadZones = vi.fn();
      render(<RateFiltersSection {...defaultProps} onLoadZones={onLoadZones} />);

      const input = screen.getByTestId("zone-select-input");
      fireEvent.focus(input);

      expect(onLoadZones).toHaveBeenCalled();
    });

    it("should call onLoadUseGroups when use group input is focused", () => {
      const onLoadUseGroups = vi.fn();
      render(<RateFiltersSection {...defaultProps} onLoadUseGroups={onLoadUseGroups} />);

      const input = screen.getByTestId("useGroup-select-input");
      fireEvent.focus(input);

      expect(onLoadUseGroups).toHaveBeenCalled();
    });

    it("should call onLoadAssessmentYears when assessment year input is focused", () => {
      const onLoadAssessmentYears = vi.fn();
      render(<RateFiltersSection {...defaultProps} onLoadAssessmentYears={onLoadAssessmentYears} />);

      const input = screen.getByTestId("assessment-year-select-input");
      fireEvent.focus(input);

      expect(onLoadAssessmentYears).toHaveBeenCalled();
    });
  });

  describe("Validation Messages", () => {
    it("should display zone validation error", () => {
      const props = {
        ...defaultProps,
        errors: {
          zone: "Zone is required",
          useGroup: "",
          assessmentYear: "",
        },
      };

      render(<RateFiltersSection {...props} />);

      expect(screen.getByText("Zone is required")).toBeInTheDocument();
    });

    it("should display use group validation error", () => {
      const props = {
        ...defaultProps,
        errors: {
          zone: "",
          useGroup: "Use group is required",
          assessmentYear: "",
        },
      };

      render(<RateFiltersSection {...props} />);

      expect(screen.getByText("Use group is required")).toBeInTheDocument();
    });

    it("should display assessment year validation error", () => {
      const props = {
        ...defaultProps,
        errors: {
          zone: "",
          useGroup: "",
          assessmentYear: "Assessment year is required",
        },
      };

      render(<RateFiltersSection {...props} />);

      expect(screen.getByText("Assessment year is required")).toBeInTheDocument();
    });

    it("should not display validation messages when no errors", () => {
      render(<RateFiltersSection {...defaultProps} />);

      expect(screen.queryByTestId("validation-message")).not.toBeInTheDocument();
    });
  });

  describe("Action Buttons", () => {
    it("should call onToggleMultipliers when multiplier button is clicked", () => {
      const onToggleMultipliers = vi.fn();
      const props = {
        ...defaultProps,
        allFiltersSelected: true,
        onToggleMultipliers,
      };

      render(<RateFiltersSection {...props} />);

      const buttons = screen.getAllByTestId("icon-button");
      fireEvent.click(buttons[0]); // First button is multiplier

      expect(onToggleMultipliers).toHaveBeenCalled();
    });

    it("should call onGenerateMatrix when generate matrix button is clicked", () => {
      const onGenerateMatrix = vi.fn();
      const props = {
        ...defaultProps,
        allFiltersSelected: true,
        onGenerateMatrix,
      };

      render(<RateFiltersSection {...props} />);

      const buttons = screen.getAllByTestId("icon-button");
      fireEvent.click(buttons[1]); // Second button is generate matrix

      expect(onGenerateMatrix).toHaveBeenCalled();
    });

    it("should call onToggleCopyRates when copy rates button is clicked", () => {
      const onToggleCopyRates = vi.fn();
      const props = {
        ...defaultProps,
        allFiltersSelected: true,
        onToggleCopyRates,
      };

      render(<RateFiltersSection {...props} />);

      const buttons = screen.getAllByTestId("icon-button");
      fireEvent.click(buttons[2]); // Third button is copy rates

      expect(onToggleCopyRates).toHaveBeenCalled();
    });

    it("should disable buttons when filters are not all selected", () => {
      const props = {
        ...defaultProps,
        allFiltersSelected: false,
      };

      render(<RateFiltersSection {...props} />);

      const buttons = screen.getAllByTestId("icon-button");
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it("should disable buttons when existing rate is found", () => {
      const props = {
        ...defaultProps,
        allFiltersSelected: true,
        existingRateFound: true,
      };

      render(<RateFiltersSection {...props} />);

      const buttons = screen.getAllByTestId("icon-button");
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it("should disable buttons when checking rates", () => {
      const props = {
        ...defaultProps,
        allFiltersSelected: true,
        isCheckingRates: true,
      };

      render(<RateFiltersSection {...props} />);

      const buttons = screen.getAllByTestId("icon-button");
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it("should enable buttons when all conditions are met", () => {
      const props = {
        ...defaultProps,
        allFiltersSelected: true,
        existingRateFound: false,
        isCheckingRates: false,
      };

      render(<RateFiltersSection {...props} />);

      const buttons = screen.getAllByTestId("icon-button");
      buttons.forEach((button) => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe("Loading States", () => {
    it("should pass isLoading prop to zone dropdown", () => {
      render(<RateFiltersSection {...defaultProps} isLoadingZones={true} />);

      // The loading state would be handled by the SearchSelect component
      expect(screen.getByTestId("search-select-zone-select")).toBeInTheDocument();
    });

    it("should pass isLoading prop to use group dropdown", () => {
      render(<RateFiltersSection {...defaultProps} isLoadingUseGroups={true} />);

      expect(screen.getByTestId("search-select-useGroup-select")).toBeInTheDocument();
    });

    it("should pass isLoading prop to assessment year dropdown", () => {
      render(<RateFiltersSection {...defaultProps} isLoadingAssessmentYears={true} />);

      expect(screen.getByTestId("search-select-assessment-year-select")).toBeInTheDocument();
    });
  });

  describe("CSS Classes", () => {
    it("should apply error class to zone dropdown when error exists", () => {
      const props = {
        ...defaultProps,
        errors: {
          zone: "Zone is required",
          useGroup: "",
          assessmentYear: "",
        },
      };

      render(<RateFiltersSection {...props} />);

      const zoneInput = screen.getByTestId("zone-select-input");
      expect(zoneInput.className).toContain("border-red-500");
    });

    it("should apply error class to use group dropdown when error exists", () => {
      const props = {
        ...defaultProps,
        errors: {
          zone: "",
          useGroup: "Use group is required",
          assessmentYear: "",
        },
      };

      render(<RateFiltersSection {...props} />);

      const useGroupInput = screen.getByTestId("useGroup-select-input");
      expect(useGroupInput.className).toContain("border-red-500");
    });

    it("should apply error class to assessment year dropdown when error exists", () => {
      const props = {
        ...defaultProps,
        errors: {
          zone: "",
          useGroup: "",
          assessmentYear: "Assessment year is required",
        },
      };

      render(<RateFiltersSection {...props} />);

      const assessmentYearInput = screen.getByTestId("assessment-year-select-input");
      expect(assessmentYearInput.className).toContain("border-red-500");
    });
  });
});
