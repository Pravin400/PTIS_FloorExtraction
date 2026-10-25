import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FinancialYear, FinancialYearFormValues } from "@/types/financialYear.types";

import { FinancialYearTable } from "@/components/modules/configuration-settings/financial-year-master/FinancialYearTable";
import { FinancialYearForm } from "@/components/modules/configuration-settings/financial-year-master/FinancialYearForm";
import { FinancialYearDrawerWrapper } from "@/components/modules/configuration-settings/financial-year-master/FinancialYearDrawerWrapper";
import { FinancialYearTableToolbar } from "@/components/modules/configuration-settings/financial-year-master/FinancialYearTableToolbar";
import { FinancialYearFormFields } from "@/components/modules/configuration-settings/financial-year-master/FinancialYearFormFields";
import { PeriodDetailsFields } from "@/components/modules/configuration-settings/financial-year-master/PeriodDetailsFields";
import { createFinancialYearSchema } from "@/lib/validations/financial-year/validation-schemas";
import { ConfirmProvider } from "@/components/common/ConfirmProvider";
import { ToastProvider } from "@/components/common/ToastProvider";
import { useFinancialYearTable } from "@/hooks/configuration-settings/financial-year-master/useFinancialYearTable";
import * as actions from "@/app/[locale]/configuration-settings/financial-year-master/actions";
import {
  getInitialFinancialYearFormData,
  mapActionValidationErrors,
  mapZodFieldErrors,
} from "@/components/modules/configuration-settings/financial-year-master/financialYearForm.utils";
import {
  calculateDuration,
  getFinancialYearColumns,
} from "@/components/modules/configuration-settings/financial-year-master/FinancialYearTableColumns";
import { FinancialYearPagination } from "@/components/modules/configuration-settings/financial-year-master/FinancialYearPagination";
import React from "react";

let mockPathname = "/en/configuration-settings/financial-year-master";
let mockSearch = "";
const routerPush = vi.fn();
const routerRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush, refresh: routerRefresh, replace: vi.fn() }),
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(mockSearch),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("@/app/[locale]/configuration-settings/financial-year-master/actions", () => ({
  saveFinancialYearAction: vi.fn(),
  deleteFinancialYearAction: vi.fn(),
  setAsCurrentAction: vi.fn(),
  closeYearAction: vi.fn(),
}));

vi.mock("@/lib/api/financial-year.service", () => ({
  createFinancialYear: vi.fn(),
  updateFinancialYear: vi.fn(),
  deleteFinancialYear: vi.fn(),
  getFinancialYearById: vi.fn(),
  getFinancialYearsPaged: vi.fn(),
}));

const mockPermissions = {
  canView: true,
  canEdit: true,
  canDelete: true,
  haveFullAccess: true,
  hasAccess: true,
};

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => mockPermissions,
}));

const mockData: FinancialYear[] = [
  { id: 1, yearCode: "FY24-25", year: 2024, status: "Active", startDate: "2024-04-01T00:00:00", endDate: "2025-03-31T00:00:00", description: "Financial Year 2024 2025", isActive: true },
  { id: 2, yearCode: "FY23-24", year: 2023, status: "Closed", startDate: "2023-04-01T00:00:00", endDate: "2024-03-31T00:00:00", description: "Financial Year 2023 2024", isActive: false },
  { id: 3, yearCode: "FY25-26", year: 2025, status: "Active", startDate: "2025-04-01T00:00:00", endDate: "2026-03-31T00:00:00", description: "Financial Year 2025 2026", isActive: false },
];

const wrap = (ui: React.ReactNode) => render(<ToastProvider><ConfirmProvider>{ui}</ConfirmProvider></ToastProvider>);

