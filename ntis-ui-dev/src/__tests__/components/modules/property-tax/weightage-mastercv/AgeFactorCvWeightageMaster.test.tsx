import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AgeFactorCvWeightageMaster from "@/components/modules/property-tax/weightage-mastercv/ageFactorCv/AgeFactorCvWeightageMaster";
import { AgeFactorCVMaster} from "@/types/ageFactorCv.types";
import {
    updateAgeFactorCVMasterAction,
    bulkUpdateAgeFactorCVMasterAction,
} from "@/app/[locale]/property-tax/weightage-master/age-weightage/action";
import { Option } from "@/components/common";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/app/[locale]/property-tax/weightage-master/age-weightage/action", () => ({
    updateAgeFactorCVMasterAction: vi.fn(),
    createAgeFactorCVMasterAction: vi.fn(),
    bulkCreateAgeFactorCVMasterAction: vi.fn(),
    bulkUpdateAgeFactorCVMasterAction: vi.fn(),
    fetchAllAgeFactorsAction: vi.fn().mockResolvedValue([]),
}));

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
    useSearchParams: () => ({
        get: vi.fn().mockImplementation((key: string) => {
            if (key === "page") return "1";
            if (key === "pageSize") return "10";
            if (key === "selectedYearRange") return "2024";
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
            "columns.constructionType": "Construction Type",
            "columns.ageFrom": "Age From",
            "columns.ageTo": "Age To",
            "columns.factor": "Factor",
            "columns.assessmentYear": "Year",
            "columns.status": "Status",
            "columns.action": "Action",
            "filters.assessmentYear": "Assessment Year",
            "filters.constructionType": "Construction Type",
            "filters.ageRange": "Age Range",
            "filters.factor": "Factor",
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
            "common.messages.recordUpdatedSuccess": "Updated successfully",
            "common.messages.bulkOperationSuccess": "Bulk success",
            "common.messages.factorApplied": "Factor applied",
            "common.messages.allClearedInfo": "All cleared",
        };
        const value = map[key];
        if (typeof value === "function") return value(params);
        return value ?? key;
    },
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockData: AgeFactorCVMaster[] = [
    {
        id: 1, constructionTypeId: 101, constructionCode: "RCC", constructionDescription: "RCC Structure",
        ageFrom: 0, ageTo: 10, factor: 1.5, yearRangeCVId: 2024,
        fromYear: 2024, toYear: 2025, isActive: true,
    },
    {
        id: 0, constructionTypeId: 101, constructionCode: "RCC", constructionDescription: "RCC Structure",
        ageFrom: 11, ageTo: 20, factor: 0.0, yearRangeCVId: 2024,
        fromYear: 2024, toYear: 2025, isActive: true,
    },
];

const constructionTypeOptions: Option[] = [
    { label: "RCC", value: "101" },
];

const yearOptions: Option[] = [{ label: "2024-2025", value: "2024" }];
const ageRangeOptions: Option[] = [
    { label: "0-10", value: "0-10" },
    { label: "11-20", value: "11-20" },
];

// Mirrors `data`, but only the real row (id=1, age 0-10) — the id=0 placeholder row
// for age 11-20 has no counterpart here, so it's correctly reported as "missing"
// for the selected year, matching how the real backend/allAgeFactors fetch behaves.
const allAgeFactorsFixture: AgeFactorCVMaster[] = [mockData[0]];

import { ConfirmProvider } from "@/components/common/ConfirmProvider";

function renderComponent(data = mockData) {
    return render(
        <ConfirmProvider>
            <AgeFactorCvWeightageMaster
                data={data}
                pageNumber={1}
                pageSize={10}
                totalCount={data.length}
                totalPages={1}
                constructionTypeOptions={constructionTypeOptions}
                assessmentYearOptions={yearOptions}
                ageRangeOptions={ageRangeOptions}
                allAgeFactors={allAgeFactorsFixture}
            />
        </ConfirmProvider>
    );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AgeFactorCvWeightageMaster – rendering", () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it("renders table rows with correct construction codes", () => {
        renderComponent();
        expect(screen.getAllByText("RCC").length).toBeGreaterThan(0);
    });

    it("renders age ranges", () => {
        renderComponent();
        // Use getAllByText for values that might appear in pageSize options (like 10, 20, 50)
        expect(screen.getByText("0")).toBeInTheDocument();
        expect(screen.getAllByText("10").length).toBeGreaterThan(0);
        expect(screen.getByText("11")).toBeInTheDocument();
        expect(screen.getAllByText("20").length).toBeGreaterThan(0);
    });

    it("renders Update button for existing record and Create button for new record", () => {
        renderComponent();
        expect(screen.getAllByRole("button", { name: /update/i }).length).toBeGreaterThan(0);
        expect(screen.getAllByRole("button", { name: /create/i }).length).toBeGreaterThan(0);
    });

    it("renders the pending records warning toast on mount when new records exist", async () => {
        renderComponent();
        await waitFor(() => {
            expect(screen.getByText("Pending records warning")).toBeInTheDocument();
        });
    });

    it("shows pending badge with correct count when new records exist", () => {
        renderComponent();
        expect(screen.getByText(/1 pending creates/i)).toBeInTheDocument();
    });
});

