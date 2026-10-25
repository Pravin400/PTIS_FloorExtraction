/* eslint-disable @typescript-eslint/no-explicit-any */
import { RefObject, ChangeEvent } from 'react';

/**
 * Floor Details & Media — Type Definitions
 * Scope: municipal-Asset / add-New-Asset / floor-details screen only.
 * Do NOT modify types shared with other screens here.
 */

/* ── Floor record stored in AssetFormContext ──────────────────────────────── */
export interface FloorEntry {
  id: number;
  checked: boolean;
  floor: string;
  conYear: string;
  asstYear: string;
  conType: string;
  useType: string;
  subUseType: string;
  rooms: number;
  carpetAreaSqFt: number;
  carpetAreaSqM: number;
  builtUpAreaSqFt: number;
  builtUpAreaSqM: number;
  baseValue: number;
  floorFactor: string;
  ageFactor: number;
  units: SubUnit[];
  // Set to true when carpet/built-up area was auto-calculated from sub-units
  isAreaFromSubUnits?: boolean;
}

/* ── Sub-unit record stored per floor ───────────────────────────────────────*/
export interface SubUnit {
  id: number;
  unitNumber: string;
  unitType: string;
  carpetAreaSqFt: number;
  status: string;
  baseValue: number;
  floorId?: number;
  floorDetailsId?: number;
}

/* ── Pool unit: generated locally against parent asset ──────────────────── */
export interface PoolUnit {
  tempId: string; // local-only ID until saved to DB
  dbId: number | null; // DB ID after save (null = not yet saved)
  id?: number | null;
  assetId?: number | null;
  unitNumber: string; // e.g. FLAT-101
  unitType: string; // Flat | Shop | Office | Room | Department
  selectedFloorId: number | null; // floor master ID (null = not yet assigned)
  selectedFloorLabel: string; // display name for the assigned floor
  floorDetailsId?: number | null;
  carpetAreaSqFt: number; // 0 until rooms are configured
  builtUpAreaSqFt?: number;
  rooms: any[]; // room-wise details
  renterDetails: any | null; // rent / owner KYC info
  isSaved: boolean; // true once persisted in DB
  isModified: boolean; // true when details changed after save
  // Department assignment
  departmentId?: number | null;
  departmentName?: string;
  // Location tracking
  locationAddress?: string;
  locationLat?: string;
  locationLng?: string;
  // Construction details (per-unit, set in configurator)
  conYear?: string;
  asstYear?: string;
  conType?: string;
  useType?: string;
  subUseType?: string;
  subTypeOfUseName?: string | null;
  photoFile?: File | null;
  planFile?: File | null;
  stagedFiles?: Record<string, File[]> | null;
  // Missing properties from UnitPoolPanel.tsx
  isRenter?: boolean;
  renterName?: string | null;
  mobileNo?: string | null;
  emailId?: string | null;
  gstNo?: string | null;
  aadhaarCardNo?: string | null;
  panCardNo?: string | null;
  propertyDescription?: string | null;
  capitalValue?: number | null;
  cvBaseRate?: number | null;
  baseValue?: number | null;
  cvFloorFactor?: number | null;
  cvAgeFactor?: number | null;
  cvNatureFactor?: number | null;
  cvUseFactor?: number | null;
  agreementId?: string | null;
  agreementNo?: string | null;
  rentInformation?: RentInformationDto | null;
  subFloorId?: number | null;

  // Property registration numbers
  propertyNo?: string | null;
  unitNo?: string | null;
  surveyNo?: string | null;
  partitionNo?: string | null;
  mpmsNo?: string | null;
  pTaxId?: string | null;
  PTaxId?: string | null;
  // Unit name (for shop/office/department)
  unitName?: string | null;
  unitNameLocal?: string | null;
  shopName?: string | null;
  shopRegionalName?: string | null;
  tenantAddress?: string | null;
}

/* ── Form state for the "add new floor" row ─────────────────────────────────*/
export interface NewFloorFormState {
  floor: string;
  conYear: string;
  asstYear: string;
  conType: string;
  useType: string;
  subUseType: string;
  rooms: number;
  carpetAreaSqM: number;
  builtUpAreaSqM: number;
  baseValue: number;
}