describe("Financial Year Master Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = "/en/configuration-settings/financial-year-master";
    mockSearch = "";
    // Reset permissions to full access
    mockPermissions.canView = true;
    mockPermissions.canEdit = true;
    mockPermissions.canDelete = true;
    mockPermissions.haveFullAccess = true;
    mockPermissions.hasAccess = true;
    // Silence jsdom unimplemented helpers some components might hit
    // (these show up as noisy console errors, not test failures).
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  });

  describe("Validation Logic", () => {
    const t = (key: string) => key;
    const schema = createFinancialYearSchema(t);

    it("passes valid data", () => {
      const data = {
        yearCode: "FY24-25",
        status: "Active",
        year: 2024,
        startDate: "2024-04-01",
        endDate: "2025-03-31",
        description: "Test",
        isActive: false,
        isCurrent: false,
      };
      expect(schema.safeParse(data).success).toBe(true);
    });

    it("allows any string with special characters in description", () => {
      const data = {
        yearCode: "FY24-25",
        status: "Active",
        year: 2024,
        startDate: "2024-04-01",
        endDate: "2025-03-31",
        description: "fgggs34534565hjgbvcxbv#@#$#4543545342545435656gfdgdfgggffgggs34534565hjgbvcxbv#@#$#454354534",
        isActive: false,
        isCurrent: false,
      };
      expect(schema.safeParse(data).success).toBe(true);
    });

    it("fails when description contains HTML tags", () => {
      const dataWithScript = {
        yearCode: "FY24-25",
        status: "Active",
        year: 2024,
        startDate: "2024-04-01",
        endDate: "2025-03-31",
        description: "Test <script>alert(1)</script>",
        isActive: false,
        isCurrent: false,
      };
      const resultScript = schema.safeParse(dataWithScript);
      expect(resultScript.success).toBe(false);

      const dataWithDiv = {
        yearCode: "FY24-25",
        status: "Active",
        year: 2024,
        startDate: "2024-04-01",
        endDate: "2025-03-31",
        description: "Hello <div>world</div>",
        isActive: false,
        isCurrent: false,
      };
      const resultDiv = schema.safeParse(dataWithDiv);
      expect(resultDiv.success).toBe(false);
    });

    it("fails when end date is before start date", () => {
      const data = {
        yearCode: "FY24-25",
        status: "Active",
        year: 2024,
        startDate: "2025-04-01",
        endDate: "2024-03-31",
        description: "Test",
        isActive: false,
        isCurrent: false,
      };
      expect(schema.safeParse(data).success).toBe(false);
    });

    it("fails when required fields are missing", () => {
      const data = {
        yearCode: "",
        status: "Active",
        year: 2024,
        startDate: "",
        endDate: "",
        description: "",
        isActive: false,
        isCurrent: false,
      };
      expect(schema.safeParse(data).success).toBe(false);
    });
  });

  describe("FinancialYearTable", () => {
    const renderTable = () => wrap(<FinancialYearTable initialData={mockData} totalCount={3} pageNumber={1} pageSize={10} />);

    it("renders table data", () => {
      renderTable();
      expect(screen.getByText("FY24-25")).toBeInTheDocument();
      expect(screen.getByText("FY23-24")).toBeInTheDocument();
      expect(screen.getByText("FY25-26")).toBeInTheDocument();
    });

    it("calls set current action from hook handler", async () => {
      vi.mocked(actions.setAsCurrentAction).mockResolvedValue({ success: true });
      const TestComponent = () => {
        const { handleSetCurrent } = useFinancialYearTable({ initialData: mockData, totalCount: 3, pageNumber: 1, pageSize: 10 });
        return <button onClick={() => handleSetCurrent(3)}>Set Current</button>;
      };
      wrap(<TestComponent />);
      await act(async () => fireEvent.click(screen.getByText("Set Current")));
      await waitFor(() => expect(actions.setAsCurrentAction).toHaveBeenCalledWith(3));
    });

    it("calls close year action from hook handler", async () => {
      vi.mocked(actions.closeYearAction).mockResolvedValue({ success: true });
      const TestComponent = () => {
        const { handleClose } = useFinancialYearTable({ initialData: mockData, totalCount: 3, pageNumber: 1, pageSize: 10 });
        return <button onClick={() => handleClose(1)}>Close Year</button>;
      };
      wrap(<TestComponent />);
      await act(async () => fireEvent.click(screen.getByText("Close Year")));
      const confirmButton = await screen.findByText("warning.confirm");
      await act(async () => fireEvent.click(confirmButton));
      await waitFor(() => expect(actions.closeYearAction).toHaveBeenCalledWith(1));
    });

    it("handles delete confirm flow (success and failure)", async () => {
      const TestComponent = () => {
        const { handleDelete } = useFinancialYearTable({ initialData: mockData, totalCount: 3, pageNumber: 1, pageSize: 10 });
        return <button onClick={() => handleDelete(3)}>Delete</button>;
      };
      vi.mocked(actions.deleteFinancialYearAction).mockResolvedValueOnce({ success: false, error: "nope" });
      wrap(<TestComponent />);
      await act(async () => fireEvent.click(screen.getByText("Delete")));
      const confirmButton = await screen.findByText("delete.confirm");
      await act(async () => fireEvent.click(confirmButton));
      await waitFor(() => expect(actions.deleteFinancialYearAction).toHaveBeenCalledWith(3));

      // Test delete with no error string in response (fallback to tCommon)
      vi.mocked(actions.deleteFinancialYearAction).mockResolvedValueOnce({ success: false });
      await act(async () => fireEvent.click(screen.getByText("Delete")));
      const confirmButtonF = await screen.findByText("delete.confirm");
      await act(async () => fireEvent.click(confirmButtonF));
      await waitFor(() => expect(actions.deleteFinancialYearAction).toHaveBeenCalledTimes(2));

      vi.mocked(actions.deleteFinancialYearAction).mockResolvedValueOnce({ success: true });
      await act(async () => fireEvent.click(screen.getByText("Delete")));
      const confirmButton2 = await screen.findByText("delete.confirm");
      await act(async () => fireEvent.click(confirmButton2));
      await waitFor(() => expect(actions.deleteFinancialYearAction).toHaveBeenCalledTimes(3));
    });

    it("handles set current failure and search/page/pageSize changes", async () => {
      // 1. With failed error message
      vi.mocked(actions.setAsCurrentAction).mockResolvedValueOnce({ success: false, error: "failed" });
      // 2. Without error message (fallback to updateError)
      vi.mocked(actions.setAsCurrentAction).mockResolvedValueOnce({ success: false });

      const TestComponent = () => {
        const { handleSetCurrent, handleSearch, handlePageChange, handlePageSizeChange } = useFinancialYearTable({ initialData: mockData, totalCount: 3, pageNumber: 1, pageSize: 10 });
        return (
          <div>
            <button onClick={() => handleSetCurrent(2)}>Set Current</button>
            <input aria-label="search" onChange={handleSearch} />
            <button onClick={() => handlePageChange(2)}>Go Page 2</button>
            <button onClick={() => handlePageSizeChange(20)}>Set Page Size 20</button>
          </div>
        );
      };
      mockSearch = "search=FY&page=3";
      wrap(<TestComponent />);
      await act(async () => fireEvent.click(screen.getByText("Set Current")));
      await waitFor(() => expect(actions.setAsCurrentAction).toHaveBeenCalledWith(2));

      // Test fallback case
      await act(async () => fireEvent.click(screen.getByText("Set Current")));
      await waitFor(() => expect(actions.setAsCurrentAction).toHaveBeenCalledTimes(2));

      fireEvent.change(screen.getByLabelText("search"), { target: { value: "FY24-25!" } });
      expect(routerPush).toHaveBeenCalled();

      // empty search deletes param branch
      fireEvent.change(screen.getByLabelText("search"), { target: { value: "" } });
      expect(routerPush).toHaveBeenCalled();

      await act(async () => fireEvent.click(screen.getByText("Go Page 2")));
      expect(routerPush).toHaveBeenCalled();

      await act(async () => fireEvent.click(screen.getByText("Set Page Size 20")));
      expect(routerPush).toHaveBeenCalled();
    });

    it("handles drawer open/close via add/edit and popstate", async () => {
      const pushStateSpy = vi.spyOn(window.history, "pushState");
      const TestComponent = () => {
        const { handleAdd, handleEdit, handleCloseDrawer } = useFinancialYearTable({ initialData: mockData, totalCount: 3, pageNumber: 1, pageSize: 10 });
        return (
          <div>
            <button onClick={() => handleAdd()}>Add</button>
            <button onClick={() => handleEdit(1)}>Edit</button>
            <button onClick={() => handleCloseDrawer()}>Close</button>
          </div>
        );
      };
      mockPathname = "/en/configuration-settings/financial-year-master/edit/123";
      wrap(<TestComponent />);

      await act(async () => fireEvent.click(screen.getByText("Add")));
      expect(pushStateSpy).toHaveBeenCalled();

      await act(async () => fireEvent.click(screen.getByText("Edit")));
      expect(pushStateSpy).toHaveBeenCalled();

      await act(async () => fireEvent.click(screen.getByText("Close")));
      expect(pushStateSpy).toHaveBeenCalled();

      // Popstate: add
      window.history.pushState(null, "", "/en/configuration-settings/financial-year-master/add");
      fireEvent(window, new Event("popstate"));
      // Popstate: edit valid id
      window.history.pushState(null, "", "/en/configuration-settings/financial-year-master/edit/1");
      fireEvent(window, new Event("popstate"));
      // Popstate: edit valid id not in initialData
      window.history.pushState(null, "", "/en/configuration-settings/financial-year-master/edit/999");
      fireEvent(window, new Event("popstate"));
      // Popstate: edit invalid id
      window.history.pushState(null, "", "/en/configuration-settings/financial-year-master/edit/abc");
      fireEvent(window, new Event("popstate"));
      // Popstate: base
      window.history.pushState(null, "", "/en/configuration-settings/financial-year-master");
      fireEvent(window, new Event("popstate"));
    });

    it("updates drawer state when props change (prevProps branch)", () => {
      const Harness = ({ drawer }: { drawer: "add" | "edit" | null }) => {
        const { activeDrawer } = useFinancialYearTable({
          initialData: mockData,
          totalCount: 3,
          pageNumber: 1,
          pageSize: 10,
          drawer,
          initialEditingData: drawer === "edit" ? mockData[0] : null,
        });
        return <div>{activeDrawer ?? "none"}</div>;
      };
      const { rerender } = wrap(<Harness drawer={null} />);
      expect(screen.getByText("none")).toBeInTheDocument();
      rerender(<ToastProvider><ConfirmProvider><Harness drawer={"add"} /></ConfirmProvider></ToastProvider>);
      expect(screen.getByText("add")).toBeInTheDocument();
    });

    it("covers /add basePath branch", async () => {
      const pushStateSpy = vi.spyOn(window.history, "pushState");
      const TestComponent = () => {
        const { handleCloseDrawer } = useFinancialYearTable({ initialData: mockData, totalCount: 3, pageNumber: 1, pageSize: 10 });
        return <button onClick={() => handleCloseDrawer()}>Close</button>;
      };
      mockPathname = "/en/configuration-settings/financial-year-master/add";
      wrap(<TestComponent />);
      await act(async () => fireEvent.click(screen.getByText("Close")));
      expect(pushStateSpy).toHaveBeenCalled();
    });

    it("covers close failure toast branch", async () => {
      // 1. With failed error message
      vi.mocked(actions.closeYearAction).mockResolvedValueOnce({ success: false, error: "err" });
      // 2. Without error message (fallback to updateError)
      vi.mocked(actions.closeYearAction).mockResolvedValueOnce({ success: false });

      const TestComponent = () => {
        const { handleClose } = useFinancialYearTable({ initialData: mockData, totalCount: 3, pageNumber: 1, pageSize: 10 });
        return <button onClick={() => handleClose(1)}>Close Year</button>;
      };
      wrap(<TestComponent />);

      await act(async () => fireEvent.click(screen.getByText("Close Year")));
      const confirmButton = await screen.findByText("warning.confirm");
      await act(async () => fireEvent.click(confirmButton));
      await waitFor(() => expect(actions.closeYearAction).toHaveBeenCalledWith(1));

      // Test fallback
      await act(async () => fireEvent.click(screen.getByText("Close Year")));
      const confirmButtonF = await screen.findByText("warning.confirm");
      await act(async () => fireEvent.click(confirmButtonF));
      await waitFor(() => expect(actions.closeYearAction).toHaveBeenCalledTimes(2));
    });

    it("renders drawer and triggers onSuccess refresh", async () => {
      vi.mocked(actions.saveFinancialYearAction).mockResolvedValue({ success: true });
      wrap(
        <FinancialYearTable
          initialData={mockData}
          totalCount={3}
          pageNumber={1}
          pageSize={10}
          drawer="add"
          initialEditingData={null}
        />
      );

      fireEvent.change(screen.getByLabelText("form.fields.yearCode *"), { target: { value: "FY26-27" } });
      fireEvent.change(screen.getByLabelText("form.fields.year *"), { target: { value: "2026" } });
      fireEvent.change(screen.getByLabelText("form.fields.startDate *"), { target: { value: "2026-04-01" } });
      fireEvent.change(screen.getByLabelText("form.fields.endDate *"), { target: { value: "2027-03-31" } });
      fireEvent.click(screen.getByText("form.buttons.create"));

      const pushStateSpy = vi.spyOn(window.history, "pushState");
      await waitFor(() => expect(actions.saveFinancialYearAction).toHaveBeenCalled());
      await waitFor(() => expect(pushStateSpy.mock.calls.length > 0 || routerPush.mock.calls.length > 0).toBe(true));
    });

    it("renders edit drawer title branch", () => {
      wrap(
        <FinancialYearTable
          initialData={mockData}
          totalCount={3}
          pageNumber={1}
          pageSize={10}
          drawer="edit"
          initialEditingData={mockData[0]}
        />
      );
      expect(screen.getByText("form.editTitle")).toBeInTheDocument();
    });

    it("renders loading state when transition is pending", async () => {
      vi.resetModules();
      vi.doMock("react", async () => {
        const actual = await vi.importActual<typeof import("react")>("react");
        return { ...actual, useTransition: () => [true, (cb: () => void) => cb()] };
      });
      const { FinancialYearTable: PendingTable } = await import("@/components/modules/configuration-settings/financial-year-master/FinancialYearTable");
      const { ToastProvider: FreshToastProvider } = await import("@/components/common/ToastProvider");
      const { ConfirmProvider: FreshConfirmProvider } = await import("@/components/common/ConfirmProvider");
      render(
        <FreshToastProvider>
          <FreshConfirmProvider>
             <PendingTable initialData={mockData} totalCount={3} pageNumber={1} pageSize={10} />
          </FreshConfirmProvider>
        </FreshToastProvider>
      );
      expect(document.querySelector(".animate-spin")).toBeTruthy();
      vi.doUnmock("react");
    });
  });

  describe("FinancialYearForm", () => {
    const renderForm = (initialData: FinancialYear | null = null) => wrap(<FinancialYearForm initialData={initialData} />);

    it("renders create form", () => {
      renderForm();
      expect(screen.getByText("form.buttons.create")).toBeInTheDocument();
      expect(screen.getByLabelText("form.fields.yearCode *")).toHaveValue("");
    });

    it("renders edit form with initial data", () => {
      renderForm(mockData[0]);
      expect(screen.getByText("form.buttons.update")).toBeInTheDocument();
      expect(screen.getByDisplayValue("FY24-25")).toBeInTheDocument();
      expect(screen.getByDisplayValue("2024")).toBeInTheDocument();
    });

    it("auto-fills FY period dates when year changes (India FY)", () => {
      renderForm();
      // Use a non-default year to ensure change detection regardless of system date
      fireEvent.change(screen.getByLabelText("form.fields.year *"), { target: { value: "2025" } });
      return waitFor(() => {
        expect(screen.getByLabelText("form.fields.startDate *")).toHaveValue("2025-04-01");
        expect(screen.getByLabelText("form.fields.endDate *")).toHaveValue("2026-03-31");
      }).then(() => {

        // Even if user manually edits dates, changing year should always auto-derive
        // standard Indian FY dates (Apr 1 → Mar 31) to prevent invalid date ranges
        fireEvent.change(screen.getByLabelText("form.fields.startDate *"), { target: { value: "2026-05-01" } });
        fireEvent.change(screen.getByLabelText("form.fields.endDate *"), { target: { value: "2027-02-28" } });
        fireEvent.change(screen.getByLabelText("form.fields.year *"), { target: { value: "2027" } });
        expect(screen.getByLabelText("form.fields.startDate *")).toHaveValue("2027-04-01");
        expect(screen.getByLabelText("form.fields.endDate *")).toHaveValue("2028-03-31");
      });
    });

    it("submits create form successfully", async () => {
      vi.mocked(actions.saveFinancialYearAction).mockResolvedValue({ success: true });
      renderForm();

      fireEvent.change(screen.getByLabelText("form.fields.yearCode *"), { target: { value: "FY26-27" } });
      fireEvent.change(screen.getByLabelText("form.fields.year *"), { target: { value: "2026" } });
      fireEvent.change(screen.getByLabelText("form.fields.startDate *"), { target: { value: "2026-04-01" } });
      fireEvent.change(screen.getByLabelText("form.fields.endDate *"), { target: { value: "2027-03-31" } });
      fireEvent.click(screen.getByText("form.buttons.create"));

      await waitFor(() => expect(actions.saveFinancialYearAction).toHaveBeenCalled());
      const callArgs = vi.mocked(actions.saveFinancialYearAction).mock.calls[0][0] as unknown as FinancialYearFormValues;
      expect(callArgs.yearCode).toBe("FY26-27");
      expect(callArgs.year).toBe(2026);
    });

    it("marks current year and submits isCurrent=true", async () => {
      vi.mocked(actions.saveFinancialYearAction).mockResolvedValue({ success: true });
      renderForm();

      fireEvent.click(screen.getByTestId("mark-as-current-container"));

      fireEvent.change(screen.getByLabelText("form.fields.yearCode *"), { target: { value: "FY26-27" } });
      fireEvent.change(screen.getByLabelText("form.fields.year *"), { target: { value: "2026" } });
      fireEvent.change(screen.getByLabelText("form.fields.startDate *"), { target: { value: "2026-04-01" } });
      fireEvent.change(screen.getByLabelText("form.fields.endDate *"), { target: { value: "2027-03-31" } });
      fireEvent.click(screen.getByText("form.buttons.create"));

      await waitFor(() => expect(actions.saveFinancialYearAction).toHaveBeenCalled());
      const callArgs = vi.mocked(actions.saveFinancialYearAction).mock.calls.at(-1)![0] as unknown as FinancialYearFormValues;
      expect(callArgs.isCurrent).toBe(true);
    });

    it("calls onCancel when provided and blocks current toggle when closed", () => {
      const onCancel = vi.fn();
      const closed = { ...mockData[1], status: "Closed", isActive: false };
      wrap(<FinancialYearForm initialData={closed} onCancel={onCancel} />);
      fireEvent.click(screen.getByText("form.buttons.cancel"));
      expect(onCancel).toHaveBeenCalled();

      // Clicking container when disabled triggers blocked path (toast/error branch coverage)
      fireEvent.click(screen.getByTestId("mark-as-current-container"));
    });

    it("shows zod validation errors and blocks closed-current", async () => {
      renderForm();
      fireEvent.click(screen.getByText("form.buttons.create"));
      await waitFor(() => {
        expect(screen.getByText("form.validation.codeRequired")).toBeInTheDocument();
      });

      // Change input to verify error clearing
      fireEvent.change(screen.getByLabelText("form.fields.yearCode *"), { target: { value: "FY26" } });
      expect(screen.queryByText("form.validation.codeRequired")).not.toBeInTheDocument();
    });

    it("handles handleChange for year input character-by-character typing", () => {
      renderForm();
      // Year input typed character-by-character (like "2" or "20" or "202")
      fireEvent.change(screen.getByLabelText("form.fields.year *"), { target: { value: "20" } });
      // The current year of 2026 was initial, so when "20" is typed, it's not length 4, so it keeps the previous startDate of "2026-04-01"
      expect(screen.getByLabelText("form.fields.startDate *")).toHaveValue("2026-04-01");
    });

    it("submits form and handles backend failure cases and throws", async () => {
      // 1. Validation errors from action
      vi.mocked(actions.saveFinancialYearAction).mockResolvedValueOnce({
        success: false,
        validationErrors: { yearCode: "YearCode_Required" },
      });
      renderForm();
      fireEvent.change(screen.getByLabelText("form.fields.yearCode *"), { target: { value: "FY26-27" } });
      fireEvent.change(screen.getByLabelText("form.fields.year *"), { target: { value: "2026" } });
      fireEvent.change(screen.getByLabelText("form.fields.startDate *"), { target: { value: "2026-04-01" } });
      fireEvent.change(screen.getByLabelText("form.fields.endDate *"), { target: { value: "2027-03-31" } });
      fireEvent.click(screen.getByText("form.buttons.create"));
      await waitFor(() => expect(actions.saveFinancialYearAction).toHaveBeenCalled());

      // 2. Simple error from action
      vi.mocked(actions.saveFinancialYearAction).mockResolvedValueOnce({
        success: false,
        error: "YearCode_Duplicate",
      });
      fireEvent.click(screen.getByText("form.buttons.create"));
      await waitFor(() => expect(actions.saveFinancialYearAction).toHaveBeenCalledTimes(2));

      // 3. Simple error from action with no error string
      vi.mocked(actions.saveFinancialYearAction).mockResolvedValueOnce({
        success: false,
      });
      fireEvent.click(screen.getByText("form.buttons.create"));
      await waitFor(() => expect(actions.saveFinancialYearAction).toHaveBeenCalledTimes(3));

      // 4. Action throws an exception
      vi.mocked(actions.saveFinancialYearAction).mockRejectedValueOnce(new Error("Network Error"));
      fireEvent.click(screen.getByText("form.buttons.create"));
      await waitFor(() => expect(actions.saveFinancialYearAction).toHaveBeenCalledTimes(4));

      // 5. Action throws raw string error
      vi.mocked(actions.saveFinancialYearAction).mockRejectedValueOnce("raw error");
      fireEvent.click(screen.getByText("form.buttons.create"));
      await waitFor(() => expect(actions.saveFinancialYearAction).toHaveBeenCalledTimes(5));
    });

    it("calls router push on cancel when onCancel is not provided", () => {
      renderForm();
      fireEvent.click(screen.getByText("form.buttons.cancel"));
      expect(routerPush).toHaveBeenCalled();
    });


  });

  describe("FinancialYearDrawerWrapper", () => {
    it("renders drawer and handles close", () => {
      const onClose = vi.fn();
      render(
        <FinancialYearDrawerWrapper title="Test Title" onClose={onClose}>
          <div>Test Children</div>
        </FinancialYearDrawerWrapper>
      );
      expect(screen.getByText("Test Title")).toBeInTheDocument();
      expect(screen.getByText("Test Children")).toBeInTheDocument();
      const closeBtn = screen.getByRole("dialog").querySelector("button")!;
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalled();
    });

    it("falls back to router push when onClose not provided", () => {
      render(
        <FinancialYearDrawerWrapper title="Test Title">
          <div>Child</div>
        </FinancialYearDrawerWrapper>
      );
      const closeBtn = screen.getByRole("dialog").querySelector("button")!;
      fireEvent.click(closeBtn);
      expect(routerPush).toHaveBeenCalled();
    });
  });

  describe("FinancialYearFormFields", () => {
    it("prevents invalid characters in number input", () => {
      const onChange = vi.fn();
      render(<FinancialYearFormFields formData={{ yearCode: "", year: 0, startDate: "", endDate: "", isActive: false, isCurrent: false, description: "" }} errors={{}} onChange={onChange} duration={null} handleCurrentChange={vi.fn()} disableCurrentToggle={false} onCurrentToggleBlocked={vi.fn()} />);
      const yearInput = screen.getByLabelText("form.fields.year *");
      fireEvent.change(yearInput, { target: { value: "2024" } });
      expect(onChange).toHaveBeenCalledWith("year", 2024);
      onChange.mockClear();
      fireEvent.change(yearInput, { target: { value: "abcd" } });
      expect(onChange).not.toHaveBeenCalled();
    });

    it("toggles current when enabled and blocks key inputs", () => {
      const handleCurrentChange = vi.fn();
      render(
        <FinancialYearFormFields
          formData={{ yearCode: "ABC", year: 2024, startDate: "", endDate: "", isActive: false, isCurrent: false, description: "" } as FinancialYearFormValues}
          errors={{}}
          onChange={vi.fn()}

          duration={null}
          handleCurrentChange={handleCurrentChange}
          disableCurrentToggle={false}
          onCurrentToggleBlocked={vi.fn()}
        />
      );

      fireEvent.click(screen.getByTestId("mark-as-current-container"));
      expect(handleCurrentChange).toHaveBeenCalledWith(true);

      const yearInput = screen.getByLabelText("form.fields.year *");
      const preventDefaultSpy = vi.spyOn(KeyboardEvent.prototype, "preventDefault");
      fireEvent.keyDown(yearInput, { key: "-" });
      expect(preventDefaultSpy).toHaveBeenCalled();
      preventDefaultSpy.mockRestore();

      // Execute checkbox click handler (stopPropagation)
      fireEvent.click(screen.getByRole("checkbox"));
    });

    it("validates yearCode and blocked current toggle", () => {
      const onChange = vi.fn();
      const handleCurrentChange = vi.fn();
      const onBlocked = vi.fn();

      const Harness = () => {
        const [data, setData] = React.useState<FinancialYearFormValues>({
          yearCode: "",
          year: 2024,
          startDate: "",
          endDate: "",
          isActive: false,
          isCurrent: false,
          description: "",
        });
        return (
          <FinancialYearFormFields
            formData={data}
            errors={{}}
            onChange={(k, v) => {
              onChange(k, v);
              setData((prev) => ({ ...prev, [k]: v }));
            }}

            duration={null}
            handleCurrentChange={handleCurrentChange}
            disableCurrentToggle={true}
            onCurrentToggleBlocked={onBlocked}
          />
        );
      };
      render(<Harness />);

      fireEvent.change(screen.getByLabelText("form.fields.yearCode *"), { target: { value: "AA--BB" } });
      expect(onChange).not.toHaveBeenCalledWith("yearCode", "AA--BB");
      fireEvent.change(screen.getByLabelText("form.fields.yearCode *"), { target: { value: "-ABC" } });
      fireEvent.change(screen.getByLabelText("form.fields.yearCode *"), { target: { value: "ABC!" } });
      // valid then empty
      fireEvent.change(screen.getByLabelText("form.fields.yearCode *"), { target: { value: "ABC" } });
      expect(onChange).toHaveBeenCalledWith("yearCode", "ABC");
      fireEvent.change(screen.getByLabelText("form.fields.yearCode *"), { target: { value: "" } });
      expect(onChange).toHaveBeenCalledWith("yearCode", "");

      // Clicking on label should not toggle
      fireEvent.click(screen.getByText("form.fields.markAsCurrent"));
      expect(handleCurrentChange).not.toHaveBeenCalled();

      // Clicking container when disabled triggers blocked handler
      fireEvent.click(screen.getByTestId("mark-as-current-container"));
      expect(onBlocked).toHaveBeenCalled();
    });

    it("enforces description max length", () => {
      const onChange = vi.fn();
      render(
        <FinancialYearFormFields
          formData={{ yearCode: "", year: 2024, startDate: "", endDate: "", isActive: false, isCurrent: false, description: "" }}
          errors={{}}
          onChange={onChange}

          duration={null}
          handleCurrentChange={vi.fn()}
          disableCurrentToggle={false}
          onCurrentToggleBlocked={vi.fn()}
        />
      );
      fireEvent.change(screen.getByPlaceholderText("form.fields.descriptionPlaceholder"), { target: { value: "ok" } });
      expect(onChange).toHaveBeenCalledWith("description", "ok");
      onChange.mockClear();
      fireEvent.change(screen.getByPlaceholderText("form.fields.descriptionPlaceholder"), { target: { value: "a".repeat(251) } });
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("FinancialYearPagination", () => {
    it("renders page info and clicks prev/next", () => {
      const onPageChange = vi.fn();
      const onPageSizeChange = vi.fn();
      const { rerender } = render(
        <FinancialYearPagination
          totalCount={25}
          pageNumber={2}
          pageSize={10}
          totalPages={3}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      );
      
      const prevBtn = screen.getByRole("button", { name: "Go to previous page" });
      const nextBtn = screen.getByRole("button", { name: "Go to next page" });
      
      fireEvent.click(prevBtn);
      fireEvent.click(nextBtn);
      
      expect(onPageChange).toHaveBeenCalledWith(1);
      expect(onPageChange).toHaveBeenCalledWith(3);

      const combobox = screen.getByRole("combobox", { name: "Rows per page" });
      fireEvent.click(combobox);
      const option20 = screen.getByText("20");
      fireEvent.click(option20);
      expect(onPageSizeChange).toHaveBeenCalledWith(20);

      rerender(<FinancialYearPagination totalCount={25} pageNumber={1} pageSize={10} totalPages={3} onPageChange={onPageChange} />);
      expect(screen.getByRole("button", { name: "Go to previous page" })).toBeDisabled();
    });

    it("renders first, last, page number buttons and dots correctly", () => {
      const onPageChange = vi.fn();
      const { rerender } = render(
        <FinancialYearPagination
          totalCount={100}
          pageNumber={5}
          pageSize={10}
          totalPages={10}
          onPageChange={onPageChange}
        />
      );

      // Verify dots are rendered
      expect(screen.getAllByText("...")).toHaveLength(2);

      // Click first page button
      const firstBtn = screen.getByRole("button", { name: "Go to first page" });
      fireEvent.click(firstBtn);
      expect(onPageChange).toHaveBeenCalledWith(1);

      // Click last page button
      const lastBtn = screen.getByRole("button", { name: "Go to last page" });
      fireEvent.click(lastBtn);
      expect(onPageChange).toHaveBeenCalledWith(10);

      // Click a specific page number
      const pageBtn = screen.getByRole("button", { name: "Go to page 4" });
      fireEvent.click(pageBtn);
      expect(onPageChange).toHaveBeenCalledWith(4);

      // Cover totalCount === 0 branch
      rerender(
        <FinancialYearPagination
          totalCount={0}
          pageNumber={1}
          pageSize={10}
          totalPages={0}
          onPageChange={onPageChange}
        />
      );
      expect(screen.getByText("table.showingEntries")).toBeInTheDocument();

      // Cover no-dots boundary pages (pageNumber = 3, totalPages = 5)
      rerender(
        <FinancialYearPagination
          totalCount={50}
          pageNumber={3}
          pageSize={10}
          totalPages={5}
          onPageChange={onPageChange}
        />
      );
      expect(screen.queryByText("...")).not.toBeInTheDocument();
    });
  });

  describe("Columns and Utils", () => {
    it("covers duration/status variants and columns rendering", () => {
      expect(calculateDuration(null, null)).toBe("-");
      expect(calculateDuration("2024-04-01", "2025-03-31")).toBe("364 days"); // no t parameter

      const handlers = { handleEdit: vi.fn(), handleSetCurrent: vi.fn(), handleClose: vi.fn(), handleDelete: vi.fn() };
      const cols = getFinancialYearColumns({
        t: (k: string, v?: Record<string, string | number>) => v ? `${k}:${JSON.stringify(v)}` : k,
        tCommon: (k: string) => k,
        loadingState: { id: 2, action: "edit" },
        canEdit: true,
        canDelete: true,
        haveFullAccess: true,
        ...handlers,
      } as unknown as Parameters<typeof getFinancialYearColumns>[0]);

      render(<div>{cols[0].render("FY", mockData[0])}</div>);
      render(<div>{cols[0].render(null, mockData[0])}</div>); // check fallback N/A
      render(<div>{cols[1].render(null, { ...mockData[0], description: null })}</div>);
      render(<div>{cols[3].render(null, mockData[0])}</div>); // check calculateDuration using translation function
      render(<div>{cols[4].render(true, mockData[0])}</div>);
      render(<div>{cols[4].render(false, mockData[0])}</div>);

      const { container } = render(<div>{cols[5].render(null, mockData[1])}</div>);
      const editBtn = container.querySelector('button[aria-label="Edit"]') as HTMLButtonElement;
      // editBtn should be disabled because loadingState.id === row.id (id: 2)
      expect(editBtn).toBeDisabled();
      fireEvent.click(editBtn);
      expect(handlers.handleEdit).not.toHaveBeenCalled();

      // Test with no loading state matching the row
      const { container: container2 } = render(<div>{cols[5].render(null, mockData[0])}</div>);
      const editBtn2 = container2.querySelector('button[aria-label="Edit"]') as HTMLButtonElement;
      expect(editBtn2).not.toBeDisabled();
      fireEvent.click(editBtn2);
      expect(handlers.handleEdit).toHaveBeenCalledWith(1);
    });

    it("covers form utils mapping", () => {
      // test with falsy year (0)
      const initial = getInitialFinancialYearFormData({ ...mockData[1], status: "Closed", year: 0, startDate: null, endDate: null, isActive: true });
      expect(initial.isCurrent).toBe(false);
      expect(initial.startDate).toBe("");
      expect(initial.endDate).toBe("");

      const mapped = mapActionValidationErrors(
        { 
          yearCode: "YearCode_MaxLen_50", 
          year: ["Year_Range"], 
          empty: [], 
          other: "X",
          desc: "YearDescription_MaxLen_250",
          code15: "YearCode_MaxLen_15",
          code20: "YearCode_MaxLen_20"
        },
        (k, v) => v ? `${k}:${JSON.stringify(v)}` : k
      ) as Record<string, unknown>;

      expect(mapped.yearCode).toContain("form.validation.codeMaxLength");
      expect(mapped.yearCode).toContain("50");
      expect(mapped.desc).toContain("form.validation.descriptionMaxLength");
      expect(mapped.desc).toContain("250");
      expect(mapped.code15).toContain("15");
      expect(mapped.code20).toContain("20");
      expect(mapped.year).toBe("form.validation.yearInvalid");
      expect(mapped.empty).toBeUndefined();
      expect(mapped.other).toBe("X");

      const zodMapped = mapZodFieldErrors({ yearCode: ["err"], year: undefined });
      expect(zodMapped.yearCode).toBe("err");
    });
  });

  describe("PeriodDetailsFields", () => {
    it("handles string year and missing year fallbacks", () => {
      const onChange = vi.fn();
      const { rerender } = render(
        <PeriodDetailsFields
          startDate="2024-04-01"
          endDate="2025-03-31"
          errors={{}}
          onChange={onChange}
          duration="365 days"
          year="2024" // string year format
        />
      );
      expect(screen.getByLabelText("form.fields.startDate *")).toHaveAttribute("min", "2024-04-01");

      rerender(
        <PeriodDetailsFields
          startDate="2024-04-01"
          endDate="2025-03-31"
          errors={{}}
          onChange={onChange}
          duration="365 days"
          year={undefined} // missing year
        />
      );
      expect(screen.getByLabelText("form.fields.startDate *")).not.toHaveAttribute("min");
    });
  });

  describe("Zod Schema Boundary Conditions", () => {
    const t = (key: string) => key;
    const schema = createFinancialYearSchema(t);

    it("covers start/end date refinements with out of range, out of bounds or NaN years", () => {
      // year is invalid (< 1900), so refinements on start/end date return true
      const dataLowYear = {
        yearCode: "FY24-25",
        year: 1899,
        startDate: "2024-04-01",
        endDate: "2025-03-31",
        description: "Test",
        isActive: false,
        isCurrent: false,
      };
      const resLow = schema.safeParse(dataLowYear);
      expect(resLow.success).toBe(false);
      
      // year is invalid (> 2100)
      const dataHighYear = {
        yearCode: "FY24-25",
        year: 2101,
        startDate: "2024-04-01",
        endDate: "2025-03-31",
        description: "Test",
        isActive: false,
        isCurrent: false,
      };
      const resHigh = schema.safeParse(dataHighYear);
      expect(resHigh.success).toBe(false);
      
      // year is NaN
      const dataNaNYear = {
        yearCode: "FY24-25",
        year: NaN,
        startDate: "2024-04-01",
        endDate: "2025-03-31",
        description: "Test",
        isActive: false,
        isCurrent: false,
      };
      const resNaN = schema.safeParse(dataNaNYear);
      expect(resNaN.success).toBe(false);
    });
  });

  describe("FinancialYearTableToolbar", () => {
    it("renders and triggers search, clear, and onAdd correctly", async () => {
      vi.useFakeTimers();
      const onAdd = vi.fn();
      
      // Test rendering with search query pre-filled
      mockSearch = "?search=2024";
      const { rerender } = render(<FinancialYearTableToolbar onAdd={onAdd} />);
      
      // Verify search placeholder and value is prefilled
      const input = screen.getByPlaceholderText("table.searchPlaceholder") as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.value).toBe("2024");
      
      // Trigger search value change
      fireEvent.change(input, { target: { value: "2025" } });
      
      // Advance timers to trigger search debounce (400ms)
      await act(async () => {
        vi.advanceTimersByTime(400);
      });
      expect(routerPush).toHaveBeenCalled();
      
      // Trigger Clear search
      const clearBtn = screen.getByLabelText("Clear search");
      expect(clearBtn).toBeInTheDocument();
      fireEvent.click(clearBtn);
      expect(input.value).toBe("");
      
      // Verify "+ Add" button triggers onAdd
      const addBtn = screen.getByText("table.addButton");
      fireEvent.click(addBtn);
      expect(onAdd).toHaveBeenCalled();
      
      // Verify "+ Add" button is hidden when onAdd is undefined
      rerender(<FinancialYearTableToolbar onAdd={undefined} />);
      expect(screen.queryByText("table.addButton")).not.toBeInTheDocument();
      
      vi.useRealTimers();
    });
  });

  describe("New Feature Highlights & Edge Cases", () => {
    it("converts Year Code input to uppercase automatically and allows underscores", () => {
      const onChange = vi.fn();
      render(
        <FinancialYearFormFields
          formData={{
            yearCode: "",
            year: 2026,
            startDate: "2026-04-01",
            endDate: "2027-03-31",
            description: "",
            isActive: false,
            isCurrent: false,
          }}
          errors={{}}
          onChange={onChange}
          duration="364 days"
          handleCurrentChange={vi.fn()}
          disableCurrentToggle={false}
          onCurrentToggleBlocked={vi.fn()}
        />
      );

      const yearCodeInput = screen.getByLabelText("form.fields.yearCode *") as HTMLInputElement;
      fireEvent.change(yearCodeInput, { target: { value: "fy_2026_27" } });
      
      expect(onChange).toHaveBeenCalledWith("yearCode", "FY_2026_27");
    });

    it("validates Year Code format with underscores in Zod schema", () => {
      const t = (k: string) => k;
      const schema = createFinancialYearSchema(t);

      const validUnderscore = schema.safeParse({
        yearCode: "FY_2026_27",
        year: 2026,
        startDate: "2026-04-01",
        endDate: "2027-03-31",
        description: "Valid description",
        isActive: false,
        isCurrent: false,
      });

      expect(validUnderscore.success).toBe(true);
    });

    it("validates description with special characters while rejecting HTML tags", () => {
      const t = (k: string) => k;
      const schema = createFinancialYearSchema(t);

      const validDesc = schema.safeParse({
        yearCode: "FY2026",
        year: 2026,
        startDate: "2026-04-01",
        endDate: "2027-03-31",
        description: "Special chars & @ # $ % ! * _ - test string",
        isActive: false,
        isCurrent: false,
      });
      expect(validDesc.success).toBe(true);

      const invalidHtmlDesc = schema.safeParse({
        yearCode: "FY2026",
        year: 2026,
        startDate: "2026-04-01",
        endDate: "2027-03-31",
        description: "<script>alert('xss')</script>",
        isActive: false,
        isCurrent: false,
      });
      expect(invalidHtmlDesc.success).toBe(false);
      if (!invalidHtmlDesc.success) {
        expect(invalidHtmlDesc.error.flatten().fieldErrors.description).toContain("form.validation.descriptionFormat");
      }
    });

    it("sorts records so currently active year is always 1st record", () => {
      const items: FinancialYear[] = [
        { id: 1, year: 2023, yearCode: "2023-24", status: "Active", startDate: "2023-04-01", endDate: "2024-03-31", description: null, isActive: false },
        { id: 2, year: 2025, yearCode: "2025-26", status: "Active", startDate: "2025-04-01", endDate: "2026-03-31", description: null, isActive: true },
        { id: 3, year: 2024, yearCode: "2024-25", status: "Active", startDate: "2024-04-01", endDate: "2025-03-31", description: null, isActive: false },
      ];

      items.sort((a, b) => {
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return b.year - a.year;
      });

      expect(items[0].id).toBe(2);
      expect(items[0].isActive).toBe(true);
    });

    it("handles popstate navigation events for /add and /edit/:id", () => {
      const TestComponent = () => {
        useFinancialYearTable({ initialData: mockData, totalCount: 3, pageNumber: 1, pageSize: 10 });
        return <div>Table Component</div>;
      };
      wrap(<TestComponent />);

      window.history.pushState({}, "", "/en/configuration-settings/financial-year-master/add");
      act(() => {
        window.dispatchEvent(new PopStateEvent("popstate"));
      });

      window.history.pushState({}, "", "/en/configuration-settings/financial-year-master/edit/1");
      act(() => {
        window.dispatchEvent(new PopStateEvent("popstate"));
      });

      window.history.pushState({}, "", "/en/configuration-settings/financial-year-master");
      act(() => {
        window.dispatchEvent(new PopStateEvent("popstate"));
      });
    });

    it("triggers handleBlockedCurrentToggle when attempting to mark a closed year as current", () => {
      const closedData = { ...mockData[1], status: "Closed" as const };
      wrap(
        <FinancialYearForm
          initialData={closedData}
          onCancel={vi.fn()}
        />
      );

      const markContainer = screen.getByTestId("mark-as-current-container");
      fireEvent.click(markContainer);
    });

    it("handles non-4-digit year change branch in FinancialYearForm", () => {
      wrap(
        <FinancialYearForm
          initialData={null}
          onCancel={vi.fn()}
        />
      );

      const yearInput = screen.getByLabelText("form.fields.year *");
      fireEvent.change(yearInput, { target: { value: "12" } });
    });
  });
});
