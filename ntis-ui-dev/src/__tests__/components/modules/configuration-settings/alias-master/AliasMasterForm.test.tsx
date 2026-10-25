import { vi, describe, test, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AliasMasterForm from "@/components/modules/configuration-settings/alias-master/AliasMasterForm";
import { saveAliasMaster } from "@/app/[locale]/configuration-settings/alias-master/action";
import { toast } from "sonner";
import type { AliasMaster } from "@/types/alias-master.types";

const mockBack = vi.fn();
const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next-intl", () => {
  const t = (key: string) => `aliasMaster.${key}`;
  t.rich = (key: string, values?: Record<string, unknown>) => {
    if (values && typeof values.b === "function") {
      (values.b as (chunks: string) => void)("bold text");
    }
    return `aliasMaster.${key}`;
  };
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

describe("AliasMasterForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockInitialData: AliasMaster = {
    id: 47,
    aliasKey: "ALS-000047",
    keyName: "Ward_No",
    labelName: "Ward No",
    englishName: "Sector",
    regionalName: "सेक्टर",
    hindiName: "सेक्टर",
    isActive: true,
  };

  test("renders in Create mode with empty fields and no status toggle", () => {
    render(<AliasMasterForm id={null} initialData={null} />);

    expect(screen.getByText("aliasMaster.form.addTitle")).toBeInTheDocument();
    expect(screen.getByLabelText("aliasMaster.form.fields.keyName.label *")).toHaveValue("");
    expect(screen.getByLabelText("aliasMaster.form.fields.labelName.label *")).toHaveValue("");
    expect(screen.queryByText("aliasMaster.form.status.label")).not.toBeInTheDocument();
  });

  test("renders in Edit mode with initial data prefilled, status toggle, and keyName disabled", () => {
    render(<AliasMasterForm id={47} initialData={mockInitialData} />);

    expect(screen.getByText("aliasMaster.form.editTitle")).toBeInTheDocument();
    expect(screen.getByLabelText("aliasMaster.form.fields.keyName.label *")).toHaveValue("Ward_No");
    expect(screen.getByLabelText("aliasMaster.form.fields.keyName.label *")).toBeDisabled();
    expect(screen.getByLabelText("aliasMaster.form.fields.labelName.label *")).toHaveValue("Ward No");
    expect(screen.getByLabelText("aliasMaster.form.fields.englishName.label")).toHaveValue("Sector");
    expect(screen.getByText("aliasMaster.form.status.label")).toBeInTheDocument();
  });

  test("shows validation errors on empty submission in Create mode", async () => {
    const { container } = render(<AliasMasterForm id={null} initialData={null} />);

    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("aliasMaster.form.validation.keyNameRequired")).toBeInTheDocument();
      expect(screen.getByText("aliasMaster.form.validation.labelNameRequired")).toBeInTheDocument();
    });
  });

  test("does not require keyName in Edit mode", async () => {
    const { container } = render(<AliasMasterForm id={47} initialData={mockInitialData} />);

    vi.mocked(saveAliasMaster).mockResolvedValue({ ok: true, mode: "update" });
    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.queryByText("aliasMaster.form.validation.keyNameRequired")).not.toBeInTheDocument();
      expect(saveAliasMaster).toHaveBeenCalled();
    });
  });

  test("successfully submits form in Create mode and triggers saveAliasMaster", async () => {
    vi.mocked(saveAliasMaster).mockResolvedValue({ ok: true, mode: "create" });

    const { container } = render(<AliasMasterForm id={null} initialData={null} />);

    fireEvent.change(screen.getByLabelText("aliasMaster.form.fields.keyName.label *"), {
      target: { value: "Ward_No" },
    });
    fireEvent.change(screen.getByLabelText("aliasMaster.form.fields.labelName.label *"), {
      target: { value: "Ward No" },
    });

    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(saveAliasMaster).toHaveBeenCalledWith("", expect.any(FormData));
      expect(toast.success).toHaveBeenCalledWith("aliasMaster.form.messages.createSuccess");
      expect(mockPush).toHaveBeenCalledWith("/en/configuration-settings/alias-master");
    });
  });

  test("successfully submits form in Edit mode and triggers saveAliasMaster with the id", async () => {
    vi.mocked(saveAliasMaster).mockResolvedValue({ ok: true, mode: "update" });

    const { container } = render(<AliasMasterForm id={47} initialData={mockInitialData} />);
    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(saveAliasMaster).toHaveBeenCalledWith("47", expect.any(FormData));
      expect(toast.success).toHaveBeenCalledWith("aliasMaster.form.messages.updateSuccess");
    });
  });

  test("toggles the status switch in Edit mode", async () => {
    vi.mocked(saveAliasMaster).mockResolvedValue({ ok: true, mode: "update" });
    const { container } = render(<AliasMasterForm id={47} initialData={mockInitialData} />);

    const toggle = screen.getByRole("switch");
    fireEvent.click(toggle);

    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(saveAliasMaster).toHaveBeenCalled();
      const formData = vi.mocked(saveAliasMaster).mock.calls[0][1] as FormData;
      expect(formData.get("isActive")).toBe("false");
    });
  });

  test("shows error toast on duplicate keyName submission", async () => {
    vi.mocked(saveAliasMaster).mockResolvedValue({ ok: false, error: "duplicate" });

    const { container } = render(<AliasMasterForm id={47} initialData={mockInitialData} />);
    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("aliasMaster.form.messages.duplicate");
    });
  });

  test("shows custom message error toast on unknown api failure", async () => {
    vi.mocked(saveAliasMaster).mockResolvedValue({ ok: false, error: "unknown", message: "Network Timeout" });

    const { container } = render(<AliasMasterForm id={47} initialData={mockInitialData} />);
    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Network Timeout");
    });
  });

  test("shows fallback message error toast on exception", async () => {
    vi.mocked(saveAliasMaster).mockRejectedValue(new Error("Database offline"));

    const { container } = render(<AliasMasterForm id={47} initialData={mockInitialData} />);
    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Database offline");
    });
  });

  test("calls router.back when Cancel is clicked", () => {
    render(<AliasMasterForm id={47} initialData={mockInitialData} />);

    fireEvent.click(screen.getByText("aliasMaster.form.actions.cancel"));

    expect(mockBack).toHaveBeenCalled();
  });
});
