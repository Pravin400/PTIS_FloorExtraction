import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FloorCvHeaderExtra } from "@/components/modules/assets/configuration/master-data/weightage-mastercv/floorFactorCv/FloorCvHeaderExtra";

// Minimal mock for next-intl useTranslations return type consumed by the component
vi.mock("next-intl", () => ({
    useTranslations: (ns: string) => (key: string) => `${ns}.${key}`,
}));

const mockT = (key: string) => key;
const mockTW = (key: string, params?: Record<string, unknown>) => {
    const map: Record<string, string | ((p?: Record<string, unknown>) => string)> = {
        "common.buttons.apply": "Apply",
        "common.buttons.clear": "Clear",
        "common.buttons.update": "Update",
        "common.buttons.cancel": "Cancel",
        "common.buttons.generateAll": "Generate All",
        "common.buttons.generating": "Generating...",
        "common.buttons.updating": "Updating...",
        "common.labels.pendingRecordCreates": (p?: Record<string, unknown>) => p?.count !== undefined ? `${p.count} pending creates` : "pending creates",
        "common.messages.valueExceedsMax": "Value exceeds max",
    };
    const value = map[key];
    if (typeof value === "function") return value(params);
    return value ?? key;
};

const floorOptions = [
    { label: "Ground Floor", value: "1" },
    { label: "First Floor", value: "2" },
];

const assessmentYearOptions = [{ label: "2024-25", value: "2024" }];

const liftStatusOptions = [
    { label: "Both", value: "both" },
    { label: "With Lift", value: "withLift" },
    { label: "Without Lift", value: "withoutLift" },
];

function buildDefaultProps(overrides = {}) {
    return {
        t: mockT as ReturnType<typeof import("next-intl").useTranslations>,
        tW: mockTW as ReturnType<typeof import("next-intl").useTranslations>,
        assessmentYearOptions,
        floorOptions,
        liftStatusOptions,
        selectedYear: "",
        fromFloor: "",
        toFloor: "",
        liftStatus: "both",
        factorValue: "0.00",
        isApplyDisabled: false,
        isBulkUpdateDisabled: true,
        isGeneratingAll: false,
        isBulkUpdating: false,
        isUpdating: false,
        hasNewRecords: false,
        newRecordsCount: 0,
        handleAssessmentYearChange: vi.fn(),
        setFromFloor: vi.fn(),
        setToFloor: vi.fn(),
        setLiftStatus: vi.fn(),
        setFactorValue: vi.fn(),
        handleApplyFilter: vi.fn(),
        handleClearAll: vi.fn(),
        handleBulkUpdate: vi.fn(),
        handleGenerateAll: vi.fn(),
        addToast: vi.fn(),
        ...overrides,
    };
}

describe("FloorCvHeaderExtra – rendering", () => {
    it("renders Apply, Clear, Update, Cancel, GenerateAll buttons", () => {
        render(<FloorCvHeaderExtra {...buildDefaultProps()} />);
        expect(screen.getByRole("button", { name: /apply/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /update/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /generate all/i })).toBeInTheDocument();
    });

    it("does NOT render pending badge when hasNewRecords is false", () => {
        render(<FloorCvHeaderExtra {...buildDefaultProps({ hasNewRecords: false })} />);
        expect(screen.queryByText(/pending creates/i)).not.toBeInTheDocument();
    });

    it("renders pending badge with count when hasNewRecords is true", () => {
        render(<FloorCvHeaderExtra {...buildDefaultProps({ hasNewRecords: true, newRecordsCount: 3 })} />);
        expect(screen.getByText(/3 pending creates/i)).toBeInTheDocument();
    });

    it("shows 'Generating...' label when isGeneratingAll is true", () => {
        render(<FloorCvHeaderExtra {...buildDefaultProps({ isGeneratingAll: true, hasNewRecords: true })} />);
        expect(screen.getByRole("button", { name: /generating/i })).toBeInTheDocument();
    });

    it("shows 'Updating...' label when isBulkUpdating is true", () => {
        render(<FloorCvHeaderExtra {...buildDefaultProps({ isBulkUpdating: true, isBulkUpdateDisabled: false })} />);
        expect(screen.getByRole("button", { name: /updating/i })).toBeInTheDocument();
    });
});

