import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { getPropertyColumns } from "@/components/modules/property-tax/zone-master/properties/propertyColumns";
import { WardItem } from "@/types/wardMaster.types";

// Mock the StatusBadge component
vi.mock("@/components/common", () => ({
  StatusBadge: ({
    label,
    variant,
  }: {
    label: string;
    variant: string;
  }) => (
    <span data-testid="status-badge" data-variant={variant}>
      {label}
    </span>
  ),
}));

describe("propertyColumns", () => {
  const mockT = vi.fn((key: string) => key);

  const mockWards: WardItem[] = [
    {
      id: 1,
      wardNo: "W01",
      zoneId: 1,
      description: "Ward 1",
      isActive: true,
      sequenceNo: 1,
      createdDate: "2024-01-01T00:00:00Z",
      updatedDate: null,
    },
  ];

  const mockCategoryMap = { 1: "Residential" };
  const mockPropertyTypeMap = { 1: "Flat" };

  const params = {
    t: mockT,
    pageNumber: 1,
    pageSize: 10,
    wards: mockWards,
    categoryMap: mockCategoryMap,
    propertyTypeMap: mockPropertyTypeMap,
  };

  it("should return the correct number of columns", () => {
    const columns = getPropertyColumns(params);
    expect(columns).toHaveLength(4);
  });

  it("should bind propertyNo alias to column label when provided", () => {
    const tWithParams = vi.fn((key: string, values?: Record<string, unknown>) => {
      if (key === "propertyList.columns.propertyNo" && values?.propertyNo) {
        return `Custom (${values.propertyNo})`;
      }
      return key;
    });

    const columns = getPropertyColumns({
      ...params,
      t: tWithParams,
      propertyNoAlias: "Holding No",
    });
    const propertyNoColumn = columns.find((c) => c.key === "propertyNo");
    expect(propertyNoColumn?.label).toBe("Custom (Holding No)");
  });

  it("should fall back to default Property No label when alias is not provided", () => {
    const tWithParams = vi.fn((key: string, values?: Record<string, unknown>) => {
      if (key === "propertyList.columns.propertyNo") {
        return values?.propertyNo as string;
      }
      return key;
    });

    const columns = getPropertyColumns({
      ...params,
      t: tWithParams,
    });
    const propertyNoColumn = columns.find((c) => c.key === "propertyNo");
    expect(propertyNoColumn?.label).toBe("Property No");
  });

  it("should correctly render serial number", () => {
    const columns = getPropertyColumns(params);
    const srNoColumn = columns.find((c) => c.key === "srNo");

    expect(srNoColumn?.render?.(null, {}, 0)).toBe(1);
    expect(srNoColumn?.render?.(null, {}, 5)).toBe(6);
  });

  it("should correctly render combined property number (ward-property-partition)", () => {
    const columns = getPropertyColumns(params);
    const propertyNoColumn = columns.find((c) => c.key === "propertyNo");

    expect(
      propertyNoColumn?.render?.(
        null,
        { wardId: 1, propertyNo: "P123", partitionNo: "01" },
        0
      )
    ).toBe("W01-P123-01");

    expect(
      propertyNoColumn?.render?.(null, { wardId: 1, propertyNo: "P123" }, 0)
    ).toBe("W01-P123");

    expect(
      propertyNoColumn?.render?.(null, { wardId: 2, propertyNo: "P123" }, 0)
    ).toBe("P123");

    expect(propertyNoColumn?.render?.(null, {}, 0)).toBe("-");
  });

  it("should correctly render category as a StatusBadge", () => {
    const columns = getPropertyColumns(params);
    const categoryColumn = columns.find((c) => c.key === "categoryId");

    const result = categoryColumn?.render?.(1, {}, 0);
    const { getByTestId } = render(<>{result}</>);

    const badge = getByTestId("status-badge");
    expect(badge.textContent).toBe("Residential");
    expect(badge.getAttribute("data-variant")).toBe("info");

    expect(categoryColumn?.render?.(null, {}, 0)).toBe("-");
    expect(categoryColumn?.render?.(99, {}, 0)).toBe("-");
  });

  it("should correctly render property type from mapping", () => {
    const columns = getPropertyColumns(params);
    const typeColumn = columns.find((c) => c.key === "propertyTypeId");

    const result = typeColumn?.render?.(1, {}, 0);
    const { getByTestId } = render(<>{result}</>);

    const badge = getByTestId("status-badge");
    expect(badge.textContent).toBe("Flat");
    expect(badge.getAttribute("data-variant")).toBe("pending");
  });

  it("should render '-' for empty property type", () => {
    const columns = getPropertyColumns(params);
    const typeColumn = columns.find((c) => c.key === "propertyTypeId");

    expect(typeColumn?.render?.(null, {}, 0)).toBe("-");
  });

  it("should render '-' for unknown property type", () => {
    const columns = getPropertyColumns(params);
    const typeColumn = columns.find((c) => c.key === "propertyTypeId");

    expect(typeColumn?.render?.(99, {}, 0)).toBe("-");
  });
});