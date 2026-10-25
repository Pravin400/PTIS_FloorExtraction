import { vi, describe, test, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import OwningDepartmentForm from "@/components/modules/assets/configuration/master-data/owning-department/OwningDepartmentForm";
import { saveOwningDepartment } from "@/app/[locale]/assets/configuration/master-data/owning-department/action";
import { toast } from "sonner";
import type { OwningDepartment } from "@/types/asset-masters/owning-department.types";

const mockBack = vi.fn();
const mockPush = vi.fn();
const mockRefresh = vi.fn();

// Mock next-intl
vi.mock("next-intl", () => {
  const t = (key: string) => `owningDepartment.${key}`;
  t.rich = (key: string, values?: Record<string, unknown>) => {
    if (values && typeof values.b === "function") {
      (values.b as (chunks: string) => void)("bold text");
    }
    return `owningDepartment.${key}`;
  };
  return {
    useTranslations: () => t,
    useLocale: () => "en",
  };
});

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock action
vi.mock("@/app/[locale]/assets/configuration/master-data/owning-department/action", () => ({
  saveOwningDepartment: vi.fn(),
}));

describe("OwningDepartmentForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockInitialData: OwningDepartment = {
    id: 10,
    owningDepartmentName: "General Admin",
    description: "General administration municipal offices",
    isActive: true,
    createdDate: null,
    updatedDate: null,
  };

  test("renders in Create mode with empty fields", () => {
    render(<OwningDepartmentForm initialData={null} />);

    expect(screen.getByText("owningDepartment.form.addTitle")).toBeInTheDocument();
    expect(screen.getByLabelText("owningDepartment.form.fields.owningDepartmentName.label *")).toHaveValue("");
    expect(screen.getByLabelText("owningDepartment.form.fields.description.label *")).toHaveValue("");
  });

  test("renders in Edit mode with initial data prefilled", () => {
    render(<OwningDepartmentForm initialData={mockInitialData} />);

    expect(screen.getByText("owningDepartment.form.editTitle")).toBeInTheDocument();
    expect(screen.getByLabelText("owningDepartment.form.fields.owningDepartmentName.label *")).toHaveValue("General Admin");
    expect(screen.getByLabelText("owningDepartment.form.fields.description.label *")).toHaveValue("General administration municipal offices");
  });

  test("shows validation errors on empty submission", async () => {
    const { container } = render(<OwningDepartmentForm initialData={null} />);
    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("owningDepartment.form.validation.nameRequired")).toBeInTheDocument();
      expect(screen.getByText("owningDepartment.form.validation.descriptionRequired")).toBeInTheDocument();
    });
  });

  test("successfully submits form and triggers saveOwningDepartment action", async () => {
    vi.mocked(saveOwningDepartment).mockResolvedValue({ ok: true, mode: "update" });

    const { container } = render(<OwningDepartmentForm initialData={mockInitialData} />);
    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(saveOwningDepartment).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("owningDepartment.form.messages.updateSuccess");
      expect(mockPush).toHaveBeenCalledWith("/en/assets/configuration/master-data/owning-department");
    });
  });

  test("shows error toast on duplicate code/name submission", async () => {
    vi.mocked(saveOwningDepartment).mockResolvedValue({ ok: false, error: "duplicate" });

    const { container } = render(<OwningDepartmentForm initialData={mockInitialData} />);
    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("owningDepartment.apiErrors.duplicateRecord");
    });
  });
});
