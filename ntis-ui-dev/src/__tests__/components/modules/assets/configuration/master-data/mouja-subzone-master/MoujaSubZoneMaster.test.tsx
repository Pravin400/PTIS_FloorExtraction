import { vi, describe, test, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MoujaSubZoneMaster } from "@/components/modules/assets/configuration/master-data/mouja-subzone-master/MoujaSubZoneMaster";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

vi.mock("@/components/common/ConfirmProvider", () => ({
  useConfirm: () => ({ confirm: vi.fn() }),
}));

describe("MoujaSubZoneMaster Component", () => {
  const mockProps = {
    moujas: [
      { id: 1, moujaNo: "MJ-001", moujaName: "Akola", isActive: true, createdDate: "2026-01-01", updatedDate: null },
      { id: 2, moujaNo: "MJ-002", moujaName: "Pune", isActive: false, createdDate: "2026-01-01", updatedDate: null },
    ],
    subZones: [
      { id: 10, subZoneNo: "SZ-01", subZoneName: "SubZone 1", moujaId: 1, moujaName: "Akola", isActive: true, createdDate: "2026-01-01", updatedDate: null },
    ],
    moujaTotalCount: 2,
    subZoneTotalCount: 1,
    moujaPageNumber: 1,
    subZonePageNumber: 1,
    moujaPageSize: 10,
    subZonePageSize: 10,
    moujaTotalPages: 1,
    subZoneTotalPages: 1,
    selectedMoujaId: "1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders Mouja and SubZone titles and headers", () => {
    render(<MoujaSubZoneMaster {...mockProps} />);

    expect(screen.getByText("list.title")).toBeInTheDocument();
    expect(screen.getByText("list.moujaTitle")).toBeInTheDocument();
    expect(screen.getByText("list.subZoneTitle")).toBeInTheDocument();
  });

  test("renders Mouja table data", () => {
    render(<MoujaSubZoneMaster {...mockProps} />);

    expect(screen.getByText("Akola")).toBeInTheDocument();
    expect(screen.getByText("MJ-001")).toBeInTheDocument();
  });

  test("renders SubZone table data for selected Mouja", () => {
    render(<MoujaSubZoneMaster {...mockProps} />);

    expect(screen.getByText("SubZone 1")).toBeInTheDocument();
    expect(screen.getByText("SZ-01")).toBeInTheDocument();
  });

  test("auto-corrects out-of-bounds page numbers (< 1) by calling router push", () => {
    const invalidProps = {
      ...mockProps,
      moujaPageNumber: 0,
      subZonePageNumber: -2,
    };
    render(<MoujaSubZoneMaster {...invalidProps} />);

    expect(screen.getByText("list.title")).toBeInTheDocument();
    expect(mockPush).toHaveBeenCalled();
  });

  test("uses selectedMoujaId when updating subZone pagination even if searchParams has no moujaId", () => {
    const props = {
      ...mockProps,
      selectedMoujaId: "1",
      subZoneTotalCount: 25,
      subZoneTotalPages: 3,
    };
    render(<MoujaSubZoneMaster {...props} />);

    const selectElements = screen.getAllByRole("combobox");
    const subZonePageSizeSelect = selectElements[selectElements.length - 1];
    
    // Change page size
    subZonePageSizeSelect?.dispatchEvent(new Event("change", { bubbles: true }));
    expect(mockPush).toHaveBeenCalled();
  });
});
