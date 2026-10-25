import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { NatureFactorCvHeaderExtra } from "@/components/modules/assets/configuration/master-data/weightage-mastercv/natureFactorCv/NatureFactorCvHeaderExtra";

// Minimal mock for next-intl useTranslations return type consumed by the component
vi.mock("next-intl", () => ({
    useTranslations: (ns: string) => (key: string) => `${ns}.${key}`,
}));

const mockT = (key: string) => key;
const mockTW = (key: string, params?: Record<string, unknown>) => {
    const map: Record<string, string> = {
        "common.buttons.apply": "Apply",
        "common.buttons.clear": "Clear",
        "common.buttons.update": "Update",
        "common.buttons.cancel": "Cancel",
        "common.buttons.generateAll": "Generate All",
        "common.buttons.generating": "Generating...",
        "common.buttons.updating": "Updating...",
        "common.labels.pendingRecordCreates": params?.count !== undefined ? `${params.count} pending creates` : "pending creates",
    };
    return map[key] ?? key;
};

const constructionTypeOptions = [
    { label: "RCC", value: "1" },
    { label: "Timber", value: "2" },
];

const assessmentYearOptions = [{ label: "2024-25", value: "2024" }];

function buildDefaultProps(overrides = {}) {
    return {
        t: mockT as unknown as ReturnType<typeof useTranslations>,
        tW: mockTW as unknown as ReturnType<typeof useTranslations>,
        assessmentYearOptions,
        constructionTypeOptions,
        selectedYear: "",
        constructionType: "",
        factorValue: "0.00",
        setFactorValue: vi.fn(),
        handleAssessmentYearChange: vi.fn(),
        handleConstructionTypeChange: vi.fn(),
        handleGenerateAll: vi.fn(),
        handleApplyFilter: vi.fn(),
        handleClearAll: vi.fn(),
        handleBulkUpdate: vi.fn(),
        hasNewRecords: false,
        newRecordsCount: 0,
        isGeneratingAll: false,
        isBulkUpdating: false,
        isUpdating: false,
        isApplyDisabled: false,
        isBulkUpdateDisabled: true,
        ...overrides,
    };
}

describe("NatureFactorCvHeaderExtra – rendering", () => {
    it("renders Apply, Clear, Update, Cancel, GenerateAll buttons", () => {
        render(<NatureFactorCvHeaderExtra {...buildDefaultProps()} />);
        expect(screen.getByRole("button", { name: /apply/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /update/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /generate all/i })).toBeInTheDocument();
    });

    it("does NOT render pending badge when hasNewRecords is false", () => {
        render(<NatureFactorCvHeaderExtra {...buildDefaultProps({ hasNewRecords: false })} />);
        expect(screen.queryByText(/pending creates/i)).not.toBeInTheDocument();
    });

    it("renders pending badge with count when hasNewRecords is true", () => {
        render(<NatureFactorCvHeaderExtra {...buildDefaultProps({ hasNewRecords: true, newRecordsCount: 3 })} />);
        expect(screen.getByText(/3 pending creates/i)).toBeInTheDocument();
    });

    it("shows 'Generating...' label when isGeneratingAll is true", () => {
        render(<NatureFactorCvHeaderExtra {...buildDefaultProps({ isGeneratingAll: true, hasNewRecords: true })} />);
        expect(screen.getByRole("button", { name: /generating/i })).toBeInTheDocument();
    });

    it("shows 'Updating...' label when isBulkUpdating is true", () => {
        render(<NatureFactorCvHeaderExtra {...buildDefaultProps({ isBulkUpdating: true, isBulkUpdateDisabled: false })} />);
        expect(screen.getByRole("button", { name: /updating/i })).toBeInTheDocument();
    });
});

describe("NatureFactorCvHeaderExtra – Apply button", () => {
    it("calls handleApplyFilter when Apply is clicked", () => {
        const handleApplyFilter = vi.fn();
        render(<NatureFactorCvHeaderExtra {...buildDefaultProps({ handleApplyFilter, isApplyDisabled: false })} />);
        fireEvent.click(screen.getByRole("button", { name: /apply/i }));
        expect(handleApplyFilter).toHaveBeenCalledTimes(1);
    });

    it("Apply button is disabled when isApplyDisabled is true", () => {
        render(<NatureFactorCvHeaderExtra {...buildDefaultProps({ isApplyDisabled: true })} />);
        expect(screen.getByRole("button", { name: /apply/i })).toBeDisabled();
    });
});