/* ── Bulk unit generator form state ─────────────────────────────────────────*/
export interface BulkGeneratorState {
  unitType: string;
  prefix: string;
  startNum: number;
  count: number;
  areaSqFt: number;
}

/* ── Component props ─────────────────────────────────────────────────────── */
export interface MediaDetailsStepProps {
  formData: any;
  photoUrl: string | null;
  photoFile: File | null;
  planUrl: string | null;
  photoInputRef: RefObject<HTMLInputElement | null>;
  planInputRef: RefObject<HTMLInputElement | null>;
  onPhotoUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  onPlanUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  onOpenMap: () => void;
}

export interface RoomWiseSubmissionStepProps {
  isOpen: boolean;
  onClose: () => void;
  floorId: number | null;
  currentFloor?: FloorEntry;
  localUnits: SubUnit[];
  bulk: BulkGeneratorState;
  activeUnit: SubUnit | null;
  dropdownOptions?: FloorDropdownOptions | null;
  allFloors?: FloorEntry[]; // all building floors — passed to unit configurator
  onBulkChange: (updated: Partial<BulkGeneratorState>) => void;
  onGenerateBulk: () => void;
  onDeleteUnit: (id: number) => void;
  onSaveSubUnits: () => void;
  setActiveUnit: (unit: SubUnit | null) => void;
  onSaveUnitDetail: (updated: SubUnit) => void;
  setLocalUnits: (units: SubUnit[]) => void;
}

export interface FloorDetailApiRequest {
  isActive: boolean;
  createdBy?: number;
  assetId: number;
  floorId: number;
  subFloorId?: number;
  constructionYear: string;
  assessmentYear: string | null;
  constructionTypeId: number;
  typeOfUseId: number;
  subTypeOfUseId: number | null;
  carpetAreaSqMeter: number;
  carpetAreaSqFeet: number;
  builtUpAreaSqMeter: number;
  builtUpAreaSqFeet: number;
  noOfRooms: number;
  isRented?: boolean;
  rentMonthly?: number | null;
  rentYearly?: number | null;
  nonCalculateRentMonthly?: number | null;
  renterNameEnglish?: string | null;
  renterNameLocal?: string | null;
  agreementFromDate?: string | null;
  agreementDate?: string | null;
  agreementToDate?: string | null;
  taxLiability?: string | null;
  isTaxable?: boolean;
  occupancyDate?: string | null;
  occupancyApplied?: boolean | null;
  occupancyNumber?: string | null;
  capitalValue?: number | null;
  marketValue?: number | null;
  baseValue?: number | null;
  lastCVCalculationDate?: string | null;
  cvBaseRate?: number | null;
  cvAgeFactor?: number | null;
  cvFloorFactor?: number | null;
  cvNatureFactor?: number | null;
  cvUseFactor?: number | null;
  cvCalculationFormula?: string | null;
  markedForDeletion?: boolean;
  markedForDeletionDate?: string | null;
}

export interface FloorDetailApiResponse extends FloorDetailApiRequest {
  id: number;
  createdDate: string;
  updatedDate?: string | null;
  subFloorName?: string | null;
  subTypeOfUseName?: string | null;
  useTypeName?: string | null;
  roomDetails?: any[] | null;
  roomWiseDetails?: any[] | null;
}

export interface SubUnitApiRequest {
  floorDetailId: number;
  unitNumber: string;
  unitType: string;
  carpetAreaSqFt: number;
  status: string;
  baseValue: number;
  isActive: boolean;
}

export interface SubUnitApiResponse extends SubUnitApiRequest {
  id: number;
  createdDate: string;
  modifiedDate?: string;
}

/* ── Select option helpers (used by form dropdowns) ─────────────────────────*/
export interface FloorSelectOption {
  label: string;
  value: string;
  typeOfUseId?: string | null;
}

export interface FloorDropdownOptions {
  floorLevels: FloorSelectOption[];
  constructionTypes: FloorSelectOption[];
  useTypes: FloorSelectOption[];
  subUseTypes: FloorSelectOption[];
  unitTypes: FloorSelectOption[];
  roomTypes?: FloorSelectOption[];
}

