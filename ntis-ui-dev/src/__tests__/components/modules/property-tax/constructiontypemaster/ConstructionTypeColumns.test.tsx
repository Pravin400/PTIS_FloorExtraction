import { getConstructionTypeColumns } from "@/components/modules/property-tax/construction-type-master/ConstructionTypeColumns";
import { render, screen } from "@testing-library/react";
import type { ConstructionType } from "@/types/construction.types";

vi.mock("@/components/common/ActionButtons", () => ({
  SortAscButton: () => <button data-testid="sort-asc" />,
  SortDescButton: () => <button data-testid="sort-desc" />,
  SortDefaultButton: () => <button data-testid="sort-default" />,
}));

describe("getConstructionTypeColumns", () => {
  const mockT = vi.fn((key: string) => key);
  const mockTCommon = vi.fn((key: string) => key);
  const mockOnSort = vi.fn();

  it("returns the correct number of columns", () => {
    const columns = getConstructionTypeColumns(mockT, mockTCommon);
    expect(columns).toHaveLength(5);
    expect(columns.map(c => c.key)).toEqual(["constructionCode", "descriptionEnglish", "description", "searchSequence", "isActive"]);
  });

  it("renders sortable headers for allowed columns", () => {
    const columns = getConstructionTypeColumns(mockT, mockTCommon, "constructionCode", "asc", mockOnSort);
    
    // Test constructionCode column Label
    const colCode = columns.find(c => c.key === "constructionCode");
    render(<div>{colCode?.label}</div>);
    expect(screen.getByTestId("sort-asc")).toBeInTheDocument();
  });

  it("renders default sort icon for sortable columns when not active", () => {
    const columns = getConstructionTypeColumns(mockT, mockTCommon, "description", "asc", mockOnSort);
    
    // Check constructionCode (not active)
    const colCode = columns.find(c => c.key === "constructionCode");
    render(<div>{colCode?.label}</div>);
    expect(screen.getByTestId("sort-default")).toBeInTheDocument();
  });

  it("renders sortable headers for searchSequence column and not for isActive column", () => {
    const columns = getConstructionTypeColumns(mockT, mockTCommon, "searchSequence", "desc", mockOnSort);
    
    const colSeq = columns.find(c => c.key === "searchSequence");
    const { unmount } = render(<div>{colSeq?.label}</div>);
    expect(screen.getByTestId("sort-desc")).toBeInTheDocument();
    unmount();

    // Check isActive column (should not be sortable)
    const colActive = columns.find(c => c.key === "isActive");
    render(<div>{colActive?.label}</div>);
    expect(screen.queryByTestId("sort-default")).not.toBeInTheDocument();
    expect(screen.queryByTestId("sort-asc")).not.toBeInTheDocument();
    expect(screen.queryByTestId("sort-desc")).not.toBeInTheDocument();
  });

  it("correctly renders column values using the render function", () => {
    const columns = getConstructionTypeColumns(mockT, mockTCommon);
    
    const dummyRow = {} as ConstructionType;
    const colCode = columns.find(c => c.key === "constructionCode");
    expect(colCode?.render?.("CODE123", dummyRow, 0)).toBe("CODE123");
    expect(colCode?.render?.(null as unknown as string, dummyRow, 0)).toBe("");

    const colDesc = columns.find(c => c.key === "description");
    expect(colDesc?.render?.("Description", dummyRow, 0)).toBe("Description");

    const colSeq = columns.find(c => c.key === "searchSequence");
    expect(colSeq?.render?.(10, dummyRow, 0)).toBe(10);
  });
});
