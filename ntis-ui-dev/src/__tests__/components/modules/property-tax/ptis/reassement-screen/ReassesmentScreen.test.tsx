import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ReassesmentScreen from "@/components/modules/property-tax/ptis/reassement-screen/ReassesmentScreen";
import { NextIntlClientProvider } from "next-intl";
import { MappedFloorDetail, ReassessmentTaxRow } from "@/types/reassessment.types";

type MockTableColumn = { key: string; label: string };
type MockTableRow = { label: string };
type MockTableProps = { columns: MockTableColumn[]; data: MockTableRow[] };
type MockEyeIconButtonProps = { onClick: () => void; isAutoScrolling: boolean };
type MockModalProps = { open: boolean; onClose: () => void };

const mockMessages = {
  reassessment: {
    sectionHeaders: {
      municipalRegistration: "Municipal Registration",
      newSurvey: "New Survey",
      taxDetails: "Tax Details",
    },
    photoLabels: {
      photoAsPerOld: "Photo as per old",
      oldPropertyPhoto: "Old Property Photo",
      oldPlanPhoto: "Old Plan Photo",
      photoAsPerNew: "Photo as per new",
      newPropertyPhoto: "New Property Photo",
      newPlanPhoto: "New Plan Photo",
    },
    buttons: {
      retrospectiveDetails: "Retrospective Details",
      section129: "Section 129",
    },
    summaryCards: {
      oldLabel: "Old",
      newLabel: "New",
      changedStatus: "Changed",
      carpetAreaLabel: "Carpet Area",
      typeOfUseLabel: "Type of Use",
      rateableValueLabel: "Rateable Value",
      totalTaxLabel: "Total Tax",
      units: {
        sqM: "sq.m",
        type: "Type",
        rupees: "₹",
      },
    },
  },
};

// Mock ImageWithFallback component
vi.mock("@/components/modules/property-tax/ptis/media/ImageWithFallback", () => ({
  ImageWithFallback: ({ alt }: { alt: string }) => <div data-testid="image">{alt}</div>,
}));

// Mock MasterTable component
vi.mock("@/components/common", () => ({
  MasterTable: ({ columns, data }: MockTableProps) => (
    <div data-testid="master-table">
      {columns.map((col) => <span key={col.key}>{col.label}</span>)}
      {data.map((row, idx) => <div key={idx}>{row.label}</div>)}
    </div>
  ),
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  EyeIconButton: ({ onClick, isAutoScrolling }: MockEyeIconButtonProps) => (
    <button onClick={onClick}>
      {isAutoScrolling ? "Stop Auto Scroll" : "Start Auto Scroll"}
    </button>
  ),
  RetrospectiveDetailsButton: ({
    onClick,
    label,
  }: {
    onClick: () => void;
    label: string;
  }) => <button onClick={onClick}>{label}</button>,
  Section129Button: ({
    onClick,
    label,
  }: {
    onClick: () => void;
    label: string;
  }) => <button onClick={onClick}>{label}</button>,
  ImageViewer: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? <div data-testid="image-viewer"><button onClick={onClose}>Close Viewer</button></div> : null,
}));

// Modal components mock
vi.mock("@/components/modules/property-tax/ptis/reassement-screen/RetrospectiveTaxModal", () => ({
  RetrospectiveTaxModal: ({ open, onClose }: MockModalProps) =>
    open ? <div data-testid="retrospective-modal"><button onClick={onClose}>Close</button></div> : null,
}));

vi.mock("@/components/modules/property-tax/ptis/reassement-screen/Section129Modal", () => ({
  Section129Modal: ({ open, onClose }: MockModalProps) =>
    open ? <div data-testid="section129-modal"><button onClick={onClose}>Close</button></div> : null,
}));

