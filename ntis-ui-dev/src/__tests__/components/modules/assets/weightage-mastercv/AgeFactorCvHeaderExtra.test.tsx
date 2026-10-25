import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { AgeFactorCvHeaderExtra } from "@/components/modules/assets/configuration/master-data/weightage-mastercv/ageFactorCv/AgeFactorCvHeaderExtra";

// Minimal mock for next-intl useTranslations return type consumed by the component
vi.mock("next-intl", () => ({
    useTranslations: (ns: string) => (key: string) => `${ns}.${key}`,
}));

const mockT = (key: string) => key;
const mockTW = (key: string, params?: Record<string, string | number>) => {
    const map: Record<string, string | ((p?: Record<string, string | number>) => string)> = {
        "common.buttons.apply": "Apply",
        "common.buttons.clear": "Clear",
        "common.buttons.update": "Update",
        "common.buttons.cancel": "Cancel",
        "common.buttons.generateAll": "Generate All",
        "common.buttons.generating": "Generating...",
        "common.buttons.updating": "Updating...",
        "common.buttons.add": "Add",
        "common.buttons.cancel_btn": "Cancel",
        "common.labels.pendingRecordCreates": (p?: Record<string, string | number>) => p?.count !== undefined ? `${p.count} pending creates` : "pending creates",
    };
    const value = map[key];
    if (typeof value === "function") return value(params);
    return value ?? key;
};

const assessmentYearOptions = [{ label: "2024-25", value: "2024" }];
const constructionTypeOptions = [{ label: "RCC", value: "1" }];
const ageRangeOptions = [{ label: "0-10", value: "0-10" }];

function buildDefaultProps(overrides = {}) {
    return {
        t: mockT,
        tW: mockTW,
        assessmentYearOptions,
        constructionTypeOptions,
        ageRangeOptions,
        selectedYear: "",
        constructionType: "",
        selectedAgeRange: "",
        ageFrom: "",
        ageTo: "",
        factorValue: "0.00",
        hasNewRecords: false,
        newRecordsCount: 0,
        canGenerateAll: true,
        isGeneratingAll: false,
        isBulkUpdating: false,
        isUpdating: false,
        dataLength: 10,
        isAddYearRangeModalOpen: false,
        setIsAddYearRangeModalOpen: vi.fn(),
        handleAssessmentYearChange: vi.fn(),
        handleConstructionTypeChange: vi.fn(),
        handleAgeRangeChange: vi.fn(),
        setAgeFrom: vi.fn(),
        setAgeTo: vi.fn(),
        setFactorValue: vi.fn(),
        handleAddAgeRange: vi.fn(),
        handleApplyFilter: vi.fn(),
        handleClearAll: vi.fn(),
        handleBulkUpdate: vi.fn(),
        handleGenerateAll: vi.fn(),
        editableRowsCount: 0,
        ...overrides,
    };
}

describe("AgeFactorCvHeaderExtra – rendering", () => {
    it("renders Apply, Clear, Update, Cancel, GenerateAll buttons", () => {
        render(<AgeFactorCvHeaderExtra {...buildDefaultProps()} />);
        expect(screen.getByRole("button", { name: /apply/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /^update$/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /generate all/i })).toBeInTheDocument();
    });

    it("does NOT render pending badge when hasNewRecords is false", () => {
        render(<AgeFactorCvHeaderExtra {...buildDefaultProps({ hasNewRecords: false })} />);
        expect(screen.queryByText(/pending creates/i)).not.toBeInTheDocument();
    });

    it("renders pending badge with count when hasNewRecords is true", () => {
        render(<AgeFactorCvHeaderExtra {...buildDefaultProps({ hasNewRecords: true, newRecordsCount: 3 })} />);
        expect(screen.getByText(/3 pending creates/i)).toBeInTheDocument();
    });

    it("shows 'Generating...' label when isGeneratingAll is true", () => {
        // Since Generate All is an AddButton, it uses tW('common.buttons.generating') when loading
        const props = buildDefaultProps({ 
            isGeneratingAll: true, 
            hasNewRecords: true,
            tW: (key: string) => key === 'common.buttons.generating' ? 'Generating...' : key
        });
        render(<AgeFactorCvHeaderExtra {...props} />);
        expect(screen.getByRole("button", { name: /generating/i })).toBeInTheDocument();
    });
});

