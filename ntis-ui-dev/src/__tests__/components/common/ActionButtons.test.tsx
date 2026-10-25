import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  AddButton,
  SaveButton,
  CancelButton,
  UploadButton,
  DownloadButton,
  ExportButton,
  ImportButton,
  SelectAllButton,
  ClearButton,
  EditButton,
  EditLabelButton,
  DeleteButton,
  DeleteLabelButton,
  FirstPageButton,
  PrevPageButton,
  NextPageButton,
  LastPageButton,
  PageNumberButton,
  SortAscButton,
  SortDescButton,
  SortDefaultButton,
  BadgeListButton,
} from "@/components/common/ActionButtons";
import { IconButton } from "@/components/common/ActionButtons";

describe("ActionButtons", () => {
  describe("Labeled Action Buttons", () => {
    describe("AddButton", () => {
      it("renders with default label", () => {
        render(<AddButton />);
        expect(screen.getByText("Add")).toBeInTheDocument();
      });

      it("renders with custom label", () => {
        render(<AddButton label="Create New" />);
        expect(screen.getByText("Create New")).toBeInTheDocument();
      });

      it("calls onClick handler when clicked", () => {
        const handleClick = vi.fn();
        render(<AddButton onClick={handleClick} />);
        fireEvent.click(screen.getByText("Add"));
        expect(handleClick).toHaveBeenCalledTimes(1);
      });

      it("is disabled when disabled prop is true", () => {
        render(<AddButton disabled />);
        const button = screen.getByText("Add").closest("button");
        expect(button).toBeDisabled();
      });

      it("accepts additional className", () => {
        render(<AddButton className="custom-class" />);
        const button = screen.getByText("Add").closest("button");
        expect(button).toHaveClass("custom-class");
      });
    });

    describe("SaveButton", () => {
      it("renders with default label", () => {
        render(<SaveButton />);
        expect(screen.getByText("Save")).toBeInTheDocument();
      });

      it("renders with custom label", () => {
        render(<SaveButton label="Submit" />);
        expect(screen.getByText("Submit")).toBeInTheDocument();
      });

      it("calls onClick handler when clicked", () => {
        const handleClick = vi.fn();
        render(<SaveButton onClick={handleClick} />);
        fireEvent.click(screen.getByText("Save"));
        expect(handleClick).toHaveBeenCalledTimes(1);
      });

      it("is disabled when disabled prop is true", () => {
        render(<SaveButton disabled />);
        const button = screen.getByText("Save").closest("button");
        expect(button).toBeDisabled();
      });
    });

    describe("CancelButton", () => {
      it("renders with default label", () => {
        render(<CancelButton />);
        expect(screen.getByText("Cancel")).toBeInTheDocument();
      });

      it("renders with custom label", () => {
        render(<CancelButton label="Close" />);
        expect(screen.getByText("Close")).toBeInTheDocument();
      });

      it("calls onClick handler when clicked", () => {
        const handleClick = vi.fn();
        render(<CancelButton onClick={handleClick} />);
        fireEvent.click(screen.getByText("Cancel"));
        expect(handleClick).toHaveBeenCalledTimes(1);
      });
    });

    describe("UploadButton", () => {
      it("renders with default label", () => {
        render(<UploadButton />);
        expect(screen.getByText("Upload")).toBeInTheDocument();
      });

      it("renders with custom label", () => {
        render(<UploadButton label="Upload File" />);
        expect(screen.getByText("Upload File")).toBeInTheDocument();
      });

      it("calls onClick handler when clicked", () => {
        const handleClick = vi.fn();
        render(<UploadButton onClick={handleClick} />);
        fireEvent.click(screen.getByText("Upload"));
        expect(handleClick).toHaveBeenCalledTimes(1);
      });
    });

    describe("ExportButton", () => {
      it("renders with default label", () => {
        render(<ExportButton />);
        expect(screen.getByText("Export")).toBeInTheDocument();
      });

      it("renders with custom label", () => {
        render(<ExportButton label="Export Data" />);
        expect(screen.getByText("Export Data")).toBeInTheDocument();
      });

      it("calls onClick handler when clicked", () => {
        const handleClick = vi.fn();
        render(<ExportButton onClick={handleClick} />);
        fireEvent.click(screen.getByText("Export"));
        expect(handleClick).toHaveBeenCalledTimes(1);
      });
    });

    describe("ImportButton", () => {
      it("renders with default label", () => {
        render(<ImportButton />);
        expect(screen.getByText("Import")).toBeInTheDocument();
      });

      it("renders with custom label", () => {
        render(<ImportButton label="Import Data" />);
        expect(screen.getByText("Import Data")).toBeInTheDocument();
      });

      it("calls onClick handler when clicked", () => {
        const handleClick = vi.fn();
        render(<ImportButton onClick={handleClick} />);
        fireEvent.click(screen.getByText("Import"));
        expect(handleClick).toHaveBeenCalledTimes(1);
      });
    });

    describe("SelectAllButton", () => {
      it("renders with default label", () => {
        render(<SelectAllButton />);
        expect(screen.getByText("Select All")).toBeInTheDocument();
      });

      it("renders with custom label", () => {
        render(<SelectAllButton label="Select Everything" />);
        expect(screen.getByText("Select Everything")).toBeInTheDocument();
      });

      it("calls onClick handler when clicked", () => {
        const handleClick = vi.fn();
        render(<SelectAllButton onClick={handleClick} />);
        fireEvent.click(screen.getByText("Select All"));
        expect(handleClick).toHaveBeenCalledTimes(1);
      });

      it("is disabled when disabled prop is true", () => {
        render(<SelectAllButton disabled />);
        const button = screen.getByText("Select All").closest("button");
        expect(button).toBeDisabled();
      });

      it("accepts additional className", () => {
        render(<SelectAllButton className="custom-select-all-class" />);
        const button = screen.getByText("Select All").closest("button");
        expect(button).toHaveClass("custom-select-all-class");
      });
    });

    describe("ClearButton", () => {
      it("renders with default label", () => {
        render(<ClearButton />);
        expect(screen.getByText("Clear")).toBeInTheDocument();
      });

      it("renders with custom label", () => {
        render(<ClearButton label="Reset" />);
        expect(screen.getByText("Reset")).toBeInTheDocument();
      });

      it("calls onClick handler when clicked", () => {
        const handleClick = vi.fn();
        render(<ClearButton onClick={handleClick} />);
        fireEvent.click(screen.getByText("Clear"));
        expect(handleClick).toHaveBeenCalledTimes(1);
      });

      it("is disabled when disabled prop is true", () => {
        render(<ClearButton disabled />);
        const button = screen.getByText("Clear").closest("button");
        expect(button).toBeDisabled();
      });

      it("accepts additional className", () => {
        render(<ClearButton className="custom-clear-class" />);
        const button = screen.getByText("Clear").closest("button");
        expect(button).toHaveClass("custom-clear-class");
      });
    });
  });

  describe("Icon-Only CRUD Buttons", () => {
    describe("EditButton", () => {
      it("renders without text", () => {
        const { container } = render(<EditButton />);
        const button = container.querySelector("button");
        expect(button).toBeInTheDocument();
        expect(button?.textContent).toBe("");
      });

      it("calls onClick handler when clicked", () => {
        const handleClick = vi.fn();
        const { container } = render(<EditButton onClick={handleClick} />);
        const button = container.querySelector("button");
        if (button) {
          fireEvent.click(button);
        }
        expect(handleClick).toHaveBeenCalledTimes(1);
      });

      it("is disabled when disabled prop is true", () => {
        const { container } = render(<EditButton disabled />);
        const button = container.querySelector("button");
        expect(button).toBeDisabled();
      });

      it("has small size by default", () => {
        const { container } = render(<EditButton />);
        const button = container.querySelector("button");
        expect(button).toHaveClass("h-8");
      });
    });

    describe("DeleteButton", () => {
      it("renders without text", () => {
        const { container } = render(<DeleteButton />);
        const button = container.querySelector("button");
        expect(button).toBeInTheDocument();
        expect(button?.textContent).toBe("");
      });

      it("calls onClick handler when clicked", () => {
        const handleClick = vi.fn();
        const { container } = render(<DeleteButton onClick={handleClick} />);
        const button = container.querySelector("button");
        if (button) {
          fireEvent.click(button);
        }
        expect(handleClick).toHaveBeenCalledTimes(1);
      });

      it("is disabled when disabled prop is true", () => {
        const { container } = render(<DeleteButton disabled />);
        const button = container.querySelector("button");
        expect(button).toBeDisabled();
      });

      it("has small size by default", () => {
        const { container } = render(<DeleteButton />);
        const button = container.querySelector("button");
        expect(button).toHaveClass("h-8");
      });
    });
  });

  describe("Pagination Buttons", () => {
    describe("FirstPageButton", () => {
      it("renders without text", () => {
        const { container } = render(<FirstPageButton />);
        const button = container.querySelector("button");
        expect(button).toBeInTheDocument();
      });

      it("calls onClick handler when clicked", () => {
        const handleClick = vi.fn();
        const { container } = render(<FirstPageButton onClick={handleClick} />);
        const button = container.querySelector("button");
        if (button) {
          fireEvent.click(button);
        }
        expect(handleClick).toHaveBeenCalledTimes(1);
      });

      it("is disabled when disabled prop is true", () => {
        const { container } = render(<FirstPageButton disabled />);
        const button = container.querySelector("button");
        expect(button).toBeDisabled();
      });
    });

    describe("PrevPageButton", () => {
      it("renders without text", () => {
        const { container } = render(<PrevPageButton />);
        const button = container.querySelector("button");
        expect(button).toBeInTheDocument();
      });

      it("calls onClick handler when clicked", () => {
        const handleClick = vi.fn();
        const { container } = render(<PrevPageButton onClick={handleClick} />);
        const button = container.querySelector("button");
        if (button) {
          fireEvent.click(button);
        }
        expect(handleClick).toHaveBeenCalledTimes(1);
      });
    });

    describe("NextPageButton", () => {
      it("renders without text", () => {
        const { container } = render(<NextPageButton />);
        const button = container.querySelector("button");
        expect(button).toBeInTheDocument();
      });

      it("calls onClick handler when clicked", () => {
        const handleClick = vi.fn();
        const { container } = render(<NextPageButton onClick={handleClick} />);
        const button = container.querySelector("button");
        if (button) {
          fireEvent.click(button);
        }
        expect(handleClick).toHaveBeenCalledTimes(1);
      });
    });

    describe("LastPageButton", () => {
      it("renders without text", () => {
        const { container } = render(<LastPageButton />);
        const button = container.querySelector("button");
        expect(button).toBeInTheDocument();
      });

      it("calls onClick handler when clicked", () => {
        const handleClick = vi.fn();
        const { container } = render(<LastPageButton onClick={handleClick} />);
        const button = container.querySelector("button");
        if (button) {
          fireEvent.click(button);
        }
        expect(handleClick).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Sort Buttons", () => {
    describe("SortAscButton", () => {
      it("renders without text", () => {
        const { container } = render(<SortAscButton />);
        const button = container.querySelector("button");
        expect(button).toBeInTheDocument();
        expect(button?.textContent).toBe("");
      });

      it("calls onClick handler when clicked", () => {
        const handleClick = vi.fn();
        const { container } = render(<SortAscButton onClick={handleClick} />);
        const button = container.querySelector("button");
        if (button) {
          fireEvent.click(button);
        }
        expect(handleClick).toHaveBeenCalledTimes(1);
      });

      it("is disabled when disabled prop is true", () => {
        const { container } = render(<SortAscButton disabled />);
        const button = container.querySelector("button");
        expect(button).toBeDisabled();
      });

      it("has correct hover classes", () => {
        const { container } = render(<SortAscButton />);
        const button = container.querySelector("button");
        expect(button).toHaveClass("hover:bg-transparent");
        expect(button).toHaveClass("hover:text-blue-600");
      });

      it("has default aria-label", () => {
        const { container } = render(<SortAscButton />);
        const button = container.querySelector("button");
        expect(button).toHaveAttribute("aria-label", "Sort ascending");
      });

      it("accepts custom aria-label", () => {
        const { container } = render(<SortAscButton aria-label="Custom sort" />);
        const button = container.querySelector("button");
        expect(button).toHaveAttribute("aria-label", "Custom sort");
      });

      it("accepts additional className", () => {
        const { container } = render(<SortAscButton className="custom-sort-class" />);
        const button = container.querySelector("button");
        expect(button).toHaveClass("custom-sort-class");
      });
    });

    describe("SortDescButton", () => {
      it("renders without text", () => {
        const { container } = render(<SortDescButton />);
        const button = container.querySelector("button");
        expect(button).toBeInTheDocument();
        expect(button?.textContent).toBe("");
      });

      it("calls onClick handler when clicked", () => {
        const handleClick = vi.fn();
        const { container } = render(<SortDescButton onClick={handleClick} />);
        const button = container.querySelector("button");
        if (button) {
          fireEvent.click(button);
        }
        expect(handleClick).toHaveBeenCalledTimes(1);
      });

      it("is disabled when disabled prop is true", () => {
        const { container } = render(<SortDescButton disabled />);
        const button = container.querySelector("button");
        expect(button).toBeDisabled();
      });

      it("has correct hover classes", () => {
        const { container } = render(<SortDescButton />);
        const button = container.querySelector("button");
        expect(button).toHaveClass("hover:bg-transparent");
        expect(button).toHaveClass("hover:text-blue-600");
      });

      it("has default aria-label", () => {
        const { container } = render(<SortDescButton />);
        const button = container.querySelector("button");
        expect(button).toHaveAttribute("aria-label", "Sort descending");
      });

      it("accepts custom aria-label", () => {
        const { container } = render(<SortDescButton aria-label="Custom sort desc" />);
        const button = container.querySelector("button");
        expect(button).toHaveAttribute("aria-label", "Custom sort desc");
      });

      it("accepts additional className", () => {
        const { container } = render(<SortDescButton className="custom-desc-class" />);
        const button = container.querySelector("button");
        expect(button).toHaveClass("custom-desc-class");
      });
    });

    describe("SortDefaultButton", () => {
      it("renders without text", () => {
        const { container } = render(<SortDefaultButton />);
        const button = container.querySelector("button");
        expect(button).toBeInTheDocument();
        expect(button?.textContent).toBe("");
      });

      it("calls onClick handler when clicked", () => {
        const handleClick = vi.fn();
        const { container } = render(<SortDefaultButton onClick={handleClick} />);
        const button = container.querySelector("button");
        if (button) {
          fireEvent.click(button);
        }
        expect(handleClick).toHaveBeenCalledTimes(1);
      });

      it("is disabled when disabled prop is true", () => {
        const { container } = render(<SortDefaultButton disabled />);
        const button = container.querySelector("button");
        expect(button).toBeDisabled();
      });

      it("has correct hover classes", () => {
        const { container } = render(<SortDefaultButton />);
        const button = container.querySelector("button");
        expect(button).toHaveClass("hover:bg-transparent");
        expect(button).toHaveClass("hover:text-blue-600");
      });

      it("has default aria-label", () => {
        const { container } = render(<SortDefaultButton />);
        const button = container.querySelector("button");
        expect(button).toHaveAttribute("aria-label", "Sort");
      });

      it("accepts custom aria-label", () => {
        const { container } = render(<SortDefaultButton aria-label="Custom default sort" />);
        const button = container.querySelector("button");
        expect(button).toHaveAttribute("aria-label", "Custom default sort");
      });

      it("accepts additional className", () => {
        const { container } = render(<SortDefaultButton className="custom-default-class" />);
        const button = container.querySelector("button");
        expect(button).toHaveClass("custom-default-class");
      });

      it("has small size by default", () => {
        const { container } = render(<SortDefaultButton />);
        const button = container.querySelector("button");
        expect(button).toHaveClass("h-8");
      });
    });
  });

  describe("IconButton (Default Export)", () => {
    it("renders with icon", () => {
      const MockIcon = () => <span data-testid="mock-icon">Icon</span>;
      const { container } = render(<IconButton icon={MockIcon} />);
      const button = container.querySelector("button");
      expect(button).toBeInTheDocument();
    });

    it("applies primary variant classes by default", () => {
      const MockIcon = () => <span>Icon</span>;
      const { container } = render(<IconButton icon={MockIcon} />);
      const button = container.querySelector("button");
      expect(button).toHaveClass("from-cyan-400");
      expect(button).toHaveClass("to-blue-500");
    });

    it("applies danger variant classes when variant is danger", () => {
      const MockIcon = () => <span>Icon</span>;
      const { container } = render(<IconButton icon={MockIcon} variant="danger" />);
      const button = container.querySelector("button");
      expect(button).toHaveClass("from-red-400");
      expect(button).toHaveClass("to-red-600");
    });

    it("calls onClick handler when clicked", () => {
      const MockIcon = () => <span>Icon</span>;
      const handleClick = vi.fn();
      const { container } = render(<IconButton icon={MockIcon} onClick={handleClick} />);
      const button = container.querySelector("button");
      if (button) {
        fireEvent.click(button);
      }
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("is disabled when disabled prop is true", () => {
      const MockIcon = () => <span>Icon</span>;
      const { container } = render(<IconButton icon={MockIcon} disabled />);
      const button = container.querySelector("button");
      expect(button).toBeDisabled();
    });

    it("accepts additional className", () => {
      const MockIcon = () => <span>Icon</span>;
      const { container } = render(<IconButton icon={MockIcon} className="custom-icon-class" />);
      const button = container.querySelector("button");
      expect(button).toHaveClass("custom-icon-class");
    });

    it("has correct size classes", () => {
      const MockIcon = () => <span>Icon</span>;
      const { container } = render(<IconButton icon={MockIcon} />);
      const button = container.querySelector("button");
      expect(button).toHaveClass("h-8");
      expect(button).toHaveClass("w-8");
    });
  });

  describe("PageNumberButton", () => {
    it("renders page number", () => {
      render(<PageNumberButton page={5} />);
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("calls onClick handler when clicked", () => {
      const handleClick = vi.fn();
      render(<PageNumberButton page={3} onClick={handleClick} />);
      fireEvent.click(screen.getByText("3"));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("applies active styles when active is true", () => {
      render(<PageNumberButton page={2} active />);
      const button = screen.getByText("2").closest("button");
      expect(button).toHaveClass("bg-[#2563EB]");
      expect(button).toHaveClass("text-white");
    });

    it("applies inactive styles when active is false", () => {
      render(<PageNumberButton page={2} active={false} />);
      const button = screen.getByText("2").closest("button");
      expect(button).toHaveClass("bg-white");
      expect(button).toHaveClass("text-[#1E3A8A]");
    });

    it("has correct size classes", () => {
      render(<PageNumberButton page={1} />);
      const button = screen.getByText("1").closest("button");
      expect(button).toHaveClass("min-w-9");
      expect(button).toHaveClass("text-sm");
    });
  });

  describe("Button Props Inheritance", () => {
    it("AddButton accepts all ButtonProps", () => {
      const handleClick = vi.fn();
      render(
        <AddButton
          onClick={handleClick}
          disabled={false}
          className="test-class"
          label="Test Add"
        />
      );
      const button = screen.getByText("Test Add");
      expect(button).toBeInTheDocument();
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalled();
    });

    it("EditButton accepts ButtonProps except icon and variant", () => {
      const { container } = render(
        <EditButton
          className="edit-test-class"
          disabled={false}
        />
      );
      const button = container.querySelector("button");
      expect(button).toHaveClass("edit-test-class");
    });
  });

  describe("Accessibility", () => {
    it("labeled buttons are keyboard accessible", () => {
      const handleClick = vi.fn();
      render(<AddButton onClick={handleClick} />);
      const button = screen.getByRole("button", { name: "Add" });
      button.focus();
      expect(button).toHaveFocus();
      fireEvent.keyDown(button, { key: "Enter" });
    });

    it("icon buttons are keyboard accessible", () => {
      const MockIcon = () => <span>Icon</span>;
      const handleClick = vi.fn();
      const { container } = render(<IconButton icon={MockIcon} onClick={handleClick} />);
      const button = container.querySelector("button");
      if (button) {
        button.focus();
        expect(button).toHaveFocus();
      }
    });

    it("sort buttons are keyboard accessible", () => {
      const handleClick = vi.fn();
      const { container } = render(<SortAscButton onClick={handleClick} />);
      const button = container.querySelector("button");
      if (button) {
        button.focus();
        expect(button).toHaveFocus();
      }
    });

    it("sort buttons have proper aria-labels", () => {
      const { container: ascContainer } = render(<SortAscButton />);
      const ascButton = ascContainer.querySelector("button");
      expect(ascButton).toHaveAttribute("aria-label", "Sort ascending");

      const { container: descContainer } = render(<SortDescButton />);
      const descButton = descContainer.querySelector("button");
      expect(descButton).toHaveAttribute("aria-label", "Sort descending");

      const { container: defaultContainer } = render(<SortDefaultButton />);
      const defaultButton = defaultContainer.querySelector("button");
      expect(defaultButton).toHaveAttribute("aria-label", "Sort");
    });

    it("disabled buttons cannot be focused programmatically", () => {
      render(<AddButton disabled />);
      const button = screen.getByText("Add").closest("button");
      expect(button).toBeDisabled();
    });
  });

  describe("Edge Cases", () => {
    it("handles multiple rapid clicks correctly", () => {
      const handleClick = vi.fn();
      render(<AddButton onClick={handleClick} />);
      const button = screen.getByText("Add");
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it("PageNumberButton handles large page numbers", () => {
      render(<PageNumberButton page={9999} />);
      expect(screen.getByText("9999")).toBeInTheDocument();
    });

    it("handles empty label strings", () => {
      render(<AddButton label="" />);
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button.textContent).toBe("");
    });
  });

  describe("New Action Buttons", () => {
    describe("DownloadButton", () => {
      it("renders with default label", () => {
        render(<DownloadButton />);
        expect(screen.getByText("Download")).toBeInTheDocument();
      });

      it("renders with custom label", () => {
        render(<DownloadButton label="Download Template" />);
        expect(screen.getByText("Download Template")).toBeInTheDocument();
      });

      it("calls onClick handler when clicked", () => {
        const handleClick = vi.fn();
        render(<DownloadButton onClick={handleClick} />);
        fireEvent.click(screen.getByText("Download"));
        expect(handleClick).toHaveBeenCalledTimes(1);
      });

      it("is disabled when disabled prop is true", () => {
        render(<DownloadButton disabled />);
        const button = screen.getByText("Download").closest("button");
        expect(button).toBeDisabled();
      });

      it("accepts additional className", () => {
        render(<DownloadButton className="custom-download-class" />);
        const button = screen.getByText("Download").closest("button");
        expect(button).toHaveClass("custom-download-class");
      });
    });

    describe("UploadButton", () => {
      it("renders with default label", () => {
        render(<UploadButton />);
        expect(screen.getByText("Upload")).toBeInTheDocument();
      });

      it("renders with custom label", () => {
        render(<UploadButton label="Upload File" />);
        expect(screen.getByText("Upload File")).toBeInTheDocument();
      });

      it("calls onClick handler when clicked", () => {
        const handleClick = vi.fn();
        render(<UploadButton onClick={handleClick} />);
        fireEvent.click(screen.getByText("Upload"));
        expect(handleClick).toHaveBeenCalledTimes(1);
      });

      it("is disabled when disabled prop is true", () => {
        render(<UploadButton disabled />);
        const button = screen.getByText("Upload").closest("button");
        expect(button).toBeDisabled();
      });

      it("accepts additional className", () => {
        render(<UploadButton className="custom-upload-class" />);
        const button = screen.getByText("Upload").closest("button");
        expect(button).toHaveClass("custom-upload-class");
      });
    });

    describe("EditLabelButton", () => {
      it("renders with default label", () => {
        render(<EditLabelButton />);
        expect(screen.getByText("Edit")).toBeInTheDocument();
      });

      it("renders with custom label", () => {
        render(<EditLabelButton label="Edit Rates" />);
        expect(screen.getByText("Edit Rates")).toBeInTheDocument();
      });

      it("calls onClick handler when clicked", () => {
        const handleClick = vi.fn();
        render(<EditLabelButton onClick={handleClick} />);
        fireEvent.click(screen.getByText("Edit"));
        expect(handleClick).toHaveBeenCalledTimes(1);
      });

      it("is disabled when disabled prop is true", () => {
        render(<EditLabelButton disabled />);
        const button = screen.getByText("Edit").closest("button");
        expect(button).toBeDisabled();
      });

      it("accepts additional className", () => {
        render(<EditLabelButton className="custom-edit-label-class" />);
        const button = screen.getByText("Edit").closest("button");
        expect(button).toHaveClass("custom-edit-label-class");
      });
    });

    describe("DeleteLabelButton", () => {
      it("renders with default label", () => {
        render(<DeleteLabelButton />);
        expect(screen.getByText("Delete")).toBeInTheDocument();
      });

      it("renders with custom label", () => {
        render(<DeleteLabelButton label="Delete Rates" />);
        expect(screen.getByText("Delete Rates")).toBeInTheDocument();
      });

      it("calls onClick handler when clicked", () => {
        const handleClick = vi.fn();
        render(<DeleteLabelButton onClick={handleClick} />);
        fireEvent.click(screen.getByText("Delete"));
        expect(handleClick).toHaveBeenCalledTimes(1);
      });

      it("is disabled when disabled prop is true", () => {
        render(<DeleteLabelButton disabled />);
        const button = screen.getByText("Delete").closest("button");
        expect(button).toBeDisabled();
      });

      it("accepts additional className", () => {
        render(<DeleteLabelButton className="custom-delete-label-class" />);
        const button = screen.getByText("Delete").closest("button");
        expect(button).toHaveClass("custom-delete-label-class");
      });
    });
  });

  describe("BadgeListButton", () => {
    describe("Rendering", () => {
      it("renders all items when count is within maxVisible", () => {
        render(<BadgeListButton items={["A", "B", "C"]} />);
        expect(screen.getByText("A")).toBeInTheDocument();
        expect(screen.getByText("B")).toBeInTheDocument();
        expect(screen.getByText("C")).toBeInTheDocument();
      });

      it("renders only maxVisible items and shows overflow count", () => {
        render(<BadgeListButton items={["A", "B", "C", "D", "E"]} maxVisible={3} />);
        expect(screen.getByText("A")).toBeInTheDocument();
        expect(screen.getByText("B")).toBeInTheDocument();
        expect(screen.getByText("C")).toBeInTheDocument();
        expect(screen.queryByText("D")).not.toBeInTheDocument();
        expect(screen.queryByText("E")).not.toBeInTheDocument();
        expect(screen.getByText("+2")).toBeInTheDocument();
      });

      it("does not show overflow badge when items equal maxVisible", () => {
        render(<BadgeListButton items={["A", "B", "C"]} maxVisible={3} />);
        expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
      });

      it("renders empty button with no items", () => {
        const { container } = render(<BadgeListButton items={[]} />);
        const button = container.querySelector("button");
        expect(button).toBeInTheDocument();
        expect(button?.textContent).toBe("");
      });

      it("respects custom maxVisible value", () => {
        render(<BadgeListButton items={["A", "B", "C", "D"]} maxVisible={2} />);
        expect(screen.getByText("A")).toBeInTheDocument();
        expect(screen.getByText("B")).toBeInTheDocument();
        expect(screen.queryByText("C")).not.toBeInTheDocument();
        expect(screen.getByText("+2")).toBeInTheDocument();
      });

      it("uses default maxVisible of 3", () => {
        render(<BadgeListButton items={["A", "B", "C", "D"]} />);
        expect(screen.getByText("A")).toBeInTheDocument();
        expect(screen.getByText("B")).toBeInTheDocument();
        expect(screen.getByText("C")).toBeInTheDocument();
        expect(screen.getByText("+1")).toBeInTheDocument();
      });
    });

    describe("Interaction", () => {
      it("calls onClick handler when clicked", () => {
        const handleClick = vi.fn();
        render(<BadgeListButton items={["A", "B"]} onClick={handleClick} />);
        fireEvent.click(screen.getByText("A").closest("button")!);
        expect(handleClick).toHaveBeenCalledTimes(1);
      });

      it("stops propagation on click", () => {
        const outerClick = vi.fn();
        const buttonClick = vi.fn();
        render(
          <div onClick={outerClick}>
            <BadgeListButton items={["A"]} onClick={buttonClick} />
          </div>
        );
        fireEvent.click(screen.getByText("A").closest("button")!);
        expect(buttonClick).toHaveBeenCalledTimes(1);
        expect(outerClick).not.toHaveBeenCalled();
      });

      it("does not call onClick when disabled", () => {
        const handleClick = vi.fn();
        render(<BadgeListButton items={["A"]} onClick={handleClick} disabled />);
        const button = screen.getByText("A").closest("button")!;
        fireEvent.click(button);
        expect(handleClick).not.toHaveBeenCalled();
      });

      it("is disabled when disabled prop is true", () => {
        render(<BadgeListButton items={["A"]} disabled />);
        const button = screen.getByText("A").closest("button");
        expect(button).toBeDisabled();
      });
    });

    describe("Styling", () => {
      it("applies custom className to button", () => {
        render(<BadgeListButton items={["A"]} className="custom-btn-class" />);
        const button = screen.getByText("A").closest("button");
        expect(button).toHaveClass("custom-btn-class");
      });

      it("applies custom badgeClassName to badges", () => {
        render(<BadgeListButton items={["A"]} badgeClassName="custom-badge" />);
        const badge = screen.getByText("A");
        expect(badge).toHaveClass("custom-badge");
      });

      it("applies custom overflowBadgeClassName to overflow badge", () => {
        render(<BadgeListButton items={["A", "B", "C", "D"]} overflowBadgeClassName="custom-overflow" />);
        const overflowBadge = screen.getByText("+1");
        expect(overflowBadge).toHaveClass("custom-overflow");
      });

      it("applies disabled styling when disabled", () => {
        render(<BadgeListButton items={["A"]} disabled />);
        const button = screen.getByText("A").closest("button");
        expect(button).toHaveClass("opacity-50");
        expect(button).toHaveClass("cursor-not-allowed");
      });

      it("has default badge styling", () => {
        render(<BadgeListButton items={["A"]} />);
        const badge = screen.getByText("A");
        expect(badge).toHaveClass("bg-blue-100");
        expect(badge).toHaveClass("text-blue-800");
        expect(badge).toHaveClass("font-mono");
      });

      it("has default overflow badge styling", () => {
        render(<BadgeListButton items={["A", "B", "C", "D"]} />);
        const overflowBadge = screen.getByText("+1");
        expect(overflowBadge).toHaveClass("bg-gray-100");
        expect(overflowBadge).toHaveClass("text-gray-600");
      });
    });

    describe("Accessibility", () => {
      it("renders title attribute when provided", () => {
        render(<BadgeListButton items={["A"]} title="Click to view" />);
        const button = screen.getByText("A").closest("button");
        expect(button).toHaveAttribute("title", "Click to view");
      });

      it("renders aria-label when provided", () => {
        render(<BadgeListButton items={["A"]} aria-label="View badges" />);
        const button = screen.getByText("A").closest("button");
        expect(button).toHaveAttribute("aria-label", "View badges");
      });

      it("is keyboard accessible", () => {
        const handleClick = vi.fn();
        render(<BadgeListButton items={["A"]} onClick={handleClick} />);
        const button = screen.getByText("A").closest("button")!;
        button.focus();
        expect(button).toHaveFocus();
      });

      it("has type button to prevent form submission", () => {
        render(<BadgeListButton items={["A"]} />);
        const button = screen.getByText("A").closest("button");
        expect(button).toHaveAttribute("type", "button");
      });
    });

    describe("Edge Cases", () => {
      it("handles single item", () => {
        render(<BadgeListButton items={["Single"]} />);
        expect(screen.getByText("Single")).toBeInTheDocument();
        expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
      });

      it("handles items with special characters", () => {
        render(<BadgeListButton items={["A&B", "C<D", "E>F"]} />);
        expect(screen.getByText("A&B")).toBeInTheDocument();
        expect(screen.getByText("C<D")).toBeInTheDocument();
        expect(screen.getByText("E>F")).toBeInTheDocument();
      });

      it("handles very long item text", () => {
        const longText = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        render(<BadgeListButton items={[longText]} />);
        expect(screen.getByText(longText)).toBeInTheDocument();
      });

      it("handles large number of items", () => {
        const items = Array.from({ length: 100 }, (_, i) => `Item${i}`);
        render(<BadgeListButton items={items} maxVisible={2} />);
        expect(screen.getByText("Item0")).toBeInTheDocument();
        expect(screen.getByText("Item1")).toBeInTheDocument();
        expect(screen.getByText("+98")).toBeInTheDocument();
      });

      it("handles maxVisible of 0", () => {
        render(<BadgeListButton items={["A", "B"]} maxVisible={0} />);
        expect(screen.queryByText("A")).not.toBeInTheDocument();
        expect(screen.getByText("+2")).toBeInTheDocument();
      });

      it("handles maxVisible greater than items length", () => {
        render(<BadgeListButton items={["A", "B"]} maxVisible={10} />);
        expect(screen.getByText("A")).toBeInTheDocument();
        expect(screen.getByText("B")).toBeInTheDocument();
        expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
      });
    });
  });
});