/* ── ManageSubUnits API Types ────────────────────────────────────────────── */
export interface BulkGenerateChildAssetsRequest {
  parentAssetId: number;
  type: string;
  count: number;
  // Optional fields — floor/prefix/startNumber no longer needed from frontend
  floorDetailsId?: number;
  prefix?: string;
  startNumber?: number;
  areaSqFt?: number;
  createdBy?: number;
}

export interface GeneratedAssetDto {
  assetId: number;
  assetNo: string;
  assetName: string;
  roomWiseSubmissionDetailsId?: number | null;
}

export interface BulkGenerateChildAssetsResponse {
  totalGenerated: number;
  generatedAssets: GeneratedAssetDto[];
  errors: string[];
}

export interface RentInformationDto {
  leaseRentType?: string | null;
  leaseStart?: string | null;
  leaseEnd?: string | null;
  agreementId?: string | null;
  agreementNo?: string | null;
  duration?: number | null;
  rentFrequency?: string | null;
  rentAmount?: number | null;
  securityDeposit?: number | null;
  depositType?: string | null;
  shopName?: string | null;
  shopRegionalName?: string | null;
  tenantAddress?: string | null;
}

export interface FloorConfigurationDto {
  unitAreaSqFt?: number | null;
  calculatedCapitalValue?: number | null;
}

export interface RoomDetailDto {
  lengthMtr?: number | null;
  widthMtr?: number | null;
  heightMtr?: number | null;
  areaSqMtr?: number | null;
  base1Mtr?: number | null;
  base2Mtr?: number | null;
  noOfRooms?: number | null;
  totalAreaSqMtr?: number | null;
  roomNo?: string | null;
  roomType?: string | null;
  shape?: string | null;
  submissionType?: string | null;
  outerYesNo: boolean;
  minusYesNo: boolean;
}

export interface CreateChildAssetRequest {
  parentAssetId: number;
  assetId: number;
  floorDetailsId?: number;
  floorId?: number | null;
  complexName?: string | null;
  renterName?: string | null;
  propertyDescription?: string | null;
  shopUnitName?: string | null;
  shopUnitNameLocal?: string | null;
  zoneNo?: number | null;
  unitNo?: string | null;
  wardNo?: number | null;
  propertyNo?: string | null;
  partitionNo?: string | null;
  mpmsNo?: string | null;
  pTaxId?: string | null;
  PTaxId?: string | null;
  mobileNo?: string | null;
  surveyNo?: string | null;
  emailId?: string | null;
  gstNo?: string | null;
  totalAreaSqFt?: number | null;
  agreementId?: string | null;
  agreementNo?: string | null;
 
  aadhaarCardNo?: string | null;
  panCardNo?: string | null;
  createdBy?: number | null;
  rentInformation?: RentInformationDto | null;
  // Gates renter/lease registration in createChildAssetAction — only attempt it when the
  // "RENTER: Yes/No" toggle is actually Yes. renterName can stay populated even when the
  // toggle is No (it doubles as the shop occupant's identity), so it alone must not trigger
  // a registration attempt.
  isRenter?: boolean;
  floorConfiguration?: FloorConfigurationDto | null;
  isRoomWiseValuationActive: boolean;
  roomDetails?: RoomDetailDto[] | null;
  // Department & Location
  departmentId?: number | null;
  locationAddress?: string | null;
  locationLat?: string | null;
  locationLng?: string | null;
  rooms?: any[] | null;
  subFloorId?: number | null;
  // ── SubUnitsDetails fields (persisted to AMS.SubUnitsDetails by backend STEP 5) ──
  constructionTypeId?: number | null;
  typeOfUseId?: number | null;
  subTypeOfUseId?: number | null;
  carpetAreaSqMeter?: number | null;
  carpetAreaSqFeet?: number | null;
  builtupAreaSqMeter?: number | null;
  builtupAreaSqFeet?: number | null;
  photoFile?: File | null;
  planFile?: File | null;
  stagedFiles?: Record<string, File[]> | null;
  upicId?: string | null;
  assetWardNo?: string | null;
  constructionYear?: string | null;
  assessmentYear?: string | null;
}

