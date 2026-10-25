import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import { ConnectionTypeForm } from "@/components/modules/water-bill/connection-type-master/ConnectionTypeForm";
import { toast } from "sonner";

const mockRouterPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
  usePathname: () => "/en/water-bill/connection-type-master",
}));

vi.mock("next-intl", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-intl")>();
  return {
    ...actual,
    useLocale: () => "en",
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/app/[locale]/water-bill/connection-type-master/actions", () => ({
  createConnectionTypeAction: vi.fn(),
  updateConnectionTypeAction: vi.fn(),
  getConnectionTypePagedAction: vi.fn().mockResolvedValue({ items: [] }),
}));

import {
  createConnectionTypeAction,
  updateConnectionTypeAction,
} from "@/app/[locale]/water-bill/connection-type-master/actions";

const mockCreateAction = vi.mocked(createConnectionTypeAction);
const mockUpdateAction = vi.mocked(updateConnectionTypeAction);

const mockMessages = {
  connectionTypeMaster: {
    connectionType: {
      drawer: {
        addTitle: "Add Connection Type",
        addSubtitle: "Create a new connection type",
        editTitle: "Edit Connection Type",
        editSubtitle: "Update connection type details",
      },
      form: {
        connectionTypeCode: {
          label: "Connection Type Code",
          placeholder: "e.g., RES",
        },
        connectionType: {
          label: "Connection Type",
          placeholder: "e.g., Residential",
        },
        description: {
          label: "Description",
          placeholder: "e.g., Standard home connection",
        },
        isActive: {
          label: "Active Status",
        },
        activeStatusTitle: "Active Status",
        connectionStatusTitle: "Connection Status",
        activeStatusOn: "Active - Connection is enabled",
        activeStatusOff: "Inactive - Connection is disabled",
      },
      validation: {
        connectionTypeCodeRequired: "Connection Type Code is required",
        connectionTypeCodeLength: "Code cannot exceed 30 characters",
        connectionTypeRequired: "Connection Type is required",
        connectionTypeLength: "Connection Type cannot exceed 100 characters",
        descriptionRequired: "Description is required",
        descriptionLength: "Description cannot exceed 300 characters",
      },
      messages: {
        createSuccess: "Connection Type created successfully",
        updateSuccess: "Connection Type updated successfully",
        createError: "Failed to create connection type",
        updateError: "Failed to update connection type",
        duplicateError: "A record with the same details already exists.",
        duplicateCodeError: "Connection Type Code already exists.",
        duplicateNameError: "Connection Type already exists.",
      },
    },
  },
  common: {
    buttons: {
      cancel: "Cancel",
      save: "Save",
      update: "Update",
    },
    note: {
      mandatory: "Indicates mandatory fields",
    },
    errors: {
      generic: "An error occurred",
    },
    status: {
      active: "Active",
      inactive: "Inactive",
    },
  },
};

describe("ConnectionTypeForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Add Connection Type drawer when id is null", () => {
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <ConnectionTypeForm id={null} />
      </NextIntlClientProvider>
    );

    expect(screen.getByText("Add Connection Type")).toBeInTheDocument();
    expect(screen.getByText("Create a new connection type")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g., RES")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g., Residential")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g., Standard home connection")).toBeInTheDocument();
  });

  it("renders Edit Connection Type drawer when id is provided", () => {
    const initialData = {
      id: 1,
      connectionTypeCode: "IND",
      connectionType: "Industrial",
      description: "Heavy manufacturing",
      isActive: true,
      createdBy: 1,
      updatedBy: 1,
    };

    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <ConnectionTypeForm id={1} initialData={initialData} />
      </NextIntlClientProvider>
    );

    expect(screen.getByText("Edit Connection Type")).toBeInTheDocument();
    expect(screen.getByText("Update connection type details")).toBeInTheDocument();
    expect(screen.getByDisplayValue("IND")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Industrial")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Heavy manufacturing")).toBeInTheDocument();
  });

  it("shows validation error messages when submitting empty form", async () => {
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <ConnectionTypeForm id={null} />
      </NextIntlClientProvider>
    );

    const submitBtn = screen.getByRole("button", { name: "Save" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Connection Type Code is required")).toBeInTheDocument();
      expect(screen.getByText("Connection Type is required")).toBeInTheDocument();
    });
  });

  it("displays friendly toast error and does not pollute input sections when duplicate record error occurs", async () => {
    mockCreateAction.mockResolvedValueOnce({
      success: false,
      statusCode: 409,
      error: "A record with the same details already exists.",
    });

    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <ConnectionTypeForm id={null} />
      </NextIntlClientProvider>
    );

    const codeInput = screen.getByPlaceholderText("e.g., RES");
    const typeInput = screen.getByPlaceholderText("e.g., Residential");
    const descInput = screen.getByPlaceholderText("e.g., Standard home connection");

    fireEvent.change(codeInput, { target: { value: "RES" } });
    fireEvent.change(typeInput, { target: { value: "Residential" } });
    fireEvent.change(descInput, { target: { value: "Duplicate test" } });

    const submitBtn = screen.getByRole("button", { name: "Save" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateAction).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith("A record with the same details already exists.");
    });
  });

  it("creates a connection type and closes drawer on valid submit", async () => {
    mockCreateAction.mockResolvedValueOnce({
      success: true,
      data: { id: 3, connectionTypeCode: "COMM", connectionType: "Commercial", description: "Offices", isActive: true },
    });

    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <ConnectionTypeForm id={null} />
      </NextIntlClientProvider>
    );

    const codeInput = screen.getByPlaceholderText("e.g., RES");
    const typeInput = screen.getByPlaceholderText("e.g., Residential");
    const descInput = screen.getByPlaceholderText("e.g., Standard home connection");

    fireEvent.change(codeInput, { target: { value: "COMM" } });
    fireEvent.change(typeInput, { target: { value: "Commercial" } });
    fireEvent.change(descInput, { target: { value: "Offices and shops" } });

    const submitBtn = screen.getByRole("button", { name: "Save" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateAction).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionTypeCode: "COMM",
          connectionType: "Commercial",
          description: "Offices and shops",
          isActive: true,
        })
      );
      expect(toast.success).toHaveBeenCalledWith("Connection Type created successfully");
      expect(mockRouterPush).toHaveBeenCalledWith("/en/water-bill/connection-type-master");
    });
  });

  it("updates an existing connection type on valid edit submit", async () => {
    mockUpdateAction.mockResolvedValueOnce({
      success: true,
      data: { id: 1, connectionTypeCode: "RES-NEW", connectionType: "Residential VIP", description: "Updated", isActive: false },
    });

    const initialData = {
      id: 1,
      connectionTypeCode: "RES",
      connectionType: "Residential",
      description: "Standard",
      isActive: true,
    };

    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <ConnectionTypeForm id={1} initialData={initialData} />
      </NextIntlClientProvider>
    );

    const codeInput = screen.getByDisplayValue("RES");
    fireEvent.change(codeInput, { target: { value: "RESNEW" } });

    const typeInput = screen.getByDisplayValue("Residential");
    fireEvent.change(typeInput, { target: { value: "Residential VIP" } });

    const submitBtn = screen.getByRole("button", { name: "Update" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockUpdateAction).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          connectionTypeCode: "RESNEW",
          connectionType: "Residential VIP",
          description: "Standard",
          isActive: true,
        })
      );
      expect(toast.success).toHaveBeenCalledWith("Connection Type updated successfully");
      expect(mockRouterPush).toHaveBeenCalledWith("/en/water-bill/connection-type-master");
    });
  });
});
