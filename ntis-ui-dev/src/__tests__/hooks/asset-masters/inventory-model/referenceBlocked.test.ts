import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { FormEvent } from "react";
import { createTranslator } from "next-intl";
import { toast } from "sonner";
import { mapInventoryModelApiError, isDeactivateBlocked } from "@/hooks/asset-masters/inventory-model/validation";
import { useInventoryModelForm } from "@/hooks/asset-masters/inventory-model/useInventoryModelForm";
import { useInventoryModelSubmit } from "@/hooks/asset-masters/inventory-model/useInventoryModelSubmit";
import { saveInventoryModelAction } from "@/app/[locale]/assets/configuration/master-data/inventory-model/actions";
import inventoryModelEn from "@/i18n/locales/en/inventoryModel.json";
import commonEn from "@/i18n/locales/en/common.json";

vi.mock("@/app/[locale]/assets/configuration/master-data/inventory-model/actions", () => ({
  saveInventoryModelAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

type T = (key: string, values?: Record<string, string | number | Date>) => string;
const messages = { inventoryModel: inventoryModelEn };
// The list (delete) reads the root namespace; the form (save) reads configuration.masterData.form.
const tRoot = createTranslator({ locale: "en", messages, namespace: "inventoryModel" }) as unknown as T;
const tForm = createTranslator({ locale: "en", messages, namespace: "inventoryModel.configuration.masterData.form" }) as unknown as T;
const tCommon = createTranslator({ locale: "en", messages: { common: commonEn }, namespace: "common" }) as unknown as T;

// Backend ReferenceValidationService messages (DisplayAs "Inventory Model"; unnamed references only).
const DELETE_IN_USE = "This Inventory Model cannot be deleted because it is in use.";
const DEACTIVATE_IN_USE = "This Inventory Model cannot be deactivated because it is in use.";

describe("inventory model reference-blocked messages", () => {
  it.each([DELETE_IN_USE, DEACTIVATE_IN_USE])("list (root namespace) translates %s exactly", (message) => {
    expect(mapInventoryModelApiError({ error: message }, tRoot, tCommon)).toBe(message);
  });

  it.each([DELETE_IN_USE, DEACTIVATE_IN_USE])("form (form namespace) translates %s exactly", (message) => {
    expect(mapInventoryModelApiError({ error: message }, tForm, tCommon)).toBe(message);
  });

  it("flags only deactivate messages", () => {
    expect(isDeactivateBlocked({ error: DEACTIVATE_IN_USE })).toBe(true);
    expect(isDeactivateBlocked({ error: DELETE_IN_USE })).toBe(false);
  });
});

describe("inventory model edit form deactivate blocked", () => {
  beforeEach(() => vi.clearAllMocks());

  const initial = { id: "4", name: "M1", group: "2", description: "", displayOrder: 1, isActive: false };
  const setup = () =>
    renderHook(() => {
      const form = useInventoryModelForm(initial, () => ({}));
      const submit = useInventoryModelSubmit({
        isEdit: true, locale: "en", formData: form.formData, validate: () => ({}),
        setErrors: form.setErrors, setTouched: form.setTouched, setOpen: vi.fn(), t: tForm, tCommon,
      });
      return { form, submit };
    });

  it("puts the deactivate error on errors.isActive and clears it on toggle", async () => {
    vi.mocked(saveInventoryModelAction).mockResolvedValue({ ok: false, error: DEACTIVATE_IN_USE } as never);
    const { result } = setup();

    await act(async () => {
      await result.current.submit.handleSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
    });
    expect(result.current.form.errors.isActive).toBe(DEACTIVATE_IN_USE);
    expect(toast.error).toHaveBeenCalledWith(DEACTIVATE_IN_USE);

    act(() => result.current.form.handleToggleStatus(true));
    expect(result.current.form.errors.isActive).toBeUndefined();
  });

  it("does not set errors.isActive for other save errors", async () => {
    vi.mocked(saveInventoryModelAction).mockResolvedValue({ ok: false, error: "Something else" } as never);
    const { result } = setup();
    await act(async () => {
      await result.current.submit.handleSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
    });
    expect(result.current.form.errors.isActive).toBeUndefined();
  });
});
