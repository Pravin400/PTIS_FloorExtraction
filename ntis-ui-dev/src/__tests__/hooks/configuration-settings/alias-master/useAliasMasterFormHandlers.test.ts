import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAliasMasterFormHandlers } from "@/hooks/configuration-settings/alias-master/useAliasMasterFormHandlers";
import { saveAliasMaster } from "@/app/[locale]/configuration-settings/alias-master/action";
import { toast } from "sonner";
import type { AliasMasterFormModel } from "@/types/alias-master.types";

const mockPush = vi.fn();
const mockBack = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/app/[locale]/configuration-settings/alias-master/action", () => ({
  saveAliasMaster: vi.fn(),
}));

const initialFormData: AliasMasterFormModel = {
  id: null,
  keyName: "",
  labelName: "",
  englishName: "",
  regionalName: "",
  hindiName: "",
  isActive: true,
};

interface SetupOverrides {
  formData?: AliasMasterFormModel;
  isEdit?: boolean;
  validate?: (data: AliasMasterFormModel) => Partial<Record<keyof AliasMasterFormModel, string>>;
}

function setup(overrides?: SetupOverrides) {
  const setFormData = vi.fn();
  const setTouched = vi.fn();
  const setErrors = vi.fn();
  const setIsSubmitting = vi.fn();
  const setSubmittedOnce = vi.fn();
  const setOpen = vi.fn();
  const validate = overrides?.validate ?? vi.fn(() => ({}) as Partial<Record<keyof AliasMasterFormModel, string>>);
  const t = (key: string) => key;

  const props = {
    formData: overrides?.formData ?? initialFormData,
    setFormData,
    setTouched,
    setErrors,
    setIsSubmitting,
    setSubmittedOnce,
    setOpen,
    validate,
    isEdit: overrides?.isEdit ?? false,
    locale: "en",
    t,
    initialFormData,
  };

  const { result } = renderHook(() => useAliasMasterFormHandlers(props));
  return { result, setFormData, setTouched, setErrors, setIsSubmitting, setSubmittedOnce, setOpen, validate };
}

