import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import * as actions from "@/app/[locale]/water-bill/geography-unit-master/action";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  redirect: vi.fn(),
}));
vi.mock("next-intl", () => ({
  useTranslations: vi.fn((ns?: string) => (key: string) => (ns ? `${ns}.${key}` : key)),
  useLocale: vi.fn(() => "en"),
}));
import { GeographyUnitForm } from "@/components/modules/water-bill/geography-unit-master";
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/components/common/Drawer", () => ({
  Drawer: ({
    open,
    title,
    footer,
    children,
  }: {
    open: boolean;
    title: React.ReactNode;
    footer: React.ReactNode;
    children: React.ReactNode;
  }) =>
    open ? (
      <div>
        <div>{title}</div>
        {React.Children.map(children, (child) => {
          if (child && typeof child === "object" && "type" in child && child.type === "form") {
            const childElement = child as React.ReactElement<{ id?: string }>;
            return React.cloneElement(childElement, {
              ...childElement.props,
              ...({ "data-testid": "form" } as React.HTMLAttributes<HTMLFormElement>),
            });
          }
          return child;
        })}
        <div>{footer}</div>
      </div>
    ) : null,
}));

interface MockSelectOption {
  label: string;
  value: string;
}

vi.mock("@/components/common", () => ({
  Input: ({
    name,
    label,
    fullWidth: _fullWidth,
    ...props
  }: React.InputHTMLAttributes<HTMLInputElement> & { name: string; label?: string; fullWidth?: boolean }) => (
    <input {...props} name={name} data-testid={name} aria-label={label || name} />
  ),
  Select: ({
    label,
    value,
    onChange,
    options,
    disabled,
  }: {
    label?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLSelectElement>, value: string) => void;
    options: MockSelectOption[];
    disabled?: boolean;
  }) => (
    <select
      aria-label={label}
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) => onChange?.(e, e.target.value)}
    >
      <option value="" />
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
  SearchSelect: ({
    label,
    value,
    onChange,
    name,
    options,
    disabled,
  }: {
    label?: string;
    value?: string;
    onChange?: (name: string, value: string) => void;
    name?: string;
    options: MockSelectOption[];
    disabled?: boolean;
  }) => (
    <select
      aria-label={label}
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) => onChange?.(name || "", e.target.value)}
    >
      <option value="" />
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
  ValidationMessage: ({ message, visible }: { message?: string; visible?: boolean }) =>
    visible && message ? <div>{message}</div> : null,
  CancelButton: ({
    label,
    fullWidth: _fullWidth,
    isLoading: _isLoading,
    ...rest
  }: { label: string; fullWidth?: boolean; isLoading?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...rest}>{label}</button>
  ),
  SaveButton: ({
    label,
    fullWidth: _fullWidth,
    isLoading: _isLoading,
    ...rest
  }: { label: string; fullWidth?: boolean; isLoading?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...rest}>{label}</button>
  ),
  ToggleSwitch: ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <input type="checkbox" checked={checked} onChange={onChange} data-testid="toggle-switch" aria-label="Toggle status" />
  ),
}));

const mockRouterPush = vi.fn();
const mockRouterRefresh = vi.fn();
vi.mocked(useRouter).mockImplementation(() => ({
  back: vi.fn(),
  refresh: mockRouterRefresh,
  forward: vi.fn(),
  push: mockRouterPush,
  replace: vi.fn(),
  prefetch: vi.fn(),
} as unknown as ReturnType<typeof useRouter>));

const mockCreate = vi.spyOn(actions, "createGeographyUnitAction").mockResolvedValue({ success: true });
const mockUpdate = vi.spyOn(actions, "updateGeographyUnitAction").mockResolvedValue({ success: true });
const mockFetchTypes = vi.spyOn(actions, "fetchGeographyTypeOptionsAction").mockResolvedValue([
  { id: 1, geographyTypeCode: "ZONE",
    geographyType: "Zone", levelNo: 1, isActive: true, createdDate: "", updatedDate: null },
  { id: 2, geographyTypeCode: "WARD",
    geographyType: "Ward", levelNo: 2, isActive: true, createdDate: "", updatedDate: null },
]);
const mockFetchCandidates = vi.spyOn(actions, "fetchParentUnitCandidatesAction").mockResolvedValue([
  {
    id: 1,
    geographyUnitCode: "UT",
    geographyUnitName: "Zone 1",
  },
]);

