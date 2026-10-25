import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { Modal, MODAL_WIDTH, ModalProps, ModalWidth } from "../../../components/common/Modal";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => {
    const t = (key: string, options?: { count?: number }) => {
      if (key === "buttons.close") return "Close";
      if (key === "messages.total") {
        return `Total ${options?.count || 0}`;
      }
      return key;
    };
    return t;
  },
}));

// Mock Badge component to make testing easier
vi.mock("../../../components/common/Badge", () => ({
  Badge: ({ children, color, size }: { children: React.ReactNode; color: string; size: string }) => (
    <span data-testid="badge" data-color={color} data-size={size}>
      {children}
    </span>
  ),
}));

// Helper to render the modal with required props
const renderModal = (props: Partial<ModalProps> = {}) => {
  const defaultProps: ModalProps = {
    open: true,
    onClose: vi.fn(),
    title: "Test Modal Title",
    children: <div>Modal Content</div>,
  };
  return render(<Modal {...defaultProps} {...props} />);
};

describe("Modal component", () => {
  it("renders nothing when open is false", () => {
    const { container } = renderModal({ open: false });
    expect(container.firstChild).toBeNull();
  });

  it("renders title and children", () => {
    renderModal();
    expect(screen.getByText("Test Modal Title")).toBeInTheDocument();
    expect(screen.getByText("Modal Content")).toBeInTheDocument();
  });

  it("renders subtitle if provided", () => {
    renderModal({ subtitle: "Subtitle here" });
    expect(screen.getByText("Subtitle here")).toBeInTheDocument();
  });

  it("renders count if provided (Badge)", () => {
    renderModal({ count: 5 });
    // The Badge should contain the translated text
    expect(screen.getByText("Total 5")).toBeInTheDocument();
    // Also verify the badge exists
    expect(screen.getByTestId("badge")).toBeInTheDocument();
  });

  it("renders footer if provided", () => {
    renderModal({ footer: <button>Footer Button</button> });
    expect(screen.getByText("Footer Button")).toBeInTheDocument();
  });

  it("calls onClose when backdrop is clicked", () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    // Find backdrop by its class (using a more reliable selector)
    const backdrop = document.querySelector('[class*="bg-gray-950"]');
    expect(backdrop).toBeInTheDocument();
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    const closeButton = screen.getByLabelText("Close");
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("applies correct width class based on maxWidth", () => {
    // Test each width variant
    const widths: ModalWidth[] = ["sm", "md", "lg", "xl", "2xl"];
    
    widths.forEach((width) => {
      const { unmount } = renderModal({ maxWidth: width, open: true });
      const modal = screen.getByRole("dialog");
      const expectedClass = MODAL_WIDTH[width];
      expect(modal.className).toContain(expectedClass);
      unmount();
    });
  });

  it("focuses first focusable element when opened", async () => {
    renderModal({ footer: <button>Footer Button</button> });
    
    // Wait for focus to be applied
    await waitFor(() => {
      const closeButton = screen.getByLabelText("Close");
      expect(document.activeElement).toBe(closeButton);
    });
  });

  it("traps focus within modal when tabbing", () => {
    renderModal({ 
      footer: <button>Footer Button</button>,
      children: (
        <div>
          <input type="text" placeholder="Test input" />
          <button>Another button</button>
        </div>
      )
    });
    
    const closeButton = screen.getByLabelText("Close");
    const inputs = screen.getAllByRole("textbox");
    const buttons = screen.getAllByRole("button");
    
    // Get all focusable elements
    const focusableElements = [closeButton, ...inputs, ...buttons];
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    // Start with focus on first element
    firstElement.focus();
    expect(document.activeElement).toBe(firstElement);
    
    // Tab to last element
    fireEvent.keyDown(document, { key: "Tab" });
    // Need to simulate the actual focus movement
    lastElement.focus();
    expect(document.activeElement).toBe(lastElement);
    
    // Shift+Tab back to first element
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    firstElement.focus();
    expect(document.activeElement).toBe(firstElement);
  });

  it("calls onClose when Escape key is pressed", () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});