describe("useAliasMasterFormHandlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("handleChange", () => {
    it("sanitizes keyName by stripping disallowed characters and clamping to 50 chars", () => {
      const { result, setFormData } = setup();

      act(() => {
        result.current.handleChange({
          target: { name: "keyName", value: "Ward@No!!" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      const updater = setFormData.mock.calls[0][0];
      expect(updater({ ...initialFormData })).toEqual({ ...initialFormData, keyName: "WardNo" });
    });

    it("sanitizes labelName and clamps to 100 chars", () => {
      const { result, setFormData } = setup();
      const longValue = "A".repeat(150);

      act(() => {
        result.current.handleChange({
          target: { name: "labelName", value: longValue },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      const updater = setFormData.mock.calls[0][0];
      const updated = updater({ ...initialFormData }) as AliasMasterFormModel;
      expect(updated.labelName).toHaveLength(100);
    });

    it("sanitizes multilingual name fields and clamps to 100 chars", () => {
      const { result, setFormData } = setup();

      act(() => {
        result.current.handleChange({
          target: { name: "regionalName", value: "सेक्टर@#$" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      const updater = setFormData.mock.calls[0][0];
      const updated = updater({ ...initialFormData }) as AliasMasterFormModel;
      expect(updated.regionalName).toBe("सेक्टर");
    });

    it("clears the error for the changed field", () => {
      const { result, setErrors } = setup();

      act(() => {
        result.current.handleChange({
          target: { name: "labelName", value: "Ward No" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      const errorUpdater = setErrors.mock.calls[0][0];
      expect(errorUpdater({ labelName: "Required" })).toEqual({ labelName: "" });
    });
  });

  describe("handleBlur", () => {
    it("marks the field as touched and sets an error when validation fails", () => {
      const validate = vi.fn(() => ({ labelName: "Required" }));
      const { result, setTouched, setErrors } = setup({ validate });

      act(() => {
        result.current.handleBlur({
          target: { name: "labelName", value: "" },
        } as React.FocusEvent<HTMLInputElement>);
      });

      const touchedUpdater = setTouched.mock.calls[0][0];
      expect(touchedUpdater({})).toEqual({ labelName: true });

      const errorsUpdater = setErrors.mock.calls[0][0];
      expect(errorsUpdater({})).toEqual({ labelName: "Required" });
    });

    it("clears a previously set error when validation now passes", () => {
      const validate = vi.fn(() => ({}));
      const { result, setErrors } = setup({ validate });

      act(() => {
        result.current.handleBlur({
          target: { name: "labelName", value: "Ward No" },
        } as React.FocusEvent<HTMLInputElement>);
      });

      const errorsUpdater = setErrors.mock.calls[0][0];
      expect(errorsUpdater({ labelName: "Required" })).toEqual({});
    });
  });

  describe("handleSubmit", () => {
    it("blocks submission and shows a toast when validation fails", async () => {
      const validate = vi.fn(() => ({ labelName: "Required" }));
      const { result } = setup({ validate });

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
      });

      expect(saveAliasMaster).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith("form.validation.fixErrors");
    });

    it("calls saveAliasMaster with an empty id when creating", async () => {
      vi.mocked(saveAliasMaster).mockResolvedValue({ ok: true, mode: "create" });
      const { result, setOpen } = setup({
        formData: { ...initialFormData, keyName: "Ward_No", labelName: "Ward No" },
        isEdit: false,
      });

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
      });

      expect(saveAliasMaster).toHaveBeenCalledWith("", expect.any(FormData));
      expect(toast.success).toHaveBeenCalledWith("form.messages.createSuccess");
      expect(setOpen).toHaveBeenCalledWith(false);
      expect(mockPush).toHaveBeenCalledWith("/en/configuration-settings/alias-master");
    });

    it("calls saveAliasMaster with the record id when editing", async () => {
      vi.mocked(saveAliasMaster).mockResolvedValue({ ok: true, mode: "update" });
      const { result } = setup({
        formData: { ...initialFormData, id: 47, keyName: "Ward_No", labelName: "Ward No" },
        isEdit: true,
      });

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
      });

      expect(saveAliasMaster).toHaveBeenCalledWith("47", expect.any(FormData));
      expect(toast.success).toHaveBeenCalledWith("form.messages.updateSuccess");
    });

    it("shows a duplicate-specific error toast", async () => {
      vi.mocked(saveAliasMaster).mockResolvedValue({ ok: false, error: "duplicate" });
      const { result } = setup({
        formData: { ...initialFormData, keyName: "Ward_No", labelName: "Ward No" },
      });

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
      });

      expect(toast.error).toHaveBeenCalledWith("form.messages.duplicate");
    });

    it("shows the server-provided message on an unknown API error", async () => {
      vi.mocked(saveAliasMaster).mockResolvedValue({ ok: false, error: "unknown", message: "Network Timeout" });
      const { result } = setup({
        formData: { ...initialFormData, keyName: "Ward_No", labelName: "Ward No" },
      });

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
      });

      expect(toast.error).toHaveBeenCalledWith("Network Timeout");
    });

    it("falls back to the exception message when saveAliasMaster throws", async () => {
      vi.mocked(saveAliasMaster).mockRejectedValue(new Error("Database offline"));
      const { result } = setup({
        formData: { ...initialFormData, keyName: "Ward_No", labelName: "Ward No" },
      });

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
      });

      expect(toast.error).toHaveBeenCalledWith("Database offline");
    });
  });

  describe("handleClose / handleClear", () => {
    it("closes the drawer and navigates back", () => {
      const { result, setOpen } = setup();

      act(() => {
        result.current.handleClose();
      });

      expect(setOpen).toHaveBeenCalledWith(false);
      expect(mockBack).toHaveBeenCalled();
    });

    it("resets formData, errors, touched, and submittedOnce", () => {
      const { result, setFormData, setErrors, setTouched, setSubmittedOnce } = setup();

      act(() => {
        result.current.handleClear();
      });

      expect(setFormData).toHaveBeenCalledWith({ ...initialFormData });
      expect(setErrors).toHaveBeenCalledWith({});
      expect(setTouched).toHaveBeenCalledWith({});
      expect(setSubmittedOnce).toHaveBeenCalledWith(false);
    });
  });
});
