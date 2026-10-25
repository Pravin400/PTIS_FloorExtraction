import { render, screen } from "@testing-library/react";
import { ValidationSection } from "@/components/modules/property-tax/construction-type-master/components/ValidationSection";

describe("ValidationSection", () => {
  it("renders the mandatory fields note", () => {
    const mockTCommon = vi.fn((key: string) => key === "note.mandatory" ? "Mandatory fields" : key);
    render(<ValidationSection tCommon={mockTCommon} />);
    
    expect(screen.getByText("Mandatory fields")).toBeInTheDocument();
  });
});