describe("AgeFactorCvWeightageMaster – row actions", () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it("enables row-Clear button after changing a cell value", async () => {
        renderComponent();
        const input = screen.getByDisplayValue("1.50");
        const row = input.closest("tr") as HTMLElement;
        const clearBtn = within(row).getByRole("button", { name: /clear/i });

        expect(clearBtn).toBeDisabled();

        fireEvent.change(input, { target: { value: "1.8" } });

        await waitFor(() => {
            expect(clearBtn).not.toBeDisabled();
        });
    });

    it("shows a localized warning instead of updating when Update is clicked without any change", async () => {
        renderComponent();
        const input = screen.getByDisplayValue("1.50");
        const row = input.closest("tr") as HTMLElement;
        const updateBtn = within(row).getByRole("button", { name: /update/i });

        expect(updateBtn).not.toBeDisabled();

        fireEvent.click(updateBtn);

        await waitFor(() => {
            expect(screen.getByText("No changes to update")).toBeInTheDocument();
        });
        expect(updateAgeFactorCVMasterAction).not.toHaveBeenCalled();
    });

    it("calls updateAgeFactorCVMasterAction when Update is clicked on changed row", async () => {
        vi.mocked(updateAgeFactorCVMasterAction).mockResolvedValueOnce({ success: true, message: "" });
        renderComponent();
        const input = screen.getByDisplayValue("1.50");
        const row = input.closest("tr") as HTMLElement;
        const updateBtn = within(row).getByRole("button", { name: /update/i });

        fireEvent.change(input, { target: { value: "1.8" } });
        await waitFor(() => expect(updateBtn).not.toBeDisabled());

        fireEvent.click(updateBtn);
        await waitFor(() => expect(updateAgeFactorCVMasterAction).toHaveBeenCalledTimes(1));
    });
});

describe("AgeFactorCvWeightageMaster – header actions", () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it("calls bulkUpdateAgeFactorCVMasterAction after changing values and clicking header Update", async () => {
        vi.mocked(bulkUpdateAgeFactorCVMasterAction).mockResolvedValueOnce({ success: true, message: "" });
        renderComponent();

        const input = screen.getByDisplayValue("1.50");
        fireEvent.change(input, { target: { value: "2.0" } });

        await waitFor(() => {
            const updateBtns = screen.getAllByRole("button", { name: /^update$/i });
            // One in the header toolbar, and one or more in the rows.
            const headerUpdateBtn = updateBtns[0]; 
            expect(headerUpdateBtn).not.toBeDisabled();
            fireEvent.click(headerUpdateBtn);
        });

        await waitFor(() => expect(bulkUpdateAgeFactorCVMasterAction).toHaveBeenCalledTimes(1));
    });

    it("shows info toast after clear all (Cancel button)", () => {
        renderComponent();
        const cancelBtn = screen.getByRole("button", { name: /cancel/i });
        fireEvent.click(cancelBtn);
        expect(screen.getByText("All cleared")).toBeInTheDocument();
    });
});
