import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { getAuditTrailColumns } from "@/components/modules/property-tax/PropertyMedia/AuditTrail/AuditTrailColumn";
import { ActivityLog } from "@/types/PropertyMedia/PropertyMedia.types";

describe("AuditTrailColumn", () => {
    const mockTranslate = (key: string, values?: Record<string, string | number>) =>
        values?.count !== undefined ? `${values.count} ${key}` : key;
    const columns = getAuditTrailColumns(mockTranslate);

    it("returns all expected column definitions with translation keys", () => {
        expect(columns).toHaveLength(5);
        const keys = columns.map((col) => col.key);
        expect(keys).toEqual(["dateTime", "user", "action", "category", "result"]);

        expect(columns[0].label).toBe("auditTrailDrawer.table.columns.dateTime");
        expect(columns[1].label).toBe("auditTrailDrawer.table.columns.user");
        expect(columns[2].label).toBe("auditTrailDrawer.table.columns.action");
        expect(columns[3].label).toBe("auditTrailDrawer.table.columns.category");
        expect(columns[4].label).toBe("auditTrailDrawer.table.columns.result");
    });

    it("renders result column with a success badge containing upload count and label", () => {
        const resultCol = columns.find((c) => c.key === "result");
        expect(resultCol?.render).toBeDefined();

        const row: ActivityLog = {
            dateTime: "2026-04-12 11:30",
            user: "Admin",
            action: "Bulk Upload",
            category: "Building Photo",
            result: 42,
        };

        render(<>{resultCol?.render!(42, row, 0)}</>);
        expect(screen.getByText("42 auditTrailDrawer.table.uploadedCount")).toBeInTheDocument();

        render(<>{resultCol?.render!(0, { ...row, result: 0 }, 1)}</>);
        expect(screen.getByText("0 auditTrailDrawer.table.uploadedCount")).toBeInTheDocument();
    });
});