export interface CreateChildAssetResponse {
  success: boolean;
  message: string;
  assetId?: number | null;
  assetNo?: string | null;
  shopUnitName?: string | null;
  roomWiseSubmissionDetailsId?: number | null;
  subUnitsDetailsId?: number | null;
  renterDetailsId?: number | null;
  errors: string[];
}

/* ── Bulk generator / child asset drawer props ───────────────────────────── */
export interface BulkGeneratorSectionProps {
  bulkType: string;
  setBulkType: (v: string) => void;
  bulkPrefix: string;
  setBulkPrefix: (v: string) => void;
  bulkStartNum: number;
  setBulkStartNum: (v: number) => void;
  bulkCount: number;
  setBulkCount: (v: number) => void;
  handleGenerateBulk: () => void;
}

export interface ChildAssetDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  floorId: number | null;
}

/* ── Direct room registration props ──────────────────────────────────────── */
export interface DirectRoomRegistrationPanelProps {
  dropdownOptions: any;
  initialFloors?: any[];
  initialSubUnits?: any[];
  editEventRegistry?: React.MutableRefObject<{ triggerEdit?: (childAssetId: number) => void }>;
  initialSubUseTypeMap?: Record<string, any[]>;
  initialSubFloorOptions?: any[];
  initialSubUseTypeOptions?: any[];
  editFloorId?: number | null;
  onSuccess?: (savedFloorItem?: any) => void;
}

export interface DirectRoomRegistrationTableProps {
  savedFloors: any[];
  dropdownOptions: any;
  isLoading: boolean;
  handleEdit: (f: any) => void;
  handleDelete: (id: number) => void;
  t: (key: string, values?: any) => string;
}

/* ── Floor configurator field props ──────────────────────────────────────── */
export interface FloorAreaFieldsProps {
  t: any;
  formState: any;
  handleRoomsDrawerOpen: () => void;
  handleOpenSpacesDrawerOpen: () => void;
}

export interface FloorClassificationFieldsProps {
  t: any;
  formState: any;
  setFormState: React.Dispatch<React.SetStateAction<any>>;
  dropdownOptions: any;
  subFloorOptions: any[];
  subUseTypeOptions: any[];
}

export interface FloorConfigRowProps {
  newFloor: NewFloorFormState;
  errors: Partial<Record<keyof NewFloorFormState, string>>;
  floorLevels: FloorSelectOption[];
  constructionTypes: FloorSelectOption[];
  useTypes: FloorSelectOption[];
  subUseTypes: FloorSelectOption[];
  onFloorChange: (_name: string, val: string) => void;
  onConTypeChange: (_name: string, val: string) => void;
  onConYrChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUseTypeChange: (_name: string, val: string) => void;
  onSelect: (key: keyof NewFloorFormState) => (_name: string, val: string) => void;
  setField: <K extends keyof NewFloorFormState>(key: K) => (val: NewFloorFormState[K]) => void;
  handleAddFloor: () => void;
}

export interface NewFloorFormProps {
  newFloor: any;
  setNewFloor: React.Dispatch<React.SetStateAction<any>>;
  handleAddFloor: () => void;
}

export interface FloorDetailsMapCardProps {
  formData: any;
  setIsMapOpen: (open: boolean) => void;
}

/* ── Floor registration form props ───────────────────────────────────────── */
export interface FloorRegistrationActionButtonsProps {
  t: any;
  editingId: number | null;
  onCancelEdit: () => void;
  onAddFloor: () => void;
  isLoading: boolean;
}

export interface FloorRegistrationDrawersProps {
  formState: any;
  setFormState: React.Dispatch<React.SetStateAction<any>>;
  dropdownOptions: any;
  isRenterDrawerOpen: boolean;
  setIsRenterDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isDrawerOpen: boolean;
  setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  roomData: any[];
  handleSaveRooms: (rooms: any[], calculatedAreaSqFt: number) => void;
  isOpenSpaceDrawerOpen: boolean;
  setIsOpenSpaceDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openSpaceData: any[];
  handleSaveSpaces: (spaces: any[], calculatedAreaSqFt: number) => void;
  isAmenityDrawerOpen: boolean;
  setIsAmenityDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  amenityData: any[];
  handleSaveAmenities: (amenities: any[], calculatedAreaSqFt: number) => void;
}

