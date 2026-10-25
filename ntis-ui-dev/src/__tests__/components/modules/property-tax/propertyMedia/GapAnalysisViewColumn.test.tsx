import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { getMissingPropertyColumns } from "@/components/modules/property-tax/PropertyMedia/GapAnalysisView/GapAnalysisViewColumn";
import { MissingPropertyRow } from "@/types/PropertyMedia/PropertyMedia.types";

describe("GapAnalysisViewColumn", () => {
    const mockTranslate = (key: string) => key;
    const columns = getMissingPropertyColumns(mockTranslate);

    it("returns all expected column definitions", () => {
        expect(columns).toHaveLength(8);
        const keys = columns.map((col) => col.key);
        expect(keys).toEqual([
            "propertyNumber",
            "division",
            "ward",
            "ownerName",
            "propertyType",
            "missingType",
            "workflowStatus",
            "lastUpdatedDate",
        ]);

        expect(columns[0].label).toBe("propertyMediaViewDrawer.table.propertyNumber");
        expect(columns[1].label).toBe("propertyMediaViewDrawer.table.division");
        expect(columns[2].label).toBe("propertyMediaViewDrawer.table.ward");
        expect(columns[3].label).toBe("propertyMediaViewDrawer.table.ownerName");
        expect(columns[4].label).toBe("propertyMediaViewDrawer.table.propertyType");
        expect(columns[5].label).toBe("propertyMediaViewDrawer.table.missingType");
        expect(columns[6].label).toBe("propertyMediaViewDrawer.table.workflowStatus");
        expect(columns[7].label).toBe("propertyMediaViewDrawer.table.lastUpdatedDate");
    });

    it("falls back to English labels when no translation function is provided", () => {
        const defaultCols = getMissingPropertyColumns();
        expect(defaultCols[0].label).toBe("Property No.");
        expect(defaultCols[1].label).toBe("Division");
        expect(defaultCols[5].label).toBe("Missing Type");
    });

    it("renders propertyNumber in bold font", () => {
        const propCol = columns.find((c) => c.key === "propertyNumber");
        expect(propCol?.render).toBeDefined();

        render(<>{propCol?.render!("PROP-999", {} as MissingPropertyRow, 0)}</>);
        const text = screen.getByText("PROP-999");
        expect(text).toHaveClass("font-bold");

        render(<>{propCol?.render!(0 as unknown as string, {} as MissingPropertyRow, 1)}</>);
        expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("renders missingType as destructive badge", () => {
        const missingCol = columns.find((c) => c.key === "missingType");
        expect(missingCol?.render).toBeDefined();

        render(<>{missingCol?.render!("Building Photo", {} as MissingPropertyRow, 0)}</>);
        expect(screen.getByText("Building Photo")).toBeInTheDocument();
    });

    it("renders workflowStatus badge with dot or dash fallback for empty value", () => {
        const statusCol = columns.find((c) => c.key === "workflowStatus");
        expect(statusCol?.render).toBeDefined();

        const activeRow: MissingPropertyRow = {
            propertyNumber: "P1",
            workflowStatus: "Survey",
            division: "Division 1",
            ward: "Ward 1",
            ownerName: "Owner 1",
            propertyType: "Residential",
            missingType: "Photo",
            lastUpdatedDate: "2026-05-15",
        };
        render(<>{statusCol?.render!("Survey", activeRow, 0)}</>);
        expect(screen.getByText("Survey")).toBeInTheDocument();

        const emptyRow: MissingPropertyRow = {
            propertyNumber: "P2",
            workflowStatus: "-",
            division: "Division 1",
            ward: "Ward 1",
            ownerName: "Owner 1",
            propertyType: "Residential",
            missingType: "Photo",
            lastUpdatedDate: "2026-05-15",
        };
        render(<>{statusCol?.render!("-", emptyRow, 1)}</>);
        expect(screen.getByText("-")).toBeInTheDocument();
    });

    it("renders lastUpdatedDate or dash fallback", () => {
        const dateCol = columns.find((c) => c.key === "lastUpdatedDate");
        expect(dateCol?.render).toBeDefined();

        render(<>{dateCol?.render!("2026-05-15", {} as MissingPropertyRow, 0)}</>);
        expect(screen.getByText("2026-05-15")).toBeInTheDocument();

        render(<>{dateCol?.render!("", {} as MissingPropertyRow, 1)}</>);
        expect(screen.getByText("-")).toBeInTheDocument();
    });
});
