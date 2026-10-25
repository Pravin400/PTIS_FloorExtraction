import { ShapeParameters, RoomFormData } from "./common-details.types";
import type { RefObject } from "react";

/* -------------------------------------------------------------------------- */
/*                                OFFSET TYPES                                 */
/* -------------------------------------------------------------------------- */

export interface OffsetData {
    length?: string;
    width?: string;
    radius?: string;
    base?: string;
    height?: string;
    side?: string;
    base1?: string;
    base2?: string;
    area: number;
    shapeType?: string;
    operation?: string;
    shape?: string;
    type?: string;
    parameters?: Record<string, unknown>;
    shapeParams?: ShapeParameters;
    id?: number | string;
    roomWiseMinusId?: number | string;
    isOffset?: boolean;
}

export interface OffsetAPIResponse {
    id: number | string;
    roomWiseMinusId?: number | string;
    lengthMtr: number;
    widthMtr: number;
    heightMtr: number;
    areaSqMtr: number;
    shape: string;
    base1Mtr: number;
    base2Mtr: number;
    isOffset?: boolean;
    // Alternative/Legacy names
    length?: number | string;
    width?: number | string;
    height?: number | string;
    base1?: number | string;
    base2?: number | string;
    area?: number;
    operation?: string;
    remark?: string;
}

export interface MinusRoomItem {
    roomWiseMinusId?: number | string;
    isActive?: boolean;
    updatedBy?: number;
    lengthMtr?: number;
    widthMtr?: number;
    heightMtr?: number;
    areaSqMtr: number;
    shape: string;
    base1Mtr?: number;
    base2Mtr?: number;
    propertyId?: number | string;
    roomWiseSubmissionId?: number | string;
}

export interface FullOffSetFormProps {
    isInline?: boolean;
    offsetModalOpen: boolean;
    formData: RoomFormData;
    calculateAdjustedRoomTotal: () => number;
    handleSubtractClick: () => void;
    handleAddClick?: () => void;
    selectedOperation: "add" | "subtract" | null;
    isShakingSubtract: boolean;
    offsetData: OffsetData;
    setOffsetValidationError: (msg: string) => void;
    setSelectedOperation: (op: "add" | "subtract" | null) => void;
    offsetValidationError: string;
    selectedShape: string;
    handleShapeChange: (shape: string) => void;
    handleOffsetInputChange: (field: keyof OffsetData, value: string) => void;
    offsetList: OffsetData[];
    getDimensionsString: (offset: OffsetData, unit?: string) => string;
    handleDeleteOffset: (index: number) => void | Promise<void>;
    handleAddOffset: () => void;
    isOffsetDataValid: () => boolean;
    handleOffsetOk: () => void;
    handleOffsetClose: () => void;
    areaUnit: "sq.m" | "sq.ft";
    shouldShake: boolean;
    deletingOffsetIndex?: number | null;
     offsetModalRef?: RefObject<HTMLDivElement> | null;
     offsetShapeRef?: RefObject<HTMLButtonElement> | null;
}
