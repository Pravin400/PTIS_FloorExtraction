import { render, screen } from "@testing-library/react";
import { WaitingWindow } from "@/components/common/WaitingWindow";
import { describe, it, expect } from "vitest";

describe("WaitingWindow Component", () => {
  it("should not render when isOpen is false", () => {
    const { container } = render(<WaitingWindow isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("should render with default title and message when isOpen is true", () => {
    render(<WaitingWindow isOpen={true} />);
    
    expect(screen.getByText("Please Wait")).toBeInTheDocument();
    expect(
      screen.getByText("Processing your request. This may take a few moments...")
    ).toBeInTheDocument();
  });

  it("should render with custom title and message when provided", () => {
    const customTitle = "Custom Loading Title";
    const customMessage = "Custom loading message to show user.";
    
    render(
      <WaitingWindow
        isOpen={true}
        title={customTitle}
        message={customMessage}
      />
    );
    
    expect(screen.getByText(customTitle)).toBeInTheDocument();
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });
});
