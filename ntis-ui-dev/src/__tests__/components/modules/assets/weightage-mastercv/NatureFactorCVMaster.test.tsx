import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import NatureFactorCVMaster from "@/components/modules/assets/configuration/master-data/weightage-mastercv/natureFactorCv/NatureFactorCVMaster";
import { Option } from "@/components/common/select";
import { NatureFactorCVMaster as NatureFactorCVMasterType } from "@/types/asset-masters/natureofbuilding-cv-weightageMaster.types";
import {
    updateNatureFactorCVMasterAction,
} from "@/app/[locale]/assets/configuration/master-data/weightage-master/nature-weightage/actions";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/app/[locale]/assets/configuration/master-data/weightage-master/nature-weightage/actions", () => ({
    updateNatureFactorCVMasterAction: vi.fn(),
    createNatureFactorCVMasterAction: vi.fn(),
    bulkCreateNatureFactorCVMasterAction: vi.fn(),
    bulkUpdateNatureFactorCVMasterAction: vi.fn(),
}));

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
    useSearchParams: () => ({
        get: vi.fn().mockImplementation((key: string) => {
            if (key === "page") return "1";
            if (key === "pageSize") return "10";
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
            "columns.constructionCode": "Code",
            "columns.description": "Description",
            "columns.factor": "Factor",
            "columns.assessmentYear": "Year",
            "columns.status": "Status",
            "columns.action": "Action",
            "filters.assessmentYear": "Assessment Year",
            "filters.constructionType": "Construction Type",
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
            "common.messages.recordCreatedSuccess": "Created successfully",
            "common.messages.changesDiscarded": "Changes discarded",
            "common.messages.allClearedInfo": "All cleared",
            "common.messages.noRecordsToUpdate": "No records to update",
            "common.messages.bulkOperationSuccess": "Bulk success",
            "common.messages.factorApplied": "Factor applied",
            "common.messages.validFactorRequired": "Valid factor required",
        };
        const value = map[key];
        if (typeof value === "function") return value(params);
        return value ?? key;
    },
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockData: NatureFactorCVMasterType[] = [
    {
        id: 1, constructionTypeId: 101, constructionCode: "C1", constructionDescription: "RCC",
        factor: 1.2, yearRangeCVId: 2024,
        fromYear: 2024, toYear: 2025, isActive: true,
    },
    {
        id: 0, constructionTypeId: 102, constructionCode: "C2", constructionDescription: "Timber",
        factor: 0.0, yearRangeCVId: 2024,
        fromYear: 2024, toYear: 2025, isActive: true,
    },
];

const constructionTypeOptions: Option[] = [
    { label: "RCC", value: "101" },
    { label: "Timber", value: "102" },
];

const yearOptions: Option[] = [{ label: "2024-2025", value: "2024" }];

function renderComponent(data = mockData) {
    return render(
        <NatureFactorCVMaster
            data={data}
            pageNumber={1}
            pageSize={10}
            totalCount={data.length}
            totalPages={1}
            assessmentYearOptions={yearOptions}
            constructionTypeOptions={constructionTypeOptions}
        />
    );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("NatureFactorCVMaster – rendering", () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it("renders table rows with correct construction codes", () => {
        renderComponent();
        expect(screen.getByText("C1")).toBeInTheDocument();
        expect(screen.getByText("C2")).toBeInTheDocument();
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

describe("NatureFactorCVMaster – row actions", () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it("Update / Create buttons are disabled initially", () => {
        renderComponent();
        const updateBtns = screen.getAllByRole("button", { name: /^(update|create)$/i });
        updateBtns.forEach((btn) => expect(btn).toBeDisabled());
    });

    it("enables Update button after changing a cell value", async () => {
        renderComponent();
        const input = screen.getByDisplayValue("1.20");
        const row = input.closest("tr") as HTMLElement;
        const updateBtn = within(row).getByRole("button", { name: /update/i });

        fireEvent.change(input, { target: { value: "1.5" } });

        await waitFor(() => {
            expect(updateBtn).not.toBeDisabled();
        });
    });

    it("calls updateNatureFactorCVMasterAction when Update is clicked", async () => {
        vi.mocked(updateNatureFactorCVMasterAction).mockResolvedValueOnce({ success: true, message: "" });
        renderComponent();
        const input = screen.getByDisplayValue("1.20");
        const row = input.closest("tr") as HTMLElement;
        const updateBtn = within(row).getByRole("button", { name: /update/i });

        fireEvent.change(input, { target: { value: "1.5" } });
        await waitFor(() => expect(updateBtn).not.toBeDisabled());

        fireEvent.click(updateBtn);
        await waitFor(() => expect(updateNatureFactorCVMasterAction).toHaveBeenCalledTimes(1));
    });
});

describe("NatureFactorCVMaster – bulk actions", () => {
    it("Apply button is disabled initially", () => {
        renderComponent();
        // Use getAllByRole since there might be other buttons, and pick the Apply one
        const applyBtn = screen.getByRole("button", { name: /^Apply$/ });
        expect(applyBtn).toBeDisabled();
    });

    it("calls router.push to reset filters on Cancel button click", () => {
        renderComponent();
        // The header has a Cancel button
        const cancelBtn = screen.getAllByRole("button", { name: /Cancel/i })[0]; 
        fireEvent.click(cancelBtn);
        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("nature-weightage"));
    });
});
