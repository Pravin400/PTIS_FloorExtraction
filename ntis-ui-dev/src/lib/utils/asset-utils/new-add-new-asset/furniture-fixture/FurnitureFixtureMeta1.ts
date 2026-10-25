 
import { Armchair, Cpu } from "lucide-react";
import { TypeMeta } from "@/types/asset/furniture-fixture.types";

export const furnitureMeta: TypeMeta = {
  label: "Furniture",
  icon: Armchair,
  cardRing: "border-l-4 border-l-violet-500",
  badgeClassName: "bg-violet-50 text-violet-700 border-violet-200",
  names: [
    { label: "Office Tables", value: "Office Tables" },
    { label: "Chairs (Executive)", value: "Chairs (Executive)" },
    { label: "Chairs (Staff)", value: "Chairs (Staff)" },
    { label: "Filing Cabinets", value: "Filing Cabinets" },
    { label: "Reception Desk", value: "Reception Desk" },
  ],
  modelMap: {
    "Office Tables": [
      { label: "Wooden", value: "Wooden" },
      { label: "Steel", value: "Steel" },
      { label: "Other (Specify)", value: "Other (Specify)" },
    ],
    "Chairs (Executive)": [
      { label: "Ergonomic", value: "Ergonomic" },
      { label: "Other (Specify)", value: "Other (Specify)" },
    ],
    "Chairs (Staff)": [
      { label: "Mesh Back", value: "Mesh Back" },
      { label: "Other (Specify)", value: "Other (Specify)" },
    ],
    "Filing Cabinets": [
      { label: "4-Drawer Steel", value: "4-Drawer Steel" },
      { label: "Other (Specify)", value: "Other (Specify)" },
    ],
    "Reception Desk": [
      { label: "Modular", value: "Modular" },
      { label: "Laminated", value: "Laminated" },
      { label: "Other (Specify)", value: "Other (Specify)" },
    ],
  },
};

export const itEquipmentMeta: TypeMeta = {
  label: "IT Equipment",
  icon: Cpu,
  cardRing: "border-l-4 border-l-blue-500",
  badgeClassName: "bg-blue-50 text-blue-700 border-blue-200",
  names: [
    { label: "Desktop Computers", value: "Desktop Computers" },
    { label: "Laptops", value: "Laptops" },
    { label: "Printers", value: "Printers" },
    { label: "Scanners", value: "Scanners" },
    { label: "UPS Systems", value: "UPS Systems" },
    { label: "Biometric Devices", value: "Biometric Devices" },
    { label: "CCTV Systems", value: "CCTV Systems" },
  ],
  modelMap: {
    "Desktop Computers": [
      { label: "Other (Specify)", value: "Other (Specify)" },
    ],
    Laptops: [
      { label: "Lenovo ThinkPad", value: "Lenovo ThinkPad" },
      { label: "Other (Specify)", value: "Other (Specify)" },
    ],
    Printers: [
      { label: "HP LaserJet", value: "HP LaserJet" },
      { label: "Other (Specify)", value: "Other (Specify)" },
    ],
    Scanners: [
      { label: "Canon CanoScan", value: "Canon CanoScan" },
      { label: "Other (Specify)", value: "Other (Specify)" },
    ],
    "UPS Systems": [
      { label: "APC Back-UPS", value: "APC Back-UPS" },
      { label: "Other (Specify)", value: "Other (Specify)" },
    ],
    "Biometric Devices": [
      { label: "ZKTeco MB360", value: "ZKTeco MB360" },
      { label: "Other (Specify)", value: "Other (Specify)" },
    ],
    "CCTV Systems": [
      { label: "Hikvision DS Series", value: "Hikvision DS Series" },
      { label: "Other (Specify)", value: "Other (Specify)" },
    ],
  },
};
