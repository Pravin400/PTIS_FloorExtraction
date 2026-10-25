/* eslint-disable @typescript-eslint/no-explicit-any */
import type { InventoryItemCategory, InventoryItemCondition, InventoryItemName, InventoryItemModel } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/inventory.service";


export type InventoryType =
  | "furniture"
  | "it-equipment"
  | "electronic-fixtures"
  | "vehicle";

export type InventoryInvoice = {
  invoiceMode: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceFileName: string;
  invoiceFile?: File;
};

export type IndividualAssetUnit = {
  assetId: number;
  assetNo: string;
  assetName: string;
  unitNumber: number;
  unitPurchaseValue: number;
  unitCapitalValue: number;
  ageInYears: number;
  depreciationRate: number;
  conditionFactor: number;
  cvFormula: string;
  condition: string;
  serialNumber?: string;
  assetTag?: string;
  dynamicAttributes?: Record<string, string>;
};

export type InventoryRow = {
  id: number;
  category: InventoryType;
  photoUrl?: string;
  photoName?: string;
  photoFile?: File;
  itemName: string;
  modelName: string;
  specifications: string;
  purchaseDate: string;
  condition: string;
  quantity: number;
  unitValue: number;
  total: number;
  owningDepartment?: string;
  invoice?: InventoryInvoice | null;
  unitDynamicAttributes?: Record<string, string>[];

  unitCV?: number;
  totalCV?: number;
  depreciationRate?: number;
  conditionFactor?: number;
  ageInYears?: number;
  cvFormula?: string;

  batchId?: number;
  isRegistered?: boolean;
  registeredUnits?: IndividualAssetUnit[];
  documents?: any[];
};

export type InventoryCategoryGroup = {
  inventorycategory: InventoryType;
  label: string;
  totalBatches: number;
  totalUnits: number;
  totalPurchaseValue: number;
  totalCapitalValue: number;
  totalDepreciation: number;
  depreciationPercent: number;
  batches: InventoryRow[];
};

export type InventoryTableRow = InventoryRow & { srNo: number };

export type InventoryForm = {
  category: InventoryType | "";
  itemName: string;
  modelName: string;
  specifications: string;
  purchaseDate: string;
  condition: string;
  quantity: string;
  unitValue: string;
  photoName: string;
  photoUrl: string;
  photoFile?: File;
  owningDepartment: string;
  unitDynamicAttributes?: Record<string, string>[];
};

export type InvoiceForm = {
  invoiceMode: string;
  existingInvoiceKey: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceFileName: string;
  invoiceFile?: File;
};

export type TypeMeta = {
  label: string;
  icon: any;
  cardRing: string;
  badgeClassName: string;
  names: any[];
  modelMap: Record<string, any[]>;
};

export interface FurnitureFixtureClientProps {
  parentAssetId?: number | null;
  categories?: InventoryItemCategory[];
  conditions?: InventoryItemCondition[];
  itemNames?: InventoryItemName[];
  itemModels?: InventoryItemModel[];
  initialBatches?: any | null;
  initialDepartments?: { label: string; value: string }[];
}

export interface RowDocumentThumbnailProps {
  row: any;
  type: 'photo' | 'invoice';
  handlePreview: () => void;
}

export interface InventoryCVGroupTableProps {
  groups: InventoryCategoryGroup[];
  grandPurchase: number;
  grandCV: number;
}

export interface InvoiceDrawerProps {
  open: boolean;
  onClose: () => void;
  invoiceForm: InvoiceForm;
  updateInvoiceForm: (key: keyof InvoiceForm, value: string) => void;
  existingInvoiceOptions: { label: string; value: string }[];
  invoiceInputRef: React.RefObject<HTMLInputElement | null>;
  handleInvoiceUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  saveInvoiceDetails: () => void;
  invoiceError: string;
}

export interface InventoryFormSectionProps {
  form: InventoryForm;
  updateForm: (key: keyof InventoryForm, value: string) => void;
  handleCategoryChange: (value: string) => void;
  handleItemNameChange: (value: string) => void;
  addPhotoInputRef: React.RefObject<HTMLInputElement | null>;
  handleAddPhotoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  openInvoiceDrawer: () => void;
  addInvoicePreviewLabel: string;
  handleAddRow: () => void;
  formError: string;
  dynamicCategoryOptions: { label: string; value: string }[];
  dynamicConditionOptions: { label: string; value: string }[];
  dynamicItemNameOptions: { label: string; value: string }[];
  dynamicModelOptions: { label: string; value: string }[];
  departments: { label: string; value: string }[];
  isSaving: boolean;
}

export interface InventoryFormInputsProps {
  form: InventoryForm;
  updateForm: (key: keyof InventoryForm, value: string) => void;
  handleCategoryChange: (value: string) => void;
  handleItemNameChange: (value: string) => void;
  dynamicCategoryOptions: { label: string; value: string }[];
  dynamicConditionOptions: { label: string; value: string }[];
  dynamicItemNameOptions: { label: string; value: string }[];
  dynamicModelOptions: { label: string; value: string }[];
  departments: { label: string; value: string }[];
  addLabels: any;
  addSpecsPlaceholder: string;
  t: any;
}

export interface InventoryEditFormFieldsProps {
  editForm: InventoryForm;
  updateEditForm: (key: keyof InventoryForm, value: string) => void;
  handleEditCategoryChange: (value: string) => void;
  handleEditItemNameChange: (value: string) => void;
  editPhotoInputRef: React.RefObject<HTMLInputElement | null>;
  handleEditPhotoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  dynamicCategoryOptions: { label: string; value: string }[];
  dynamicConditionOptions: { label: string; value: string }[];
  dynamicItemNameOptions: { label: string; value: string }[];
  dynamicModelOptions: { label: string; value: string }[];
  departments: { label: string; value: string }[];
  editLabels: any;
  editSpecsPlaceholder: string;
  t: any;
}

export interface InventoryEditDrawerProps {
  open: boolean;
  onClose: () => void;
  editForm: InventoryForm;
  updateEditForm: (key: keyof InventoryForm, value: string) => void;
  handleEditCategoryChange: (value: string) => void;
  handleEditItemNameChange: (value: string) => void;
  editPhotoInputRef: React.RefObject<HTMLInputElement | null>;
  handleEditPhotoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  openInvoiceDrawer: () => void;
  editInvoicePreviewLabel: string;
  handleUpdateRow: () => void;
  formError: string;
  dynamicCategoryOptions: { label: string; value: string }[];
  dynamicConditionOptions: { label: string; value: string }[];
  dynamicItemNameOptions: { label: string; value: string }[];
  dynamicModelOptions: { label: string; value: string }[];
  departments: { label: string; value: string }[];
}

export interface InventoryActionContainerProps {
  form: { photoName?: string };
  addPhotoInputRef: React.RefObject<HTMLInputElement | null>;
  handleAddPhotoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  openInvoiceDrawer: () => void;
  addInvoicePreviewLabel: string;
  handleAddRow: () => void;
  isSaving: boolean;
  t: any;
}

export interface FurnitureFixtureTableProps {
  tableData: any[];
  filterCategory: string;
  setFilterCategory: (v: string) => void;
  filterOptions: { label: string; value: string }[];
  currentPage: number;
  setCurrentPage: (v: number) => void;
  filteredRowsLength: number;
  handleStartEdit: (row: any) => void;
  handleDeleteRow: (id: number) => void;
  handlePreviewDocument: (row: any, type: 'photo' | 'invoice') => void;
  t: any;
}

export interface FurnitureFixtureSummaryCardsProps {
  summaryCards: any[];
}
