import type React from 'react';
import { LookupData } from "./common-details.types";
import { FloorData, RoomAPIResponse, RoomTypeResponse } from "./room-details.types";
import { RenterDetailItem, RenterMastItem } from "./renter/renter-details.types";
import type { TypeOfUseApiItem } from "./property-basic-details.types";

/* -------------------------------------------------------------------------- */
/*                                  FLOOR DETAILS                             */
/* -------------------------------------------------------------------------- */

export interface FloorResponse {
    floorId: number;
    floorCode: string;
    description: string;
    sequenceNo: number;
    maxFloorNo: number;
    isActive: boolean;
    createdDate: string;
    updatedDate: string | null;
    [key: string]: unknown;
}

export interface ConstructionTypeResponse {
    constructionTypeId: number;
    constructionCode: string;
    description: string;
    searchKey: string | null;
    searchSequence: number | null;
    isActive: boolean;
    createdDate: string;
    updatedDate: string | null;
    [key: string]: unknown;
}

export type { TypeOfUseApiItem } from "./property-basic-details.types";

export interface SubTypeOfUseResponse {
    id?: number;
    subTypeOfUseId?: number;
    description: string;
    typeOfUseId: number;
    searchKey: string | null;
    searchSequence: number | null;
    isActive: boolean;
    createdDate: string;
    updatedDate: string | null;
    [key: string]: unknown;
}

export interface SubFloorResponse {
    subFloorId: number;
    subFloorCode: string;
    description: string;
    subFloorPercentage: number;
    isActive: boolean;
    createdDate: string;
    updatedDate: string | null;
    [key: string]: unknown;
}


/* -------------------------------------------------------------------------- */
/*                                  LOOKUP TYPES                              */
/* -------------------------------------------------------------------------- */

export interface FloorDataLookup {
    floorId: number;
    floorCode?: string;
    description: string;
    sequenceNo: number;
}

export interface ConstructionTypeLookup {
    constructionTypeId: number;
    constructionCode?: string;
    description: string;
}

export interface UseLookup {
    typeOfUseId: number;
    typeOfUseCode?: string;
    description: string;
}

export interface SubTypeLookup {
    subTypeOfUseId: number;
    description: string;
    typeOfUseId: number;
    searchKey?: string | null;
}

export interface SubFloorLookup {
    subFloorId: number;
    subFloorCode?: string;
    description: string;
}

export interface FloorAPIResponse {
    id: number;
    propertyDetailsId?: number;
    ownerID: number;
    ownerId?: number;
    propertyId?: number;
    floorID: string | number;
    floorId?: number | string;
    subFloorID: string | number;
    subFloorId?: number | string;
    constructionYear: string;
    assessmentYear: string;
    constructionId?: string | number;
    constructionTypeId?: number;
    ConstructionTypeId?: number | string;
    typeOfUseId: string | number;
    subTypeOfUseId: number | string;
    floorCode?: string;
    subFloorCode?: string;
    constructionCode?: string;
    typeOfUseCode?: string;
    floorDescription?: string;
    subFloorDescription?: string;
    constructionTypeDescription?: string;
    typeOfUseDescription?: string;
    subTypeOfUseDescription?: string;
    carpetAreaSqFeet: number;
    carpetAreaSqFt?: number;
    carpetAreaSqMeter: number;
    carpetAreaSqM?: number;
    builtupAreaSqMeter: number;
    builtUpAreaSqMeter?: number;
    builtupAreaSqFeet: number;
    builtUpAreaSqFeet?: number;
    noOfRooms: number;
    renterYesNO: boolean;
    renterYesNo?: boolean;
    isTaxable?: boolean | string;
    isActive?: boolean;
    createdBy?: number;
    taxLiability?: string;
    occupancyDate?: string | null;
    occupancyApplyOrNot?: boolean;
    occupancyNumber?: string;
    nonCalculateRentMonthly?: number;
    renterName?: string;
    renterNameEnglish?: string;
    rentMonthly?: number;
    rentYearly?: number;
    agreementFromDate?: string;
    agreementToDate?: string;
    agreementDate?: string;
    renterDetails?: RenterDetailItem[];
    renterMast?: RenterMastItem[];
    renters?: RenterMastItem[];
    isRenter?: boolean;
    propertyRooms?: RoomAPIResponse[];
    roomWiseSubmissionDetails?: RoomAPIResponse[];
    length?: number | string | null;
    width?: number | string | null;
    lengthMtr?: number | string | null;
    widthMtr?: number | string | null;
    propertyCertificates?: unknown[];
}

