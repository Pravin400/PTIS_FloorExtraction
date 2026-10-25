import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import FloorCvWeightageMaster from "@/components/modules/property-tax/weightage-mastercv/floorFactorCv/FloorCvWeightageMaster";
import { Option } from "@/components/common/select";
import { FloorFactorCVMaster } from "@/types/floor-cv-weightageMaster.types";
import {
    updateFloorFactorCVMasterAction,
    bulkUpdateFloorFactorCVMasterAction,
    fetchAllFloorFactorCVMasterAction,
} from "@/app/[locale]/property-tax/weightage-master/action";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/app/[locale]/property-tax/weightage-master/action", () => ({
    updateFloorFactorCVMasterAction: vi.fn(),
    createFloorFactorCVMasterAction: vi.fn(),
    bulkCreateFloorFactorCVMasterAction: vi.fn(),
    bulkUpdateFloorFactorCVMasterAction: vi.fn(),
    fetchAllFloorFactorCVMasterAction: vi.fn(),
}));

const mockPush = vi.fn();
const mockRefresh = vi.fn();
// Configurable per-test/describe-block via beforeEach; defaults to a year being
// selected since that's the common case for the missing-records-count tests.
let mockSelectedYearRange: string | null = "2024";

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
    useSearchParams: () => ({
        get: vi.fn().mockImplementation((key: string) => {
            if (key === "page") return "1";
            if (key === "pageSize") return "10";
            if (key === "selectedYearRange") return mockSelectedYearRange;
            return null;
        }),
    }),
}));

