import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ValidationSection } from "@/components/modules/property-tax/property-type-master/components/ValidationSection";

describe("ValidationSection", () => {
  it("renders the validation message correctly", () => {
    render(<ValidationSection tCommon={(key) => key} />);

    expect(screen.getByText("note.mandatory")).toBeInTheDocument();
  });
});