describe("NatureFactorCvHeaderExtra – Clear button", () => {
    it("calls handleClearAll when Clear is clicked", () => {
        const handleClearAll = vi.fn();
        render(<NatureFactorCvHeaderExtra {...buildDefaultProps({ handleClearAll })} />);
        fireEvent.click(screen.getByRole("button", { name: /^clear$/i }));
        expect(handleClearAll).toHaveBeenCalledTimes(1);
    });
});

describe("NatureFactorCvHeaderExtra – Update button", () => {
    it("Update button is disabled when isBulkUpdateDisabled is true", () => {
        render(<NatureFactorCvHeaderExtra {...buildDefaultProps({ isBulkUpdateDisabled: true })} />);
        expect(screen.getByRole("button", { name: /^update$/i })).toBeDisabled();
    });

    it("calls handleBulkUpdate when Update is clicked and not disabled", () => {
        const handleBulkUpdate = vi.fn();
        render(<NatureFactorCvHeaderExtra {...buildDefaultProps({ isBulkUpdateDisabled: false, handleBulkUpdate })} />);
        fireEvent.click(screen.getByRole("button", { name: /^update$/i }));
        expect(handleBulkUpdate).toHaveBeenCalledTimes(1);
    });
});

describe("NatureFactorCvHeaderExtra – Cancel button", () => {
    it("calls handleClearAll when Cancel is clicked", () => {
        const handleClearAll = vi.fn();
        render(<NatureFactorCvHeaderExtra {...buildDefaultProps({ handleClearAll })} />);
        fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
        expect(handleClearAll).toHaveBeenCalledTimes(1);
    });
});

describe("NatureFactorCvHeaderExtra – GenerateAll button", () => {
    it("GenerateAll button is disabled when hasNewRecords is false", () => {
        render(<NatureFactorCvHeaderExtra {...buildDefaultProps({ hasNewRecords: false })} />);
        expect(screen.getByRole("button", { name: /generate all/i })).toBeDisabled();
    });

    it("GenerateAll button is disabled when isGeneratingAll is true", () => {
        render(<NatureFactorCvHeaderExtra {...buildDefaultProps({ hasNewRecords: true, isGeneratingAll: true })} />);
        expect(screen.getByRole("button", { name: /generating/i })).toBeDisabled();
    });

    it("calls handleGenerateAll when button is clicked and enabled", () => {
        const handleGenerateAll = vi.fn();
        render(<NatureFactorCvHeaderExtra {...buildDefaultProps({ hasNewRecords: true, handleGenerateAll })} />);
        fireEvent.click(screen.getByRole("button", { name: /generate all/i }));
        expect(handleGenerateAll).toHaveBeenCalledTimes(1);
    });
});

describe("NatureFactorCvHeaderExtra – factor input", () => {
    it("renders the factor number input", () => {
        render(<NatureFactorCvHeaderExtra {...buildDefaultProps()} />);
        const input = screen.getByPlaceholderText("placeholders.factor");
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute("type", "number");
    });

    it("calls setFactorValue on valid input change", () => {
        const setFactorValue = vi.fn();
        render(<NatureFactorCvHeaderExtra {...buildDefaultProps({ setFactorValue, factorValue: "0.00" })} />);
        fireEvent.change(screen.getByPlaceholderText("placeholders.factor"), { target: { value: "2.5" } });
        expect(setFactorValue).toHaveBeenCalledWith("2.5");
    });

    it("prevents minus key entry via keydown", () => {
        render(<NatureFactorCvHeaderExtra {...buildDefaultProps()} />);
        const input = screen.getByPlaceholderText("placeholders.factor");
        const event = new KeyboardEvent("keydown", { key: "-", bubbles: true, cancelable: true });
        input.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
    });

    it("restricts input to two decimal places", () => {
        const setFactorValue = vi.fn();
        render(<NatureFactorCvHeaderExtra {...buildDefaultProps({ setFactorValue, factorValue: "0.00" })} />);
        fireEvent.change(screen.getByPlaceholderText("placeholders.factor"), { target: { value: "1.234" } });
        expect(setFactorValue).toHaveBeenCalledWith("1.23");
    });
});