describe("AgeFactorCvHeaderExtra – Add Age Range Modal", () => {
    it("shows modal when isAddYearRangeModalOpen is true", () => {
        render(<AgeFactorCvHeaderExtra {...buildDefaultProps({ isAddYearRangeModalOpen: true })} />);
        expect(screen.getByText(/labels.addAgeRange/i)).toBeInTheDocument();
    });

    it("calls handleAddAgeRange when Add button in modal is clicked", () => {
        const handleAddAgeRange = vi.fn();
        render(<AgeFactorCvHeaderExtra {...buildDefaultProps({ isAddYearRangeModalOpen: true, handleAddAgeRange })} />);
        // Use exact name "Add" to distinguish from "buttons.addAge"
        fireEvent.click(screen.getByRole("button", { name: /^Add$/ }));
        expect(handleAddAgeRange).toHaveBeenCalledTimes(1);
    });

    it("calls setIsAddYearRangeModalOpen(false) when Cancel button in modal is clicked", () => {
        const setIsAddYearRangeModalOpen = vi.fn();
        render(<AgeFactorCvHeaderExtra {...buildDefaultProps({ isAddYearRangeModalOpen: true, setIsAddYearRangeModalOpen })} />);
        
        // Use role to find the modal
        const modal = screen.getByRole('dialog');
        const modalCancelBtn = within(modal).getByRole("button", { name: /cancel/i });
        
        fireEvent.click(modalCancelBtn);
        expect(setIsAddYearRangeModalOpen).toHaveBeenCalledWith(false);
    });
});

describe("AgeFactorCvHeaderExtra – Action Buttons", () => {
    it("calls handleApplyFilter when Apply is clicked", () => {
        const handleApplyFilter = vi.fn();
        render(<AgeFactorCvHeaderExtra {...buildDefaultProps({ handleApplyFilter, selectedYear: "2024" })} />);
        fireEvent.click(screen.getByRole("button", { name: /apply/i }));
        expect(handleApplyFilter).toHaveBeenCalledTimes(1);
    });

    it("Apply button is disabled when no filters are selected", () => {
        render(<AgeFactorCvHeaderExtra {...buildDefaultProps({ selectedYear: "", constructionType: "", selectedAgeRange: "", dataLength: 10 })} />);
        const applyBtn = screen.getByRole("button", { name: /apply/i });
        expect(applyBtn).toBeDisabled();
    });

    it("calls handleBulkUpdate when Update is clicked", () => {
        const handleBulkUpdate = vi.fn();
        render(<AgeFactorCvHeaderExtra {...buildDefaultProps({ handleBulkUpdate, editableRowsCount: 5 })} />);
        fireEvent.click(screen.getByRole("button", { name: /^update$/i }));
        expect(handleBulkUpdate).toHaveBeenCalledTimes(1);
    });

    it("Update button is disabled when editableRowsCount is 0", () => {
        render(<AgeFactorCvHeaderExtra {...buildDefaultProps({ editableRowsCount: 0 })} />);
        expect(screen.getByRole("button", { name: /^update$/i })).toBeDisabled();
    });
});

describe("AgeFactorCvHeaderExtra – factor input", () => {
    it("renders the factor number input", () => {
        render(<AgeFactorCvHeaderExtra {...buildDefaultProps()} />);
        const input = screen.getByPlaceholderText("0.00");
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute("type", "number");
    });

    it("calls setFactorValue on valid input change", () => {
        const setFactorValue = vi.fn();
        render(<AgeFactorCvHeaderExtra {...buildDefaultProps({ setFactorValue, factorValue: "0.00" })} />);
        fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "2.5" } });
        expect(setFactorValue).toHaveBeenCalledWith("2.5");
    });

    it("restricts input to two decimal places", () => {
        const setFactorValue = vi.fn();
        render(<AgeFactorCvHeaderExtra {...buildDefaultProps({ setFactorValue, factorValue: "0.00" })} />);
        fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "1.234" } });
        expect(setFactorValue).toHaveBeenCalledWith("1.23");
    });
});
