import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MandatoryFieldsNotice } from "@/components/modules/water-bill/connection-type-master/MandatoryFieldsNotice";

describe("MandatoryFieldsNotice Component", () => {
  it("renders notice message correctly", () => {
    render(<MandatoryFieldsNotice message="* Indicates mandatory fields" />);
    expect(screen.getByText("* Indicates mandatory fields")).toBeInTheDocument();
  });
});
