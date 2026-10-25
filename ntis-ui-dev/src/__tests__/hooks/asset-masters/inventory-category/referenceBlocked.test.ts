import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { FormEvent } from "react";
import { createTranslator } from "next-intl";
import { toast } from "sonner";
import { mapInventoryCategoryApiError, isDeactivateBlocked } from "@/hooks/asset-masters/inventory-category/validation";
import { useInventoryCategoryForm } from "@/hooks/asset-masters/inventory-category/useInventoryCategoryForm";
import { useInventoryCategorySubmit } from "@/hooks/asset-masters/inventory-category/useInventoryCategorySubmit";
import { saveInventoryCategoryAction } from "@/app/[locale]/assets/configuration/master-data/inventory-category/actions";
import inventoryCategoryEn from "@/i18n/locales/en/inventoryCategory.json";
import commonEn from "@/i18n/locales/en/common.json";

vi.mock("@/app/[locale]/assets/configuration/master-data/inventory-category/actions", () => ({
  saveInventoryCategoryAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

type T = (key: string, values?: Record<string, string | number | Date>) => string;
const messages = { inventoryCategory: inventoryCategoryEn };
// The list (delete) reads the root namespace; the form (save) reads configuration.masterData.form.
const tRoot = createTranslator({ locale: "en", messages, namespace: "inventoryCategory" }) as unknown as T;
const tForm = createTranslator({ locale: "en", messages, namespace: "inventoryCategory.configuration.masterData.form" }) as unknown as T;
const tCommon = createTranslator({ locale: "en", messages: { common: commonEn }, namespace: "common" }) as unknown as T;

// Backend ReferenceValidationService messages (DisplayAs "Inventory Category").
const DELETE_IN_USE = "This Inventory Category cannot be deleted because it is in use.";
const DEACTIVATE_IN_USE = "This Inventory Category cannot be deactivated because it is in use.";
const DELETE_ONE = "This Inventory Category cannot be deleted because it has Inventory Names. Please delete all Inventory Names for this Inventory Category first.";
const DEACTIVATE_ONE = "This Inventory Category cannot be deactivated because it has Inventory Conditions. Please delete all Inventory Conditions for this Inventory Category first.";
const DELETE_TWO = "This Inventory Category cannot be deleted because it has Inventory Names and Inventory Conditions. Please delete all Inventory Names and Inventory Conditions for this Inventory Category first.";
const DEACTIVATE_TWO = "This Inventory Category cannot be deactivated because it has Inventory Names and Inventory Conditions. Please delete all Inventory Names and Inventory Conditions for this Inventory Category first.";
const ALL = [DELETE_IN_USE, DEACTIVATE_IN_USE, DELETE_ONE, DEACTIVATE_ONE, DELETE_TWO, DEACTIVATE_TWO];

describe("inventory category reference-blocked messages", () => {
  it.each(ALL)("list (root namespace) translates %s exactly", (message) => {
    expect(mapInventoryCategoryApiError({ ok: false, error: message } as never, tRoot, tCommon)).toBe(message);
  });

  it.each(ALL)("form (form namespace) translates %s exactly", (message) => {
    expect(mapInventoryCategoryApiError({ error: message }, tForm, tCommon)).toBe(message);
  });

  it("flags only deactivate messages", () => {
    expect(isDeactivateBlocked({ error: DEACTIVATE_IN_USE })).toBe(true);
    expect(isDeactivateBlocked({ error: DEACTIVATE_TWO })).toBe(true);
    expect(isDeactivateBlocked({ error: DELETE_IN_USE })).toBe(false);
    expect(isDeactivateBlocked({ error: DELETE_TWO })).toBe(false);
  });
});

describe("inventory category edit form deactivate blocked", () => {
  beforeEach(() => vi.clearAllMocks());

  it("puts the deactivate error on errors.isActive and clears it on toggle", async () => {
    vi.mocked(saveInventoryCategoryAction).mockResolvedValue({ ok: false, error: DEACTIVATE_TWO } as never);
    const initial = { id: "7", code: "IC1", name: "Cat", group: "1", depreciationRate: "0.1", displayOrder: "1", description: "", isActive: false };

    const { result } = renderHook(() => {
      const form = useInventoryCategoryForm(initial, () => ({}));
      const submit = useInventoryCategorySubmit({
        isEdit: true,
        locale: "en",
        formData: form.formData,
        validate: () => ({}),
        setErrors: form.setErrors,
        setTouched: form.setTouched,
        setOpen: vi.fn(),
        t: tForm,
        tCommon,
      });
      return { form, submit };
    });

    await act(async () => {
      await result.current.submit.handleSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
    });
    expect(result.current.form.errors.isActive).toBe(DEACTIVATE_TWO);
    expect(toast.error).toHaveBeenCalledWith(DEACTIVATE_TWO);

    act(() => result.current.form.handleToggleStatus(true));
    expect(result.current.form.errors.isActive).toBeUndefined();
  });

  it("does not set errors.isActive for other save errors", async () => {
    vi.mocked(saveInventoryCategoryAction).mockResolvedValue({ ok: false, error: "Something else" } as never);
    const initial = { id: "7", code: "IC1", name: "Cat", group: "1", depreciationRate: "0.1", displayOrder: "1", description: "", isActive: true };
    const { result } = renderHook(() => {
      const form = useInventoryCategoryForm(initial, () => ({}));
      const submit = useInventoryCategorySubmit({
        isEdit: true, locale: "en", formData: form.formData, validate: () => ({}),
        setErrors: form.setErrors, setTouched: form.setTouched, setOpen: vi.fn(), t: tForm, tCommon,
      });
      return { form, submit };
    });
    await act(async () => {
      await result.current.submit.handleSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
    });
    expect(result.current.form.errors.isActive).toBeUndefined();
  });
});
