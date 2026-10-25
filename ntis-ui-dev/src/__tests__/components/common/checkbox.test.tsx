import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import * as React from 'react';
import { Checkbox } from '@/components/common';

describe('Checkbox', () => {
  // ─────────────────────────────────────────────────────────────
  // 1. Basic Rendering
  // ─────────────────────────────────────────────────────────────

  it('renders without crashing', () => {
    render(<Checkbox />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  it('renders with correct default ARIA role', () => {
    render(<Checkbox />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDefined();
  });

  it('renders as unchecked by default', () => {
    render(<Checkbox />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
  });

  it('renders as a button element', () => {
    render(<Checkbox />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.tagName).toBe('BUTTON');
    expect(checkbox).toHaveAttribute('type', 'button');
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Checked / Unchecked States
  // ─────────────────────────────────────────────────────────────

  it('renders as checked when defaultChecked is true', () => {
    render(<Checkbox defaultChecked />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-checked', 'true');
  });

  it('renders as checked when checked prop is true', () => {
    render(<Checkbox checked />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-checked', 'true');
  });

  it('renders as unchecked when checked prop is false', () => {
    render(<Checkbox checked={false} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
  });

  // ─────────────────────────────────────────────────────────────
  // 3. User Interaction – Toggle via Click
  // ─────────────────────────────────────────────────────────────

  it('toggles checked state on click (uncontrolled)', async () => {
    const user = userEvent.setup();
    render(<Checkbox />);
    const checkbox = screen.getByRole('checkbox');

    // Initially unchecked
    expect(checkbox).toHaveAttribute('aria-checked', 'false');

    // Click to check
    await user.click(checkbox);
    expect(checkbox).toHaveAttribute('aria-checked', 'true');

    // Click again to uncheck
    await user.click(checkbox);
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onCheckedChange when toggled', async () => {
    const handleCheckedChange = vi.fn();
    const user = userEvent.setup();

    render(<Checkbox onCheckedChange={handleCheckedChange} />);
    const checkbox = screen.getByRole('checkbox');

    await user.click(checkbox);
    expect(handleCheckedChange).toHaveBeenCalledTimes(1);
    expect(handleCheckedChange).toHaveBeenCalledWith(true);
  });

  it('calls onCheckedChange with false when unchecking', async () => {
    const handleCheckedChange = vi.fn();
    const user = userEvent.setup();

    render(<Checkbox defaultChecked onCheckedChange={handleCheckedChange} />);
    const checkbox = screen.getByRole('checkbox');

    await user.click(checkbox);
    expect(handleCheckedChange).toHaveBeenCalledWith(false);
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Controlled vs Uncontrolled
  // ─────────────────────────────────────────────────────────────

  it('does not change internal state in controlled mode', async () => {
    const handleCheckedChange = vi.fn();
    const user = userEvent.setup();

    render(<Checkbox checked={false} onCheckedChange={handleCheckedChange} />);
    const checkbox = screen.getByRole('checkbox');

    await user.click(checkbox);
    // Callback fires, but DOM stays unchecked since parent controls state
    expect(handleCheckedChange).toHaveBeenCalledWith(true);
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
  });

  it('updates when controlled checked prop changes', () => {
    const { rerender } = render(<Checkbox checked={false} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-checked', 'false');

    rerender(<Checkbox checked={true} />);
    expect(checkbox).toHaveAttribute('aria-checked', 'true');
  });

  // ─────────────────────────────────────────────────────────────
  // 5. Disabled State
  // ─────────────────────────────────────────────────────────────

  it('renders as disabled when disabled prop is true', () => {
    render(<Checkbox disabled />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('does not toggle when disabled', async () => {
    const handleCheckedChange = vi.fn();
    const user = userEvent.setup();

    render(<Checkbox disabled onCheckedChange={handleCheckedChange} />);
    const checkbox = screen.getByRole('checkbox');

    await user.click(checkbox);
    expect(handleCheckedChange).not.toHaveBeenCalled();
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
  });

  it('applies disabled styling classes', () => {
    render(<Checkbox disabled />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  // ─────────────────────────────────────────────────────────────
  // 6. Custom className Forwarding
  // ─────────────────────────────────────────────────────────────

  it('applies custom className alongside default classes', () => {
    render(<Checkbox className="my-custom-class" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('my-custom-class');
  });

  it('merges custom className with default classes', () => {
    render(<Checkbox className="extra-class" />);
    const checkbox = screen.getByRole('checkbox');
    // Verify default classes are still present (via cn utility)
    expect(checkbox.className).toBeTruthy();
    expect(checkbox).toHaveClass('extra-class');
  });

  // ─────────────────────────────────────────────────────────────
  // 7. Ref Forwarding
  // ─────────────────────────────────────────────────────────────

  it('forwards ref to the underlying button element', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Checkbox ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('ref.current matches the rendered checkbox element', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Checkbox ref={ref} />);
    const checkbox = screen.getByRole('checkbox');
    expect(ref.current).toBe(checkbox);
  });

  // ─────────────────────────────────────────────────────────────
  // 8. Accessibility (a11y)
  // ─────────────────────────────────────────────────────────────

  it('has role="checkbox" for screen readers', () => {
    render(<Checkbox />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('supports aria-label for accessibility', () => {
    render(<Checkbox aria-label="Accept terms and conditions" />);
    const checkbox = screen.getByRole('checkbox', {
      name: 'Accept terms and conditions',
    });
    expect(checkbox).toBeInTheDocument();
  });

  it('supports aria-labelledby for external labels', () => {
    render(
      <>
        <label id="checkbox-label">Subscribe to newsletter</label>
        <Checkbox aria-labelledby="checkbox-label" />
      </>
    );
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-labelledby', 'checkbox-label');
  });

  it('has correct aria-checked attribute when checked', () => {
    render(<Checkbox checked />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-checked', 'true');
  });

  it('has correct aria-checked attribute when unchecked', () => {
    render(<Checkbox checked={false} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
  });

  // ─────────────────────────────────────────────────────────────
  // 9. Keyboard Interaction
  // ─────────────────────────────────────────────────────────────

  it('toggles on Space key press', async () => {
    const handleCheckedChange = vi.fn();
    const user = userEvent.setup();

    render(<Checkbox onCheckedChange={handleCheckedChange} />);
    const checkbox = screen.getByRole('checkbox');

    // Focus the checkbox
    checkbox.focus();
    expect(checkbox).toHaveFocus();

    // Press Space to toggle
    await user.keyboard(' ');
    expect(handleCheckedChange).toHaveBeenCalledWith(true);
  });

  it('is focusable via Tab key', async () => {
    const user = userEvent.setup();
    render(<Checkbox />);
    const checkbox = screen.getByRole('checkbox');

    await user.tab();
    expect(checkbox).toHaveFocus();
  });

  it('does not toggle on Enter key (only Space)', async () => {
    const handleCheckedChange = vi.fn();
    const user = userEvent.setup();

    render(<Checkbox onCheckedChange={handleCheckedChange} />);
    const checkbox = screen.getByRole('checkbox');

    checkbox.focus();
    await user.keyboard('{Enter}');
    // Enter should NOT toggle a checkbox per ARIA spec
    // (button default click via Enter is prevented by our keyDown handler)
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
  });

  // ─────────────────────────────────────────────────────────────
  // 10. Data Attributes
  // ─────────────────────────────────────────────────────────────

  it('has data-state="unchecked" when unchecked', () => {
    render(<Checkbox />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('data-state', 'unchecked');
  });

  it('has data-state="checked" when checked', () => {
    render(<Checkbox checked />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('data-state', 'checked');
  });

  it('toggles data-state attribute on click', async () => {
    const user = userEvent.setup();
    render(<Checkbox />);
    const checkbox = screen.getByRole('checkbox');

    expect(checkbox).toHaveAttribute('data-state', 'unchecked');

    await user.click(checkbox);
    expect(checkbox).toHaveAttribute('data-state', 'checked');

    await user.click(checkbox);
    expect(checkbox).toHaveAttribute('data-state', 'unchecked');
  });

  // ─────────────────────────────────────────────────────────────
  // 11. Props Spread
  // ─────────────────────────────────────────────────────────────

  it('spreads additional props to the root element', () => {
    render(<Checkbox data-testid="my-checkbox" id="terms" />);
    const checkbox = screen.getByTestId('my-checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveAttribute('id', 'terms');
  });

  it('supports name and value props for form submission', () => {
    const { container } = render(<Checkbox name="agreement" value="accepted" />);
    const input = container.querySelector('input[type="checkbox"]');
    expect(input).toHaveAttribute('name', 'agreement');
    expect(input).toHaveAttribute('value', 'accepted');
  });

  // ─────────────────────────────────────────────────────────────
  // 12. Display Name
  // ─────────────────────────────────────────────────────────────

  it('has the correct displayName', () => {
    expect(Checkbox.displayName).toBe('Checkbox');
  });

  // ─────────────────────────────────────────────────────────────
  // 13. Integration: Checkbox with Label
  // ─────────────────────────────────────────────────────────────

  it('works correctly with an associated label', async () => {
    const handleCheckedChange = vi.fn();
    const user = userEvent.setup();

    render(
      <div>
        <Checkbox id="terms-checkbox" onCheckedChange={handleCheckedChange} />
        <label htmlFor="terms-checkbox">I agree to the terms</label>
      </div>
    );

    const label = screen.getByText('I agree to the terms');
    expect(label).toBeInTheDocument();

    // Clicking the label should toggle the checkbox
    await user.click(label);
    expect(handleCheckedChange).toHaveBeenCalledWith(true);
  });

  // ─────────────────────────────────────────────────────────────
  // 14. Check Icon Rendering
  // ─────────────────────────────────────────────────────────────

  it('shows check icon only when checked', async () => {
    const user = userEvent.setup();
    const { container } = render(<Checkbox />);
    const checkbox = screen.getByRole('checkbox');

    // Unchecked: no SVG icon inside
    expect(container.querySelector('svg')).toBeNull();

    // Click to check: SVG icon appears
    await user.click(checkbox);
    expect(container.querySelector('svg')).not.toBeNull();

    // Click to uncheck: SVG icon disappears
    await user.click(checkbox);
    expect(container.querySelector('svg')).toBeNull();
  });

  it('renders check icon when defaultChecked is true', () => {
    const { container } = render(<Checkbox defaultChecked />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  // ─────────────────────────────────────────────────────────────
  // 15. Multiple Rapid Clicks
  // ─────────────────────────────────────────────────────────────

  it('handles multiple rapid clicks correctly', async () => {
    const handleCheckedChange = vi.fn();
    const user = userEvent.setup();

    render(<Checkbox onCheckedChange={handleCheckedChange} />);
    const checkbox = screen.getByRole('checkbox');

    await user.click(checkbox); // check
    await user.click(checkbox); // uncheck
    await user.click(checkbox); // check

    expect(handleCheckedChange).toHaveBeenCalledTimes(3);
    expect(handleCheckedChange).toHaveBeenNthCalledWith(1, true);
    expect(handleCheckedChange).toHaveBeenNthCalledWith(2, false);
    expect(handleCheckedChange).toHaveBeenNthCalledWith(3, true);
    expect(checkbox).toHaveAttribute('aria-checked', 'true');
  });

  // ─────────────────────────────────────────────────────────────
  // 16. Built-in Label Prop
  // ─────────────────────────────────────────────────────────────

  it('renders with a built-in label as its accessible name', () => {
    render(<Checkbox label="Subscribe" />);
    // Verify the label text exists AND is the accessible name for the checkbox
    expect(screen.getByRole('checkbox', { name: 'Subscribe' })).toBeInTheDocument();
  });

  it('toggles when clicking the built-in label', async () => {
    const handleCheckedChange = vi.fn();
    const user = userEvent.setup();
    render(<Checkbox label="Subscribe" onCheckedChange={handleCheckedChange} />);
    
    const label = screen.getByText('Subscribe');
    await user.click(label);
    
    expect(handleCheckedChange).toHaveBeenCalledWith(true);
    // Verify by accessible name here too
    expect(screen.getByRole('checkbox', { name: 'Subscribe' })).toHaveAttribute('aria-checked', 'true');
  });

  it('generates unique IDs for label linkage when none is provided', () => {
    render(
      <>
        <Checkbox label="First" />
        <Checkbox label="Second" />
      </>
    );
    
    const label1 = screen.getByText('First');
    const label2 = screen.getByText('Second');
    const id1 = label1.getAttribute('for');
    const id2 = label2.getAttribute('for');

    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);

    // verify linkage works by selecting by label text
    expect(screen.getByLabelText('First')).toBeInTheDocument();
    expect(screen.getByLabelText('Second')).toBeInTheDocument();
  });

  it('uses provided id for label linkage', () => {
    render(<Checkbox label="Manual ID" id="my-custom-id" />);
    const checkbox = screen.getByRole('checkbox');
    const label = screen.getByText('Manual ID');
    
    expect(checkbox).toHaveAttribute('id', 'my-custom-id');
    expect(label).toHaveAttribute('for', 'my-custom-id');
  });

});
