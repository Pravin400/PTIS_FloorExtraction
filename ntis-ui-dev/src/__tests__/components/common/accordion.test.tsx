
import { render, fireEvent, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Accordion,  AccordionItemType } from "@/components/common/accordion";

describe("Accordion", () => {
  const items: AccordionItemType[] = [
    { title: "Section 1", content: <div>Content 1</div> },
    { title: "Section 2", content: <div>Content 2</div> },
    { title: "Section 3", content: <div>Content 3</div>, disabled: true },
  ];

  it("renders all accordion items", () => {
    render(<Accordion items={items} />);
    expect(screen.getByText("Section 1")).toBeInTheDocument();
    expect(screen.getByText("Section 2")).toBeInTheDocument();
    expect(screen.getByText("Section 3")).toBeInTheDocument();
  });

  it("expands and collapses an item on click", () => {
    render(<Accordion items={items} />);
    const trigger = screen.getByText("Section 1");
    fireEvent.click(trigger);
    expect(screen.getByText("Content 1")).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
  });

  it("does not expand disabled items", () => {
    render(<Accordion items={items} />);
    const trigger = screen.getByText("Section 3");
    fireEvent.click(trigger);
    expect(screen.queryByText("Content 3")).not.toBeInTheDocument();
  });

  it("allows multiple open if multiple=true", () => {
    render(<Accordion items={items} multiple />);
    const trigger1 = screen.getByText("Section 1");
    const trigger2 = screen.getByText("Section 2");
    fireEvent.click(trigger1);
    fireEvent.click(trigger2);
    expect(screen.getByText("Content 1")).toBeInTheDocument();
    expect(screen.getByText("Content 2")).toBeInTheDocument();
  });

  it("opens defaultOpen items", () => {
    render(<Accordion items={items} defaultOpen={[1]} />);
    expect(screen.getByText("Content 2")).toBeInTheDocument();
  });
});
