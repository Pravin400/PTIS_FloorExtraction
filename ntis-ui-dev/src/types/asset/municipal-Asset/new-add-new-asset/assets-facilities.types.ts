import type { InventoryLookups } from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/action";
import type { InventoryBatchListResponse } from "@/types/asset/municipal-Asset/new-add-new-asset/inventory-batch.types";
import type React from "react";
import type {
  InventoryItemCategory,
  InventoryItemName,
  InventoryItemModel
} from "@/lib/api/asset/municipal-Asset/new-add-new-asset/inventory.service";
import type { InventoryRow } from "@/types/asset/furniture-fixture.types";
import type { LoadedDocumentFile } from "./document-helpers.types";

export interface AddFacilityDrawerProps {
  open: boolean;
  onClose: () => void;
  form: {
    category: string;
    itemName: string;
    modelName: string;
    condition: string;
    purchaseDate: string;
    specifications: string;
    quantity: string;
    unitValue: string;
    photoName: string;
    owningDepartment: string;
  };
  updateForm: (key: string, val: unknown) => void;
  photoInputRef: React.RefObject<HTMLInputElement | null>;
  handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  onOpenInvoice: () => void;
  categories: InventoryItemCategory[];
  conditions: ApiCondition[];
  itemNames: InventoryItemName[];
  itemModels: InventoryItemModel[];
  departments: { label: string; value: string; id: number }[];
  editingRow?: InventoryRow | null;
  assetCategoryId?: number | null;
  onPreview: (doc: LoadedDocumentFile | unknown) => void;
  onDownload: (doc: LoadedDocumentFile | unknown) => void;
}

export interface AddFacilityFormFieldsProps {
  form: {
    category: string;
    itemName: string;
    modelName: string;
    condition: string;
    purchaseDate: string;
    specifications: string;
    quantity: string;
    unitValue: string;
    photoName: string;
    owningDepartment: string;
  };
  updateForm: (key: string, val: unknown) => void;
  photoInputRef: React.RefObject<HTMLInputElement | null>;
  handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  categories: InventoryItemCategory[];
  conditions: ApiCondition[];
  itemNames: InventoryItemName[];
  itemModels: InventoryItemModel[];
  departments: { label: string; value: string; id: number }[];
  editingRow?: InventoryRow | null;
  assetCategoryId?: number;
  onPreview: (doc: LoadedDocumentFile | unknown) => void;
  onDownload?: (doc: LoadedDocumentFile | unknown) => void;
}


export interface AssetsFacilitiesContentProps {
  parentAssetId?: number | null;
  initialLookups?: InventoryLookups;
  initialBatches?: InventoryBatchListResponse | null;
  assetCategoryId?: number;
}

export interface AssetsFacilitiesTableProps {
  data: InventoryRow[];
  isLoading?: boolean;
  onDelete?: (id: number | string) => void;
  onEdit?: (item: InventoryRow) => void;
  onPreview?: (row: InventoryRow, type: "photo" | "invoice") => Promise<unknown> | void;
}

export interface ApiCategory {
  id: number;
  name?: string;
  categoryName?: string;
  facilityCategoryName?: string;
  assetCategoryId?: number;
  AssetCategoryId?: number | null;
  typeName?: string;
  typeCode?: string;
  [key: string]: unknown;
}

export interface ApiCondition {
  id: number;
  conditionName?: string;
  name?: string;
  categoryId?: number;
  CategoryId?: number;
  [key: string]: unknown;
}

export interface NAInvoiceDrawerProps {
  open: boolean;
  onClose: () => void;
  invoiceForm: {
    invoiceFileName?: string;
    invoiceFile?: File | null;
    invoiceNumber?: string;
    invoiceDate?: string;
    [key: string]: unknown;
  };
  updateInvoiceForm: (k: string, v: unknown) => void;
  invoiceInputRef: React.RefObject<HTMLInputElement | null>;
  handleInvoiceUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  saveInvoiceDetails: () => void;
  editingRow?: InventoryRow | null;
  onPreview: (doc: LoadedDocumentFile | unknown) => void;
  onDownload: (doc: LoadedDocumentFile | unknown) => void;
}

export interface SummaryCardsProps {
  data: InventoryRow[];
  categories: InventoryItemCategory[];
  onOpenAddModal?: () => void;
}
