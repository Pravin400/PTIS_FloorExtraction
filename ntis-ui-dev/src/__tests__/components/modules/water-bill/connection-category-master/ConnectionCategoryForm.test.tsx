import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import { ConnectionCategoryForm } from "@/components/modules/water-bill/connection-category-master/ConnectionCategoryForm";
import type { ConnectionCategory, BillingFrequencyOption } from "@/types/waterBill/connectionCategoryMaster.types";
import { toast } from "sonner";

const mockRouterPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useSearchParams: () => new URLSearchParams(""),
  usePathname: () => "/en/water-bill/connection-category-master/add",
}));

vi.mock("next-intl", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-intl")>();
  return { ...actual, useLocale: () => "en" };
});

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/app/[locale]/water-bill/connection-category-master/actions", () => ({
  createConnectionCategoryAction: vi.fn(),
  updateConnectionCategoryAction: vi.fn(),
  getConnectionCategoryPagedAction: vi.fn().mockResolvedValue({ items: [] }),
}));

import {
  updateConnectionCategoryAction,
} from "@/app/[locale]/water-bill/connection-category-master/actions";
const mockUpdateAction = vi.mocked(updateConnectionCategoryAction);

const mockMessages = {
  connectionCategoryMaster: {
    connectionCategory: {
      drawer: {
        addTitle: "Add Connection Category", editTitle: "Edit Connection Category",
        addSubtitle: "Create a new category", editSubtitle: "Update category details",
        cancel: "Cancel", save: "Save",
      },
      form: {
        connectionCategoryCode: { label: "Connection Category Code", placeholder: "e.g., REGULAR" },
        connectionCategory: { label: "Connection Category", placeholder: "e.g., Regular Metered" },
        billingFrequencyId: { label: "Billing Frequency", placeholder: "Select Billing Frequency..." },
        isMetered: { label: "Metered Connection" },
        meteredStatusTitle: "Metered Status", meteredStatusOn: "Metered", meteredStatusOff: "Non-Metered",
        billingMethod: { label: "Billing Method", placeholder: "Select Billing Method..." },
        description: { label: "Description", placeholder: "e.g., Standard quarterly metered" },
        isActive: { label: "Active Status" },
        activeStatusTitle: "Category Status", activeStatusOn: "Active", activeStatusOff: "Inactive",
      },
      billingMethods: {
        Metered: "Metered",
        Slab: "Slab",
        Telescopic: "Telescopic",
        Hybrid: "Hybrid",
        Flat: "Flat",
        Fixed: "Fixed",
        Annual: "Annual",
      },
      validation: {
        connectionCategoryCodeRequired: "Connection Category Code is required",
        connectionCategoryRequired: "Connection Category is required",
        billingFrequencyRequired: "Please select a billing frequency",
      },
      messages: { updateSuccess: "Connection Category updated successfully" },
    },
  },
  common: {
    buttons: { save: "Save", update: "Save Changes", cancel: "Cancel" },
    note: { mandatory: "* Indicates mandatory fields" },
    errors: { generic: "An error occurred" },
    status: {
      active: "Active",
      inactive: "Inactive",
    },
  },
};

const mockBillingFrequencies: BillingFrequencyOption[] = [
  { id: 1, billingFrequencyCode: "MONTHLY", billingFrequency: "Monthly" },
  { id: 2, billingFrequencyCode: "QUARTERLY", billingFrequency: "Quarterly" },
];

const mockInitialData: ConnectionCategory = {
  id: 1, connectionCategoryCode: "REGULAR", connectionCategory: "Regular Metered",
  billingFrequencyId: 2, billingFrequencyCode: "QUARTERLY", billingFrequency: "Quarterly",
  isMetered: true, billingMethod: "Metered", description: "Standard metered connection", isActive: true,
};

describe("ConnectionCategoryForm Component", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  const renderComponent = (props: {
    id: number | null;
    initialData?: ConnectionCategory;
    billingFrequencies?: BillingFrequencyOption[];
  }) =>
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <ConnectionCategoryForm {...props} />
      </NextIntlClientProvider>
    );

  it("renders Add Drawer titles and empty fields", () => {
    renderComponent({ id: null, billingFrequencies: mockBillingFrequencies });
    expect(screen.getByText("Add Connection Category")).toBeInTheDocument();
    expect(screen.getByText("Create a new category")).toBeInTheDocument();
  });

  it("renders Edit Drawer with populated values", () => {
    renderComponent({ id: 1, initialData: mockInitialData, billingFrequencies: mockBillingFrequencies });
    expect(screen.getByText("Edit Connection Category")).toBeInTheDocument();
    expect(screen.getByDisplayValue("REGULAR")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Regular Metered")).toBeInTheDocument();
  });

  it("displays validation errors on empty submit", async () => {
    renderComponent({ id: null, billingFrequencies: mockBillingFrequencies });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() => {
      expect(screen.getByText("Connection Category Code is required")).toBeInTheDocument();
      expect(screen.getByText("Connection Category is required")).toBeInTheDocument();
      expect(screen.getByText("Please select a billing frequency")).toBeInTheDocument();
    });
  });

  it("submits update successfully when valid", async () => {
    mockUpdateAction.mockResolvedValueOnce({ success: true, data: mockInitialData });
    renderComponent({ id: 1, initialData: mockInitialData, billingFrequencies: mockBillingFrequencies });

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => {
      expect(mockUpdateAction).toHaveBeenCalledWith(1, {
        connectionCategoryCode: "REGULAR", connectionCategory: "Regular Metered",
        billingFrequencyId: 2, isMetered: true, billingMethod: "Metered",
        description: "Standard metered connection", isActive: true,
      });
      expect(toast.success).toHaveBeenCalledWith("Connection Category updated successfully");
      expect(mockRouterPush).toHaveBeenCalledWith("/en/water-bill/connection-category-master");
    });
  });
});