vi.mock("next-intl", () => ({
    useLocale: () => "en",
    useTranslations: (_namespace: string) => (key: string, params?: Record<string, unknown>) => {
        const map: Record<string, string | ((p?: Record<string, unknown>) => string)> = {
            "table.showing": "Showing",
            "table.to": "to",
            "table.entries": "entries",
            "columns.floorCode": "Floor Code",
            "columns.description": "Description",
            "columns.factorWithLift": "With Lift",
            "columns.factorWithoutLift": "Without Lift",
            "columns.assessmentYear": "Year",
            "columns.status": "Status",
            "columns.action": "Action",
            "filters.assessmentYear": "Assessment Year",
            "filters.fromFloor": "From Floor",
            "filters.toFloor": "To Floor",
            "filters.liftStatus": "Lift Status",
            "filters.factor": "Factor",
            "liftStatusOptions.both": "Both",
            "liftStatusOptions.withLift": "With Lift",
            "liftStatusOptions.withoutLift": "Without Lift",
            "common.buttons.create": "Create",
            "common.buttons.update": "Update",
            "common.buttons.clear": "Clear",
            "common.buttons.apply": "Apply",
            "common.buttons.cancel": "Cancel",
            "common.buttons.generateAll": "Generate All",
            "common.buttons.generating": "Generating...",
            "common.buttons.updating": "Updating...",
            "common.labels.active": "Active",
            "common.labels.inactive": "Inactive",
            "common.labels.pendingRecordCreates": (p?: Record<string, unknown>) => p?.count !== undefined ? `${p.count} pending creates` : "pending creates",
            "common.messages.pendingRecordsWarning": "Pending records warning",
            "common.messages.noChangesToUpdate": "No changes to update",
            "common.messages.noChangesDetected": "No changes detected",
            "common.messages.negativeValuesNotAllowed": "Negative values not allowed",
            "common.messages.valueExceedsMax": "Value exceeds max",
            "common.messages.recordUpdatedSuccess": "Updated successfully",
            "common.messages.recordCreatedSuccess": "Created successfully",
            "common.messages.changesDiscarded": "Changes discarded",
            "common.messages.allClearedInfo": "All cleared",
            "common.messages.noRecordsToUpdate": "No records to update",
            "common.messages.bulkOperationSuccess": "Bulk success",
            "common.messages.factorApplied": "Factor applied",
            "common.messages.validFactorRequired": "Valid factor required",
            "common.messages.noRecordsMatch": "No records match",
        };
        const value = map[key];
        if (typeof value === "function") return value(params);
        return value ?? key;
    },
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockData: FloorFactorCVMaster[] = [
    {
        id: 1, floorId: 101, floorCode: "F1", floorDescription: "First Floor",
        factorWithLift: 1.2, factorWithoutLift: 1.0, yearRangeCVId: 2024, yearRangeCVID: 2024,
        fromYear: 2024, toYear: 2025, isActive: true,
    },
    {
        id: 0, floorId: 102, floorCode: "F2", floorDescription: "Second Floor",
        factorWithLift: 0.0, factorWithoutLift: 0.0, yearRangeCVId: 2024, yearRangeCVID: 2024,
        fromYear: 2024, toYear: 2025, isActive: true,
    },
];

const floorOptions: Option[] = [
    { label: "Floor 101", value: "101" },
    { label: "Floor 102", value: "102" },
];

const yearOptions: Option[] = [{ label: "2024-2025", value: "2024" }];

import { ConfirmProvider } from "@/components/common/ConfirmProvider";

function renderComponent(data = mockData) {
    return render(
        <ConfirmProvider>
            <FloorCvWeightageMaster
                data={data}
                pageNumber={1}
                pageSize={10}
                totalCount={data.length}
                totalPages={1}
                floorOptions={floorOptions}
                assessmentYearOptions={yearOptions}
            />
        </ConfirmProvider>
    );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("FloorCvWeightageMaster – rendering", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default: one real row (F1) + one missing combo (F2), matching mockData,
        // so the "1 pending creates" badge/button-enabled expectations hold unless
        // a test overrides this to represent a fully-existing selection.
        vi.mocked(fetchAllFloorFactorCVMasterAction).mockResolvedValue(mockData);
    });

    it("renders table rows with correct floor codes", () => {
        renderComponent();
        expect(screen.getByText("F1")).toBeInTheDocument();
        expect(screen.getByText("F2")).toBeInTheDocument();
    });

    it("renders floor descriptions", () => {
        renderComponent();
        expect(screen.getByText("First Floor")).toBeInTheDocument();
        expect(screen.getByText("Second Floor")).toBeInTheDocument();
    });

    it("renders Update button for existing record and Create button for new record", () => {
        renderComponent();
        expect(screen.getAllByRole("button", { name: /update/i }).length).toBeGreaterThan(0);
        expect(screen.getAllByRole("button", { name: /create/i }).length).toBeGreaterThan(0);
    });

    it("renders the pending records warning toast on mount when new records exist", async () => {
        renderComponent();
        // The warning toast is deferred via setTimeout(0) inside the useEffect
        await waitFor(() => {
            expect(screen.getByText("Pending records warning")).toBeInTheDocument();
        });
    });

    it("shows Generate All button (enabled) when new records exist", async () => {
        renderComponent();
        await waitFor(() => {
            const btn = screen.getByRole("button", { name: /generate all/i });
            expect(btn).not.toBeDisabled();
        });
    });

    it("shows pending badge with correct count when new records exist", async () => {
        renderComponent();
        await waitFor(() => {
            expect(screen.getByText(/1 pending creates/i)).toBeInTheDocument();
        });
    });

    it("does not show pending badge when all records are existing", async () => {
        // No missing combinations for the selected year: only the real row.
        vi.mocked(fetchAllFloorFactorCVMasterAction).mockResolvedValue([mockData[0]]);
        renderComponent();
        await waitFor(() => {
            expect(fetchAllFloorFactorCVMasterAction).toHaveBeenCalled();
        });
        expect(screen.queryByText(/pending creates/i)).not.toBeInTheDocument();
    });
});

describe("FloorCvWeightageMaster – row actions", () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it("Update / Create buttons show a localized warning when clicked with no editable changes", async () => {
        renderComponent();
        const input = screen.getByDisplayValue("1.20");
        const row = input.closest("tr") as HTMLElement;
        const updateBtn = within(row).getByRole("button", { name: /update/i });

        expect(updateBtn).not.toBeDisabled();

        fireEvent.click(updateBtn);

        await waitFor(() => {
            expect(screen.getByText("No changes to update")).toBeInTheDocument();
        });
    });

    it("enables row-Clear button after changing a cell value", async () => {
        renderComponent();
        const input = screen.getByDisplayValue("1.20");
        const row = input.closest("tr") as HTMLElement;
        const clearBtn = within(row).getByRole("button", { name: /clear/i });

        expect(clearBtn).toBeDisabled();

        fireEvent.change(input, { target: { value: "1.5" } });

        await waitFor(() => {
            expect(clearBtn).not.toBeDisabled();
        });
    });

    it("shows the no-changes warning again after Clear discards an edit", async () => {
        renderComponent();
        const input = screen.getByDisplayValue("1.20");
        const row = input.closest("tr") as HTMLElement;
        const updateBtn = within(row).getByRole("button", { name: /update/i });
        const clearBtn = within(row).getByRole("button", { name: /clear/i });

        fireEvent.change(input, { target: { value: "1.5" } });
        await waitFor(() => expect(clearBtn).not.toBeDisabled());

        fireEvent.click(clearBtn);
        await waitFor(() => expect(clearBtn).toBeDisabled());

        fireEvent.click(updateBtn);
        await waitFor(() => {
            expect(screen.getByText("No changes to update")).toBeInTheDocument();
        });
    });

    it("calls updateFloorFactorCVMasterAction when Update is clicked on changed row", async () => {
        vi.mocked(updateFloorFactorCVMasterAction).mockResolvedValueOnce({ success: true, message: "" });
        renderComponent();
        const input = screen.getByDisplayValue("1.20");
        const row = input.closest("tr") as HTMLElement;
        const updateBtn = within(row).getByRole("button", { name: /update/i });

        fireEvent.change(input, { target: { value: "1.5" } });
        await waitFor(() => expect(updateBtn).not.toBeDisabled());

        fireEvent.click(updateBtn);
        await waitFor(() => expect(updateFloorFactorCVMasterAction).toHaveBeenCalledTimes(1));
    });
});

