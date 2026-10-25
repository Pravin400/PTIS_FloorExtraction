export interface ActionDeps {
  form: unknown;
  setForm: (f: unknown) => void;
  editingRowId: string | null;
  setEditingRowId: (id: string | null) => void;
  setRows: React.Dispatch<React.SetStateAction<unknown[]>>;
  openDrawer: boolean;
  setOpenDrawer: (v: boolean) => void;
  openInvoiceDrawer: boolean;
  setOpenInvoiceDrawer: (v: boolean) => void;
  invoiceTargetRowId: string | null;
  setInvoiceTargetRowId: (id: string | null) => void;
  invoiceFile: File | null;
  setInvoiceFile: (f: File | null) => void;
  photoFile: File | null;
  setPhotoFile: (f: File | null) => void;
  documentFiles: File[];
  setDocumentFiles: (f: File[]) => void;
  rawInvoiceDocuments: unknown[];
  setRawInvoiceDocuments: React.Dispatch<React.SetStateAction<unknown[]>>;
  invoiceForm: unknown;
  setInvoiceForm: (f: unknown) => void;
  summary: unknown;
  initialLookups: unknown;
  parentAssetId?: number | null;
  photoInputRef: React.RefObject<HTMLInputElement | null>;
  invoiceInputRef: React.RefObject<HTMLInputElement | null>;
}
