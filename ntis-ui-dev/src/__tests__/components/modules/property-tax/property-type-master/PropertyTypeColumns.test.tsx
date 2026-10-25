import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { getPropertyTypeColumns } from "@/components/modules/property-tax/property-type-master/PropertyTypeColumns";
import type { PropertyType, PropertyTypeAndTypeOfUseValidation } from "@/types/property-type.types";
import type { PropertyTypeCategory } from "@/types/property-type-category.types";
import type { UseType } from "@/types/typeOfUse.types";

describe("PropertyTypeColumns", () => {
  const mockT = (key: string) => key;
  const mockTCommon = (key: string) => key;

  const mockCategories = [
    { id: 1, propertyTypeCategory: "Residential Category", isActive: true },
  ] as PropertyTypeCategory[];

  const mockTypeOfUseList = [
    { typeOfUseId: 10, typeOfUseCode: "R1", description: "Residential 1", type: "R" },
    { typeOfUseId: 11, typeOfUseCode: "C1", description: "Commercial 1", type: "C" },
    { typeOfUseId: 12, typeOfUseCode: "R2", description: "Residential 2", type: "R" },
    { typeOfUseId: 13, typeOfUseCode: "R3", description: "Residential 3", type: "R" },
  ] as UseType[];

  const mockValidations = [
    { propertyTypeId: 1, typeOfUseId: 10 },
    { propertyTypeId: 1, typeOfUseId: 11 },
    { propertyTypeId: 2, typeOfUseId: 10 },
    { propertyTypeId: 2, typeOfUseId: 11 },
    { propertyTypeId: 2, typeOfUseId: 12 },
    { propertyTypeId: 2, typeOfUseId: 13 },
  ] as PropertyTypeAndTypeOfUseValidation[];

  const mockRow = {
    id: 1,
    propertyDescription: "Test Property",
    type: "R",
    propertyTypeGroup: "Group 1",
    propertyTypeCategoryId: 1,
    searchSequence: 1,
    isActive: true,
  } as PropertyType;

  const mockRowWithManyVal = {
    id: 2,
    propertyDescription: "Complex Property",
    type: "C",
    propertyTypeGroup: "Group 2",
    propertyTypeCategoryId: 1,
    searchSequence: 2,
    isActive: true,
  } as PropertyType;

  it("returns correct column definitions", () => {
    const columns = getPropertyTypeColumns(mockT, mockTCommon);

    expect(columns.length).toBe(7);
    expect(columns[0].key).toBe("descriptionEnglish");
    expect(columns[1].key).toBe("propertyDescription");
    expect(columns[2].key).toBe("type");
    expect(columns[3].key).toBe("propertyTypeCategoryId");
    expect(columns[4].key).toBe("searchSequence");
    expect(columns[5].key).toBe("typeOfUseValidation");
    expect(columns[6].key).toBe("isActive");
  });

  it("renders simple column values correctly", () => {
    const columns = getPropertyTypeColumns(mockT, mockTCommon);
    
    const engCol = columns.find(c => c.key === "descriptionEnglish");
    expect(engCol?.render?.("English Test", mockRow, 0)).toBe("English Test");
    expect(engCol?.render?.(null, mockRow, 0)).toBe("-");

    const descCol = columns.find(c => c.key === "propertyDescription");
    expect(descCol?.render?.("Test", mockRow, 0)).toBe("Test");

    const seqCol = columns.find(c => c.key === "searchSequence");
    expect(seqCol?.render?.(5, mockRow, 0)).toBe(5);
  });

  it("renders category correctly based on ID mapping", () => {
    const columns = getPropertyTypeColumns(mockT, mockTCommon, undefined, undefined, undefined, mockCategories);
    
    const catCol = columns.find(c => c.key === "propertyTypeCategoryId");
    
    expect(catCol?.render?.(1, mockRow, 0)).toBe("Residential Category");
    expect(catCol?.render?.(99, mockRow, 0)).toBe("-");
    expect(catCol?.render?.(null, mockRow, 0)).toBe("-");
  });

  it("renders type of use validation badges correctly", () => {
    const onTypeOfUseClick = vi.fn();
    const columns = getPropertyTypeColumns(
      mockT, mockTCommon, undefined, undefined, undefined, 
      mockCategories, mockTypeOfUseList, mockValidations, onTypeOfUseClick
    );
    
    const valCol = columns.find(c => c.key === "typeOfUseValidation");
    
    // Row 1 has 2 validations: R1, C1
    const { container: container1 } = render(<>{valCol?.render?.(null, mockRow, 0)}</>);
    expect(container1.textContent).toContain("R1");
    expect(container1.textContent).toContain("C1");
    
    // Test click handler
    const button = container1.querySelector("button");
    fireEvent.click(button!);
    expect(onTypeOfUseClick).toHaveBeenCalledWith(mockRow);

    // Row 2 has 4 validations, so it should show +1 badge
    const { container: container2 } = render(<>{valCol?.render?.(null, mockRowWithManyVal, 0)}</>);
    expect(container2.textContent).toContain("R1");
    expect(container2.textContent).toContain("C1");
    expect(container2.textContent).toContain("R2");
    expect(container2.textContent).toContain("+1");
  });

  it("handles missing propertyTypeId or no validations gracefully", () => {
    const columns = getPropertyTypeColumns(mockT, mockTCommon);
    const valCol = columns.find(c => c.key === "typeOfUseValidation");
    
    expect(valCol?.render?.(null, { ...mockRow, id: 0 } as PropertyType, 0)).toBe("-");
    expect(valCol?.render?.(null, { ...mockRow, id: 999 } as PropertyType, 0)).toBe("-");
  });

  it("renders sortable headers correctly", () => {
    const onSort = vi.fn();
    const columns = getPropertyTypeColumns(mockT, mockTCommon, "type", "asc", onSort);
    
    const typeCol = columns.find(c => c.key === "type");
    const { container } = render(<>{typeCol?.label}</>);
    
    // It should render a sort button (the specific icon/button depends on ActionButtons implementation)
    // But we know it should have an aria-label containing 'ascending' based on the logic
    const button = container.querySelector("button");
    expect(button).toBeInTheDocument();
    
    if (button) {
      fireEvent.click(button);
      expect(onSort).toHaveBeenCalledWith("type");
    }
  });
});
