import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
  GridContainerCard,
  GridContainerCardHeader,
  GridContainerCardContent,
} from "@/components/common/GridContainerCard";

describe("GridContainerCard", () => {
  describe("GridContainerCard", () => {
    it("renders children correctly", () => {
      render(
        <GridContainerCard>
          <div>Test Content</div>
        </GridContainerCard>
      );

      expect(screen.getByText("Test Content")).toBeInTheDocument();
    });

    it("applies default classes", () => {
      const { container } = render(
        <GridContainerCard>
          <div>Test</div>
        </GridContainerCard>
      );

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass("bg-white");
      expect(card).toHaveClass("rounded-lg");
      expect(card).toHaveClass("p-6"); // default padding is "md" which is p-6
    });

    it("accepts custom className", () => {
      const { container } = render(
        <GridContainerCard className="custom-class">
          <div>Test</div>
        </GridContainerCard>
      );

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass("custom-class");
    });

    it("renders multiple children", () => {
      render(
        <GridContainerCard>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </GridContainerCard>
      );

      expect(screen.getByText("Child 1")).toBeInTheDocument();
      expect(screen.getByText("Child 2")).toBeInTheDocument();
      expect(screen.getByText("Child 3")).toBeInTheDocument();
    });
  });

  describe("GridContainerCardHeader", () => {
    it("renders header content", () => {
      render(
        <GridContainerCardHeader>
          <h2>Header Title</h2>
        </GridContainerCardHeader>
      );

      expect(screen.getByText("Header Title")).toBeInTheDocument();
    });

    it("applies header-specific classes", () => {
      const { container } = render(
        <GridContainerCardHeader>
          <div>Header</div>
        </GridContainerCardHeader>
      );

      const header = container.firstChild as HTMLElement;
      expect(header).toHaveClass("mb-0");
    });

    it("accepts custom className", () => {
      const { container } = render(
        <GridContainerCardHeader className="custom-header">
          <div>Header</div>
        </GridContainerCardHeader>
      );

      const header = container.firstChild as HTMLElement;
      expect(header).toHaveClass("custom-header");
    });

    it("renders with icon and text", () => {
      render(
        <GridContainerCardHeader>
          <span>📊</span>
          <span>Statistics</span>
        </GridContainerCardHeader>
      );

      expect(screen.getByText("📊")).toBeInTheDocument();
      expect(screen.getByText("Statistics")).toBeInTheDocument();
    });
  });

  describe("GridContainerCardContent", () => {
    it("renders content correctly", () => {
      render(
        <GridContainerCardContent>
          <p>Content goes here</p>
        </GridContainerCardContent>
      );

      expect(screen.getByText("Content goes here")).toBeInTheDocument();
    });

    it("applies content-specific classes", () => {
      const { container } = render(
        <GridContainerCardContent>
          <div>Content</div>
        </GridContainerCardContent>
      );

      const content = container.firstChild as HTMLElement;
      // Content has no default classes, only accepts custom className
      expect(content).toBeInTheDocument();
    });

    it("accepts custom className", () => {
      const { container } = render(
        <GridContainerCardContent className="custom-content">
          <div>Content</div>
        </GridContainerCardContent>
      );

      const content = container.firstChild as HTMLElement;
      expect(content).toHaveClass("custom-content");
    });

    it("renders complex content structure", () => {
      render(
        <GridContainerCardContent>
          <div className="grid">
            <div className="col">Column 1</div>
            <div className="col">Column 2</div>
          </div>
        </GridContainerCardContent>
      );

      expect(screen.getByText("Column 1")).toBeInTheDocument();
      expect(screen.getByText("Column 2")).toBeInTheDocument();
    });
  });

  describe("GridContainerCard - Complete Structure", () => {
    it("renders complete card with header and content", () => {
      render(
        <GridContainerCard>
          <GridContainerCardHeader>
            <h2>Card Title</h2>
          </GridContainerCardHeader>
          <GridContainerCardContent>
            <p>Card body content</p>
          </GridContainerCardContent>
        </GridContainerCard>
      );

      expect(screen.getByText("Card Title")).toBeInTheDocument();
      expect(screen.getByText("Card body content")).toBeInTheDocument();
    });

    it("renders multiple sections in content", () => {
      render(
        <GridContainerCard>
          <GridContainerCardHeader>
            <h2>Dashboard</h2>
          </GridContainerCardHeader>
          <GridContainerCardContent>
            <div>Section 1</div>
          </GridContainerCardContent>
          <GridContainerCardContent>
            <div>Section 2</div>
          </GridContainerCardContent>
        </GridContainerCard>
      );

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Section 1")).toBeInTheDocument();
      expect(screen.getByText("Section 2")).toBeInTheDocument();
    });

    it("handles empty header", () => {
      render(
        <GridContainerCard>
          <GridContainerCardHeader />
          <GridContainerCardContent>
            <div>Content only</div>
          </GridContainerCardContent>
        </GridContainerCard>
      );

      expect(screen.getByText("Content only")).toBeInTheDocument();
    });

    it("handles empty content", () => {
      render(
        <GridContainerCard>
          <GridContainerCardHeader>
            <div>Header only</div>
          </GridContainerCardHeader>
          <GridContainerCardContent />
        </GridContainerCard>
      );

      expect(screen.getByText("Header only")).toBeInTheDocument();
    });
  });
});
