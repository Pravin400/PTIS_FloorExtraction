import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { FormEvent } from "react";
import { createTranslator } from "next-intl";
import { toast } from "sonner";
import { mapInventoryNameApiError, isDeactivateBlocked } from "@/hooks/asset-masters/inventory-name/validation";
import { useInventoryNameForm } from "@/hooks/asset-masters/inventory-name/useInventoryNameForm";
import { useInventoryNameSubmit } from "@/hooks/asset-masters/inventory-name/useInventoryNameSubmit";
import { updateInventoryNameAction } from "@/app/[locale]/assets/configuration/master-data/inventory-name/actions";
import inventoryNameEn from "@/i18n/locales/en/inventoryName.json";
import commonEn from "@/i18n/locales/en/common.json";
import type { InventoryNameFormModel } from "@/types/asset-masters/inventory-name.types";

vi.mock("@/app/[locale]/assets/configuration/master-data/inventory-name/actions", () => ({
  createInventoryNameAction: vi.fn(),
  updateInventoryNameAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

type T = (key: string, values?: Record<string, string | number | Date>) => string;
// Both the list (delete) and the form (save) read the root "inventoryName" namespace.
const t = createTranslator({ locale: "en", messages: { inventoryName: inventoryNameEn }, namespace: "inventoryName" }) as unknown as T;
const tCommon = createTranslator({ locale: "en", messages: { common: commonEn }, namespace: "common" }) as unknown as T;

// Backend ReferenceValidationService messages (DisplayAs "Inventory Name"; only child master: "Inventory Models").
const DELETE_IN_USE = "This Inventory Name cannot be deleted because it is in use.";
const DEACTIVATE_IN_USE = "This Inventory Name cannot be deactivated because it is in use.";
const DELETE_MODELS = "This Inventory Name cannot be deleted because it has Inventory Models. Please delete all Inventory Models for this Inventory Name first.";
const DEACTIVATE_MODELS = "This Inventory Name cannot be deactivated because it has Inventory Models. Please delete all Inventory Models for this Inventory Name first.";

describe("inventory name reference-blocked messages", () => {
  it.each([DELETE_IN_USE, DEACTIVATE_IN_USE, DELETE_MODELS, DEACTIVATE_MODELS])("translates %s exactly", (message) => {
    expect(mapInventoryNameApiError({ success: false, error: message }, t, tCommon)).toBe(message);
  });

  it("flags only deactivate messages", () => {
    expect(isDeactivateBlocked({ error: DEACTIVATE_IN_USE })).toBe(true);
    expect(isDeactivateBlocked({ error: DEACTIVATE_MODELS })).toBe(true);
    expect(isDeactivateBlocked({ error: DELETE_IN_USE })).toBe(false);
    expect(isDeactivateBlocked({ error: DELETE_MODELS })).toBe(false);
  });
});

describe("inventory name edit form deactivate blocked", () => {
  beforeEach(() => vi.clearAllMocks());

  const initial = {
    id: 3, inventoryItemCategoryId: 1, subTypeCode: "IN1", subTypeName: "Chair", displayOrder: 1, description: "", isActive: false,
  } as unknown as InventoryNameFormModel;

  const setup = () =>
    renderHook(() => {
      const form = useInventoryNameForm(initial, () => ({}));
      const submit = useInventoryNameSubmit({
        isEdit: true, locale: "en", formData: form.formData, validate: () => ({}),
        setErrors: form.setErrors, setTouched: form.setTouched, setOpen: vi.fn(), t, tCommon,
      });
      return { form, submit };
    });

  it("puts the deactivate error on errors.isActive and clears it on toggle", async () => {
    vi.mocked(updateInventoryNameAction).mockResolvedValue({ success: false, error: DEACTIVATE_MODELS, statusCode: 400 } as never);
    const { result } = setup();

    await act(async () => {
      await result.current.submit.handleSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
    });
    expect(result.current.form.errors.isActive).toBe(DEACTIVATE_MODELS);
    expect(toast.error).toHaveBeenCalledWith(DEACTIVATE_MODELS);

    act(() => result.current.form.handleToggleStatus(true));
    expect(result.current.form.errors.isActive).toBeUndefined();
  });

  it("does not set errors.isActive for other save errors", async () => {
    vi.mocked(updateInventoryNameAction).mockResolvedValue({ success: false, error: "Something else", statusCode: 400 } as never);
    const { result } = setup();
    await act(async () => {
      await result.current.submit.handleSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
    });
    expect(result.current.form.errors.isActive).toBeUndefined();
  });
});
