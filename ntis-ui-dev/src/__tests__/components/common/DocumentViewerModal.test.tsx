import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DocumentViewerModal } from "@/components/common/DocumentViewerModal";

// Mock next-intl useTranslations hook
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, string | number>) => {
    const messages: Record<string, string> = {
      "discount.detectingDocumentType": "Detecting document type...",
      "discount.previewNotAvailable": "Preview not available",
      "discount.previewNotAvailableDesc": "This file format cannot be previewed in the browser. You can download it to view.",
      "discount.downloadToView": "Download to View",
      "roomSubmission.info.ward": "Ward",
      "roomSubmission.info.property": "Property No",
      "roomSubmission.info.partition": "Partition",
    };
    if (values) {
      return `${messages[key] || key} ${JSON.stringify(values)}`;
    }
    return messages[key] || key;
  },
}));

const mockGet = vi.fn().mockImplementation((key: string) => {
  if (key === "wardNo") return "MM11";
  if (key === "propertyNo") return "27";
  if (key === "partitionNo") return "—";
  return null;
});

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

describe("DocumentViewerModal", () => {
  let mockFetchBlobType = "image/png";
  let mockFetchBlobData = [""];
  let mockFileReaderResult: ArrayBuffer = new Uint8Array([]).buffer;
  let originalFetch: typeof global.fetch;
  let originalFileReaderRead: typeof FileReader.prototype.readAsArrayBuffer;

  beforeEach(() => {
    mockGet.mockClear();
    originalFetch = global.fetch;
    originalFileReaderRead = FileReader.prototype.readAsArrayBuffer;

    // Default mock fetch behavior
    mockFetchBlobType = "image/png";
    mockFetchBlobData = [""];
    mockFileReaderResult = new Uint8Array([]).buffer;

    vi.spyOn(global, "fetch").mockImplementation(() =>
      Promise.resolve({
        ok: true,
        blob: async () => new Blob(mockFetchBlobData, { type: mockFetchBlobType }),
      } as Response)
    );

    // Mock FileReader behavior
    vi.spyOn(FileReader.prototype, "readAsArrayBuffer").mockImplementation(function (
      this: FileReader
    ) {
      Object.defineProperty(this, "result", {
        value: mockFileReaderResult,
        configurable: true,
      });
      if (this.onloadend) {
        this.onloadend({} as ProgressEvent<FileReader>);
      }
    });

    // Mock window.open and URL creators
    vi.spyOn(window, "open").mockImplementation(() => null);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    // Mock Fullscreen API
    Object.defineProperty(document, "fullscreenElement", {
      value: null,
      writable: true,
      configurable: true,
    });
    document.exitFullscreen = vi.fn().mockResolvedValue(undefined);
    Element.prototype.requestFullscreen = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    FileReader.prototype.readAsArrayBuffer = originalFileReaderRead;
    vi.restoreAllMocks();
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <DocumentViewerModal
        isOpen={false}
        onClose={vi.fn()}
        fileUrl="blob:url"
        fileName="test-image.png"
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("does not render when fileUrl is empty", () => {
    const { container } = render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl=""
        fileName="test-image.png"
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders loader during detection state on generic blob url", async () => {
    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="blob:generic-url"
        fileName="document"
      />
    );

    expect(screen.getByText("Detecting document type...")).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText("Detecting document type...")).not.toBeInTheDocument();
    });
  });

  it("skips detection loader and detects image synchronously when URL contains image extension", async () => {
    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="http://localhost/test-image.png"
        fileName="test-image.png"
      />
    );

    expect(screen.queryByText("Detecting document type...")).not.toBeInTheDocument();
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("skips detection loader and detects PDF synchronously when URL/fileName has PDF extension", async () => {
    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="http://localhost/test.pdf"
        fileName="test.pdf"
      />
    );

    expect(screen.queryByText("Detecting document type...")).not.toBeInTheDocument();
    const iframe = document.body.querySelector("iframe");
    expect(iframe).toBeInTheDocument();
  });

  it("detects PDF synchronously when URL is data:application/pdf", () => {
    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="data:application/pdf;base64,JVBERi..."
        fileName="document"
      />
    );
    const iframe = document.body.querySelector("iframe");
    expect(iframe).toBeInTheDocument();
  });

  it("detects Image synchronously when URL is data:image/png", () => {
    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="data:image/png;base64,iVBORw..."
        fileName="document"
      />
    );
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("detects PDF file type dynamically via fetch blob type", async () => {
    mockFetchBlobType = "application/pdf";
    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="blob:generic-url"
        fileName="document"
      />
    );

    await waitFor(() => {
      const iframe = document.body.querySelector("iframe");
      expect(iframe).toBeInTheDocument();
    });
  });

  it("detects PDF file type dynamically via magic numbers (%PDF)", async () => {
    mockFetchBlobType = "";
    mockFileReaderResult = new Uint8Array([0x25, 0x50, 0x44, 0x46]).buffer; // %PDF

    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="blob:generic-url"
        fileName="document"
      />
    );

    await waitFor(() => {
      const iframe = document.body.querySelector("iframe");
      expect(iframe).toBeInTheDocument();
    });
  });

  it("detects Image type dynamically via magic numbers (PNG)", async () => {
    mockFetchBlobType = "";
    mockFileReaderResult = new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer; // PNG

    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="blob:generic-url"
        fileName="document"
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("img")).toBeInTheDocument();
    });
  });

  it("falls back to unsupported file view if format is not PDF or Image", async () => {
    mockFetchBlobType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="blob:generic-url"
        fileName="document.docx"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Preview not available")).toBeInTheDocument();
    });
  });

  it("detects unsupported format if magic numbers are less than 4 bytes", async () => {
    mockFetchBlobType = "";
    mockFileReaderResult = new Uint8Array([0x25, 0x50]).buffer; // Only 2 bytes

    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="blob:short-url"
        fileName="short"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Preview not available")).toBeInTheDocument();
    });
  });

  it("detects unsupported format if magic numbers are not PDF or image", async () => {
    mockFetchBlobType = "";
    mockFileReaderResult = new Uint8Array([0x00, 0x00, 0x00, 0x00]).buffer; // 4 bytes of zeros

    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="blob:generic-url"
        fileName="document"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Preview not available")).toBeInTheDocument();
    });
  });

  it("falls back to file extension check if fetch fails", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network Error"));

    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="http://external-site.com/doc.pdf"
        fileName="doc.pdf"
      />
    );

    await waitFor(() => {
      const iframe = document.body.querySelector("iframe");
      expect(iframe).toBeInTheDocument();
    });
  });

  it("falls back to image extension check if fetch fails", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network Error"));

    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="http://external-site.com/doc.png"
        fileName="doc.png"
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("img")).toBeInTheDocument();
    });
  });

  it("falls back to unsupported extension check if fetch fails on unknown extension", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network Error"));

    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="http://external-site.com/doc.unknown"
        fileName="doc.unknown"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Preview not available")).toBeInTheDocument();
    });
  });

  it("calls onClose when close button is clicked", async () => {
    const onCloseMock = vi.fn();
    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={onCloseMock}
        fileUrl="http://localhost/test-image.png"
        fileName="test-image.png"
      />
    );

    const closeBtn = screen.getByTitle("Close");
    fireEvent.click(closeBtn);
    expect(onCloseMock).toHaveBeenCalled();
  });

  it("calls onClose when Escape key is pressed", () => {
    const onCloseMock = vi.fn();
    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={onCloseMock}
        fileUrl="http://localhost/test-image.png"
        fileName="test-image.png"
      />
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCloseMock).toHaveBeenCalled();
  });

  it("toggles fullscreen mode", async () => {
    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="http://localhost/test-image.png"
        fileName="test-image.png"
      />
    );

    const fullscreenBtn = screen.getByTitle("Fullscreen");
    
    fireEvent.click(fullscreenBtn);
    expect(Element.prototype.requestFullscreen).toHaveBeenCalled();

    Object.defineProperty(document, "fullscreenElement", {
      value: {},
      writable: true,
      configurable: true,
    });
    fireEvent.click(fullscreenBtn);
    expect(document.exitFullscreen).toHaveBeenCalled();
  });

  it("syncs fullscreen state via fullscreenchange event", async () => {
    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="http://localhost/test-image.png"
        fileName="test-image.png"
      />
    );

    Object.defineProperty(document, "fullscreenElement", {
      value: {},
      writable: true,
      configurable: true,
    });

    fireEvent(document, new Event("fullscreenchange"));
    expect(screen.getByTitle("Exit Fullscreen")).toBeInTheDocument();
  });

  it("downloads the file when download button is clicked", () => {
    const originalAppend = document.body.appendChild;
    const originalRemove = document.body.removeChild;

    const appendChildSpy = vi.spyOn(document.body, "appendChild").mockImplementation((node) => {
      const el = node as unknown as Element;
      if (el.tagName === "A") return node;
      return originalAppend.call(document.body, node);
    });
    const removeChildSpy = vi.spyOn(document.body, "removeChild").mockImplementation((node) => {
      const el = node as unknown as Element;
      if (el.tagName === "A") return node;
      return originalRemove.call(document.body, node);
    });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="http://localhost/test-image.png"
        fileName="test-image.png"
      />
    );

    const downloadBtn = screen.getByTitle("Download File");
    fireEvent.click(downloadBtn);

    expect(appendChildSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
  });

  it("zooms in and out using Zoom buttons up to 700%", () => {
    vi.useFakeTimers();
    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="http://localhost/test-image.png"
        fileName="test-image.png"
      />
    );

    const zoomInBtn = screen.getByTitle("Zoom In");
    const zoomOutBtn = screen.getByTitle("Zoom Out");

    expect(screen.getByText("100%")).toBeInTheDocument();

    // Zoom In: 1.0 -> 1.25 -> 1.50
    fireEvent.click(zoomInBtn);
    expect(screen.getByText("125%")).toBeInTheDocument();

    vi.advanceTimersByTime(200);

    fireEvent.click(zoomOutBtn);
    expect(screen.getByText("100%")).toBeInTheDocument();

    vi.advanceTimersByTime(200);

    // Verify limit of 700%
    for (let i = 0; i < 30; i++) {
      fireEvent.click(zoomInBtn);
      vi.advanceTimersByTime(200);
    }
    expect(screen.getByText("700%")).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("resets zoom when Reset button is clicked", () => {
    vi.useFakeTimers();
    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="http://localhost/test-image.png"
        fileName="test-image.png"
      />
    );

    const zoomInBtn = screen.getByTitle("Zoom In");
    const resetBtn = screen.getByTitle("Reset Zoom");

    fireEvent.click(zoomInBtn);
    vi.advanceTimersByTime(200);
    fireEvent.click(zoomInBtn);
    vi.advanceTimersByTime(200);
    expect(screen.getByText("150%")).toBeInTheDocument();

    fireEvent.click(resetBtn);
    vi.advanceTimersByTime(200);
    expect(screen.getByText("100%")).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("clamps coordinates during Zoom buttons actions when zoomed and panned", () => {
    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="http://localhost/test-image.png"
        fileName="test-image.png"
      />
    );

    const zoomInBtn = screen.getByTitle("Zoom In");
    const zoomOutBtn = screen.getByTitle("Zoom Out");

    // Mock bounding rect of container
    const containerNode = document.body.querySelector(".flex-1.relative.overflow-hidden")!;
    vi.spyOn(containerNode, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      right: 100,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => {}
    });

    fireEvent.click(zoomInBtn); // scale = 1.25

    // Pan image by dragging
    const img = screen.getByRole("img");
    const container = img.parentElement!;
    fireEvent.mouseDown(container, { clientX: 0, clientY: 0 });
    fireEvent.mouseMove(container, { clientX: 50, clientY: 50 });
    fireEvent.mouseUp(container);

    // Zoom in again
    fireEvent.click(zoomInBtn); // scale = 1.50
    expect(img.style.transform).toContain("scale(1.5)");

    // Zoom out
    fireEvent.click(zoomOutBtn); // scale = 1.25
    expect(img.style.transform).toContain("scale(1.25)");
  });

  it("prints an image file via hidden iframe and cleans it up after 1s", () => {
    vi.useFakeTimers();

    const originalAppend = document.body.appendChild;
    const originalRemove = document.body.removeChild;

    const appendChildSpy = vi.spyOn(document.body, "appendChild").mockImplementation((node) => {
      const el = node as unknown as Element;
      if (el.tagName === "IFRAME") return node;
      return originalAppend.call(document.body, node);
    });
    const removeChildSpy = vi.spyOn(document.body, "removeChild").mockImplementation((node) => {
      const el = node as unknown as Element;
      if (el.tagName === "IFRAME") return node;
      return originalRemove.call(document.body, node);
    });
    
    const mockImage = {
      complete: false,
      onload: null as (() => void) | null
    };

    const mockIframe = {
      tagName: "IFRAME",
      style: {},
      parentNode: document.body,
      contentWindow: {
        focus: vi.fn(),
        print: vi.fn()
      },
      contentDocument: {
        open: vi.fn(),
        write: vi.fn(),
        close: vi.fn(),
        querySelector: vi.fn().mockReturnValue(mockImage)
      }
    };

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName) => {
      if (tagName === "iframe") {
        return mockIframe as unknown as HTMLIFrameElement;
      }
      return originalCreateElement(tagName);
    });

    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="http://localhost/test-image.png"
        fileName="test-image.png"
      />
    );

    const printBtn = screen.getByTitle("Print");
    fireEvent.click(printBtn);

    expect(appendChildSpy).toHaveBeenCalled();
    expect(mockIframe.contentDocument.write).toHaveBeenCalled();

    // Trigger onload
    mockImage.onload?.();
    expect(mockIframe.contentWindow.focus).toHaveBeenCalled();
    expect(mockIframe.contentWindow.print).toHaveBeenCalled();

    // Advance 1s and check removal
    vi.advanceTimersByTime(1000);
    expect(removeChildSpy).toHaveBeenCalledWith(mockIframe);

    vi.useRealTimers();
  });

  it("prints an image file immediately if already cached/loaded", () => {
    const originalAppend = document.body.appendChild;
    const originalRemove = document.body.removeChild;

    const appendChildSpy = vi.spyOn(document.body, "appendChild").mockImplementation((node) => {
      const el = node as unknown as Element;
      if (el.tagName === "IFRAME") return node;
      return originalAppend.call(document.body, node);
    });
    vi.spyOn(document.body, "removeChild").mockImplementation((node) => {
      const el = node as unknown as Element;
      if (el.tagName === "IFRAME") return node;
      return originalRemove.call(document.body, node);
    });
    
    const mockImage = {
      complete: true,
      onload: null as (() => void) | null
    };

    const mockIframe = {
      tagName: "IFRAME",
      style: {},
      parentNode: document.body,
      contentWindow: {
        focus: vi.fn(),
        print: vi.fn()
      },
      contentDocument: {
        open: vi.fn(),
        write: vi.fn(),
        close: vi.fn(),
        querySelector: vi.fn().mockReturnValue(mockImage)
      }
    };

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName) => {
      if (tagName === "iframe") {
        return mockIframe as unknown as HTMLIFrameElement;
      }
      return originalCreateElement(tagName);
    });

    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="http://localhost/test-image.png"
        fileName="test-image.png"
      />
    );

    const printBtn = screen.getByTitle("Print");
    fireEvent.click(printBtn);

    expect(appendChildSpy).toHaveBeenCalled();
    expect(mockIframe.contentWindow.print).toHaveBeenCalled();
  });

  it("prints a PDF file using pdfIframeRef, falls back to window.open on failure or cross-origin restriction", () => {
    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="http://localhost/test.pdf"
        fileName="test.pdf"
      />
    );

    const printBtn = screen.getByTitle("Print");

    const iframe = document.body.querySelector("iframe")!;
    const printMock = vi.fn();
    Object.defineProperty(iframe, "contentWindow", {
      value: {
        focus: vi.fn(),
        print: printMock
      },
      writable: true,
      configurable: true
    });

    fireEvent.click(printBtn);
    expect(printMock).toHaveBeenCalled();

    // Throw on print mock to test CORS fallback
    printMock.mockImplementation(() => {
      throw new Error("CORS Blocked");
    });
    fireEvent.click(printBtn);
    expect(window.open).toHaveBeenCalledWith("http://localhost/test.pdf", "_blank");
  });

  it("prints a PDF file and falls back to window.open if iframe contentWindow is not available", () => {
    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="http://localhost/test.pdf"
        fileName="test.pdf"
      />
    );

    const printBtn = screen.getByTitle("Print");

    const iframe = document.body.querySelector("iframe")!;
    Object.defineProperty(iframe, "contentWindow", {
      value: null,
      configurable: true
    });

    fireEvent.click(printBtn);
    expect(window.open).toHaveBeenCalledWith("http://localhost/test.pdf", "_blank");
  });

  it("supports panning/dragging image on mouse events", () => {
    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="http://localhost/test-image.png"
        fileName="test-image.png"
      />
    );

    const zoomInBtn = screen.getByTitle("Zoom In");
    fireEvent.click(zoomInBtn); // scale = 1.25

    const img = screen.getByRole("img");
    const container = img.parentElement!;
    
    // Mouse drag simulation
    fireEvent.mouseDown(container, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(container, { clientX: 120, clientY: 130 });
    fireEvent.mouseLeave(container); // triggers drag end
    fireEvent.mouseMove(container, { clientX: 140, clientY: 150 }); // drag is disabled

    expect(img.style.transform).toContain("translate(");
  });

  it("supports touch panning/dragging on touch events", () => {
    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="http://localhost/test-image.png"
        fileName="test-image.png"
      />
    );

    const zoomInBtn = screen.getByTitle("Zoom In");
    fireEvent.click(zoomInBtn); // scale = 1.25

    const img = screen.getByRole("img");
    const container = img.parentElement!;

    // Touch drag simulation
    fireEvent.touchStart(container, {
      touches: [{ clientX: 50, clientY: 50 } as TouchInit]
    } as TouchEventInit);
    fireEvent.touchMove(container, {
      touches: [{ clientX: 60, clientY: 70 } as TouchInit]
    } as TouchEventInit);
    fireEvent.touchEnd(container);

    expect(img.style.transform).toContain("translate(");
  });

  it("handles mouse wheel zoom-in and zoom-out", () => {
    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="http://localhost/test-image.png"
        fileName="test-image.png"
      />
    );

    const containerNode = document.body.querySelector(".flex-1.relative.overflow-hidden")!;
    vi.spyOn(containerNode, "getBoundingClientRect").mockReturnValue({
      left: 10,
      top: 10,
      width: 500,
      height: 500,
      right: 510,
      bottom: 510,
      x: 10,
      y: 10,
      toJSON: () => {}
    });

    // Zoom In via scroll
    fireEvent(containerNode, new WheelEvent("wheel", { deltaY: -100, clientX: 250, clientY: 250 }));
    expect(screen.getByText(/%/)).toBeInTheDocument();
    
    // Zoom Out via scroll
    fireEvent(containerNode, new WheelEvent("wheel", { deltaY: 100, clientX: 250, clientY: 250 }));
  });

  it("clamps wheel zoom scale between 50% and 700%", () => {
    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="http://localhost/test-image.png"
        fileName="test-image.png"
      />
    );

    const containerNode = document.body.querySelector(".flex-1.relative.overflow-hidden")!;
    vi.spyOn(containerNode, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      right: 100,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => {}
    });

    // Zoom Out multiple times
    for (let i = 0; i < 10; i++) {
      fireEvent(containerNode, new WheelEvent("wheel", { deltaY: 100, clientX: 50, clientY: 50 }));
    }
    expect(screen.getByText("50%")).toBeInTheDocument();

    // Zoom In multiple times
    for (let i = 0; i < 40; i++) {
      fireEvent(containerNode, new WheelEvent("wheel", { deltaY: -100, clientX: 50, clientY: 50 }));
    }
    expect(screen.getByText("700%")).toBeInTheDocument();
  });

  it("clamps image panning within boundaries during drag", () => {
    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="http://localhost/test-image.png"
        fileName="test-image.png"
      />
    );

    const zoomInBtn = screen.getByTitle("Zoom In");
    fireEvent.click(zoomInBtn); // scale = 1.25

    const img = screen.getByRole("img");
    const containerNode = document.body.querySelector(".flex-1.relative.overflow-hidden")!;
    const container = img.parentElement!;

    vi.spyOn(containerNode, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      right: 100,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => {}
    });

    // Drag to positive maxX clamping boundary
    fireEvent.mouseDown(container, { clientX: 0, clientY: 0 });
    fireEvent.mouseMove(container, { clientX: 100, clientY: 100 });
    fireEvent.mouseUp(container);
    // maxX = (100 * 0.25) / 2 = 12.5px
    expect(img.style.transform).toContain("translate(12.5px, 12.5px) scale(1.25)");

    // Drag to negative maxX clamping boundary
    fireEvent.mouseDown(container, { clientX: 0, clientY: 0 });
    fireEvent.mouseMove(container, { clientX: -100, clientY: -100 });
    fireEvent.mouseUp(container);
    expect(img.style.transform).toContain("translate(-12.5px, -12.5px) scale(1.25)");
  });

  it("does not drag when scale is 100% or less", () => {
    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="http://localhost/test-image.png"
        fileName="test-image.png"
      />
    );

    const img = screen.getByRole("img");
    const container = img.parentElement!;

    fireEvent.mouseDown(container, { clientX: 0, clientY: 0 });
    fireEvent.mouseMove(container, { clientX: 10, clientY: 10 });
    fireEvent.mouseUp(container);

    expect(img.style.transform).toContain("translate(0px, 0px) scale(1)");
  });

  it("does not touch drag if there are multiple touches", () => {
    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="http://localhost/test-image.png"
        fileName="test-image.png"
      />
    );

    const zoomInBtn = screen.getByTitle("Zoom In");
    fireEvent.click(zoomInBtn); // scale = 1.25

    const img = screen.getByRole("img");
    const container = img.parentElement!;

    fireEvent.touchStart(container, {
      touches: [{ clientX: 0, clientY: 0 } as TouchInit, { clientX: 10, clientY: 10 } as TouchInit]
    } as TouchEventInit);
    fireEvent.touchMove(container, {
      touches: [{ clientX: 5, clientY: 5 } as TouchInit]
    } as TouchEventInit);
    fireEvent.touchEnd(container);

    expect(img.style.transform).toContain("translate(0px, 0px) scale(1.25)");
  });

  it("does not touch drag if document is not an image", () => {
    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="http://localhost/test.pdf"
        fileName="test.pdf"
      />
    );

    const containerNode = document.body.querySelector(".flex-1.relative.overflow-hidden")!;
    fireEvent.touchStart(containerNode, {
      touches: [{ clientX: 50, clientY: 50 } as TouchInit]
    } as TouchEventInit);
    fireEvent.touchMove(containerNode, {
      touches: [{ clientX: 60, clientY: 70 } as TouchInit]
    } as TouchEventInit);
    fireEvent.touchEnd(containerNode);
  });

  it("calls onClose when clicking the modal backdrop, but not when clicking inside the content modal", () => {
    const onCloseMock = vi.fn();
    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={onCloseMock}
        fileUrl="http://localhost/test-image.png"
        fileName="test-image.png"
      />
    );

    const backdrop = document.body.querySelector(".fixed.inset-0")!;
    const content = document.body.querySelector(".relative.flex.flex-col")!;

    fireEvent.click(content);
    expect(onCloseMock).not.toHaveBeenCalled();

    fireEvent.click(backdrop);
    expect(onCloseMock).toHaveBeenCalled();
  });

  it("cleans up event listeners on unmount", () => {
    const addListenerSpy = vi.spyOn(document, "addEventListener");
    const removeListenerSpy = vi.spyOn(document, "removeEventListener");

    const { unmount } = render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="http://localhost/test-image.png"
        fileName="test-image.png"
      />
    );

    expect(addListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
    expect(addListenerSpy).toHaveBeenCalledWith("fullscreenchange", expect.any(Function));

    unmount();

    expect(removeListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
    expect(removeListenerSpy).toHaveBeenCalledWith("fullscreenchange", expect.any(Function));
  });

  it("locks and restores document body overflow style", () => {
    document.body.style.overflow = "scroll";

    const { unmount } = render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="http://localhost/test-image.png"
        fileName="test-image.png"
      />
    );

    expect(document.body.style.overflow).toBe("hidden");

    unmount();

    expect(document.body.style.overflow).toBe("scroll");
  });

  it("renders with label as primary title and fileName as subtitle when label is provided", () => {
    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="http://localhost/test-image.png"
        fileName="test-image.png"
        label="Commencement Certificate"
      />
    );

    expect(screen.getByText("Commencement Certificate")).toBeInTheDocument();
    expect(screen.getByText("test-image.png")).toBeInTheDocument();
  });

  it("renders with fileName as primary title and no subtitle when label is not provided", () => {
    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="http://localhost/test-image.png"
        fileName="test-image.png"
      />
    );

    expect(screen.getByText("test-image.png")).toBeInTheDocument();
  });

  it("renders property info badges using values from search params when not provided as props", () => {
    mockGet.mockImplementation((key: string) => {
      if (key === "wardNo") return "MM11";
      if (key === "propertyNo") return "27";
      if (key === "partitionNo") return "—";
      return null;
    });

    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="http://localhost/test-image.png"
        fileName="test-image.png"
      />
    );

    expect(screen.getByText("Ward: MM11")).toBeInTheDocument();
    expect(screen.getByText("Property No: 27")).toBeInTheDocument();
    expect(screen.getByText("Partition: —")).toBeInTheDocument();
  });

  it("renders property info badges using custom prop values when passed explicitly", () => {
    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="http://localhost/test-image.png"
        fileName="test-image.png"
        wardNo="W100"
        propertyNo="99"
        partitionNo="5"
      />
    );

    expect(screen.getByText("Ward: W100")).toBeInTheDocument();
    expect(screen.getByText("Property No: 99")).toBeInTheDocument();
    expect(screen.getByText("Partition: 5")).toBeInTheDocument();
  });

  it("has the responsive display class hidden md:flex on the badges container", () => {
    render(
      <DocumentViewerModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="http://localhost/test-image.png"
        fileName="test-image.png"
        wardNo="MM11"
        propertyNo="27"
        partitionNo="—"
      />
    );

    const badgesContainer = document.body.querySelector(".hidden.md\\:flex");
    expect(badgesContainer).toBeInTheDocument();
    expect(badgesContainer).toHaveClass("hidden", "md:flex");
  });
});
