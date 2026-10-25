import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useOptionTooltips } from "@/hooks/weightageMaster/useOptionTooltips";

function TestHarness() {
    const { containerRef, tooltip } = useOptionTooltips<HTMLDivElement>();
    return (
        <div ref={containerRef} data-testid="container">
            {tooltip}
            <ul>
                <li role="option" aria-selected={false}>Long Option Label That Might Truncate</li>
            </ul>
            <input role="combobox" aria-expanded={false} aria-controls="test-listbox" defaultValue="Selected Value Text" readOnly />
            <span data-testid="unrelated">Not an option or combobox</span>
        </div>
    );
}

describe("useOptionTooltips", () => {
    it("shows no tooltip initially", () => {
        render(<TestHarness />);
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("shows a tooltip with the option's full text on hover", () => {
        render(<TestHarness />);
        fireEvent.mouseOver(screen.getByRole("option"));
        expect(screen.getByRole("tooltip")).toHaveTextContent("Long Option Label That Might Truncate");
    });

    it("shows a tooltip with the combobox input's value on hover", () => {
        render(<TestHarness />);
        fireEvent.mouseOver(screen.getByRole("combobox"));
        expect(screen.getByRole("tooltip")).toHaveTextContent("Selected Value Text");
    });

    it("hides the tooltip when the mouse leaves the container", () => {
        render(<TestHarness />);
        fireEvent.mouseOver(screen.getByRole("option"));
        expect(screen.getByRole("tooltip")).toBeInTheDocument();

        fireEvent.mouseLeave(screen.getByTestId("container"));
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("does not show a tooltip when hovering an element that is not an option or combobox", () => {
        render(<TestHarness />);
        fireEvent.mouseOver(screen.getByTestId("unrelated"));
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("switches the tooltip text when hovering from one option to another", () => {
        render(<TestHarness />);
        fireEvent.mouseOver(screen.getByRole("option"));
        expect(screen.getByRole("tooltip")).toHaveTextContent("Long Option Label That Might Truncate");

        fireEvent.mouseOver(screen.getByRole("combobox"));
        expect(screen.getByRole("tooltip")).toHaveTextContent("Selected Value Text");
    });
});