describe("ReassesmentScreen", () => {
  const mockOldFloorDetails: MappedFloorDetail[] = [
    {
      floor: "GF",
      conYear: "2020",
      asstYear: "2021",
      constType: "RCC",
      use: "Residential",
      carpetAreaSqFt: 500,
      carpetAreaSqM: 46.45,
      builtUpAreaSqFt: 600,
      builtUpAreaSqM: 55.74,
      rate: 100,
      yearlyRate: 1200,
      financialYear: "2021-22",
      renter: "John Doe",
      taxLiability: "₹5000",
      rentMy: 10000,
      rentalValue: 120000,
      depreciation: 10,
      alv: 108000,
      mr: 100,
      rv: 120000,
      ocCertificateNo: '',
      ocCertificateIssueDate: '',
      ccCertificateNo: '',
      ccCertificateIssueDate: '',
    },
  ];

  const mockNewFloorDetails: MappedFloorDetail[] = [
    {
      floor: "GF",
      conYear: "2021",
      asstYear: "2022",
      constType: "RCC",
      use: "Commercial",
      carpetAreaSqFt: 600,
      carpetAreaSqM: 55.74,
      builtUpAreaSqFt: 700,
      builtUpAreaSqM: 65.03,
      rate: 120,
      yearlyRate: 1440,
      financialYear: "2022-23",
      renter: "Jane Doe",
      taxLiability: "₹7000",
      rentMy: 12000,
      rentalValue: 144000,
      depreciation: 10,
      alv: 129600,
      mr: 120,
      rv: 144000,
      status: "Added",
      ocCertificateNo: '',
      ocCertificateIssueDate: '',
      ccCertificateNo: '',
      ccCertificateIssueDate: '',
    },
  ];

  const mockTaxColumns = [
    { key: "tax1", label: "Tax 1", displayOrder: 1 },
    { key: "tax2", label: "Tax 2", displayOrder: 2 },
  ];

  const mockTaxRows: ReassessmentTaxRow[] = [
    {
      rowType: "old",
      label: "Old Tax",
      taxes: { tax1: 1000, tax2: 500 },
      totalTax: 1500,
    },
    {
      rowType: "additional",
      label: "New Tax",
      taxes: { tax1: 1200, tax2: 600 },
      totalTax: 1800,
    },
  ];

  const mockPhotos = [
    {
      documentGuid: "old-prop-123",
      type: "OLD_PROPERTY_PHOTO" as const,
    },
    {
      documentGuid: "old-plan-456",
      type: "OLD_PLAN_PHOTO" as const,
    },
    {
      documentGuid: "new-prop-789",
      type: "NEW_PROPERTY_PHOTO" as const,
    },
    {
      documentGuid: "new-plan-012",
      type: "NEW_PLAN_PHOTO" as const,
    },
  ];

  function setup(
    oldFloorDetails = mockOldFloorDetails,
    newFloorDetails = mockNewFloorDetails,
    taxColumns = mockTaxColumns,
    taxRows = mockTaxRows,
    photos = mockPhotos
  ) {
    return render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <ReassesmentScreen
          oldFloorDetails={oldFloorDetails}
          newFloorDetails={newFloorDetails}
          taxColumns={taxColumns}
          taxRows={taxRows}
          photos={photos}
        />
      </NextIntlClientProvider>
    );
  }

  it("renders the component with all sections", () => {
    setup();
    expect(screen.getByText("Municipal Registration")).toBeInTheDocument();
    expect(screen.getByText("New Survey")).toBeInTheDocument();
    expect(screen.getByText("Tax Details")).toBeInTheDocument();
  });

  it("renders photos when provided", () => {
    setup();
    expect(screen.getAllByTestId("image")).toHaveLength(4);
  });

  it("opens and closes Retrospective Tax Modal", () => {
    setup();
    const retroButton = screen.getByText("Retrospective Details");
    fireEvent.click(retroButton);
    expect(screen.getByTestId("retrospective-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Close"));
    expect(screen.queryByTestId("retrospective-modal")).not.toBeInTheDocument();
  });

  it("opens and closes Section 129 Modal", () => {
    setup();
    const sec129Button = screen.getByText("Section 129");
    fireEvent.click(sec129Button);
    expect(screen.getByTestId("section129-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Close"));
    expect(screen.queryByTestId("section129-modal")).not.toBeInTheDocument();
  });
});
