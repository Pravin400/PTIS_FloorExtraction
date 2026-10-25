import { describe, it, expect, vi } from "vitest";
import { getMoujaColumns } from "@/components/modules/property-tax/mouja-master/MoujaColumns";

describe("getMoujaColumns", () => {
  const mockT = (key: string) => key;
  const mockTCommon = (key: string) => key;
  const mockOnSort = vi.fn();

  describe("Column Configuration", () => {
    it("should return correct number of columns", () => {
      const columns = getMoujaColumns(mockT, mockTCommon);

      expect(columns).toHaveLength(3);
    });

    it("should have moujaNo column", () => {
      const columns = getMoujaColumns(mockT, mockTCommon);
      const moujaNoColumn = columns.find((col) => col.key === "moujaNo");

      expect(moujaNoColumn).toBeDefined();
      expect(moujaNoColumn?.width).toBe("30%");
    });

    it("should have moujaName column", () => {
      const columns = getMoujaColumns(mockT, mockTCommon);
      const moujaNameColumn = columns.find((col) => col.key === "moujaName");

      expect(moujaNameColumn).toBeDefined();
      expect(moujaNameColumn?.width).toBe("40%");
    });

    it("should have isActive status column", () => {
      const columns = getMoujaColumns(mockT, mockTCommon);
      const statusColumn = columns.find((col) => col.key === "isActive");

      expect(statusColumn).toBeDefined();
      expect(statusColumn?.width).toBe("20%");
      expect(statusColumn?.isStatus).toBe(true);
    });
  });

  describe("Column Labels", () => {
    it("should use translation keys for labels", () => {
      const columns = getMoujaColumns(mockT, mockTCommon);

      const moujaNoColumn = columns.find((col) => col.key === "moujaNo");
      const moujaNameColumn = columns.find((col) => col.key === "moujaName");
      const statusColumn = columns.find((col) => col.key === "isActive");

      // When sortable, label is a React element, so check the column exists
      expect(moujaNoColumn).toBeDefined();
      expect(moujaNameColumn).toBeDefined();
      expect(statusColumn?.label).toBe("list.table.status");
    });

    it("should pass alias values when moujaLabel is provided", () => {
      const mockTWithValues = vi.fn((key: string, values?: Record<string, string | number>) => {
        if (key === "list.table.moujaNo") return `${values?.mouja} Number`;
        if (key === "list.table.moujaName") return `${values?.mouja} Name`;
        return key;
      });

      const columns = getMoujaColumns(
        mockTWithValues,
        mockTCommon,
        undefined,
        undefined,
        undefined,
        "Custom Mouja"
      );

      expect(columns[0].label).toBe("Custom Mouja Number");
      expect(columns[1].label).toBe("Custom Mouja Name");
      expect(mockTWithValues).toHaveBeenCalledWith("list.table.moujaNo", {
        mouja: "Custom Mouja",
        entity: "Custom Mouja",
      });
    });
  });

  describe("Column Rendering", () => {
    const mockRow = {
      id: 1,
      moujaNo: "M001",
      moujaName: "Test",
      isActive: true,
      createdDate: "2024-01-01",
      updatedDate: null,
    };

    it("should render moujaNo as string", () => {
      const columns = getMoujaColumns(mockT, mockTCommon);
      const moujaNoColumn = columns.find((col) => col.key === "moujaNo");

      const rendered = moujaNoColumn?.render?.("M001", mockRow, 0);
      expect(rendered).toBe("M001");
    });

    it("should render moujaName as string", () => {
      const columns = getMoujaColumns(mockT, mockTCommon);
      const moujaNameColumn = columns.find((col) => col.key === "moujaName");

      const rendered = moujaNameColumn?.render?.("Test Mouja", mockRow, 0);
      expect(rendered).toBe("Test Mouja");
    });

    it("should handle non-string values gracefully", () => {
      const columns = getMoujaColumns(mockT, mockTCommon);
      const moujaNoColumn = columns.find((col) => col.key === "moujaNo");

      const rendered = moujaNoColumn?.render?.(null, mockRow, 0);
      expect(rendered).toBe("");
    });

    it("should handle undefined values", () => {
      const columns = getMoujaColumns(mockT, mockTCommon);
      const moujaNameColumn = columns.find((col) => col.key === "moujaName");

      const rendered = moujaNameColumn?.render?.(undefined, mockRow, 0);
      expect(rendered).toBe("");
    });
  });

  describe("Sortable Columns", () => {
    it("should make moujaNo sortable when onSort is provided", () => {
      const columns = getMoujaColumns(mockT, mockTCommon, "moujaNo", "asc", mockOnSort);
      const moujaNoColumn = columns.find((col) => col.key === "moujaNo");

      expect(moujaNoColumn).toBeDefined();
      // Label should be a React element (sortable header) when onSort is provided
      expect(typeof moujaNoColumn?.label).toBe("object");
    });

    it("should make moujaName sortable when onSort is provided", () => {
      const columns = getMoujaColumns(mockT, mockTCommon, "moujaName", "asc", mockOnSort);
      const moujaNameColumn = columns.find((col) => col.key === "moujaName");

      expect(moujaNameColumn).toBeDefined();
      // Label should be a React element (sortable header) when onSort is provided
      expect(typeof moujaNameColumn?.label).toBe("object");
    });

    it("should not make isActive sortable", () => {
      const columns = getMoujaColumns(mockT, mockTCommon, "isActive", "asc", mockOnSort);
      const statusColumn = columns.find((col) => col.key === "isActive");

      expect(statusColumn).toBeDefined();
      // Status column should always have a string label (not sortable)
      expect(typeof statusColumn?.label).toBe("string");
    });

    it("should use plain labels when onSort is not provided", () => {
      const columns = getMoujaColumns(mockT, mockTCommon);
      const moujaNoColumn = columns.find((col) => col.key === "moujaNo");
      const moujaNameColumn = columns.find((col) => col.key === "moujaName");

      // Without onSort, labels should be strings
      expect(typeof moujaNoColumn?.label).toBe("string");
      expect(typeof moujaNameColumn?.label).toBe("string");
    });
  });

  describe("Sort State", () => {
    it("should reflect ascending sort state for moujaNo", () => {
      const columns = getMoujaColumns(mockT, mockTCommon, "moujaNo", "asc", mockOnSort);
      const moujaNoColumn = columns.find((col) => col.key === "moujaNo");

      expect(moujaNoColumn).toBeDefined();
      // The column should have sortable header with asc state
    });

    it("should reflect descending sort state for moujaName", () => {
      const columns = getMoujaColumns(mockT, mockTCommon, "moujaName", "desc", mockOnSort);
      const moujaNameColumn = columns.find((col) => col.key === "moujaName");

      expect(moujaNameColumn).toBeDefined();
      // The column should have sortable header with desc state
    });

    it("should handle no active sort", () => {
      const columns = getMoujaColumns(mockT, mockTCommon, undefined, undefined, mockOnSort);

      expect(columns).toHaveLength(3);
      // All columns should exist even without active sort
    });
  });

  describe("Column Widths", () => {
    it("should have correct widths for all columns", () => {
      const columns = getMoujaColumns(mockT, mockTCommon);

      const moujaNoColumn = columns.find((col) => col.key === "moujaNo");
      const moujaNameColumn = columns.find((col) => col.key === "moujaName");
      const statusColumn = columns.find((col) => col.key === "isActive");

      expect(moujaNoColumn?.width).toBe("30%");
      expect(moujaNameColumn?.width).toBe("40%");
      expect(statusColumn?.width).toBe("20%");
    });

    it("should maintain widths regardless of sort state", () => {
      const columns1 = getMoujaColumns(mockT, mockTCommon);
      const columns2 = getMoujaColumns(mockT, mockTCommon, "moujaNo", "asc", mockOnSort);

      expect(columns1[0].width).toBe(columns2[0].width);
      expect(columns1[1].width).toBe(columns2[1].width);
      expect(columns1[2].width).toBe(columns2[2].width);
    });
  });

  describe("Column Order", () => {
    it("should return columns in correct order", () => {
      const columns = getMoujaColumns(mockT, mockTCommon);

      expect(columns[0].key).toBe("moujaNo");
      expect(columns[1].key).toBe("moujaName");
      expect(columns[2].key).toBe("isActive");
    });

    it("should maintain order regardless of sort parameters", () => {
      const columns = getMoujaColumns(mockT, mockTCommon, "moujaName", "desc", mockOnSort);

      expect(columns[0].key).toBe("moujaNo");
      expect(columns[1].key).toBe("moujaName");
      expect(columns[2].key).toBe("isActive");
    });
  });

  describe("Status Column", () => {
    it("should mark isActive column as status column", () => {
      const columns = getMoujaColumns(mockT, mockTCommon);
      const statusColumn = columns.find((col) => col.key === "isActive");

      expect(statusColumn?.isStatus).toBe(true);
    });

    it("should not mark other columns as status columns", () => {
      const columns = getMoujaColumns(mockT, mockTCommon);

      const moujaNoColumn = columns.find((col) => col.key === "moujaNo");
      const moujaNameColumn = columns.find((col) => col.key === "moujaName");

      expect(moujaNoColumn?.isStatus).toBeUndefined();
      expect(moujaNameColumn?.isStatus).toBeUndefined();
    });
  });

  describe("Edge Cases", () => {
    const mockRow = {
      id: 1,
      moujaNo: "M001",
      moujaName: "Test",
      isActive: true,
      createdDate: "2024-01-01",
      updatedDate: null,
    };

    it("should handle empty sortBy and sortOrder", () => {
      const columns = getMoujaColumns(mockT, mockTCommon, "", "", mockOnSort);

      expect(columns).toHaveLength(3);
      expect(columns[0].key).toBe("moujaNo");
    });

    it("should handle invalid sort column", () => {
      const columns = getMoujaColumns(mockT, mockTCommon, "invalidColumn", "asc", mockOnSort);

      expect(columns).toHaveLength(3);
      // Should still return all columns even with invalid sort column
    });

    it("should handle numeric values in render", () => {
      const columns = getMoujaColumns(mockT, mockTCommon);
      const moujaNoColumn = columns.find((col) => col.key === "moujaNo");

      const rendered = moujaNoColumn?.render?.(123, mockRow, 0);
      expect(rendered).toBe("");
    });

    it("should handle object values in render", () => {
      const columns = getMoujaColumns(mockT, mockTCommon);
      const moujaNameColumn = columns.find((col) => col.key === "moujaName");

      const rendered = moujaNameColumn?.render?.({ test: "value" }, mockRow, 0);
      expect(rendered).toBe("");
    });
  });
});
