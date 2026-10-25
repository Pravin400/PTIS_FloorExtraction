import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { getUploadTableColumns } from "@/components/modules/property-tax/PropertyMedia/UploadDownload/UploadTableColumn";
import { UploadFileItem } from "@/types/PropertyMedia/PropertyMedia.types";

describe("UploadTableColumn", () => {
  const mockTranslate = (key: string) => key;
  const columns = getUploadTableColumns(mockTranslate);

  it("returns 3 columns with translation keys", () => {
    expect(columns).toHaveLength(3);
    expect(columns[0].key).toBe("fileName");
    expect(columns[1].key).toBe("propertyDisplay");
    expect(columns[2].key).toBe("isMatched");

    expect(columns[0].label).toBe("uploadDownloadDrawer.table.columns.fileName");
    expect(columns[1].label).toBe("uploadDownloadDrawer.table.columns.propertyDetails");
    expect(columns[2].label).toBe("uploadDownloadDrawer.table.columns.matchStatus");
  });

  it("renders image file preview icon for jpg/png files", () => {
    const fileCol = columns.find((c) => c.key === "fileName");
    expect(fileCol?.render).toBeDefined();

    const row: UploadFileItem = { fileName: "photo.jpg", isMatched: true };
    const { container } = render(<>{fileCol?.render!("photo.jpg", row, 0)}</>);

    expect(screen.getByText("photo.jpg")).toBeInTheDocument();
    // Image icon has class lucide-image-icon or data-icon="ImageIcon"
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders pdf file preview icon for pdf files", () => {
    const fileCol = columns.find((c) => c.key === "fileName");
    const row: UploadFileItem = { fileName: "document.pdf", isMatched: false };
    render(<>{fileCol?.render!("document.pdf", row, 0)}</>);

    expect(screen.getByText("document.pdf")).toBeInTheDocument();
  });

  it("renders property details or dash fallback", () => {
    const propCol = columns.find((c) => c.key === "propertyDisplay");
    expect(propCol?.render).toBeDefined();

    const rowWithProp: UploadFileItem = {
      fileName: "photo.jpg",
      isMatched: true,
      propertyDisplay: "Property #102, Ward 5",
    };
    render(<>{propCol?.render!("Property #102, Ward 5", rowWithProp, 0)}</>);
    expect(screen.getByText("Property #102, Ward 5")).toBeInTheDocument();

    const rowWithoutProp: UploadFileItem = {
      fileName: "photo.jpg",
      isMatched: false,
    };
    render(<>{propCol?.render!(undefined, rowWithoutProp, 1)}</>);
    expect(screen.getByText("-")).toBeInTheDocument();

    const rowWithZeroProp: UploadFileItem = {
      fileName: "photo.jpg",
      isMatched: true,
      propertyDisplay: 0 as unknown as string,
    };
    render(<>{propCol?.render!(0, rowWithZeroProp, 2)}</>);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("renders checkmark icon for matched items and cross icon for unmatched items", () => {
    const matchCol = columns.find((c) => c.key === "isMatched");
    expect(matchCol?.render).toBeDefined();

    const matchedRow: UploadFileItem = { fileName: "photo.jpg", isMatched: true };
    const { container: matchedContainer } = render(
      <>{matchCol?.render!(true, matchedRow, 0)}</>
    );
    expect(matchedContainer.querySelector(".text-\\[\\#16a34a\\]")).toBeInTheDocument();

    const unmatchedRow: UploadFileItem = { fileName: "photo.jpg", isMatched: false };
    const { container: unmatchedContainer } = render(
      <>{matchCol?.render!(false, unmatchedRow, 1)}</>
    );
    expect(unmatchedContainer.querySelector(".text-\\[\\#dc2626\\]")).toBeInTheDocument();
  });
});
