import { render, screen } from "@testing-library/react";
import { getGeographyTypeColumns } from "@/components/modules/water-bill/geography-type-master/GeographyTypeColumns";
import type { GeographyType } from "@/types/water-bill/geographyType.types";

describe("getGeographyTypeColumns", () => {
  const mockT = vi.fn((key: string) => key);

  it("returns the correct number of columns", () => {
    const columns = getGeographyTypeColumns(mockT);
    expect(columns).toHaveLength(4);
    expect(columns.map((c) => c.key)).toEqual([
      "geographyTypeCode",
      "geographyType",
      "levelNo",
      "isActive",
    ]);
  });

  it("does not render any sort controls (API does not support sorting)", () => {
    const columns = getGeographyTypeColumns(mockT);
    // Labels should be plain translated strings, not React elements with sort buttons
    expect(columns.map((c) => c.label)).toEqual([
      "list.table.geographyTypeCode",
      "list.table.geographyType",
      "list.table.levelNo",
      "list.table.status",
    ]);
  });

  it("correctly renders column values using the render function", () => {
    const columns = getGeographyTypeColumns(mockT);
    const dummyRow = {} as GeographyType;

    const colCode = columns.find((c) => c.key === "geographyTypeCode");
    const codeBadge = colCode?.render?.("ZONE", dummyRow, 0);
    render(<>{codeBadge}</>);
    expect(screen.getByText("ZONE")).toHaveClass("bg-[#e3f0fd]");

    const emptyCode = colCode?.render?.(null as unknown as string, dummyRow, 0);
    expect(emptyCode).toBe("—");

    const colType = columns.find((c) => c.key === "geographyType");
    expect(colType?.render?.("Zone", dummyRow, 0)).toBe("Zone");

    const colLevel = columns.find((c) => c.key === "levelNo");
    expect(colLevel?.render?.(1, dummyRow, 0)).toBe(1);
    expect(colLevel?.render?.("bad" as unknown as number, dummyRow, 0)).toBe("");
  });

  it("marks the status column as a status column", () => {
    const columns = getGeographyTypeColumns(mockT);
    const colStatus = columns.find((c) => c.key === "isActive");
    expect(colStatus?.isStatus).toBe(true);
  });
});
