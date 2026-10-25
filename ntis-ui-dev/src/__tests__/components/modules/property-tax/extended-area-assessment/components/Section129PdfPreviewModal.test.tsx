import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Section129PdfPreviewModal } from "@/components/modules/property-tax/extended-area-assessment/components/Section129PdfPreviewModal";

describe("Section129PdfPreviewModal", () => {
  beforeEach(() => {
    vi.spyOn(window, "open").mockImplementation(() => null);

    Object.defineProperty(document, "fullscreenElement", {
      value: null,
      writable: true,
      configurable: true,
    });
    document.exitFullscreen = vi.fn().mockResolvedValue(undefined);
    Element.prototype.requestFullscreen = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <Section129PdfPreviewModal isOpen={false} onClose={vi.fn()} fileUrl="blob:url" fileName="schedule.pdf" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("does not render when fileUrl is empty", () => {
    const { container } = render(
      <Section129PdfPreviewModal isOpen={true} onClose={vi.fn()} fileUrl="" fileName="schedule.pdf" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders a PDF iframe with the toolbar hidden", () => {
    render(
      <Section129PdfPreviewModal isOpen={true} onClose={vi.fn()} fileUrl="blob:mock-url" fileName="schedule.pdf" />
    );
    const iframe = document.body.querySelector("iframe");
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute("src", "blob:mock-url#toolbar=0");
  });

  it("shows the label as the primary title and fileName as the subtitle when label is provided", () => {
    render(
      <Section129PdfPreviewModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="blob:mock-url"
        fileName="Section_129A_General_Tax_Schedule.pdf"
        label="Section 129A Assessment"
      />
    );
    expect(screen.getByText("Section 129A Assessment")).toBeInTheDocument();
    expect(screen.getByText("Section_129A_General_Tax_Schedule.pdf")).toBeInTheDocument();
  });

  it("falls back to fileName as the title (no subtitle) when label is not provided", () => {
    render(<Section129PdfPreviewModal isOpen={true} onClose={vi.fn()} fileUrl="blob:mock-url" fileName="schedule.pdf" />);
    expect(screen.getByText("schedule.pdf")).toBeInTheDocument();
  });

  it("does not render the Ward/Property/Partition context badges the shared DocumentViewerModal shows", () => {
    render(<Section129PdfPreviewModal isOpen={true} onClose={vi.fn()} fileUrl="blob:mock-url" fileName="schedule.pdf" />);
    expect(screen.queryByText(/Ward:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Property:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Partition:/)).not.toBeInTheDocument();
  });

  describe("closing", () => {
    it("calls onClose when the close button is clicked", () => {
      const onClose = vi.fn();
      render(<Section129PdfPreviewModal isOpen={true} onClose={onClose} fileUrl="blob:mock-url" fileName="schedule.pdf" />);
      fireEvent.click(screen.getByTitle("Close"));
      expect(onClose).toHaveBeenCalled();
    });

    it("calls onClose when Escape is pressed", () => {
      const onClose = vi.fn();
      render(<Section129PdfPreviewModal isOpen={true} onClose={onClose} fileUrl="blob:mock-url" fileName="schedule.pdf" />);
      fireEvent.keyDown(document, { key: "Escape" });
      expect(onClose).toHaveBeenCalled();
    });

    it("calls onClose when clicking the backdrop, but not when clicking inside the modal content", () => {
      const onClose = vi.fn();
      render(<Section129PdfPreviewModal isOpen={true} onClose={onClose} fileUrl="blob:mock-url" fileName="schedule.pdf" />);

      const backdrop = document.body.querySelector(".fixed.inset-0")!;
      const content = document.body.querySelector(".relative.flex.flex-col")!;

      fireEvent.click(content);
      expect(onClose).not.toHaveBeenCalled();

      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("print", () => {
    it("prints via the iframe's contentWindow when available", () => {
      render(<Section129PdfPreviewModal isOpen={true} onClose={vi.fn()} fileUrl="blob:mock-url" fileName="schedule.pdf" />);

      const iframe = document.body.querySelector("iframe")!;
      const printMock = vi.fn();
      Object.defineProperty(iframe, "contentWindow", {
        value: { focus: vi.fn(), print: printMock },
        writable: true,
        configurable: true,
      });

      fireEvent.click(screen.getByTitle("Print"));
      expect(printMock).toHaveBeenCalled();
      expect(window.open).not.toHaveBeenCalled();
    });

    it("falls back to window.open when the iframe has no contentWindow", () => {
      render(<Section129PdfPreviewModal isOpen={true} onClose={vi.fn()} fileUrl="blob:mock-url" fileName="schedule.pdf" />);

      const iframe = document.body.querySelector("iframe")!;
      Object.defineProperty(iframe, "contentWindow", { value: null, configurable: true });

      fireEvent.click(screen.getByTitle("Print"));
      expect(window.open).toHaveBeenCalledWith("blob:mock-url", "_blank");
    });

    it("falls back to window.open when print() throws (e.g. a cross-origin restriction)", () => {
      render(<Section129PdfPreviewModal isOpen={true} onClose={vi.fn()} fileUrl="blob:mock-url" fileName="schedule.pdf" />);

      const iframe = document.body.querySelector("iframe")!;
      const printMock = vi.fn(() => {
        throw new Error("Cross-origin");
      });
      Object.defineProperty(iframe, "contentWindow", {
        value: { focus: vi.fn(), print: printMock },
        writable: true,
        configurable: true,
      });

      fireEvent.click(screen.getByTitle("Print"));
      expect(window.open).toHaveBeenCalledWith("blob:mock-url", "_blank");
    });
  });

  it("downloads the file (creates, clicks, and removes an anchor) when the download button is clicked", () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const appendSpy = vi.spyOn(document.body, "appendChild");
    const removeSpy = vi.spyOn(document.body, "removeChild");

    render(<Section129PdfPreviewModal isOpen={true} onClose={vi.fn()} fileUrl="blob:mock-url" fileName="schedule.pdf" />);
    fireEvent.click(screen.getByTitle("Download File"));

    expect(appendSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
  });

  describe("fullscreen", () => {
    it("requests fullscreen when toggled on, and exits fullscreen when toggled off", () => {
      render(<Section129PdfPreviewModal isOpen={true} onClose={vi.fn()} fileUrl="blob:mock-url" fileName="schedule.pdf" />);

      const fullscreenBtn = screen.getByTitle("Fullscreen");
      fireEvent.click(fullscreenBtn);
      expect(Element.prototype.requestFullscreen).toHaveBeenCalled();

      Object.defineProperty(document, "fullscreenElement", { value: {}, writable: true, configurable: true });
      fireEvent.click(fullscreenBtn);
      expect(document.exitFullscreen).toHaveBeenCalled();
    });

    it("syncs its label via the native fullscreenchange event", () => {
      render(<Section129PdfPreviewModal isOpen={true} onClose={vi.fn()} fileUrl="blob:mock-url" fileName="schedule.pdf" />);

      Object.defineProperty(document, "fullscreenElement", { value: {}, writable: true, configurable: true });
      fireEvent(document, new Event("fullscreenchange"));

      expect(screen.getByTitle("Exit Fullscreen")).toBeInTheDocument();
    });
  });

  it("locks document body scroll while open and restores it on unmount", () => {
    document.body.style.overflow = "scroll";

    const { unmount } = render(
      <Section129PdfPreviewModal isOpen={true} onClose={vi.fn()} fileUrl="blob:mock-url" fileName="schedule.pdf" />
    );
    expect(document.body.style.overflow).toBe("hidden");

    unmount();
    expect(document.body.style.overflow).toBe("scroll");
  });

  it("removes its keydown/fullscreenchange listeners on unmount", () => {
    const addSpy = vi.spyOn(document, "addEventListener");
    const removeSpy = vi.spyOn(document, "removeEventListener");

    const { unmount } = render(
      <Section129PdfPreviewModal isOpen={true} onClose={vi.fn()} fileUrl="blob:mock-url" fileName="schedule.pdf" />
    );
    expect(addSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith("fullscreenchange", expect.any(Function));

    unmount();
    expect(removeSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("fullscreenchange", expect.any(Function));
  });
});