export interface FloorDetailsProps {
    valueType: "rateable" | "capital";
    onTotalChange?: (total: number) => void;
    onResidentialTotalChange?: (total: number) => void;
    onCommercialTotalChange?: (total: number) => void;
    sharedData?: unknown[] | null;
    onDataChange?: (data: unknown[]) => void;
    apartmentProperty?: unknown | null;
    filterWardNo?: string;
    filterPropertyNo?: string;
    hideFormSection?: boolean;
    filteredData?: unknown[] | null;
    showStatusBadges?: boolean;
    sharedLanguage?: "english" | "marathi";
    dynamicFloorOptions?: string[];
    dynamicConstructionTypeOptions?: string[];
    dynamicUseOptions?: string[];
    dynamicSubTypeOptions?: string[];
    dynamicSubFloorOptions?: string[];
    floorData?: FloorDataLookup[];
    constructionTypeData?: ConstructionTypeLookup[];
    useData?: UseLookup[];
    subTypeData?: SubTypeLookup[];
    subFloorData?: SubFloorLookup[];
    pdnId?: number | string;
}

export interface EditFloorInformationProps {
    open: boolean;
    editData: unknown;
    setEditData: (data: unknown) => void;
    editModal: unknown;
    setEditModal: (modal: unknown) => void;
    inputRefs: unknown;
    handleKeyDown: () => void;
    handleOpenSubmission: () => void;
    handleSave: () => void;
    handleClose: () => void;
    dynamicFloorOptions: string[];
    dynamicSubFloorOptions: string[];
}

export interface EditSidebarFormProps {
    wardNo: string;
    propertyNo: string;
    partitionNo: string;
    locale: string;
    // SSR Lookup Data
    floorLookup: FloorResponse[];
    constructionLookup: ConstructionTypeResponse[];
    useLookup: TypeOfUseApiItem[];
    subTypeLookup: SubTypeOfUseResponse[];
    subFloorLookup: SubFloorResponse[];
    floorOptions: string[];
    constructionTypeOptions: string[];
    useOptions: string[];
    subTypeOptions: string[];
    subFloorOptions: string[];
    // SSR-fetched initial data (from server page.tsx)
    initialPropertyData: Record<string, unknown> | null;
    initialPropertyID: string | number | undefined;
    initialFloors: unknown[];
    initialFloorDetails: unknown;
}

export interface EditSidebarProps {
    wardNo: string;
    wardId?: number;
    propertyNo: string;
    partitionNo: string;
    locale: string;
    // SSR Lookup Data
    floorData: FloorResponse[];
    constructionTypeData: ConstructionTypeResponse[];
    useData: TypeOfUseApiItem[];
    subTypeData: SubTypeOfUseResponse[];
    subFloorData: SubFloorResponse[];
    roomTypeData?: RoomTypeResponse[];
    floorOptions: string[] | FloorResponse[] | { success: boolean; error: string };
    constructionTypeOptions: string[] | ConstructionTypeResponse[] | { success: boolean; error: string };
    useOptions: string[] | TypeOfUseApiItem[] | { success: boolean; error: string };
    subTypeOptions: string[];
    subFloorOptions: string[] | SubFloorResponse[] | { success: boolean; error: string };
    // SSR-fetched initial data
    initialPropertyData: Record<string, unknown> | null;
    initialPropertyID: string | number | undefined;
    initialFloors: unknown[];
    initialFloorDetails: unknown;
    initialPlotArea?: {
        length?: number | string | null;
        width?: number | string | null;
        totalPlotArea?: number | string | null;
    } | null;
    propertyTypeId?: string | number;
    apiErrors?: string[];
}

export interface BottomActionBarProps {
    currentPage?: number;
    totalPages?: number;
    wardNo: string;
    propertyNo: string;
    partitionNo: string;
    propertyId: string;
    locale: string;
}

export interface PtisScreenProps {
    wardNo: string;
    propertyNo: string;
    partitionNo: string;
    locale: string;
    isEditSidebarOpen: boolean;
    isQuickDataDrawerOpen: boolean;
    activeTab?: string;
    initialPropertyID?: string | number;
    initialPropertyData?: unknown;
    initialFloors?: unknown[];
    initialFloorDetails?: unknown;
}

export interface OldFloorRow {
    id: number;
    floor: string;
    conYr: string;
    conTyp: string;
    use: string;
    areaSqFt: string;
    registration: boolean;
}

