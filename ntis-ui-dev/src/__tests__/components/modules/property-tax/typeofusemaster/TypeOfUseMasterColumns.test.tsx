import { describe, it, expect, vi } from "vitest";
import { getSubTypeColumns, type SubTypeTableRow } from "@/components/modules/property-tax/typeofusemaster/TypeOfUseMasterColumns";
import type { UseSubType } from "@/types/typeOfUse.types";

// Mock translation function
const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    "table.columns.serial": "#",
    "table.columns.subTypeName": "Sub-Type Name",
    "table.columns.searchSequence": "Search Sequence",
    "subtype.fields.status": "Status",
    "status.active": "Active",
    "status.inactive": "Inactive",
  };
  return translations[key] || key;
});

describe("TypeOfUseMasterColumns", () => {
  describe("getSubTypeColumns", () => {
    it("should return column definitions", () => {
      const columns = getSubTypeColumns(mockT);

      expect(columns).toBeDefined();
      expect(Array.isArray(columns)).toBe(true);
      expect(columns.length).toBeGreaterThan(0);
    });

    it("should have correct column headers", () => {
      const columns = getSubTypeColumns(mockT);

      const labels = columns.map(col => col.label);
      
      expect(labels).toContain("#");
      expect(labels).toContain("Sub-Type Name");
      expect(labels).toContain("Search Sequence");
      expect(labels).toContain("Status");
    });

    it("should have serial number column", () => {
      const columns = getSubTypeColumns(mockT);
      
      const serialColumn = columns.find(col => col.label === "#");
      expect(serialColumn).toBeDefined();
      expect(serialColumn?.key).toBe("srNo");
    });

    it("should have description column", () => {
      const columns = getSubTypeColumns(mockT);
      
      const descColumn = columns.find(col => col.label === "Sub-Type Name");
      expect(descColumn).toBeDefined();
      expect(descColumn?.key).toBe("description");
    });

    it("should have search sequence column", () => {
      const columns = getSubTypeColumns(mockT);
      
      const seqColumn = columns.find(col => col.label === "Search Sequence");
      expect(seqColumn).toBeDefined();
      expect(seqColumn?.key).toBe("searchSequence");
    });

    it("should have status column", () => {
      const columns = getSubTypeColumns(mockT);
      
      const statusColumn = columns.find(col => col.label === "Status");
      expect(statusColumn).toBeDefined();
      expect(statusColumn?.key).toBe("status");
    });

    it("should render description correctly", () => {
      const columns = getSubTypeColumns(mockT);
      const descColumn = columns.find(col => col.key === "description");

      const mockRow: SubTypeTableRow = {
        subTypeOfUseId: 1,
        description: "Ground Floor",
        typeOfUseId: 1,
        searchSequence: 1,
        isActive: true,
        status: "Active",
        srNo: 1,
      };

      expect(descColumn?.render).toBeDefined();
      if (descColumn?.render && typeof descColumn.render === "function") {
        const result = descColumn.render("Ground Floor", mockRow, 0);
        expect(result).toBe("Ground Floor");
      }
    });

    it("should render search sequence correctly", () => {
      const columns = getSubTypeColumns(mockT);
      const seqColumn = columns.find(col => col.key === "searchSequence");

      const mockRow: SubTypeTableRow = {
        subTypeOfUseId: 1,
        description: "Test",
        typeOfUseId: 1,
        searchSequence: 5,
        isActive: true,
        status: "Active",
        srNo: 1,
      };

      expect(seqColumn?.render).toBeDefined();
      if (seqColumn?.render && typeof seqColumn.render === "function") {
        const result = seqColumn.render(5, mockRow, 0);
        expect(result).toBe("5");
      }
    });

    it("should use translation function for labels", () => {
      getSubTypeColumns(mockT);

      expect(mockT).toHaveBeenCalledWith("table.columns.serial");
      expect(mockT).toHaveBeenCalledWith("table.columns.subTypeName", { subTypeOfUse: "Sub-Type" });
      expect(mockT).toHaveBeenCalledWith("table.columns.searchSequence");
      expect(mockT).toHaveBeenCalledWith("subtype.fields.status");
    });

    it("should handle empty description values", () => {
      const columns = getSubTypeColumns(mockT);
      const descColumn = columns.find(col => col.key === "description");

      expect(descColumn?.render).toBeDefined();
      if (descColumn?.render && typeof descColumn.render === "function") {
        const result = descColumn.render("", { srNo: 1 } as SubTypeTableRow, 0);
        expect(result).toBe("—");
      }
    });
  });

  describe("SubTypeTableRow type", () => {
    it("should accept valid UseSubType objects", () => {
      const validRow: UseSubType = {
        subTypeOfUseId: 1,
        description: "Test SubType",
        typeOfUseId: 1,
        searchSequence: 1,
        isActive: true,
        status: "Active",
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
      };

      expect(validRow).toBeDefined();
      expect(validRow.subTypeOfUseId).toBe(1);
      expect(validRow.description).toBe("Test SubType");
    });
  });
});
