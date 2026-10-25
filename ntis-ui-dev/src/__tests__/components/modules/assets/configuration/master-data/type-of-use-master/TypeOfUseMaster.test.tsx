import { vi, describe, test, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TypeOfUseMaster } from "@/components/modules/assets/configuration/master-data/type-of-use-master/TypeOfUseMaster";

vi.mock("next-intl", () => {
  const t = (key: string) => `typeofuse.${key}`;
  return {
    useTranslations: () => t,
    useLocale: () => "en",
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/hooks/asset-masters/type-of-use/useTypeOfUseMasterState", () => ({
  useTypeOfUseMasterState: () => ({
    t: (key: string, def?: { default: string }) => def?.default || `typeofuse.${key}`,
    tCommon: (key: string, def?: { default: string }) => def?.default || `common.${key}`,
    typeSearch: "",
    subTypeSearch: "",
    handleGroupSelect: vi.fn(),
    handleRowClick: vi.fn(),
    handleAddGroup: vi.fn(),
    handleEditGroup: vi.fn(),
    handleDeleteGroup: vi.fn(),
    handleAddType: vi.fn(),
    handleEditType: vi.fn(),
    handleDeleteType: vi.fn(),
    handleAddSubtype: vi.fn(),
    handleEditSubtype: vi.fn(),
    handleDeleteSubtype: vi.fn(),
    pushUrl: vi.fn(),
    setTypeSearch: vi.fn(),
    setSubTypeSearch: vi.fn(),
  }),
}));

describe("TypeOfUseMaster Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should render the Type of Use master screen correctly", () => {
    const props = {
      groups: [],
      selectedGroupId: null,
      selectedTypeOfUseId: null,
      groupPageNumber: 1,
      groupPageSize: 10,
      groupTotalCount: 0,
      groupTotalPages: 0,
      types: [],
      typePageNumber: 1,
      typePageSize: 10,
      typeTotalCount: 0,
      typeTotalPages: 0,
      subtypes: [],
      subTypePageNumber: 1,
      subTypePageSize: 10,
      subTypeTotalCount: 0,
      subTypeTotalPages: 0,
      editId: null,
      categories: [],
      dropdownGroups: [],
      typeOfUses: [],
    };

    render(<TypeOfUseMaster {...props} />);

    // Check for table header title fallback or keys
    expect(screen.getByText("Type of Use Master")).toBeInTheDocument();
  });
});
