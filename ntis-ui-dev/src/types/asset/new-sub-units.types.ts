/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Room, OffsetEntry, DimKey } from "@/lib/utils/asset-utils/room-utils";

export interface SubUnitRoomConfigSectionProps {
  roomsList: any[];
  openSpacesList: any[];
  area: number;
  setIsRoomsDrawerOpen: (val: boolean) => void;
  setIsOpenSpacesDrawerOpen: (val: boolean) => void;
  t: (key: string, values?: any) => string;
}

export interface SubUnitRentSectionProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  errors?: Record<string, string>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  selectOnFocus: (e: React.FocusEvent<HTMLInputElement>) => void;
  t: (key: string, values?: any) => string;
  inpClass: string;
}

export interface SubUnitMediaSectionProps {
  photoPreview: string | null;
  planPreview: string | null;
  setPhotoPreview: (val: string | null) => void;
  setPlanPreview: (val: string | null) => void;
  setPhotoFile: (file: File | null) => void;
  setPlanFile: (file: File | null) => void;
  photoRef: React.RefObject<HTMLInputElement | null>;
  planRef: React.RefObject<HTMLInputElement | null>;
  handlePhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePlanChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  t: (key: string, values?: any) => string;
}

export interface SubUnitHeaderProps {
  unitNumber: string;
  parentBuildingName: string;
  onCancel: () => void;
  t: (key: string, values?: any) => string;
}

export interface SubUnitFooterProps {
  onCancel: () => void;
  onSave: () => void;
  t: (key: string, values?: any) => string;
}

export interface SubUnitFloorSectionProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleFloorSelect: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  floorSelectOptions: any[];
  subFloorOptions: any[];
  dropdownOptions: any;
  dynamicSubUseTypes: any[];
  area: number;
  t: (key: string, values?: any) => string;
  inpClass: string;
}

export interface SubUnitDrawersProps {
  formData: any;
  setFormData: (val: any) => void;
  roomsList: any[];
  setRoomsList: (val: any[]) => void;
  openSpacesList: any[];
  setOpenSpacesList: (val: any[]) => void;
  isRoomsDrawerOpen: boolean;
  setIsRoomsDrawerOpen: (val: boolean) => void;
  isOpenSpacesDrawerOpen: boolean;
  setIsOpenSpacesDrawerOpen: (val: boolean) => void;
}

export interface RoomWiseSubmissionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  unit: any;
  onSaveRooms: (rooms: Room[], calculatedAreaSqFt: number) => void;
  roomTypes?: any[];
}

export interface RoomTableProps {
  rooms: Room[];
  carpetSqM: number;
  carpetSqFt: number;
  builtUpSqM: number;
  builtUpSqFt: number;
  toggleOffset: (roomId: string, val: "Yes" | "No") => void;
  handleEdit: (r: Room) => void;
  handleDelete: (id: string) => void;
  t: (key: string, values?: any) => string;
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
  t: (key: string, values?: any) => string;
}

export interface OpenSpaceSubmissionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  spaces: any[];
  onSaveSpaces: (spaces: any[], calculatedAreaSqFt: number) => void;
}

export interface OpenSpaceConfigSectionProps {
  drawerState: any;
  setMainDim: (key: DimKey, val: string) => void;
  setShape: (shape: string) => void;
  t: (key: string) => string;
}

export interface SubUnitBasicInfoSectionProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  selectOnFocus: (e: React.FocusEvent<HTMLInputElement>) => void;
  sectionTitle: string;
  parentBuildingName: string;
  departments: { label: string; value: string }[];
  isShop: boolean;
  isOffice: boolean;
  isRoom: boolean;
  isDepartment: boolean;
  t: (key: string, values?: any) => string;
  inpClass: string;
}

export interface OffsetPopupProps {
  offsetRoom: any;
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
  t: (key: string, values?: any) => string;
}

export interface OffsetHistoryListProps {
  drawerOffsets: OffsetEntry[];
  handleRemoveOffsetFromHistory: (entryId: string) => void;
}

export interface CustomDigitInputProps {
  value: string;
  onChange: (val: string) => void;
  length: number;
  type?: "numeric" | "alphanumeric";
  groupSizes?: number[];
  showPrefix?: string;
}

export interface AmenitySubmissionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  amenities: any[];
  onSaveAmenities: (amenities: any[], calculatedAreaSqFt: number) => void;
}

export interface AmenityConfigSectionProps {
  drawerState: any;
  setMainDim: (key: DimKey, val: string) => void;
  setShape: (shape: string) => void;
  t: (key: string) => string;
}

