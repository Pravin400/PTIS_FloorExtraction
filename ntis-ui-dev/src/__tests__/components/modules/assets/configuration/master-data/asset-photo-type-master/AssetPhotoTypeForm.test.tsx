import { vi, describe, test, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AssetPhotoTypeForm from "@/components/modules/assets/configuration/master-data/asset-photo-type-master/AssetPhotoTypeForm";

const mockBack = vi.fn();
const mockPush = vi.fn();
const mockRefresh = vi.fn();

const mockHandleSubmit = vi.fn((e) => e.preventDefault());
const mockHandleCancel = vi.fn();
const mockHandleChange = vi.fn();
const mockHandleBlur = vi.fn();
const mockHandleSelectChange = vi.fn();
const mockHandleToggleStatus = vi.fn();

vi.mock("next-intl", () => {
  const t = (key: string) => `assetPhotoType.${key}`;
  return {
    useTranslations: () => t,
    useLocale: () => "en",
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
    refresh: mockRefresh,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/hooks/asset-masters/assetphototype/useAssetPhotoForm", () => ({
  useAssetPhotoForm: () => ({
    formData: {
      photoTypeCode: "TEST_CODE",
      photoTypeName: "Test Name",
      description: "Test description",
      isActive: true,
      displayOrder: 1,
      assetCategoryId: 1,
      assetTypeId: 1,
      isRequired: true,
      isSubUnit: false,
    },
    displayOrderValue: "1",
    errors: {},
    isSubmitting: false,
    isActive: true,
    open: true,
    handleChange: mockHandleChange,
    handleBlur: mockHandleBlur,
    handleSelectChange: mockHandleSelectChange,
    handleSubmit: mockHandleSubmit,
    handleToggleStatus: mockHandleToggleStatus,
    handleCancel: mockHandleCancel,
    showError: () => false,
    t: (key: string) => `assetPhotoType.${key}`,
    tCommon: (key: string) => `common.${key}`,
    isEdit: false,
  }),
}));

describe("AssetPhotoTypeForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should render form elements correctly and respond to interaction", () => {
    const categories = [{ id: 1, name: "Building" }];
    const assetTypes = [{ id: 1, name: "Structure" }];

    render(<AssetPhotoTypeForm id={null} categories={categories} types={assetTypes} />);

    expect(screen.getByLabelText("assetPhotoType.form.fields.photoTypeCode.label", { exact: false })).toBeInTheDocument();
    expect(screen.getByLabelText("assetPhotoType.form.fields.photoTypeName.label", { exact: false })).toBeInTheDocument();

    const saveButton = screen.getByRole("button", { name: /assetPhotoType.form.actions.save/i });
    expect(saveButton).toBeInTheDocument();
    fireEvent.click(saveButton);
    expect(mockHandleSubmit).toHaveBeenCalled();

    const cancelButton = screen.getByRole("button", { name: /common.buttons.cancel/i });
    expect(cancelButton).toBeInTheDocument();
    fireEvent.click(cancelButton);
    expect(mockHandleCancel).toHaveBeenCalled();
  });
});
