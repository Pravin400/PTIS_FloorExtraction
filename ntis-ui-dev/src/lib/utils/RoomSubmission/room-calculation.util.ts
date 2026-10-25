import { OffsetData } from "@/types/offset-details.types";
import { RoomData } from "@/types/room-details.types";
import { ShapeParameters } from "@/types/common-details.types";
import { CONVERSION_FACTORS } from "./conversions";

/**
 * Constants for unit conversions
 */
export const SQM_TO_SQFT = CONVERSION_FACTORS.SQM_TO_SQFT;
export const M_TO_FT = 3.28084;

/**
 * Helper to parse numeric values safely
 */
export const parseNumeric = (val: unknown): number | undefined => {
    const parsed = parseFloat(String(val));
    return isNaN(parsed) ? undefined : parsed;
};

/**
 * Calculates Room Areas (Carpet and Built-up)
 * 
 * Requirements:
 * 1. Default (Outer = No):
 *    - Carpet Area = (Main Area - Offset)
 *    - Built-up Area = Carpet Area * 1.20
 * 2. Outer = Yes:
 *    - Built-up Area = (Main Area - Offset)
 *    - Carpet Area = Built-up Area * 0.80 (20% less)
 * 
 * @param mainArea Calculated main area of the room
 * @param hasOffset Whether the room has an offset
 * @param offsetArea Measured offset area
 * @param isOuter Whether the room is an Outer room
 * @returns Object containing calculated areas
 */
export const calculateRoomAreas = (
    mainArea: number,
    hasOffset: boolean | string,
    offsetArea: number = 0,
    isOuter: boolean | string = false
) => {
    const isOff = hasOffset === "Yes" || hasOffset === true;
    const isOut = isOuter === "Yes" || isOuter === true;

    const actualOffset = isOff ? Math.min(offsetArea, mainArea) : 0;
    const baseArea = mainArea - actualOffset;

    let carpetArea = baseArea;
    if (isOut) {
        carpetArea = baseArea * 0.80;
    }
    const builtUpArea = carpetArea * 1.20;

    return {
        mainArea: Number(mainArea.toFixed(2)),
        carpetArea: Number(carpetArea.toFixed(2)),
        builtUpArea: Number(builtUpArea.toFixed(2)),
    };
};

/**
 * Calculates the area of a single shape based on provided parameters
 */
export const calculateSingleShapeArea = (
    shape: string,
    params: ShapeParameters,
    fallbackLength: number | string = 0,
    fallbackWidth: number | string = 0
): number => {
    const parseNum = (val: string | number | undefined) => typeof val === "string" ? parseFloat(val) || 0 : val || 0;

    switch (shape) {
        case "Rectangle":
        case "Rectangular":
            return parseNum(params.length) * parseNum(params.width);
        case "Square":
            const side = parseNum(params.side);
            return side * side;
        case "Circle":
            const radius = parseNum(params.radius);
            return Math.PI * radius * radius;
        case "Triangle":
            return (parseNum(params.base) * parseNum(params.height)) / 2;
        case "Trapezoid":
            return ((parseNum(params.base1) + parseNum(params.base2)) * parseNum(params.height)) / 2;
        case "Semi Circle":
            const sr = parseNum(params.radius);
            return (Math.PI * sr * sr) / 2;
        case "Quarter Circle":
            const qr = parseNum(params.radius);
            return (Math.PI * qr * qr) / 4;
        default:
            if (shape === "-Select-" || !shape) return parseNum(fallbackLength);
            return parseNum(fallbackLength) * parseNum(fallbackWidth);
    }
};

/**
 * Calculates net offset area from a list of offsets
 */
export const calculateNetOffsetArea = (offsets: OffsetData[]): number => {
    return offsets.reduce((sum, off) => {
        const op = off.type || off.operation;
        return op === 'subtract' ? sum + off.area : sum - off.area;
    }, 0);
};

/**
 * Calculates net adjustment for a list of offsets in a specific operation context
 */
export const calculateNetAdjustment = (offsets: OffsetData[]): number => {
    return offsets.reduce((sum, offset) => {
        if (offset.operation === "add") return sum + offset.area;
        if (offset.operation === "subtract") return sum - offset.area;
        return sum;
    }, 0);
};

