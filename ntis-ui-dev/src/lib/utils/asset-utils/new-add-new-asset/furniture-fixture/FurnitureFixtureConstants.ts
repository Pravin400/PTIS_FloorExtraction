/* eslint-disable @typescript-eslint/no-explicit-any */
import { InventoryForm, InventoryRow, InventoryType, InvoiceForm, TypeMeta } from "@/types/asset/furniture-fixture.types";
import { furnitureMeta, itEquipmentMeta } from "@/lib/utils/asset-utils/new-add-new-asset/furniture-fixture/FurnitureFixtureMeta1";
import { electronicFixturesMeta, vehicleMeta } from "@/lib/utils/asset-utils/new-add-new-asset/furniture-fixture/FurnitureFixtureMeta2";
export const PAGE_SIZE = 8;

export const typeOptions = [
  { label: "Furniture", value: "furniture" },
  { label: "IT Equipment", value: "it-equipment" },
  { label: "Electronic Fixtures", value: "electronic-fixtures" },
  { label: "Vehicle", value: "vehicle" },
];

export const conditionMap: Record<InventoryType, any[]> = {
  furniture: [
    { label: "Excellent", value: "Excellent" },
    { label: "Good", value: "Good" },
    { label: "Fair", value: "Fair" },
    { label: "Poor", value: "Poor" },
  ],
  "it-equipment": [
    { label: "Working", value: "Working" },
    { label: "Not Working", value: "Not Working" },
  ],
  "electronic-fixtures": [
    { label: "Working", value: "Working" },
    { label: "Not Working", value: "Not Working" },
  ],
  vehicle: [
    { label: "Excellent", value: "Excellent" },
    { label: "Good", value: "Good" },
    { label: "Fair", value: "Fair" },
    { label: "Poor", value: "Poor" },
  ],
};

export const invoiceModeOptions = [
  { label: "Upload New Invoice", value: "upload" },
  { label: "Use Existing Invoice", value: "reuse" },
];

export const inventoryMeta: Record<InventoryType, TypeMeta> = {
  furniture: furnitureMeta,
  "it-equipment": itEquipmentMeta,
  "electronic-fixtures": electronicFixturesMeta,
  vehicle: vehicleMeta,
};

export const initialRows: InventoryRow[] = [];

export const emptyForm = (): InventoryForm => ({
  category: "",
  itemName: "",
  modelName: "",
  specifications: "",
  purchaseDate: "",
  condition: "",
  quantity: "",
  unitValue: "",
  photoName: "",
  photoUrl: "",
  owningDepartment: "",
});

export const emptyInvoiceForm = (): InvoiceForm => ({
  invoiceMode: "upload",
  existingInvoiceKey: "",
  invoiceNumber: "",
  invoiceDate: "",
  invoiceFileName: "",
});

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(value)
    .replace("INR", "₹");
}

export function formatCurrencyCompact(value: number): string {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(2).replace(/\.?0+$/, "")}Cr`;
  } else if (value >= 100000) {
    return `₹${(value / 100000).toFixed(2).replace(/\.?0+$/, "")}L`;
  }
  return formatCurrency(value);
}