export interface SubUnitDetailedConfiguratorProps {
  unit: any;
  parentBuildingName: string;
  onSave: (updatedUnit: any) => void;
  onCancel: () => void;
  floors?: any[];
  dropdownOptions?: any;
  departments?: { label: string; value: string }[];
}

export interface RoomDisplayRow {
  id: string;
  room: Room;
  idx: number;
  isGroup: boolean;
  displayNo: string | number;
}

/** Minimal shape any offset-bearing entity (Room/Amenity/OpenSpace) needs to expose for this popup. */
export interface OffsetTarget {
  areaSqM: number;
  roomNo: string;
}

export interface AmenityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  amenities: any[];
  onSaveAmenities: (amenities: any[], calculatedAreaSqFt: number) => void;
}

export interface OpenSpaceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  spaces: any[];
  onSaveSpaces: (spaces: any[], calculatedAreaSqFt: number) => void;
}

export interface OffsetEntryFormProps {
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
  handleAddOffsetToHistory: () => void;
  t: (key: string, values?: any) => string;
}

export interface DepartmentOccupantFieldsProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  errors?: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  selectOnFocus: (e: React.FocusEvent<HTMLInputElement>) => void;
  handleLocalRenterNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleLocalRenterNameBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  inp: string;
  t: (key: string, values?: any) => string;
}

export interface FlatOccupantFieldsProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  errors?: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleLocalRenterNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleLocalRenterNameBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  inp: string;
  t: (key: string, values?: any) => string;
}

export interface OfficeOccupantFieldsProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  errors?: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleLocalNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleLocalNameBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  handleLocalRenterNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleLocalRenterNameBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  inp: string;
  t: (key: string, values?: any) => string;
}

export interface RoomOccupantFieldsProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  errors?: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleLocalRenterNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleLocalRenterNameBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  inp: string;
  t: (key: string, values?: any) => string;
}

export interface ShopOccupantFieldsProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  errors?: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleLocalNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleLocalNameBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  handleLocalRenterNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleLocalRenterNameBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  inp: string;
  t: (key: string, values?: any) => string;
}

export interface SubUnitOccupantFieldsProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  errors?: Record<string, string>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleLocalNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleLocalNameBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  handleLocalRenterNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleLocalRenterNameBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  selectOnFocus: (e: React.FocusEvent<HTMLInputElement>) => void;
  isShop: boolean;
  isOffice: boolean;
  isRoom: boolean;
  isDepartment: boolean;
  inp: string;
  t: (key: string, values?: any) => string;
}

export interface StandaloneParentBuildingBannerProps {
  t: (key: string, values?: any) => string;
  parentBuildingName: string;
  assetType: string;
  parentBuildingData: any;
}

export interface StandaloneUnitGeneratorPanelProps {
  t: (key: string, values?: any) => string;
  fromNo: number;
  setFromNo: (val: number) => void;
  toNo: number;
  setToNo: (val: number) => void;
  parentFloors: any[];
  selectedFloorId: number;
  setSelectedFloorId: (val: number) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  unitsCount: number;
}

export interface StandaloneUnitsTableProps {
  t: any;
  units: any[];
  dropdownOptions?: any;
  isGenerating: boolean;
  onConfigureUnit: (unit: any) => void;
  onDeleteUnit: (unit: any) => void;
}

export interface StandaloneUnitsTableColumnsArgs {
  t: any;
  dropdownOptions?: any;
  isGenerating: boolean;
  onConfigureUnit: (unit: any) => void;
  onDeleteUnit: (unit: any) => void;
}

export interface SubUnitAreaSummaryFieldsProps {
  submissionType: 'Construction' | 'Open Space';
  area: number;
  setIsOpenSpacesDrawerOpen: (val: boolean) => void;
  t: (key: string, values?: any) => string;
}

/** Distinct from SubUnitBasicInfoSectionProps above — that one backs a different component. */
export interface SubUnitBasicInfoCardProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  errors?: Record<string, string>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleLocalNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleLocalNameBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  handleLocalRenterNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleLocalRenterNameBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  handleRenterToggle: (val: string) => void;
  selectOnFocus: (e: React.FocusEvent<HTMLInputElement>) => void;
  departments: { label: string; value: string }[];
  sectionTitle: string;
  showRentSection: boolean;
  isRenter: boolean;
  isShop: boolean;
  isOffice: boolean;
  isRoom: boolean;
  isDepartment: boolean;
  inp: string;
  t: (key: string, values?: any) => string;
}

export interface SubUnitBusinessIdFieldsProps {
  formData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  errors?: Record<string, string>;
  inp: string;
  t: (key: string, values?: any) => string;
}