export interface FloorFormProps {
    t: (key: string, values?: Record<string, string | number | Date>) => string;
    isAddingNewFloor: boolean;
    setIsAddingNewFloor?: React.Dispatch<React.SetStateAction<boolean>>;
    setSelectedFloor?: (val: FloorData | null) => void;
    editingFloorForm: FloorData;
    setEditingFloorForm: React.Dispatch<React.SetStateAction<FloorData>>;
    formErrors: Record<string, string>;
    setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    resetForm: () => void;
    handleOpenDropdown: (key: "loadFloor" | "loadSubFloor" | "loadConstruction" | "loadUsage" | "loadSubType") => void;
    handleOpenRenterManagement: (form?: FloorData) => void;
    updateUrlParams: (params: Record<string, string | null>) => void;
    isOperationLoading: boolean;
    startTransition: (fn: () => void) => void;
    roomsInputRef: React.RefObject<HTMLInputElement | null>;
    areaInputRef: React.RefObject<HTMLInputElement | null>;
    // Lookups and Options
    floorOptions: string[] | FloorResponse[] | { success: boolean; error: string };
    floorLookup: LookupData[];
    subFloorOptions: string[] | SubFloorResponse[] | { success: boolean; error: string };
    subFloorLookup: LookupData[];
    constructionTypeOptions: string[] | ConstructionTypeResponse[] | { success: boolean; error: string };
    constructionLookup: LookupData[];
    useOptions: string[] | TypeOfUseApiItem[] | { success: boolean; error: string };
    useLookup: LookupData[];
    subTypeOptionsFromData: string[];
    subTypeData: LookupData[];
    setShowRoomSubmission: (val: boolean) => void;
    onSave: () => void;
    wardNo?: string;
    propertyNo?: string;
    partitionNo?: string;
    propertyId?: string | number;
}

/* -------------------------------------------------------------------------- */
/*                      FLOOR FORM SECTION COMPONENT PROPS                    */
/* -------------------------------------------------------------------------- */

/**
 * Base props shared across all floor form section components.
 * Provides common form state management and validation functionality.
 */
export interface BaseFormSectionProps {
    /** Translation function for i18n support */
    t: (key: string) => string;

    /** Current floor form state containing all field values */
    editingFloorForm: FloorData;

    /** Updates the floor form state */
    setEditingFloorForm: React.Dispatch<React.SetStateAction<FloorData>>;

    /** Object containing validation errors keyed by field name */
    formErrors: Record<string, string>;

    /** Updates the form validation errors */
    setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

/**
 * Props for the BasicInfoSection component.
 * Handles floor and sub-floor selection with lazy loading support.
 * 
 * @example
 * ```tsx
 * <BasicInfoSection
 *   t={t}
 *   editingFloorForm={form}
 *   floorOptions={floorData}
 *   handleOpenDropdown={(key) => loadDropdown(key)}
 * />
 * ```
 */
export interface BasicInfoSectionProps extends BaseFormSectionProps {
    /** Floor options - can be string array, response array, or error object */
    floorOptions: string[] | FloorResponse[] | { success: boolean; error: string };

    /** Full floor lookup data for ID-to-description mapping */
    floorLookup: LookupData[];

    /** Sub-floor options - can be string array, response array, or error object */
    subFloorOptions: string[] | SubFloorResponse[] | { success: boolean; error: string };

    /** Full sub-floor lookup data for ID-to-description mapping */
    subFloorLookup: LookupData[];

    /** Resolves floor description from ID using lookup data */
    getFloorDescription: (id: string, lookup: LookupData[]) => string;

    /** Resolves sub-floor description from ID using lookup data */
    getSubFloorDescription: (id: string, lookup: LookupData[]) => string;

    /** Triggers lazy loading for specific dropdown data */
    handleOpenDropdown: (key: 'loadFloor' | 'loadSubFloor' | 'loadConstruction' | 'loadUsage' | 'loadSubType') => void;

    /** Indicates if we are in Add Floor mode */
    isAddingNewFloor?: boolean;
}

/**
 * Props for the UsageSection component.
 * Manages construction type, type of use, and sub-type selections.
 * 
 * @example
 * ```tsx
 * <UsageSection
 *   t={t}
 *   editingFloorForm={form}
 *   constructionTypeOptions={constructionData}
 *   useOptions={useData}
 *   subTypeOptionsFromData={subtypes}
 * />
 * ```
 */
export interface UsageSectionProps extends BaseFormSectionProps {
    /** Construction type options - can be string array, response array, or error object */
    constructionTypeOptions: string[] | ConstructionTypeResponse[] | { success: boolean; error: string };

