import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import assetEn from "@/i18n/locales/en/asset.json";
import commonEn from "@/i18n/locales/en/common.json";
import { useAssetCategoryForm } from "@/hooks/asset-masters/asset-category/useAssetCategoryForm";
import { saveAssetCategoryAction } from "@/app/[locale]/assets/configuration/master-data/asset-category/actions";

vi.mock("@/app/[locale]/assets/configuration/master-data/asset-category/actions", () => ({ saveAssetCategoryAction: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("next-intl", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-intl")>();
  const messages = { asset: assetEn, common: commonEn };
  return {
    ...actual,
    useLocale: () => "en",
    useTranslations: (namespace: string) => actual.createTranslator({ locale: "en", messages, namespace: namespace as never }),
  };
});

const DEACTIVATE_BLOCKED =
  "This Asset Category cannot be deactivated because it has Asset Types. Please delete all Asset Types for this Asset Category first.";

describe("useAssetCategoryForm deactivate reference error", () => {
  it("shows the deactivate error under the status toggle and clears it on toggle", async () => {
    vi.mocked(saveAssetCategoryAction).mockResolvedValue({ ok: false, error: DEACTIVATE_BLOCKED } as never);
    const { result } = renderHook(() =>
      useAssetCategoryForm({
        initialData: {
          id: "1",
          code: "CAT1",
          name: "Land",
          description: "",
          isMovable: false,
          hasFloorDetails: false,
          hasInventory: false,
          isInventoryMandatory: false,
          hasLegalCompliance: false,
          valuationType: "FIXED",
          isActive: false,
        },
      })
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: () => {} } as never);
    });
    expect(result.current.errors.isActive).toBe(DEACTIVATE_BLOCKED);

    act(() => result.current.handleToggleStatus(true));
    expect(result.current.errors.isActive).toBeFalsy();
  });
});
