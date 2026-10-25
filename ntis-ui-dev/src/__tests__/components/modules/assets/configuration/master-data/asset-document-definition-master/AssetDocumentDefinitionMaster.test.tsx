/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AssetDocumentDefinitionMaster } from "@/components/modules/assets/configuration/master-data/asset-document-definition-master/AssetDocumentDefinitionMaster";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/en/assets/configuration/master-data/asset-document-definition",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("@/components/common/ConfirmProvider", () => ({
  useConfirm: () => ({ confirm: vi.fn() }),
}));

vi.mock("@/hooks/asset-masters/asset-document-definition/useAssetDocumentDefinitionList", () => ({
  useAssetDocumentDefinitionSearch: () => ({ search: "", setSearch: vi.fn() }),
  useAssetDocumentDefinitionList: () => ({ handleSort: vi.fn() }),
}));

vi.mock("@/components/common", () => ({
  PageContainer: ({ children }: any) => <div data-testid="page-container">{children}</div>,
  TableHeader: ({ title, rightContent }: any) => (
    <div data-testid="table-header">
      <div>{title}</div>
      <div>{rightContent}</div>
    </div>
  ),
  DataTable: () => <div data-testid="data-table" />,
  Input: () => <input data-testid="search-input" />,
  SearchInput: ({ value, onChange }: any) => <input data-testid="search-input" value={value || ""} onChange={(e) => onChange(e.target.value)} />,
  AddButton: ({ onClick, label }: any) => <button data-testid="add-button" onClick={onClick}>{label}</button>,
  Select: ({ value, onChange, children }: any) => <select data-testid="select-component" value={value} onChange={onChange}>{children}</select>,
  Pagination: () => <div data-testid="pagination-component" />,
}));

describe("AssetDocumentDefinitionMaster Component", () => {
  const defaultProps = {
    data: [
      {
        id: 1,
        documentCode: "DOC01",
        documentName: "Title Deed",
        description: "Property deed",
        isRequired: true,
        displayOrder: 1,
        isActive: true,
        assetCategoryId: 10,
        assetTypeId: 20,
      },
    ],
    pageNumber: 1,
    pageSize: 10,
    totalCount: 1,
    totalPages: 1,
    sortBy: "documentCode",
    sortOrder: "asc",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders master data list table and search input", () => {
    render(<AssetDocumentDefinitionMaster {...defaultProps} />);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByTestId("search-input")).toBeInTheDocument();
  });
});