export interface FloorRegistrationFormProps {
  t: any;
  editingId: number | null;
  onCancelEdit: () => void;
  onAddFloor: () => void;
  isLoading: boolean;
  formState: any;
  setFormState: React.Dispatch<React.SetStateAction<any>>;
  dropdownOptions: any;
  subFloorOptions: any[];
  subUseTypeOptions: any[];
  isRenterDrawerOpen: boolean;
  setIsRenterDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isDrawerOpen: boolean;
  setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  roomData: any[];
  handleSaveRooms: (rooms: any[], calculatedAreaSqFt: number) => void;
  handleRoomsDrawerOpen: () => void;
  isOpenSpaceDrawerOpen: boolean;
  setIsOpenSpaceDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openSpaceData: any[];
  handleSaveSpaces: (spaces: any[], calculatedAreaSqFt: number) => void;
  handleOpenSpacesDrawerOpen: () => void;
  isAmenityDrawerOpen: boolean;
  setIsAmenityDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  amenityData: any[];
  handleSaveAmenities: (amenities: any[], calculatedAreaSqFt: number) => void;
}

export interface FloorRegistrationFormFieldsProps {
  t: any;
  editingId: number | null;
  onCancelEdit: () => void;
  onAddFloor: () => void;
  isLoading: boolean;
  formState: any;
  setFormState: React.Dispatch<React.SetStateAction<any>>;
  dropdownOptions: any;
  subFloorOptions: any[];
  subUseTypeOptions: any[];
  setIsRenterDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleRoomsDrawerOpen: () => void;
  handleOpenSpacesDrawerOpen: () => void;
}

export interface FloorRenterAndRoomsFieldsProps {
  t: any;
  formState: any;
  setFormState: React.Dispatch<React.SetStateAction<any>>;
  setIsRenterDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleRoomsDrawerOpen: () => void;
  handleOpenSpacesDrawerOpen: () => void;
}

/* ── Mini map preview props ───────────────────────────────────────────────── */
export interface MiniMapPreviewProps {
  latitude: number;
  longitude: number;
}

/* ── Saved floors list / columns props ───────────────────────────────────── */
export interface SavedFloorsActionColumnsArgs {
  t: any;
  isLoading: boolean;
  isScrolledRight: boolean;
  tableContainerRef: React.RefObject<HTMLDivElement | null>;
  onEdit: (f: any) => void;
  onDelete: (id: number) => void;
}

export interface SavedFloorsListProps {
  t: any;
  savedFloors: any[];
  dropdownOptions: any;
  subUseTypeMap: Record<string, any[]>;
  isLoading: boolean;
  isScrolledRight: boolean;
  setIsScrolledRight: React.Dispatch<React.SetStateAction<boolean>>;
  tableContainerRef: React.RefObject<HTMLDivElement | null>;
  onEdit: (f: any) => void;
  onDelete: (id: number) => void;
  onDuplicate?: (floor: any, count: number) => Promise<void>;
  isDuplicating?: boolean;
}

/* ── Unit generation form props ──────────────────────────────────────────── */
export interface UnitGenerationDerived {
  totalCount: number;
  isGenerateDisabled: boolean;
  toFloorOptions: { label: string; value: string }[];
}

export interface UnitGenerationConstructionFieldsProps {
  dropdownOptions: any | null;
  genConYear: string;
  setGenConYear: (val: string) => void;
  genConType: string;
  setGenConType: (val: string) => void;
  genUseType: string;
  setGenUseType: (val: string) => void;
  genSubUseType?: string;
  setGenSubUseType?: (val: string) => void;
  dynamicSubUseTypes?: any[];
  isSubUseTypesLoading?: boolean;
  isGenerating: boolean;
  isGenerateDisabled: boolean;
  handleGenerate: () => void;
  totalCount: number;
  t: (key: string, values?: any) => string;
}

