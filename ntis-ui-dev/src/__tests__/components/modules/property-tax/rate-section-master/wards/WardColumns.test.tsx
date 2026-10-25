import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { getWardColumns } from "@/components/modules/property-tax/rate-section-master/wards/WardColumns";

// Mock StatusBadge
vi.mock("@/components/common/StatusBadge", () => ({
  StatusBadge: ({ label, variant }: { label: string; variant?: string }) => (
    <span data-testid="status-badge" data-variant={variant}>{label}</span>
  ),
}));

describe("WardColumns", () => {
  const mockT = (key: string) => key;

  const defaultParams = {
    t: mockT,
  };

  describe("getWardColumns", () => {
    it("returns an array of columns", () => {
      const columns = getWardColumns(defaultParams);
      expect(Array.isArray(columns)).toBe(true);
      expect(columns.length).toBeGreaterThan(0);
    });

    it("includes wardNo column", () => {
      const columns = getWardColumns(defaultParams);
      const wardNoColumn = columns.find(col => col.key === "wardNo");
      expect(wardNoColumn).toBeDefined();
      expect(wardNoColumn?.label).toBe("wards.wardNo");
    });

    it("wardNo column has render function", () => {
      const columns = getWardColumns(defaultParams);
      const wardNoColumn = columns.find(col => col.key === "wardNo");
      expect(wardNoColumn?.render).toBeDefined();
      expect(typeof wardNoColumn?.render).toBe("function");
    });
  });

  describe("wardNo column render", () => {
    const mockRow = {
      rateSectionDetailsId: 1,
      rateSectionId: 1,
      wardId: 101,
      wardNo: "W001",
      isActive: true,
    };

    it("renders StatusBadge with wardNo", () => {
      const columns = getWardColumns(defaultParams);
      const wardNoColumn = columns.find(col => col.key === "wardNo");
      
      render(
        <div>{wardNoColumn?.render?.("W001", mockRow, 0)}</div>
      );
      
      expect(screen.getByTestId("status-badge")).toBeInTheDocument();
      expect(screen.getByTestId("status-badge")).toHaveTextContent("W001");
    });

    it("renders StatusBadge with info variant", () => {
      const columns = getWardColumns(defaultParams);
      const wardNoColumn = columns.find(col => col.key === "wardNo");
      
      render(<div>{wardNoColumn?.render?.("W001", mockRow, 0)}</div>);
      
      expect(screen.getByTestId("status-badge")).toHaveAttribute("data-variant", "info");
    });

    it("renders wardNo from row if first argument is missing", () => {
      const columns = getWardColumns(defaultParams);
      const wardNoColumn = columns.find(col => col.key === "wardNo");
      
      const rowWithWardNo = {
        rateSectionDetailsId: 1,
        rateSectionId: 1,
        wardId: 101,
        wardNo: "W002",
        isActive: true,
      };
      
      render(<div>{wardNoColumn?.render?.(undefined, rowWithWardNo, 0)}</div>);
      
      expect(screen.getByTestId("status-badge")).toHaveTextContent("W002");
    });

    it("shows dash when no wardNo available", () => {
      const columns = getWardColumns(defaultParams);
      const wardNoColumn = columns.find(col => col.key === "wardNo");
      
      const rowWithoutWardNo = {
        rateSectionDetailsId: 1,
        rateSectionId: 1,
        wardId: 101,
        isActive: true,
      };
      
      render(<div>{wardNoColumn?.render?.(undefined, rowWithoutWardNo, 0)}</div>);
      
      expect(screen.getByTestId("status-badge")).toHaveTextContent("-");
    });
  });
});