export interface SubUnitConfiguratorBodyProps {
  loading: boolean;
  occupantFieldProps: any;
  handleRenterToggle: (val: string) => void;
  departments: any;
  sectionTitle: string;
  showRentSection: boolean;
  isRenter: boolean;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleFloorSelect: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleUseTypeSelect: (typeId: string) => void;
  floorSelectOptions: any[];
  dropdownOptions: any;
  subFloorOptions: any[];
  dynamicSubUseTypes: any[];
  submissionType: 'Construction' | 'Open Space';
  setSubmissionType: (val: 'Construction' | 'Open Space') => void;
  roomsList: any[];
  setRoomsList: React.Dispatch<React.SetStateAction<any[]>>;
  openSpacesList: any[];
  setOpenSpacesList: React.Dispatch<React.SetStateAction<any[]>>;
  setIsRoomsDrawerOpen: (val: boolean) => void;
  setIsOpenSpacesDrawerOpen: (val: boolean) => void;
  area: number;
  inp: string;
  t: (key: string, values?: any) => string;
  initialPhotoSlots: any;
  initialPhotos: any;
  isFetchingDb: boolean;
  handleFileStaged: (photoTypeCode: string, file: File) => void;
  handleFileUnstaged: (photoTypeCode: string, fileOrIndex: File | number) => void;
}

export interface SubUnitConfiguratorDrawersProps {
  isRoomsDrawerOpen: boolean;
  setIsRoomsDrawerOpen: (val: boolean) => void;
  isOpenSpacesDrawerOpen: boolean;
  setIsOpenSpacesDrawerOpen: (val: boolean) => void;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  roomsList: any[];
  setRoomsList: React.Dispatch<React.SetStateAction<any[]>>;
  openSpacesList: any[];
  setOpenSpacesList: React.Dispatch<React.SetStateAction<any[]>>;
  dropdownOptions: any;
}

export interface SubUnitConfiguratorFooterProps {
  onCancel: () => void;
  onSaveClick: () => void;
  t: (key: string, values?: any) => string;
}

export interface SubUnitConfiguratorHeaderProps {
  parentBuildingName: string;
  unitNumber: string;
  onCancel: () => void;
  t: (key: string, values?: any) => string;
}

export interface SubUnitContactIdentityFieldsProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  errors?: any;
  t: (key: string, values?: any) => string;
}

export interface SubUnitFloorClassificationFieldsProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleFloorSelect: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleUseTypeSelect: (typeId: string) => void;
  floorSelectOptions: any[];
  dropdownOptions: any;
  subFloorOptions: any[];
  dynamicSubUseTypes: any[];
  submissionType: 'Construction' | 'Open Space';
  setSubmissionType: (val: 'Construction' | 'Open Space') => void;
  roomsList: any[];
  setRoomsList: React.Dispatch<React.SetStateAction<any[]>>;
  setIsRoomsDrawerOpen: (val: boolean) => void;
  inp: string;
  t: (key: string, values?: any) => string;
}

export interface SubUnitFloorConstructionCardProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleFloorSelect: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleUseTypeSelect: (typeId: string) => void;
  floorSelectOptions: any[];
  dropdownOptions: any;
  subFloorOptions: any[];
  dynamicSubUseTypes: any[];
  submissionType: 'Construction' | 'Open Space';
  setSubmissionType: (val: 'Construction' | 'Open Space') => void;
  roomsList: any[];
  setRoomsList: React.Dispatch<React.SetStateAction<any[]>>;
  openSpacesList: any[];
  setOpenSpacesList: React.Dispatch<React.SetStateAction<any[]>>;
  setIsRoomsDrawerOpen: (val: boolean) => void;
  setIsOpenSpacesDrawerOpen: (val: boolean) => void;
  area: number;
  inp: string;
  t: (key: string, values?: any) => string;
}

export interface SubUnitRentInfoCardProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  errors?: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleLocalNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleLocalNameBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  handleLocalRenterNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleLocalRenterNameBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  selectOnFocus: (e: React.FocusEvent<HTMLInputElement>) => void;
  isShop: boolean;
  isOffice: boolean;
  isRoom: boolean;
  isDepartment: boolean;
  inp: string;
  t: (key: string, values?: any) => string;
}

export interface SubUnitRoomsAndSpacesTablesProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  roomsList: any[];
  setRoomsList: React.Dispatch<React.SetStateAction<any[]>>;
  openSpacesList: any[];
  setOpenSpacesList: React.Dispatch<React.SetStateAction<any[]>>;
  setIsRoomsDrawerOpen: (val: boolean) => void;
  setIsOpenSpacesDrawerOpen: (val: boolean) => void;
  t: (key: string, values?: any) => string;
}
