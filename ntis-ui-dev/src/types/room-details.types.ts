/**
 * Room and Floor data type definitions
 */

import type { Dispatch, SetStateAction, FC, RefObject } from "react";
import { ShapeParameters, RoomFormData } from "./common-details.types";
import type { OffsetData, OffsetAPIResponse, MinusRoomItem } from "./offset-details.types";
import { RenterDetailItem, RenterMastItem } from "./renter/renter-details.types";
import type { DrawerFloorDataRow, DrawerDropdownOption } from "@/types/propertyEditScreenDrawer.types";
export { type ShapeParameters };

export interface FloorData {
    id?: number | string;
    ownerID?: number | string;
    ownerId?: number | string;
    propertyId?: number | string;
    floor: string;
    floorId?: number | string;
    floorID?: number | string;
    FloorID?: number | string;
    subFloor: string;
    subFloorId?: number | string;
    subFloorID?: number | string;
    SubFloorID?: number | string;
    conYr: string;
    asstYr: string;
    conTyp: string;
    constructionTypeId?: number | string;
    constructionId?: number | string;
    ConstructionTypeId?: number | string;
    use: string;
    useId?: number | string;
    typeOfUseId?: number | string;
    TypeOfUseId?: number | string;
    subTyp: string;
    subTypId?: number | string;
    subTypeOfUseId?: number | string;
    SubTypeOfUseId?: number | string;
    subFloorDescription?: string;
    floorDescription?: string;
    constructionTypeDescription?: string;
    typeOfUseDescription?: string;
    subTypeOfUseDescription?: string;
    floorCode?: string;
    subFloorCode?: string;
    constructionCode?: string;
    typeOfUseCode?: string;
    propertyDetailsId?: number;
    rooms: string | number;
    noOfRooms?: string | number;
    areaSqFt: string | number;
    carpetAreaSqFeet?: string | number;
    areaSqM: string | number;
    carpetAreaSqMeter?: string | number;
    builtupAreaSqFt: string | number;
    builtupAreaSqFeet?: string | number;
    builtUpAreaSqFeet?: string | number;
    builtupAreaSqM: string | number;
    builtupAreaSqMeter?: string | number;
    builtUpAreaSqMeter?: string | number;
    renter: boolean | string;
    renterYesNo?: boolean;
    renterYesNO?: boolean;
    renterName?: string;
    renterMonthly?: string | number;
    rentMonthly?: string | number;
    agreementFromDate?: string | null;
    occupancyDate?: string | null;
    occupancyYesNo?: boolean;
    occupancyApplyOrNot?: boolean | string;
    renterDetails?: RenterDetailItem[];
    renterMast?: RenterMastItem[];
    documentBindingId?: number;
    documentGuid?: string;
    isTaxable?: boolean | string;
    isOpenPlot?: boolean | string | number;
    IsOpenPlot?: boolean | string | number;
    constructionYear?: string;
    assessmentYear?: string;
    roomData?: RoomData[];
    typeOfUseCategoryId?: number | string | null;
    updateBuildingPermission?: string;
    [key: string]: unknown;
}

export interface RoomData {
    id?: number | string;
    tempId?: string;
    roomId?: number | string;
    roomNo?: string;
    roomWiseSubmissionId?: number | string;
    roomName?: string;
    roomType?: string;
    utilities?: string;
    roomTypeId?: number | string;
    length?: number | string;
    breadth?: number | string;
    height?: number | string;
    area?: number | string;
    shape?: string;
    roomCount?: string | number;
    total?: number;
    carpetArea?: number;
    mainArea?: number;
    builtUpArea?: number;
    outer?: string;
    offsetMinus?: string;
    remark?: string;
    shapeParameters?: ShapeParameters;
    offsets?: OffsetData[];
    [key: string]: unknown;
}

export interface RoomAPIResponse {
    id?: number | string;
    tempId?: string;
    roomId?: number | string;
    roomWiseSubmissionId?: number | string;
    roomName?: string;
    roomNo?: string;
    roomType?: string;
    roomTypeId?: number | string;
    utilities?: string;
    length?: number | string;
    lengthMtr?: number | string;
    breadth?: number | string;
    widthMtr?: number | string;
    height?: number | string;
    heightMtr?: number | string;
    area?: number | string;
    areaSqMtr?: number | string;
    totalAreaSqMtr?: number | string;
    shape?: string;
    shapeType?: string;
    shapeParameters?: ShapeParameters;
    noOfRooms?: number | string;
    roomCount?: number | string;
    outerYesNo?: boolean;
    OuterYesNo?: boolean;
    outer?: string;
    minusYesNo?: boolean;
    MinusYesNo?: boolean;
    offsetMinus?: string;
    remark?: string;
    offsets?: OffsetAPIResponse[];
    minusRooms?: MinusRoomItem[];
    [key: string]: unknown;
}

export interface RoomTypeResponse {
    roomTypeId: number;
    roomTypeCode: string;
    roomTypeName?: string;
    description: string;
    isActive: boolean;
    createdDate: string;
    updatedDate: string | null;
    roomTypeDescription?: string; // Some APIs return this instead of description
    [key: string]: unknown;
}