    /** Full construction type lookup data */
    constructionLookup: LookupData[];

    /** Type of use options - can be string array, response array, or error object */
    useOptions: string[] | TypeOfUseApiItem[] | { success: boolean; error: string };

    /** Full type of use lookup data */
    useLookup: LookupData[];

    /** Sub-type options derived from current type of use selection */
    subTypeOptionsFromData: string[];

    /** Full sub-type lookup data */
    subTypeData: LookupData[];

    /** React transition function for non-blocking state updates */
    startTransition: React.TransitionStartFunction;

    /** Updates URL parameters for deep linking support */
    updateUrlParams: (params: Record<string, string>) => void;

    /** Resolves construction type description from ID */
    getConstructionDescription: (id: string, lookup: LookupData[]) => string;

    /** Resolves type of use description from ID */
    getUseDescription: (id: string, lookup: LookupData[]) => string;

    /** Resolves sub-type description from ID */
    getSubTypeDescription: (id: string, lookup: LookupData[]) => string;

    /** Triggers lazy loading for specific dropdown data */
    handleOpenDropdown: (key: 'loadFloor' | 'loadSubFloor' | 'loadConstruction' | 'loadUsage' | 'loadSubType') => void;
}

/**
 * Props for the AreaSection component.
 * Handles room count and area calculations (sq ft and sq m).
 * 
 * @example
 * ```tsx
 * <AreaSection
 *   t={t}
 *   editingFloorForm={form}
 *   roomsInputRef={roomsRef}
 *   areaInputRef={areaRef}
 *   setShowRoomSubmission={setShowModal}
 * />
 * ```
 */
export interface AreaSectionProps extends BaseFormSectionProps {
    /** Ref for the rooms input field for programmatic focus */
    roomsInputRef: React.RefObject<HTMLInputElement | null>;

    /** Ref for the area input field for programmatic focus */
    areaInputRef: React.RefObject<HTMLInputElement | null>;

    /** Controls visibility of room submission modal */
    setShowRoomSubmission: (show: boolean) => void;

    /** Optional ward number for plan extraction */
    wardNo?: string;

    /** Optional property number for plan extraction */
    propertyNo?: string;

    /** Optional partition number for plan extraction */
    partitionNo?: string;

    /** Optional property ID for plan extraction */
    propertyId?: string | number;
}

/**
 * Props for the RenterSection component.
 * Manages renter status and provides access to renter management.
 * 
 * @example
 * ```tsx
 * <RenterSection
 *   t={t}
 *   editingFloorForm={form}
 *   handleOpenRenterManagement={openRenterModal}
 *   isOperationLoading={isSaving}
 * />
 * ```
 */
export interface RenterSectionProps extends BaseFormSectionProps {
    /** Opens renter management dialog/page */
    handleOpenRenterManagement: (data?: FloorData) => void;

    /** Indicates if a save/update operation is in progress */
    isOperationLoading: boolean;
}

/**
 * Props for the FieldWrapper component.
 * Provides consistent field layout with label, error message, and optional elements.
 */
export interface FieldWrapperProps {
    /** Field label text */
    label: string;

    /** HTML ID of the input field for label association */
    htmlFor: string;

    /** Whether the field is required (shows asterisk) */
    required?: boolean;

    /** Error message to display below the field */
    error?: string;

    /** Input element or other form control */
    children: React.ReactNode;

    /** Additional CSS classes for the wrapper */
    className?: string;

    /** Optional element to display next to the label (e.g., info icon, badge) */
    labelExtra?: React.ReactNode;
}

/**
 * Props for the ReadOnlyField component.
 * Displays a read-only field with consistent styling.
 */
export interface ReadOnlyFieldProps {
    /** Field label text */
    label: string;