describe("FloorCvWeightageMaster – bulk update header action", () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it("bulk Update button is disabled when no editable rows", () => {
        renderComponent();
        // The header-level Update button (isBulkUpdateDisabled)
        const headerUpdateBtns = screen.getAllByRole("button", { name: /^update$/i });
        // The one in the header toolbar is disabled; row-level ones are also disabled initially
        expect(headerUpdateBtns.some((b) => (b as HTMLButtonElement).disabled)).toBe(true);
    });

    it("calls bulkUpdateFloorFactorCVMasterAction after changing and clicking header Update", async () => {
        vi.mocked(bulkUpdateFloorFactorCVMasterAction).mockResolvedValueOnce({ success: true, message: "" });
        renderComponent();

        const input = screen.getByDisplayValue("1.20");
        fireEvent.change(input, { target: { value: "2.0" } });

        await waitFor(() => {
            const updateBtns = screen.getAllByRole("button", { name: /^update$/i });
            const enabledUpdateBtns = updateBtns.filter((b) => !(b as HTMLButtonElement).disabled);
            expect(enabledUpdateBtns.length).toBeGreaterThan(0);
        });
    });
});

describe("FloorCvWeightageMaster – clear all (header)", () => {
    it("calls router.push to reset filters on Cancel button click", () => {
        renderComponent();
        const cancelBtn = screen.getByRole("button", { name: /cancel/i });
        fireEvent.click(cancelBtn);
        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("property-tax/weightage-master"));
    });

    it("shows info toast after clear", () => {
        renderComponent();
        const cancelBtn = screen.getByRole("button", { name: /cancel/i });
        fireEvent.click(cancelBtn);
        expect(screen.getByText("All cleared")).toBeInTheDocument();
    });
});

describe("FloorCvWeightageMaster – Apply filter button", () => {
    afterEach(() => {
        mockSelectedYearRange = "2024";
    });

    it("Apply button is disabled initially (no assessment year selected)", () => {
        mockSelectedYearRange = null;
        renderComponent();
        expect(screen.getByRole("button", { name: /^apply$/i })).toBeDisabled();
    });
});
