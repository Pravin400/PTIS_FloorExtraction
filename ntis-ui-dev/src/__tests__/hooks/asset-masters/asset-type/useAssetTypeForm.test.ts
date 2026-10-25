import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import assetEn from "@/i18n/locales/en/asset.json";
import commonEn from "@/i18n/locales/en/common.json";
import { useAssetTypeForm } from "@/hooks/asset-masters/asset-type/useAssetTypeForm";
import { saveAssetTypeAction } from "@/app/[locale]/assets/configuration/master-data/asset-type/actions";

vi.mock("@/app/[locale]/assets/configuration/master-data/asset-type/actions", () => ({ saveAssetTypeAction: vi.fn() }));
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
  "This Asset Type cannot be deactivated because it has Asset Room Types. Please delete all Asset Room Types for this Asset Type first.";

describe("useAssetTypeForm deactivate reference error", () => {
  it("shows the deactivate error under the status toggle and clears it on toggle", async () => {
    vi.mocked(saveAssetTypeAction).mockResolvedValue({ ok: false, error: DEACTIVATE_BLOCKED } as never);
    const { result } = renderHook(() =>
      useAssetTypeForm({
        initialData: {
          id: "1",
          code: "TYPE1",
          name: "Building",
          typeNameLocal: "",
          group: "1",
          allowUnitRegistration: true,
          allowRoomRegistration: false,
          isSubUnit: false,
          description: "",
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