describe("GeographyUnitForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchTypes.mockResolvedValue([
      { id: 1, geographyTypeCode: "ZONE",
        geographyType: "Zone", levelNo: 1, isActive: true, createdDate: "", updatedDate: null },
      { id: 2, geographyTypeCode: "WARD",
        geographyType: "Ward", levelNo: 2, isActive: true, createdDate: "", updatedDate: null },
    ]);
    mockFetchCandidates.mockResolvedValue([
      {
        id: 1,
        geographyUnitCode: "UT",
        geographyUnitName: "Zone 1",
      },
    ]);
    mockCreate.mockResolvedValue({ success: true });
    mockUpdate.mockResolvedValue({ success: true });
  });

  it("loads geography type options on mount", async () => {
    render(<GeographyUnitForm id={null} />);
    await waitFor(() => {
      expect(mockFetchTypes).toHaveBeenCalled();
    });
    expect(await screen.findByText("Zone")).toBeInTheDocument();
  });

  it("loads parent unit candidates when a geography type is selected", async () => {
    render(<GeographyUnitForm id={null} />);
    await screen.findByText("Zone");

    const typeSelect = screen.getByLabelText("geographyUnitMaster.form.fields.geographyType.label");
    fireEvent.change(typeSelect, { target: { value: "1" } });

    await waitFor(() => {
      expect(mockFetchCandidates).toHaveBeenCalledWith(1);
    });
  });

  it("renders add form and submits successfully", async () => {
    render(<GeographyUnitForm id={null} />);
    await screen.findByText("Zone");

    fireEvent.change(screen.getByTestId("geographyUnitCode"), { target: { value: "ZONE-3" } });
    fireEvent.blur(screen.getByTestId("geographyUnitCode"));
    fireEvent.change(screen.getByTestId("geographyUnitName"), { target: { value: "Zone 3" } });
    fireEvent.blur(screen.getByTestId("geographyUnitName"));
    fireEvent.change(screen.getByTestId("searchSequence"), { target: { value: "3" } });
    fireEvent.blur(screen.getByTestId("searchSequence"));

    const typeSelect = screen.getByLabelText("geographyUnitMaster.form.fields.geographyType.label");
    fireEvent.change(typeSelect, { target: { value: "1" } });

    fireEvent.submit(screen.getByTestId("form"));
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
      expect(mockRouterPush).toHaveBeenCalledWith("/en/water-bill/geography-unit-master");
      expect(mockRouterRefresh).toHaveBeenCalled();
    });
  });

  it("renders edit form pre-filled with initial data", async () => {
    const initialData = {
      id: 10,
      geographyTypeId: 2,
      geographyTypeCode: "ZONE1",
    geographyType: "Ward",
      parentGeographyUnitId: 1,
      parentGeographyUnitName: "Zone 1",
      geographyUnitCode: "UT1",
      geographyUnitName: "UT1",
      searchSequence: 1,
      markedForDeletion: false,
      markedForDeletionDate: null,
      isActive: true,
      createdDate: "2026-09-19T12:53:47",
      updatedDate: null,
    };
    render(<GeographyUnitForm id={10} initialData={initialData} />);
    await waitFor(() => {
      expect(mockFetchTypes).toHaveBeenCalled();
    });
    expect(screen.getByTestId("geographyUnitCode")).toHaveValue("UT1");
    expect(screen.getByTestId("geographyUnitName")).toHaveValue("UT1");
  });

  it("excludes the record itself from the parent unit options in edit mode", async () => {
    mockFetchCandidates.mockResolvedValue([
      {
        id: 10,
        geographyUnitCode: "UT1",
        geographyUnitName: "UT1",
      },
      {
        id: 11,
        geographyUnitCode: "UT2",
        geographyUnitName: "UT2",
      },
    ]);
    const initialData = {
      id: 10,
      geographyTypeId: 2,
      geographyTypeCode: "ZONE1",
    geographyType: "Ward",
      parentGeographyUnitId: null,
      parentGeographyUnitName: null,
      geographyUnitCode: "UT1",
      geographyUnitName: "UT1",
      searchSequence: 1,
      markedForDeletion: false,
      markedForDeletionDate: null,
      isActive: true,
      createdDate: "2026-09-19T12:53:47",
      updatedDate: null,
    };
    render(<GeographyUnitForm id={10} initialData={initialData} />);
    await waitFor(() => {
      expect(mockFetchCandidates).toHaveBeenCalledWith(2);
    });
    const parentSelect = await screen.findByLabelText("geographyUnitMaster.form.fields.parentUnit.label");
    expect(screen.queryByText("UT1 (UT1)")).not.toBeInTheDocument();
    expect(parentSelect).toHaveTextContent("UT2 (UT2)");
  });

  it("shows validation error when geography type is not selected on submit", async () => {
    render(<GeographyUnitForm id={null} />);
    await screen.findByText("Zone");
    fireEvent.change(screen.getByTestId("geographyUnitCode"), { target: { value: "ZONE-3" } });
    fireEvent.change(screen.getByTestId("geographyUnitName"), { target: { value: "Zone 3" } });
    fireEvent.submit(screen.getByTestId("form"));
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("toggles active status in edit mode", async () => {
    const initialData = {
      id: 10,
      geographyTypeId: 2,
      geographyTypeCode: "ZONE1",
    geographyType: "Ward",
      parentGeographyUnitId: null,
      parentGeographyUnitName: null,
      geographyUnitCode: "UT1",
      geographyUnitName: "UT1",
      searchSequence: 1,
      markedForDeletion: false,
      markedForDeletionDate: null,
      isActive: true,
      createdDate: "2026-09-19T12:53:47",
      updatedDate: null,
    };
    render(<GeographyUnitForm id={10} initialData={initialData} />);
    const toggle = await screen.findByTestId("toggle-switch");
    expect(toggle).toBeChecked();
    fireEvent.click(toggle);
    expect(toggle).not.toBeChecked();
  });

  it("cancels and closes drawer", async () => {
    render(<GeographyUnitForm id={null} />);
    const cancelBtn = screen.getByText("common.buttons.cancel");
    fireEvent.click(cancelBtn);
    await waitFor(
      () => {
        expect(mockRouterPush).toHaveBeenCalledWith("/en/water-bill/geography-unit-master");
      },
      { timeout: 1000 }
    );
  });

  it("sanitizes unit code to alphanumeric and underscore only", async () => {
    render(<GeographyUnitForm id={null} />);
    const input = screen.getByTestId("geographyUnitCode") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "AB C-12@#$_" } });
    expect(input.value).toBe("ABC12_");
  });

  it("handles API error on submit", async () => {
    mockCreate.mockResolvedValueOnce({ success: false, statusCode: 409, message: "Duplicate" });
    render(<GeographyUnitForm id={null} />);
    await screen.findByText("Zone");
    fireEvent.change(screen.getByTestId("geographyUnitCode"), { target: { value: "ZONE-3" } });
    fireEvent.blur(screen.getByTestId("geographyUnitCode"));
    fireEvent.change(screen.getByTestId("geographyUnitName"), { target: { value: "Zone 3" } });
    fireEvent.blur(screen.getByTestId("geographyUnitName"));
    fireEvent.change(screen.getByTestId("searchSequence"), { target: { value: "3" } });
    fireEvent.blur(screen.getByTestId("searchSequence"));
    const typeSelect = screen.getByLabelText("geographyUnitMaster.form.fields.geographyType.label");
    fireEvent.change(typeSelect, { target: { value: "1" } });
    fireEvent.submit(screen.getByTestId("form"));
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
    });
  });
});
