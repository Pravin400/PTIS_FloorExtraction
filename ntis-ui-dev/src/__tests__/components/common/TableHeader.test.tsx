import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import TableHeader from "@/components/common/TableHeader";
import { Plus } from "lucide-react";

describe("TableHeader", () => {
  it("renders title and icon", () => {
    render(<TableHeader title="My Table" icon={Plus} />);
    expect(screen.getByText("My Table")).toBeInTheDocument();
    expect(screen.getByRole("banner").querySelector("svg")).toBeInTheDocument();
  });

  it("renders subtitle if provided", () => {
    render(<TableHeader title="Title" subtitle="Subtitle" icon={Plus} />);
    expect(screen.getByText("Subtitle")).toBeInTheDocument();
  });

  it("renders rightContent if provided", () => {
    render(<TableHeader title="Title" icon={Plus} rightContent={<span>Right</span>} />);
    expect(screen.getByText("Right")).toBeInTheDocument();
  });

  it("renders action button if actionLabel and onActionClick provided", () => {
    const handleClick = vi.fn();
    render(<TableHeader title="Title" icon={Plus} actionLabel="Add" onActionClick={handleClick} />);
    expect(screen.getByText("Add")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Add"));
    expect(handleClick).toHaveBeenCalled();
  });

  it("disables action button if actionDisabled is true", () => {
    const handleClick = vi.fn();
    render(<TableHeader title="Title" icon={Plus} actionLabel="Add" onActionClick={handleClick} actionDisabled />);
    const button = screen.getByRole("button", { name: "Add" });
    expect(button).toBeDisabled();
  });

  it("applies custom className", () => {
    const { container } = render(<TableHeader title="Title" icon={Plus} className="custom-header" />);
    expect(container.firstChild).toHaveClass("custom-header");
  });
});
