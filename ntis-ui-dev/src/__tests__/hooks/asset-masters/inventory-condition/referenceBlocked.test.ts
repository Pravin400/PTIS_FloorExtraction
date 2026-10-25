import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { FormEvent } from "react";
import { createTranslator } from "next-intl";
import { toast } from "sonner";
import { mapInventoryConditionApiError, isDeactivateBlocked } from "@/hooks/asset-masters/inventory-condition/validation";
import { useInventoryConditionForm } from "@/hooks/asset-masters/inventory-condition/useInventoryConditionForm";
import { useInventoryConditionSubmit } from "@/hooks/asset-masters/inventory-condition/useInventoryConditionSubmit";
import { updateInventoryConditionAction } from "@/app/[locale]/assets/configuration/master-data/inventory-condition/actions";
import inventoryConditionEn from "@/i18n/locales/en/inventoryCondition.json";
import commonEn from "@/i18n/locales/en/common.json";
import type { InventoryConditionFormModel } from "@/types/asset-masters/inventory-condition.types";

vi.mock("@/app/[locale]/assets/configuration/master-data/inventory-condition/actions", () => ({
  createInventoryConditionAction: vi.fn(),
  updateInventoryConditionAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

type T = (key: string, values?: Record<string, string | number | Date>) => string;
// Both the list (delete) and the form (save) read the root "inventoryCondition" namespace.
const t = createTranslator({ locale: "en", messages: { inventoryCondition: inventoryConditionEn }, namespace: "inventoryCondition" }) as unknown as T;
const tCommon = createTranslator({ locale: "en", messages: { common: commonEn }, namespace: "common" }) as unknown as T;

// Backend ReferenceValidationService messages (AssetConditionMaster DisplayAs "Condition"; unnamed references only).
const DELETE_IN_USE = "This Condition cannot be deleted because it is in use.";
const DEACTIVATE_IN_USE = "This Condition cannot be deactivated because it is in use.";

describe("inventory condition reference-blocked messages", () => {
  it.each([DELETE_IN_USE, DEACTIVATE_IN_USE])("translates %s exactly", (message) => {
    expect(mapInventoryConditionApiError({ success: false, error: message, statusCode: 400 }, t, tCommon)).toBe(message);
  });

  it("flags only deactivate messages", () => {
    expect(isDeactivateBlocked({ error: DEACTIVATE_IN_USE })).toBe(true);
    expect(isDeactivateBlocked({ error: DELETE_IN_USE })).toBe(false);
  });
});

describe("inventory condition edit form deactivate blocked", () => {
  beforeEach(() => vi.clearAllMocks());

  const initial = {
    id: 9, conditionCategory: "Inventory", categoryId: 1, conditionName: "Good", description: "", conditionFactor: 1, displayOrder: 1, isActive: false,
  } as InventoryConditionFormModel;
  const setup = () =>
    renderHook(() => {
      const form = useInventoryConditionForm(initial, () => ({}));
      const submit = useInventoryConditionSubmit({
        isEdit: true, locale: "en", formData: form.formData, validate: () => ({}),
        setErrors: form.setErrors, setTouched: form.setTouched, setOpen: vi.fn(), t, tCommon,
      });
      return { form, submit };
    });

  it("puts the deactivate error on errors.isActive and clears it on toggle", async () => {
    vi.mocked(updateInventoryConditionAction).mockResolvedValue({ success: false, error: DEACTIVATE_IN_USE, statusCode: 400 } as never);
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
    vi.mocked(updateInventoryConditionAction).mockResolvedValue({ success: false, error: "Something else", statusCode: 400 } as never);
    const { result } = setup();
    await act(async () => {
      await result.current.submit.handleSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
    });
    expect(result.current.form.errors.isActive).toBeUndefined();
  });
});
