import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TableModal } from "@/components/modules/property-tax/lockunlock/TableModal";
import { LockedScreen, LockUnlockPropertyItem } from "@/types/lockunlock.types";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (key === "manageModal.title") {
      return `Manage Locks: ${values?.propertyNo}`;
    }
    const translations: Record<string, string> = {
      "manageModal.cancel": "Cancel",
      "manageModal.description": "Description",
      "manageModal.saveChanges": "Save Changes",
    };
    return translations[key] || key;
  },
}));

describe("TableModal", () => {
  const mockScreens: LockedScreen[] = [
    { id: 1, screenCode: "S1", screenName: "Screen 1", screenNameLocal: "Screen 1 Local", displayOrder: 1 },
    { id: 2, screenCode: "S2", screenName: "Screen 2", screenNameLocal: "Screen 2 Local", displayOrder: 2 },
  ];

  const mockProperty: LockUnlockPropertyItem = {
    propertyId: 101,
    wardId: 79,
    wardNo: "79",
    propertyNo: "Prop-101",
    partitionNo: "A",
    isLocked: false,
    lockedScreens: [],
  };

  it("should render modal when open", () => {
    const mockSetEditModal = vi.fn();
    const mockSave = vi.fn();

    render(
      <TableModal
        editModal={{ isOpen: true, property: mockProperty, selectedScreenIds: [1] }}
        setEditModal={mockSetEditModal}
        screens={mockScreens}
        handleSaveIndividualLock={mockSave}
        isPending={false}
      />
    );

    expect(screen.getByText("Manage Locks: Prop-101 - A")).toBeInTheDocument();
    expect(screen.getByText("Screen 1")).toBeInTheDocument();
    expect(screen.getByText("Screen 2")).toBeInTheDocument();
  });

  it("should not render modal when closed", () => {
    const { container } = render(
      <TableModal
        editModal={{ isOpen: false, property: null, selectedScreenIds: [] }}
        setEditModal={vi.fn()}
        screens={mockScreens}
        handleSaveIndividualLock={vi.fn()}
        isPending={false}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("should trigger cancel when cancel is clicked", () => {
    const mockSetEditModal = vi.fn();
    render(
      <TableModal
        editModal={{ isOpen: true, property: mockProperty, selectedScreenIds: [1] }}
        setEditModal={mockSetEditModal}
        screens={mockScreens}
        handleSaveIndividualLock={vi.fn()}
        isPending={false}
      />
    );

    const cancelButton = screen.getAllByRole("button", { name: "Cancel" })[0];
    fireEvent.click(cancelButton);
    expect(mockSetEditModal).toHaveBeenCalledWith({ isOpen: false, property: null, selectedScreenIds: [] });
  });

  it("should trigger save when Save Changes is clicked", () => {
    const mockSave = vi.fn();
    render(
      <TableModal
        editModal={{ isOpen: true, property: mockProperty, selectedScreenIds: [1] }}
        setEditModal={vi.fn()}
        screens={mockScreens}
        handleSaveIndividualLock={mockSave}
        isPending={false}
      />
    );

    const saveButton = screen.getByRole("button", { name: "Save Changes" });
    fireEvent.click(saveButton);
    expect(mockSave).toHaveBeenCalled();
  });

  it("should trigger setEditModal when screen checkbox is toggled", () => {
    const mockSetEditModal = vi.fn();
    render(
      <TableModal
        editModal={{ isOpen: true, property: mockProperty, selectedScreenIds: [1] }}
        setEditModal={mockSetEditModal}
        screens={mockScreens}
        handleSaveIndividualLock={vi.fn()}
        isPending={false}
      />
    );

    const checkbox1 = screen.getByLabelText("Screen 1");
    const checkbox2 = screen.getByLabelText("Screen 2");

    // Toggle screen 1
    fireEvent.click(checkbox1);
    expect(mockSetEditModal).toHaveBeenCalled();

    // Toggle screen 2
    fireEvent.click(checkbox2);
    expect(mockSetEditModal).toHaveBeenCalled();
  });
});
