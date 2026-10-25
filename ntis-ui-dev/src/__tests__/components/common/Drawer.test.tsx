import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    if (key === "login.sessionTimeout.countdown" || key === "sessionTimeout.countdown") {
      return "60s";
    }
    if (key === "login.sessionTimeout.saveWorkHint" || key === "sessionTimeout.saveWorkHint") {
      return "Session Expiring, save the work!";
    }
    return key;
  },
}));

vi.mock("@/lib/utils/session-expiry-client", () => ({
  getSessionExpiresAtUnixFromCookie: () => null,
  isSessionWarningActiveAtUnix: () => false,
  SESSION_EXPIRY_CLOCK_SKEW_SECONDS: 30,
}));

import { Drawer } from "@/components/common/Drawer";

describe("Drawer", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    title: <span data-testid="drawer-title">Drawer Title</span>,
    children: <div data-testid="drawer-body">Drawer Content</div>,
  };

  it("does not render when open is false", () => {
    render(<Drawer {...defaultProps} open={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders with correct title and children", () => {
    render(<Drawer {...defaultProps} />);
    expect(screen.getByTestId("drawer-title")).toBeInTheDocument();
    expect(screen.getByTestId("drawer-body")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(<Drawer {...defaultProps} onClose={onClose} />);
    // There are two elements with role="button": backdrop (div) and close (button)
    const buttons = screen.getAllByRole("button", { hidden: true });
    // The close button is the second one (first is backdrop)
    const closeBtn = buttons.find(btn => btn.tagName.toLowerCase() === 'button');
    fireEvent.click(closeBtn!);
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when backdrop is clicked", () => {
    const onClose = vi.fn();
    render(<Drawer {...defaultProps} onClose={onClose} />);
    // The backdrop is the first element with role="button" (a div)
    const buttons = screen.getAllByRole('button', { hidden: true });
    const backdrop = buttons.find(btn => btn.tagName.toLowerCase() === 'div');
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when Enter or Space is pressed on backdrop", () => {
    const onClose = vi.fn();
    render(<Drawer {...defaultProps} onClose={onClose} />);
    const buttons = screen.getAllByRole('button', { hidden: true });
    const backdrop = buttons.find(btn => btn.tagName.toLowerCase() === 'div');
    fireEvent.keyDown(backdrop!, { key: "Enter" });
    fireEvent.keyDown(backdrop!, { key: " " });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("renders footer if provided", () => {
    render(<Drawer {...defaultProps} footer={<div data-testid="drawer-footer">Footer</div>} />);
    expect(screen.getByTestId("drawer-footer")).toBeInTheDocument();
  });

  it("applies correct width classes", () => {
    const widths = ["sm", "md", "lg", "xl"] as const;
    for (const width of widths) {
      const { unmount } = render(<Drawer {...defaultProps} width={width} />);
      const dialog = screen.getByRole("dialog");
      // Check for at least one expected width class
      if (width === "sm") {
        expect(dialog.className).toMatch(/w-\[90vw\]|md:w-\[420px\]/);
      } else if (width === "md") {
        expect(dialog.className).toMatch(/w-\[90vw\]|md:w-\[520px\]/);
      } else if (width === "lg") {
        expect(dialog.className).toMatch(/w-\[95vw\]|md:w-\[900px\]|lg:w-\[1100px\]|xl:w-\[1300px\]/);
      } else if (width === "xl") {
        expect(dialog.className).toMatch(/w-\[97vw\]|md:w-\[1000px\]|lg:w-\[1200px\]|xl:w-\[1400px\]/);
      }
      unmount();
    }
  });

  it("renders session warning timer when custom tick event is dispatched", () => {
    render(<Drawer {...defaultProps} />);
    
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    fireEvent(
      window,
      new CustomEvent("ntis:session-warning-tick", {
        detail: { secondsLeft: 45, active: true },
      })
    );

    const statusEl = screen.getByRole("status");
    expect(statusEl).toBeInTheDocument();
    expect(statusEl.textContent).toContain("Session Expiring, save the work!");
  });

  it("renders session warning timer as floating indicator when hideHeader is true", () => {
    render(<Drawer {...defaultProps} hideHeader={true} />);
    
    fireEvent(
      window,
      new CustomEvent("ntis:session-warning-tick", {
        detail: { secondsLeft: 15, active: true },
      })
    );

    const statusEl = screen.getByRole("status");
    expect(statusEl).toBeInTheDocument();
    expect(statusEl.textContent).toContain("Session Expiring, save the work!");
  });
});