/**
 * Calculates grand totals and consumed counts for a list of rooms
 */
export const calculateRoomWiseTotals = (rooms: RoomData[], excludeIndex?: number | null) => {
    let roomsConsumed = 0;
    let grandTotal = 0;
    let builtupGrandTotal = 0;

    rooms.forEach((room, idx) => {
        const isExcluded = excludeIndex !== undefined && excludeIndex !== null && idx === excludeIndex;

        const carpet = parseFloat(String(room.carpetArea || room.total || 0)) || 0;
        const builtUp = Number((carpet * 1.20).toFixed(2));
        const count = parseInt(String(room.roomCount || 1)) || 1;

        // Sum totals for ALL rooms
        grandTotal += (carpet * count);
        builtupGrandTotal += (builtUp * count);

        // Count consumed rooms (for allocation logic capacity checking)
        if (!isExcluded) {
            const isFilled = carpet > 0 || (room.remark && room.remark !== "-Select-") || (room.shape && room.shape !== "-Select-");
            if (isFilled) roomsConsumed += count;
        }
    });


    return {
        grandTotal,
        builtupGrandTotal,
        roomsConsumed
    };
};

/**
 * Resolves shape-specific parameters for persistent storage
 */
export const getShapeParams = (
    item: Record<string, unknown>
): {
    lengthMtr?: number;
    widthMtr?: number;
    heightMtr?: number;
    base1?: number;
    base2?: number;
} => {
    const rawShape = String(item.shape || item.shapeType || 'Rectangle');
    const shape = rawShape.trim();
    const params = (item.shapeParams ? item.shapeParams : item) as ShapeParameters;
    const areaVal = parseNumeric(item.area) || parseNumeric(item.totalAreaSqM) || 0;

    let length: number | undefined,
        width: number | undefined,
        height: number | undefined,
        base1: number | undefined,
        base2: number | undefined;

    switch (shape.toLowerCase()) {
        case 'square':
            length = parseNumeric(params.side);
            width = parseNumeric(params.side);
            base1 = parseNumeric(params.side);
            break;
        case 'rectangle':
        case 'rectangular':
            length = parseNumeric(params.length);
            width = parseNumeric(params.width);
            base1 = parseNumeric(params.length);
            base2 = parseNumeric(params.width);
            if (params.height) height = parseNumeric(params.height);
            break;
        case 'triangle':
            length = 1;
            width = areaVal;
            base1 = parseNumeric(params.base);
            height = parseNumeric(params.height);
            break;
        case 'circle':
        case 'semi circle':
        case 'quarter circle':
            length = 1;
            width = areaVal;
            base1 = parseNumeric(params.radius);
            break;
        case 'trapezoid':
            length = 1;
            width = areaVal;
            height = parseNumeric(params.height);
            base1 = parseNumeric(params.base1);
            base2 = parseNumeric(params.base2);
            break;
        default:
            length = parseNumeric(params.length);
            width = parseNumeric(params.width);
            height = parseNumeric(params.height);
    }
    return { lengthMtr: length, widthMtr: width, heightMtr: height, base1, base2 };
};

/**
 * Helper to convert area between units
 */
export const convertAreaUnit = (value: number, fromUnit: string, toUnit: string): number => {
    if (fromUnit === toUnit) return value;
    if (fromUnit === "sq.ft" && toUnit === "sq.m") return value / SQM_TO_SQFT;
    if (fromUnit === "sq.m" && toUnit === "sq.ft") return value * SQM_TO_SQFT;
    return value;
};

/**
 * Helper to convert dimensions (lengths/widths) between units
 */
export const convertDimension = (val: string | number | undefined, toUnit: "ft" | "m"): string => {
    if (val === undefined || val === null) return "";
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (isNaN(num) || num === 0) return String(val || "");

    // If toUnit is ft, we assume fromUnit was m (and vice versa)
    const result = toUnit === "ft" ? num * M_TO_FT : num / M_TO_FT;
    return parseFloat(result.toFixed(2)).toString();
};
