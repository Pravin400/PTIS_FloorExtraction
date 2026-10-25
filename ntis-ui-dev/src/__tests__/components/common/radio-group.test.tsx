import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import * as React from 'react';

import { RadioGroup, RadioGroupItem } from '@/components/common';


describe('RadioGroup', () => {
    // ─────────────────────────────────────────────────────────────
    // 1. Basic Rendering
    // ─────────────────────────────────────────────────────────────

    it('renders a radiogroup container', () => {
        render(
            <RadioGroup>
                <RadioGroupItem value="a" />
            </RadioGroup>
        );
        expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    it('renders radio items inside the group', () => {
        render(
            <RadioGroup>
                <RadioGroupItem value="a" />
                <RadioGroupItem value="b" />
                <RadioGroupItem value="c" />
            </RadioGroup>
        );
        const radios = screen.getAllByRole('radio');
        expect(radios).toHaveLength(3);
    });

    it('renders items as button elements', () => {
        render(
            <RadioGroup>
                <RadioGroupItem value="a" />
            </RadioGroup>
        );
        const radio = screen.getByRole('radio');
        expect(radio.tagName).toBe('BUTTON');
        expect(radio).toHaveAttribute('type', 'button');
    });

    // ─────────────────────────────────────────────────────────────
    // 2. Default / Initial State
    // ─────────────────────────────────────────────────────────────

    it('no item is selected by default', () => {
        render(
            <RadioGroup>
                <RadioGroupItem value="a" />
                <RadioGroupItem value="b" />
            </RadioGroup>
        );
        const radios = screen.getAllByRole('radio');
        radios.forEach((r) => {
            expect(r).toHaveAttribute('aria-checked', 'false');
        });
    });

    it('selects the item matching defaultValue', () => {
        render(
            <RadioGroup defaultValue="b">
                <RadioGroupItem value="a" />
                <RadioGroupItem value="b" />
            </RadioGroup>
        );
        expect(screen.getAllByRole('radio')[0]).toHaveAttribute('aria-checked', 'false');
        expect(screen.getAllByRole('radio')[1]).toHaveAttribute('aria-checked', 'true');
    });

    // ─────────────────────────────────────────────────────────────
    // 3. Controlled State
    // ─────────────────────────────────────────────────────────────

    it('selects the item matching controlled value prop', () => {
        render(
            <RadioGroup value="b">
                <RadioGroupItem value="a" />
                <RadioGroupItem value="b" />
            </RadioGroup>
        );
        expect(screen.getAllByRole('radio')[0]).toHaveAttribute('aria-checked', 'false');
        expect(screen.getAllByRole('radio')[1]).toHaveAttribute('aria-checked', 'true');
    });

    it('does not change internal state in controlled mode', async () => {
        const handleChange = vi.fn();
        const user = userEvent.setup();

        render(
            <RadioGroup value="a" onValueChange={handleChange}>
                <RadioGroupItem value="a" />
                <RadioGroupItem value="b" />
            </RadioGroup>
        );

        await user.click(screen.getAllByRole('radio')[1]);
        expect(handleChange).toHaveBeenCalledWith('b');
        // Still shows "a" as selected since parent controls state
        expect(screen.getAllByRole('radio')[0]).toHaveAttribute('aria-checked', 'true');
    });

    it('updates when controlled value prop changes', () => {
        const { rerender } = render(
            <RadioGroup value="a">
                <RadioGroupItem value="a" />
                <RadioGroupItem value="b" />
            </RadioGroup>
        );

        expect(screen.getAllByRole('radio')[0]).toHaveAttribute('aria-checked', 'true');

        rerender(
            <RadioGroup value="b">
                <RadioGroupItem value="a" />
                <RadioGroupItem value="b" />
            </RadioGroup>
        );

        expect(screen.getAllByRole('radio')[0]).toHaveAttribute('aria-checked', 'false');
        expect(screen.getAllByRole('radio')[1]).toHaveAttribute('aria-checked', 'true');
    });

    // ─────────────────────────────────────────────────────────────
    // 4. User Interaction – Click
    // ─────────────────────────────────────────────────────────────

    it('selects an item on click (uncontrolled)', async () => {
        const user = userEvent.setup();
        render(
            <RadioGroup>
                <RadioGroupItem value="a" />
                <RadioGroupItem value="b" />
            </RadioGroup>
        );
        const radios = screen.getAllByRole('radio');

        await user.click(radios[1]);
        expect(radios[0]).toHaveAttribute('aria-checked', 'false');
        expect(radios[1]).toHaveAttribute('aria-checked', 'true');
    });

    it('switches selection on click (uncontrolled)', async () => {
        const user = userEvent.setup();
        render(
            <RadioGroup>
                <RadioGroupItem value="a" />
                <RadioGroupItem value="b" />
            </RadioGroup>
        );
        const radios = screen.getAllByRole('radio');

        await user.click(radios[0]);
        expect(radios[0]).toHaveAttribute('aria-checked', 'true');

        await user.click(radios[1]);
        expect(radios[0]).toHaveAttribute('aria-checked', 'false');
        expect(radios[1]).toHaveAttribute('aria-checked', 'true');
    });

    it('calls onValueChange when an item is clicked', async () => {
        const handleChange = vi.fn();
        const user = userEvent.setup();

        render(
            <RadioGroup onValueChange={handleChange}>
                <RadioGroupItem value="a" />
                <RadioGroupItem value="b" />
            </RadioGroup>
        );

        await user.click(screen.getAllByRole('radio')[1]);
        expect(handleChange).toHaveBeenCalledTimes(1);
        expect(handleChange).toHaveBeenCalledWith('b');
    });

    it('does not call onValueChange when clicking already-selected item', async () => {
        const handleChange = vi.fn();
        const user = userEvent.setup();

        render(
            <RadioGroup defaultValue="a" onValueChange={handleChange}>
                <RadioGroupItem value="a" />
                <RadioGroupItem value="b" />
            </RadioGroup>
        );

        await user.click(screen.getAllByRole('radio')[0]);
        expect(handleChange).not.toHaveBeenCalled();
    });

    // ─────────────────────────────────────────────────────────────
    // 5. Disabled State
    // ─────────────────────────────────────────────────────────────

    it('disables all items when group is disabled', () => {
        render(
            <RadioGroup disabled>
                <RadioGroupItem value="a" />
                <RadioGroupItem value="b" />
            </RadioGroup>
        );
        screen.getAllByRole('radio').forEach((r) => {
            expect(r).toBeDisabled();
        });
    });

    it('does not allow selection when group is disabled', async () => {
        const handleChange = vi.fn();
        const user = userEvent.setup();

        render(
            <RadioGroup disabled onValueChange={handleChange}>
                <RadioGroupItem value="a" />
                <RadioGroupItem value="b" />
            </RadioGroup>
        );

        await user.click(screen.getAllByRole('radio')[0]);
        expect(handleChange).not.toHaveBeenCalled();
    });

    it('disables individual item when item disabled prop is set', () => {
        render(
            <RadioGroup>
                <RadioGroupItem value="a" />
                <RadioGroupItem value="b" disabled />
            </RadioGroup>
        );
        const radios = screen.getAllByRole('radio');
        expect(radios[0]).not.toBeDisabled();
        expect(radios[1]).toBeDisabled();
    });

    it('does not select a disabled individual item on click', async () => {
        const handleChange = vi.fn();
        const user = userEvent.setup();

        render(
            <RadioGroup onValueChange={handleChange}>
                <RadioGroupItem value="a" />
                <RadioGroupItem value="b" disabled />
            </RadioGroup>
        );

        await user.click(screen.getAllByRole('radio')[1]);
        expect(handleChange).not.toHaveBeenCalled();
    });

    // ─────────────────────────────────────────────────────────────
    // 6. Data Attributes
    // ─────────────────────────────────────────────────────────────

    it('sets data-state="unchecked" on unselected items', () => {
        render(
            <RadioGroup>
                <RadioGroupItem value="a" />
            </RadioGroup>
        );
        expect(screen.getByRole('radio')).toHaveAttribute('data-state', 'unchecked');
    });

    it('sets data-state="checked" on the selected item', () => {
        render(
            <RadioGroup value="a">
                <RadioGroupItem value="a" />
            </RadioGroup>
        );
        expect(screen.getByRole('radio')).toHaveAttribute('data-state', 'checked');
    });

    it('toggles data-state on click', async () => {
        const user = userEvent.setup();
        render(
            <RadioGroup>
                <RadioGroupItem value="a" />
                <RadioGroupItem value="b" />
            </RadioGroup>
        );
        const radios = screen.getAllByRole('radio');

        await user.click(radios[0]);
        expect(radios[0]).toHaveAttribute('data-state', 'checked');
        expect(radios[1]).toHaveAttribute('data-state', 'unchecked');

        await user.click(radios[1]);
        expect(radios[0]).toHaveAttribute('data-state', 'unchecked');
        expect(radios[1]).toHaveAttribute('data-state', 'checked');
    });

    // ─────────────────────────────────────────────────────────────
    // 7. Accessibility
    // ─────────────────────────────────────────────────────────────

    it('group has role="radiogroup"', () => {
        render(
            <RadioGroup>
                <RadioGroupItem value="a" />
            </RadioGroup>
        );
        expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    it('items have role="radio"', () => {
        render(
            <RadioGroup>
                <RadioGroupItem value="a" />
            </RadioGroup>
        );
        expect(screen.getByRole('radio')).toBeInTheDocument();
    });

    it('supports aria-label on group', () => {
        render(
            <RadioGroup aria-label="Choose plan">
                <RadioGroupItem value="a" />
            </RadioGroup>
        );
        expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-label', 'Choose plan');
    });

    it('supports aria-label on items', () => {
        render(
            <RadioGroup>
                <RadioGroupItem value="a" aria-label="Option A" />
            </RadioGroup>
        );
        expect(screen.getByRole('radio', { name: 'Option A' })).toBeInTheDocument();
    });

    // ─────────────────────────────────────────────────────────────
    // 8. Keyboard Interaction
    // ─────────────────────────────────────────────────────────────

    it('selects on Space key press', async () => {
        const handleChange = vi.fn();
        const user = userEvent.setup();

        render(
            <RadioGroup onValueChange={handleChange}>
                <RadioGroupItem value="a" />
                <RadioGroupItem value="b" />
            </RadioGroup>
        );
        const radios = screen.getAllByRole('radio');

        radios[1].focus();
        expect(radios[1]).toHaveFocus();

        await user.keyboard(' ');
        expect(handleChange).toHaveBeenCalledWith('b');
    });

    it('items are focusable via Tab', async () => {
        const user = userEvent.setup();
        render(
            <RadioGroup>
                <RadioGroupItem value="a" />
            </RadioGroup>
        );

        await user.tab();
        expect(screen.getByRole('radio')).toHaveFocus();
    });

    // ─────────────────────────────────────────────────────────────
    // 9. className Forwarding
    // ─────────────────────────────────────────────────────────────

    it('applies custom className to RadioGroup', () => {
        render(
            <RadioGroup className="custom-group">
                <RadioGroupItem value="a" />
            </RadioGroup>
        );
        expect(screen.getByRole('radiogroup')).toHaveClass('custom-group');
    });

    it('applies custom className to RadioGroupItem', () => {
        render(
            <RadioGroup>
                <RadioGroupItem value="a" className="custom-item" />
            </RadioGroup>
        );
        expect(screen.getByRole('radio')).toHaveClass('custom-item');
    });

    // ─────────────────────────────────────────────────────────────
    // 10. Ref Forwarding
    // ─────────────────────────────────────────────────────────────

    it('forwards ref to RadioGroup div element', () => {
        const ref = React.createRef<HTMLDivElement>();
        render(
            <RadioGroup ref={ref}>
                <RadioGroupItem value="a" />
            </RadioGroup>
        );
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current).toBe(screen.getByRole('radiogroup'));
    });

    it('forwards ref to RadioGroupItem button element', () => {
        const ref = React.createRef<HTMLButtonElement>();
        render(
            <RadioGroup>
                <RadioGroupItem ref={ref} value="a" />
            </RadioGroup>
        );
        expect(ref.current).toBeInstanceOf(HTMLButtonElement);
        expect(ref.current).toBe(screen.getByRole('radio'));
    });

    // ─────────────────────────────────────────────────────────────
    // 11. Props Spread
    // ─────────────────────────────────────────────────────────────

    it('spreads additional props to RadioGroup', () => {
        render(
            <RadioGroup data-testid="my-group" id="plan-group">
                <RadioGroupItem value="a" />
            </RadioGroup>
        );
        const group = screen.getByTestId('my-group');
        expect(group).toHaveAttribute('id', 'plan-group');
    });

    it('spreads additional props to RadioGroupItem', () => {
        render(
            <RadioGroup>
                <RadioGroupItem value="a" data-testid="item-a" id="radio-a" />
            </RadioGroup>
        );
        const item = screen.getByTestId('item-a');
        expect(item).toHaveAttribute('id', 'radio-a');
    });

    // ─────────────────────────────────────────────────────────────
    // 12. Name & Value for Forms
    // ─────────────────────────────────────────────────────────────

    it('assigns name to all items from the group', () => {
        render(
            <RadioGroup name="plan">
                <RadioGroupItem value="free" />
                <RadioGroupItem value="pro" />
            </RadioGroup>
        );
        // Check hidden inputs for name attribute
        const inputs = document.querySelectorAll('input[type="radio"]');
        inputs.forEach((input) => {
            expect(input).toHaveAttribute('name', 'plan');
        });
    });

    it('items have their own value attribute', () => {
        render(
            <RadioGroup>
                <RadioGroupItem value="free" />
                <RadioGroupItem value="pro" />
            </RadioGroup>
        );
        const inputs = document.querySelectorAll('input[type="radio"]');
        expect(inputs[0]).toHaveAttribute('value', 'free');
        expect(inputs[1]).toHaveAttribute('value', 'pro');
    });

    // ─────────────────────────────────────────────────────────────
    // 13. Display Names
    // ─────────────────────────────────────────────────────────────

    it('RadioGroup has the correct displayName', () => {
        expect(RadioGroup.displayName).toBe('RadioGroup');
    });

    it('RadioGroupItem has the correct displayName', () => {
        expect(RadioGroupItem.displayName).toBe('RadioGroupItem');
    });

    // ─────────────────────────────────────────────────────────────
    // 14. Circle Icon Rendering
    // ─────────────────────────────────────────────────────────────

    it('shows circle icon only on selected item', async () => {
        const user = userEvent.setup();
        const { container } = render(
            <RadioGroup>
                <RadioGroupItem value="a" />
                <RadioGroupItem value="b" />
            </RadioGroup>
        );

        // No SVG initially
        expect(container.querySelectorAll('svg')).toHaveLength(0);

        // Click first item – one SVG appears
        await user.click(screen.getAllByRole('radio')[0]);
        expect(container.querySelectorAll('svg')).toHaveLength(1);

        // Switch to second item – still one SVG total
        await user.click(screen.getAllByRole('radio')[1]);
        expect(container.querySelectorAll('svg')).toHaveLength(1);
    });

    // ─────────────────────────────────────────────────────────────
    // 15. Integration: RadioGroup with Labels
    // ─────────────────────────────────────────────────────────────

    it('works with associated labels', async () => {
        const handleChange = vi.fn();
        const user = userEvent.setup();

        render(
            <RadioGroup onValueChange={handleChange}>
                <div>
                    <RadioGroupItem value="a" id="radio-a" />
                    <label htmlFor="radio-a">Option A</label>
                </div>
                <div>
                    <RadioGroupItem value="b" id="radio-b" />
                    <label htmlFor="radio-b">Option B</label>
                </div>
            </RadioGroup>
        );

        await user.click(screen.getByText('Option B'));
        expect(handleChange).toHaveBeenCalledWith('b');
    });

    // ─────────────────────────────────────────────────────────────
    // 16. Error Boundary – Item outside Group
    // ─────────────────────────────────────────────────────────────

    it('throws error when RadioGroupItem is used outside RadioGroup', () => {
        // Suppress console.error from React error boundary
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { });

        expect(() => {
            render(<RadioGroupItem value="a" />);
        }).toThrow('RadioGroupItem must be used within a <RadioGroup>');

        spy.mockRestore();
    });
});