export interface RoomWiseSubmissionProps {
    isOpen: boolean;
    onClose: () => void;
    floorNumber: string;
    maxRooms: number;
    availableRooms?: number;
    initialRooms?: RoomAPIResponse[];
    existingRooms?: RoomAPIResponse[];
    initialPropertyID?: string | number;
    initialFloorId?: string | number;
    onRoomsUpdate?: (rooms: RoomAPIResponse[]) => void;
    displayMode?: 'modal' | 'dialog' | 'inline';
    externalAreaUnit?: "sq.m" | "sq.ft";
    onExternalToggleUnit?: () => void;
    t?: (key: string) => string;
    onSaveRooms?: (rooms: RoomData[], area: number) => void;
    onUpdate?: (data: { floorNumber: string; rooms: RoomData[]; totalAreaSqM: number; builtUpAreaSqM: number; roomCount: number }) => void;
    roomTypeData?: RoomTypeResponse[];
    selectedFloorRow?: DrawerFloorDataRow | null;
    floorLookup?: DrawerDropdownOption[];
    constructionLookup?: DrawerDropdownOption[];
    useLookup?: DrawerDropdownOption[];
    subTypeLookup?: DrawerDropdownOption[];
    floorData?: FloorData;
    wardNo?: string;
    propertyNo?: string;
    partitionNo?: string;
}

export interface RoomTableHeaderProps {
    areaUnit: "sq.m" | "sq.ft";
}

export interface RoomDataTableProps {
    rooms: RoomData[];
    grandTotal: number;
    builtupGrandTotal: number;
    areaUnit: "sq.m" | "sq.ft";
    setRooms: Dispatch<SetStateAction<RoomData[]>>;
    inlineEditingCell: { rowIndex: number; field: string } | null;
    setInlineEditingCell: Dispatch<SetStateAction<{ rowIndex: number; field: string } | null>>;
    handleEdit: (index: number, room?: RoomData) => void;
    handleDelete: (index: number) => void;
    handleCancelEdit: () => void;
    setSelectedRoomForPlan: (room: RoomData | null) => void;
    setFilledParameters: (fields: string[]) => void;
    editingIndex: number | null;
    selectedRoomForPlan: RoomData | null;
    onOpenOffset?: (index: number) => void;
    addNewRow?: () => void;
    floorData?: FloorData;
    roomTypeData?: RoomTypeResponse[];
}

export interface InputBoxProps {
    formData: RoomFormData;
    handleInputChange: (field: string, value: string) => void;
    rooms: RoomData[];
    isEditMode: boolean;
    validationErrors: Record<string, string>;
    calculateArea: () => number;
    setOffsetModalOpen: (open: boolean) => void;
    currentRoomOffsets: OffsetData[];
    setOffsetList: (val: OffsetData[]) => void;
    setOffsetData: (val: OffsetData) => void;
    setSelectedOperation: (val: "add" | "subtract" | null) => void;
    setCurrentRoomOffsets: (val: OffsetData[]) => void;
    handleUpdateRoom: () => void;
    handleAddRoom: () => void;
    calculateTotal: (area: number, roomCount: string | number, offsets: OffsetData[], outer?: string | boolean) => number;
    maxRooms: number | null;
    availableRooms: number | null;
    setSelectedShape: (shape: string) => void;
    shapeParameters?: ShapeParameters;
    filledParameters?: string[];
    setFilledParameters?: (fields: string[]) => void;
    setShapeParameters?: (params: ShapeParameters) => void;
    areaUnit: string;
    offsetModalOpen?: boolean;
    editingIndex?: number | null;
    floorData?: FloorData;
    InlineError?: FC<{ message: string }>;
    handleEdit: (index: number, roomData?: RoomData) => void;
    roomTypeData?: RoomTypeResponse[];
}

export interface RoomActions {
    handleInputChange: (field: string, value: string) => void;
    handleEdit: (index: number, roomData?: RoomData) => void;
    handleCancelEdit: () => void;
    handleAddRoom: () => void;
    handleUpdateRoom: () => void;
    handleDelete: (index: number) => void;
    handleUpdate: () => void;
}

export interface OffsetActions {
    handleOpenOffset: (index: number) => void;
    handleSubtractClick: () => void;
    handleAddClick?: () => void;
    handleOffsetInputChange: (field: keyof OffsetData, value: string) => void;
    handleShapeChange: (shape: string) => void;
    handleAddOffset: () => void;
    handleOffsetOk: () => void;
    handleOffsetClose: () => void;
    handleDeleteOffset: (idx: number) => void;
    calculateAdjustedRoomTotal: () => number;
}

export interface RoomSubmissionSidebarProps extends RoomWiseSubmissionProps {
    wardNo: string;
    propertyNo: string;
    partitionNo: string;
    floorData: FloorData;
}

export interface RoomSubmissionItem {
    roomId?: number | string;
    roomName?: string;
    roomTypeId?: number | string;
    length?: number;
    breadth?: number;
    height?: number;
    area?: number;
    shape?: string;
    shapeParameters?: ShapeParameters;
    roomWiseMinusData?: OffsetAPIResponse[];
    [key: string]: unknown;
}

export interface ParameterInputProps {
    param: string;
    value: string;
    label: string;
    isFilled: boolean;
    onChange: (val: string) => void;
    onEnter?: () => void;
    autoFocus?: boolean;
    x: number;
    y: number;
    verticalLabel?: boolean;
    paramInputRefs?: RefObject<Record<string, HTMLInputElement | null>>;
}
