import type { DuplicateEntry } from '@/hooks/asset-hooks/floor-details/useSubUnitDuplicateMode';
import type React from 'react';
import type { LoadedDocumentFile } from "./document-helpers.types";

export interface NAAssetPlanDrawingsProps {
  documents?: LoadedDocumentFile[];
}

export interface NAFloorTableProps {
  floors: unknown[];
  onAdd?: () => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => Promise<void>;
  onGenerateUnits?: () => void;
  showGenerateUnits?: boolean;
  typeId?: number;
}

export interface FloorComponentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  assetId: number;
  categoryId: number;
  typeId: number;
  categoryStr: string;
  assetTypeStr: string;
  mode?: 'floorSubmission' | 'generateUnits';
  editFloorId?: number | null;
  onSuccess?: (savedFloorItem?: unknown, options?: { keepDrawerOpen?: boolean }) => void;
}

export interface FloorDrawerContentProps {
  assetId: number;
  categoryId: number;
  typeId: number;
  categoryStr: string;
  assetTypeStr: string;
  mode?: 'floorSubmission' | 'generateUnits';
  editFloorId?: number | null;
  onSuccess?: (savedFloorItem?: unknown, options?: { keepDrawerOpen?: boolean }) => void;
}

export interface FloorConfigRowProps {
  newFloor: {
    conYear?: string;
    useType?: string;
    floor?: string;
    conType?: string;
    subUseType?: string;
    rooms?: number;
    carpetAreaSqM?: number;
    builtUpAreaSqM?: number;
    baseValue?: number;
    [key: string]: unknown;
  };
  errors: Record<string, string | undefined>;
  floorLevels: (string | { label?: string | number; value?: string | number })[];
  constructionTypes: (string | { label?: string | number; value?: string | number })[];
  useTypes: (string | { label?: string | number; value?: string | number })[];
  subUseTypes: (string | { label?: string | number; value?: string | number })[];
  onFloorChange: (e: unknown) => void;
  onConTypeChange: (e: unknown) => void;
  onConYrChange: (e: unknown) => void;
  onUseTypeChange: (e: unknown) => void;
  onSelect: (field: string) => (e: unknown) => void;
  setField: (field: string) => (val: unknown) => void;
  handleAddFloor: () => void;
}

export interface UnitPoolPanelHeaderProps {
  poolCount?: number;
  savedCount?: number;
  t?: (key: string, values?: Record<string, string | number | Date>) => string;
  isUnitGenerationEnabled?: boolean;
  onToggle?: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface DuplicateEntriesTableProps {
  entries: DuplicateEntry[];
  onEdit: (entry: DuplicateEntry) => void;
  onDelete: (entryId: string) => void;
  conTypeLabelMap?: Map<string, string>;
  dropdownOptions?: {
    useTypes?: { label?: string | number; value?: string | number }[];
    constructionTypes?: { label?: string | number; value?: string | number }[];
    subUseTypes?: { label?: string | number; value?: string | number }[];
    [key: string]: unknown;
  };
  dynamicSubUseTypes?: { label?: string | number; value?: string | number }[];
  editingEntryId?: string | null;
  isUnitRenter?: boolean;
}

export type SortKey =
  | 'floor'
  | 'subFloor'
  | 'conYear'
  | 'asstYear'
  | 'conType'
  | 'useType'
  | 'subUseType'
  | 'renter'
  | 'rooms'
  | 'carpet'
  | 'builtup';

import type { PropertyPhotoTypeWithStatusDto, PropertyPhotoDto } from '@/types/photoplan.types';

export interface NASubUnitMediaProps {
  initialPhotoSlots?: PropertyPhotoTypeWithStatusDto[] | unknown;
  initialPhotos?: PropertyPhotoDto[] | unknown;
  isFetchingDb?: boolean;
  onFileStaged?: (photoTypeCode: string, file: File) => void;
  onFileUnstaged?: (photoTypeCode: string, fileOrIndex: number | File) => void;
  onFileReplaced?: (photoTypeCode: string, newFile: File, oldFile?: File, targetImg?: unknown, index?: number) => void;
  onDbPhotoRemoved?: (photoId: number) => void;
  subUnit?: unknown;
  onUploadPhoto?: (file: File) => void;
  onUploadPlan?: (file: File) => void;
}
