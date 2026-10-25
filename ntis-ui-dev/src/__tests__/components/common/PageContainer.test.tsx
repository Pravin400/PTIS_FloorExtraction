import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PageContainer } from "@/components/common/PageContainer";

describe("PageContainer", () => {
  it("renders children", () => {
    render(
      <PageContainer>
        <span>Test Content</span>
      </PageContainer>
    );
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <PageContainer className="custom-class">
        <span>Test Content</span>
      </PageContainer>
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("has default classes for layout and background", () => {
    const { container } = render(
      <PageContainer>
        <span>Test Content</span>
      </PageContainer>
    );
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain("bg-[#F8FAFC]");
    expect(div.className).toContain("flex-1");
  });
});