    /** Value to display in the read-only field */
    value: string | number;
    badgeText?: string;
    id: string;
}

// Re-export common entities for backward compatibility where possible
export * from "./common-details.types";
export {
    type FloorData,
    type RoomData,
    type RoomAPIResponse,
    type RoomWiseSubmissionProps,
    type RoomActions,
    type OffsetActions,
    type RoomSubmissionSidebarProps,
    type RoomSubmissionItem,
    type ParameterInputProps
} from "./room-details.types";
export * from "./offset-details.types";
export * from "./renter/renter-details.types";

// FloorSubmissionPayload - used for floor submission API calls
// FloorSubmissionPayload - used for floor submission API calls
export interface FloorSubmissionPayload {
    propertyId: number;
    propertyDetailsId?: number;
    updatedBy?: number;
    floorId?: number | string;
    floorDescription?: string;
    subFloorId?: number | string;
    subFloorDescription?: string;
    constructionYear: string;
    assessmentYear: string;
    constructionTypeId?: number | string;
    constructionTypeDescription?: string;
    typeOfUseId: number | string;
    typeOfUseDescription?: string;
    subTypeOfUseId?: number | string;
    subTypeOfUseDescription?: string;
    floorCode?: string;
    subFloorCode?: string;
    constructionCode?: string;
    typeOfUseCode?: string;
    carpetAreaSqFeet: number;
    carpetAreaSqMeter?: number;
    builtupAreaSqFeet?: number;
    builtupAreaSqMeter?: number;
    noOfRooms: number;
    renterYesNo?: boolean;
    renterName?: string;
    renterNameEnglish?: string;
    rentYearly?: number;
    agreementFromDate?: string;
    agreementToDate?: string;
    agreementDate?: string;
    rentMonthly?: number;
    isTaxable?: boolean | string;
    isActive?: boolean;
    createdBy?: number;
    taxLiability?: string;
    occupancyDate?: string | null;
    occupancyApplyOrNot?: boolean;
    occupancyNumber?: string;
    nonCalculateRentMonthly?: number;
    renterDetails?: unknown[];
    renterMast?: unknown[];
    renters?: unknown[];
    isRenter?: boolean;
    roomWiseSubmissionDetails?: unknown[];
    selectedFloorType?: 'Construction' | 'OpenPlot';
    isOpenPlot?: boolean;
    length?: number | string | null;
    width?: number | string | null;
    lengthMtr?: number | string | null;
    widthMtr?: number | string | null;
    roomWiseMinusData?: unknown[];
    typeOfUseCategoryId?: number | string | null;
    documentBindingId?: number | null;
}

// QuickDataEntryPayload - used for quick data entry submission
export type QuickDataEntryPayload = Record<string, unknown>;

// SubmissionResponse - generic response for submission operations
export interface SubmissionResponse {
    id?: number;
    success?: boolean;
    message?: string;
    [key: string]: unknown;
}
// Renter Custom Increment Row - used for Renter Agreement sub-data
export interface RenterCustomIncrementPostRow {
    Customfromdate: string;
    Customtodate: string;
    CustomIncrementtype: string;
    CustomIncrementValue: number;
    CustomMethod: string;
}

export interface RenterTableEntryPostRow {
    TablePeriod: number;
    TableDurationFrom: string;
    TableDurationTo: string;
    TableRentMonthly: number;
    TableIncrementApplied: number;
    TableSegmentType: string;
    TableStatusLabel: string;
}

/* -------------------------------------------------------------------------- */
/*                            DATA ENTRY SAME AS TYPES                        */
/* -------------------------------------------------------------------------- */

export interface SelectableProperty {
    id: string | number;
    propertyId?: string | number;
    propertyFloorId?: string | number | null;
    propertyDetailsId?: string | number | null;
    wardId?: string | number;
    wardNo: string;
    propertyNo: string;
    partitionNo: string;
    categoryName?: string;
    type: string | number;
    typeLabel?: string;
    wing: string;
    flatNo: string;
    carpetAreaSqFeet?: number | null;
    carpetAreaSqMeter?: number | null;
    builtupAreaSqFeet?: number | null;
    builtupAreaSqMeter?: number | null;
    parkingCarpetAreaSqFeet?: number | null;
    parkingCarpetAreaSqMeter?: number | null;
    parkingBuiltupAreaSqFeet?: number | null;
    parkingBuiltupAreaSqMeter?: number | null;
}

export interface DataEntrySameAsItem {
    propertyId: number;
    propertyFloorId?: number | null;
    propertyDetailsId?: number | null;
    wardId: number;
    wardNo?: string | null;
    propertyNo: string;
    partitionNo: string;
    propertyCategoryName?: string | null;
    categoryName?: string | null;
    type: string | number;
    typeName?: string | null;
    typeLabel?: string | null;
    typeDescription?: string | null;
    propertyTypeName?: string | null;
    apartmentType?: string | null;
    wingName: string;
    flatOrShopNo: string;
}

export interface DataEntrySameAsResponse {
    success: boolean;
    message: string;
    items: DataEntrySameAsItem[];
    errors: unknown;
    correlationId: string | null;
}
