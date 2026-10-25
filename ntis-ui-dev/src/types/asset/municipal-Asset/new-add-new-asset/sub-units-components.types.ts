import type React from "react";
import type { Room, DimKey, OffsetEntry } from "@/lib/utils/asset-utils/room-utils";
import type { OpenSpace } from "@/hooks/asset-hooks/useOpenSpaceDrawer";

export interface OffsetPopupProps {
  offsetRoom: {
    roomNo?: string | number;
    areaSqM: number;
    outer?: string;
    minus?: string;
    [key: string]: unknown;
  } | Room | OpenSpace | Record<string, unknown> | null;
  entityLabel?: string;
  drawerOffsets: OffsetEntry[];
  tempOffsetShape: string;
  setTempOffsetShape: (val: string) => void;
  tempOffsetLength: number;
  setTempOffsetLength: (val: number) => void;
  tempOffsetWidth: number;
  setTempOffsetWidth: (val: number) => void;
  tempOffsetHeight: number;
  setTempOffsetHeight: (val: number) => void;
  tempOffsetBase1: number;
  setTempOffsetBase1: (val: number) => void;
  tempOffsetBase2: number;
  setTempOffsetBase2: (val: number) => void;
  tempOffsetRadius: number;
  setTempOffsetRadius: (val: number) => void;
  tempOffsetOp: "Add" | "Subtract";
  setTempOffsetOp: (val: "Add" | "Subtract") => void;
  tempOffsetAreaSqM: number;
  drawerNetAdjustmentSqM: number;
  handleAddOffsetToHistory: () => void;
  handleRemoveOffsetFromHistory: (entryId: string) => void;
  handleDrawerClose: () => void;
  handleOkSave: () => void;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}

export interface OpenSpaceDisplayRow {
  id: string;
  space: OpenSpace;
  idx: number;
  isGroup: boolean;
  displayNo: string;
}

export interface RoomFormProps {
  form: Room;
  setForm: React.Dispatch<React.SetStateAction<Room>>;
  roomsLength: number;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  setShape: (shape: string) => void;
  setMainDim: (key: DimKey, val: string) => void;
  handleFormOffsetToggle: (val: "Yes" | "No") => void;
  setIsFormOffsetOpen: (val: boolean) => void;
  handleAdd: () => void;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  roomTypes?: (string | { label?: string | number; value?: string | number; id?: string | number; name?: string })[];
}

export type ShapePreviewColor = "indigo" | "violet" | "emerald" | "amber" | "blue";

export interface ShapePreviewProps {
  shape: string;
  areaSqM: number;
  label?: string | number;
  color?: ShapePreviewColor;
  length?: number | string;
  width?: number | string;
  height?: number | string;
  base1?: number | string;
  base2?: number | string;
  radius?: number | string;
}

export interface SubUnitDetailedConfiguratorProps {
  unit: Record<string, unknown> | null;
  parentBuildingName: string;
  onSave: (updatedUnit: Record<string, unknown>) => void;
  onCancel: () => void;
  floors?: Record<string, unknown>[];
  dropdownOptions?: Record<string, unknown>;
  departments?: { label: string; value: string }[];
  suppressToast?: boolean;
}

export interface SubUnitDocumentsPanelProps {
  formData: Record<string, unknown>;
}
