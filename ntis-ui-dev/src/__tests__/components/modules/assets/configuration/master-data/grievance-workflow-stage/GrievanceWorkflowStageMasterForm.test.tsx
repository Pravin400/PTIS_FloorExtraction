import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import GrievanceWorkflowStageMasterForm from "@/components/modules/assets/configuration/master-data/grievance-workflow-stage/GrievanceWorkflowStageMasterForm";
import * as actions from "@/app/[locale]/assets/configuration/master-data/grievance-workflow-stage/action";

const mockBack = vi.fn();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/en/assets/configuration/master-data/grievance-workflow-stage",
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => {
    const fn = (key: string) => {
      const map: Record<string, string> = {
        "form.addTitle": "Add New Workflow Stage",
        "form.editTitle": "Edit Workflow Stage",
        "form.fields.stageCode.label": "Stage Code",
        "form.fields.stageCode.placeholder": "e.g. CORRECTION",
        "form.fields.stageName.label": "Stage Name",
        "form.fields.stageName.placeholder": "e.g. Verification",
        "form.fields.stageNameLocal.label": "Stage Name (Local)",
        "form.fields.stageNameLocal.placeholder": "Local Name",
        "form.fields.stageOrder.label": "Stage Order",
        "form.fields.stageOrder.placeholder": "e.g. 1",
        "form.fields.status.label": "Stages",
        "form.fields.status.placeholder": "e.g. IN REVIEW",
        "form.fields.description.label": "Description",
        "form.fields.description.placeholder": "Optional description",
        "form.actions.save": "Create Stage",
        "form.actions.update": "Update Stage",
        "form.actions.cancel": "Cancel",
        "form.validation.fixErrors": "Please fix validation errors",
        "form.validation.stageCodeRequired": "Stage Code is required",
        "form.validation.stageNameRequired": "Stage Name is required",
        "form.validation.stageOrderRequired": "Stage Order is required",
        "form.validation.statusRequired": "Stages is required",
        "form.messages.createSuccess": "Stage created successfully",
        "form.messages.updateSuccess": "Stage updated successfully",
        "status.label": "Active Status",
      };
      return map[key] || key;
    };
    fn.rich = (key: string) => fn(key);
    return fn;
  },
}));

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
};

vi.mock("@/components/common", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useToast: () => mockToast,
  };
});

vi.mock("@/app/[locale]/assets/configuration/master-data/grievance-workflow-stage/action", () => ({
  saveGrievanceWorkflowStageMaster: vi.fn(),
}));

describe("GrievanceWorkflowStageMasterForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders form in Add mode with blank fields", () => {
    render(<GrievanceWorkflowStageMasterForm initialData={null} />);

    expect(screen.getByText("Add New Workflow Stage")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. CORRECTION")).toHaveValue("");
    expect(screen.getByPlaceholderText("e.g. Verification")).toHaveValue("");
    expect(screen.getByText("Create Stage")).toBeInTheDocument();
  });

  it("populates fields when initialData is provided in Edit mode", () => {
    const initialData = {
      id: 3,
      ulbTypeId: 1,
      ulbTypeName: "Council",
      stageCode: "APPROV",
      stageName: "Approval",
      stageNameLocal: "मंजूरी",
      stageOrder: 2,
      status: "Approved",
      description: "Approval stage",
      isActive: true,
      createdDate: null,
      updatedDate: null,
      createdBy: null,
      updatedBy: null,
    };

    render(<GrievanceWorkflowStageMasterForm initialData={initialData} />);

    expect(screen.getByText("Edit Workflow Stage")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. CORRECTION")).toHaveValue("APPROV");
    expect(screen.getByPlaceholderText("e.g. Verification")).toHaveValue("Approval");
    expect(screen.getByPlaceholderText("e.g. 1")).toHaveValue(2);
    expect(screen.getByText("Update Stage")).toBeInTheDocument();
  });

  it("shows validation error toast on submit when required fields are empty", async () => {
    const { container } = render(<GrievanceWorkflowStageMasterForm initialData={null} />);

    const form = container.querySelector("form#grievance-workflow-stage-form")!;
    fireEvent.submit(form);

    expect(mockToast.error).toHaveBeenCalledWith("Please fix validation errors");
    expect(actions.saveGrievanceWorkflowStageMaster).not.toHaveBeenCalled();
  });

  it("calls saveGrievanceWorkflowStageMaster and shows success toast on valid submission", async () => {
    vi.mocked(actions.saveGrievanceWorkflowStageMaster).mockResolvedValue({
      success: true,
      ok: true,
      mode: "create",
    });

    const { container } = render(<GrievanceWorkflowStageMasterForm initialData={null} />);

    fireEvent.change(screen.getByPlaceholderText("e.g. CORRECTION"), {
      target: { name: "stageCode", value: "INIT" },
    });
    fireEvent.change(screen.getByPlaceholderText("e.g. Verification"), {
      target: { name: "stageName", value: "Initiated" },
    });
    fireEvent.change(screen.getByPlaceholderText("e.g. 1"), {
      target: { name: "stageOrder", value: "1" },
    });
    fireEvent.change(screen.getByPlaceholderText("e.g. IN REVIEW"), {
      target: { name: "status", value: "Initiated" },
    });

    const form = container.querySelector("form#grievance-workflow-stage-form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(actions.saveGrievanceWorkflowStageMaster).toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalledWith("Stage created successfully");
    });
  });
});