export interface UnitGenerationFloorRangeFieldsProps {
  dropdownOptions: any | null;
  genType: string;
  setGenType: (val: string) => void;
  genFromFloor: string;
  setGenFromFloor: (val: string) => void;
  genToFloor: string;
  setGenToFloor: (val: string) => void;
  toFloorOptions: { label: string; value: string }[];
  genCountPerFloor: number | '';
  setGenCountPerFloor: (val: number | '') => void;
  totalCount: number;
  TYPE_OPTIONS: { label: string; value: string }[];
  t: (key: string, values?: any) => string;
}

export interface UnitGenerationFormProps {
  dropdownOptions: any | null;
  genType: string;
  setGenType: (val: string) => void;
  genFromFloor: string;
  setGenFromFloor: (val: string) => void;
  genToFloor: string;
  setGenToFloor: (val: string) => void;
  genCountPerFloor: number | '';
  setGenCountPerFloor: (val: number | '') => void;
  genConYear: string;
  setGenConYear: (val: string) => void;
  genConType: string;
  setGenConType: (val: string) => void;
  genUseType: string;
  setGenUseType: (val: string) => void;
  genSubUseType?: string;
  setGenSubUseType?: (val: string) => void;
  dynamicSubUseTypes?: any[];
  isSubUseTypesLoading?: boolean;
  isGenerating: boolean;
  handleGenerate: () => void;
  TYPE_OPTIONS: { label: string; value: string }[];
  t: (key: string, values?: any) => string;
}

/* ── Unit pool props ──────────────────────────────────────────────────────── */
export interface UnitPoolTableRowData {
  id: string;
  name: string;
  type: string;
  rowType: 'subunit';
  floorId: number | null;
  floorLabel: string;
  floorIdx: number;
  department: string;
  area: number;
  isSaved: boolean;
  isModified: boolean;
  original: any;
}

export interface UnitPoolTableColumnsArgs {
  activePage: number;
  PAGE_SIZE: number;
  setActiveUnit: (unit: any) => void;
  handleRemove: (tempId: string) => void;
  editEventRegistry?: React.MutableRefObject<{ triggerEdit?: (childAssetId: number) => void }>;
  confirm: (options: any) => void;
  t: (key: string, values?: any) => string;
  dropdownOptions?: any | null;
  isScrolledRight?: boolean;
  tableContainerRef?: React.RefObject<HTMLDivElement | null>;
}

export interface UnitPoolGeneratorProps {
  dropdownOptions: any | null;
  genType: string;
  setGenType: (val: string) => void;
  genFromFloor: string;
  setGenFromFloor: (val: string) => void;
  genToFloor: string;
  setGenToFloor: (val: string) => void;
  genCountPerFloor: number | "";
  setGenCountPerFloor: (val: number | "") => void;
  isGenerating: boolean;
  handleGenerate: () => void;
  TYPE_OPTIONS: { label: string; value: string }[];
  t: (key: string, values?: any) => string;
}

export interface UnitPoolPaginationProps {
  totalRows: number;
  activePage: number;
  totalPages: number;
  PAGE_SIZE: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}

export interface UnitPoolPanelProps {
  dropdownOptions: any | null;
  initialSubUnits?: any[];
  initialFloors?: any[];
  editEventRegistry?: React.MutableRefObject<{ triggerEdit?: (childAssetId: number) => void }>;
  mode?: 'floorSubmission' | 'generateUnits';
  editFloorId?: number | null;
  onSuccess?: () => void;
}

export interface UnitPoolPanelDrawersProps {
  poolState: any;
}

export interface UnitPoolPanelHeaderProps {
  poolCount: number;
  savedCount: number;
  t: (key: string, values?: any) => string;
  isUnitGenerationEnabled?: boolean;
  onToggle?: (checked: boolean) => void;
}

export interface UnitPoolPanelStatusProps {
  isSaving: boolean;
  unsavedCount: number;
  t: (key: string, values?: any) => string;
}

export interface UnitPoolTableProps {
  paginatedRows: UnitPoolTableRowData[];
  totalRows: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  activePage: number;
  totalPages: number;
  PAGE_SIZE: number;
  setActiveUnit: (unit: any) => void;
  handleRemove: (tempId: string) => void;
  editEventRegistry?: React.MutableRefObject<{ triggerEdit?: (childAssetId: number) => void }>;
  confirm: (options: any) => void;
  t: (key: string, values?: any) => string;
  dropdownOptions?: any | null;
}