describe("FloorCvHeaderExtra – Apply button", () => {
    it("calls handleApplyFilter when Apply is clicked", () => {
        const handleApplyFilter = vi.fn();
        render(<FloorCvHeaderExtra {...buildDefaultProps({ handleApplyFilter, isApplyDisabled: false })} />);
        fireEvent.click(screen.getByRole("button", { name: /apply/i }));
        expect(handleApplyFilter).toHaveBeenCalledTimes(1);
    });

    it("Apply button is disabled when isApplyDisabled is true", () => {
        render(<FloorCvHeaderExtra {...buildDefaultProps({ isApplyDisabled: true })} />);
        expect(screen.getByRole("button", { name: /apply/i })).toBeDisabled();
    });
});

describe("FloorCvHeaderExtra – Clear button", () => {
    it("calls handleClearAll when Clear is clicked", () => {
        const handleClearAll = vi.fn();
        render(<FloorCvHeaderExtra {...buildDefaultProps({ handleClearAll })} />);
        fireEvent.click(screen.getByRole("button", { name: /^clear$/i }));
        expect(handleClearAll).toHaveBeenCalledTimes(1);
    });
});

describe("FloorCvHeaderExtra – Update button", () => {
    it("Update button is disabled when isBulkUpdateDisabled is true", () => {
        render(<FloorCvHeaderExtra {...buildDefaultProps({ isBulkUpdateDisabled: true })} />);
        expect(screen.getByRole("button", { name: /^update$/i })).toBeDisabled();
    });

    it("calls handleBulkUpdate when Update is clicked and not disabled", () => {
        const handleBulkUpdate = vi.fn();
        render(<FloorCvHeaderExtra {...buildDefaultProps({ isBulkUpdateDisabled: false, handleBulkUpdate })} />);
        fireEvent.click(screen.getByRole("button", { name: /^update$/i }));
        expect(handleBulkUpdate).toHaveBeenCalledTimes(1);
    });
});

describe("FloorCvHeaderExtra – Cancel button", () => {
    it("calls handleClearAll when Cancel is clicked", () => {
        const handleClearAll = vi.fn();
        render(<FloorCvHeaderExtra {...buildDefaultProps({ handleClearAll })} />);
        fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
        expect(handleClearAll).toHaveBeenCalledTimes(1);
    });
});

describe("FloorCvHeaderExtra – GenerateAll button", () => {
    it("GenerateAll button is disabled when hasNewRecords is false", () => {
        render(<FloorCvHeaderExtra {...buildDefaultProps({ hasNewRecords: false })} />);
        expect(screen.getByRole("button", { name: /generate all/i })).toBeDisabled();
    });

    it("GenerateAll button is disabled when isGeneratingAll is true", () => {
        render(<FloorCvHeaderExtra {...buildDefaultProps({ hasNewRecords: true, isGeneratingAll: true })} />);
        expect(screen.getByRole("button", { name: /generating/i })).toBeDisabled();
    });

    it("calls handleGenerateAll when button is clicked and enabled", () => {
        const handleGenerateAll = vi.fn();
        render(<FloorCvHeaderExtra {...buildDefaultProps({ hasNewRecords: true, handleGenerateAll })} />);
        fireEvent.click(screen.getByRole("button", { name: /generate all/i }));
        expect(handleGenerateAll).toHaveBeenCalledTimes(1);
    });
});

describe("FloorCvHeaderExtra – factor input", () => {
    it("renders the factor number input", () => {
        render(<FloorCvHeaderExtra {...buildDefaultProps()} />);
        const input = screen.getByPlaceholderText("0.00");
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute("type", "number");
    });

    it("calls setFactorValue on valid input change", () => {
        const setFactorValue = vi.fn();
        render(<FloorCvHeaderExtra {...buildDefaultProps({ setFactorValue, factorValue: "0.00" })} />);
        fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "2.5" } });
        expect(setFactorValue).toHaveBeenCalledWith("2.5");
    });

    it("calls addToast on excessive value", () => {
        const addToast = vi.fn();
        render(<FloorCvHeaderExtra {...buildDefaultProps({ addToast })} />);
        fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "1000000" } });
        expect(addToast).toHaveBeenCalledWith("error", "Value exceeds max");
    });

    it("prevents minus key entry via keydown", () => {
        render(<FloorCvHeaderExtra {...buildDefaultProps()} />);
        const input = screen.getByPlaceholderText("0.00");
        const event = new KeyboardEvent("keydown", { key: "-", bubbles: true, cancelable: true });
        input.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
    });

    it("restricts input to two decimal places", () => {
        const setFactorValue = vi.fn();
        render(<FloorCvHeaderExtra {...buildDefaultProps({ setFactorValue, factorValue: "0.00" })} />);
        fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "1.234" } });
        expect(setFactorValue).toHaveBeenCalledWith("1.23");
    });
});
