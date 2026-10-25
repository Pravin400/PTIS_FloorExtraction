import { RoomData, RoomAPIResponse } from "@/types/room-details.types";
import { OffsetData } from "@/types/offset-details.types";
import { SHAPE_TYPES, OFFSET_OPERATIONS } from "@/components/modules/property-tax/ptis/QuickDataEntry/floorSubmission/RoomSubmission/constants/room-submission.constants";

/**
 * Robust numeric extraction helper
 */
const toApiNumber = (values: (string | number | undefined | null | unknown)[], fallback: number = 0): number => {
  for (const v of values) {
    if (v === undefined || v === null || v === "") continue;
    const n = parseFloat(String(v));
    if (!isNaN(n)) return n;
  }
  return fallback;
};

/**
 * Robust ID extraction helper (ignores string UUIDs and NaN)
 */
const extractValidId = (...ids: (string | number | undefined | null | unknown)[]): number => {
  for (const id of ids) {
    if (id === undefined || id === null || id === "") continue;
    const num = Number(id);
    if (!isNaN(num) && num > 0) return num;
  }
  return 0;
};

/**
 * Maps UI OffsetData to API RoomWiseMinus payload
 */
export const mapOffsetToApi = (offset: OffsetData, roomSubmissionId: number = 0) => {
  const params = (offset.shapeParams || offset.parameters || {}) as Record<string, unknown>;

  const resolvedId = extractValidId(offset.id, offset.roomWiseMinusId);

  const shape = offset.shape || SHAPE_TYPES.RECTANGLE;
  const areaSqMtr = toApiNumber([offset.area], 0);

  let lengthMtr = 0;
  let widthMtr = 0;
  let base1Mtr = 0;
  let base2Mtr = 0;
  let heightMtr = 0;

  const normalizedShape = String(shape || '').toLowerCase().trim();

  switch (normalizedShape) {
    case 'rectangle':
    case 'rectangular':
      lengthMtr = toApiNumber([offset.length, params.length], 0);
      widthMtr = toApiNumber([offset.width, params.width], 0);
      base1Mtr = lengthMtr;
      base2Mtr = widthMtr;
      break;
    case 'square':
      const s = toApiNumber([offset.side, params.side, offset.length, params.length, params.base1, offset.base1], 0);
      lengthMtr = s;
      widthMtr = s;
      base1Mtr = s;
      break;
    case 'trapezoid':
      lengthMtr = 1;
      widthMtr = areaSqMtr;
      base1Mtr = toApiNumber([offset.base1, params.base1], 0);
      base2Mtr = toApiNumber([offset.base2, params.base2], 0);
      heightMtr = toApiNumber([offset.height, params.height], 0);
      break;
    case 'triangle':
      lengthMtr = 1;
      widthMtr = areaSqMtr;
      base1Mtr = toApiNumber([offset.base, params.base, params.base1], 0);
      heightMtr = toApiNumber([offset.height, params.height], 0);
      break;
    case 'circle':
    case 'semi circle':
    case 'semicircle':
    case 'quarter circle':
    case 'quartercircle':
      lengthMtr = 1;
      widthMtr = areaSqMtr;
      base1Mtr = toApiNumber([offset.radius, params.radius, params.base1], 0);
      break;
    default:
      lengthMtr = toApiNumber([offset.length, params.length], 0);
      widthMtr = toApiNumber([offset.width, params.width], 0);
      base1Mtr = lengthMtr;
      base2Mtr = widthMtr;
  }

  return {
    isActive: true,
    updatedBy: 0,
    id: resolvedId > 0 ? resolvedId : null,
    roomWiseSubmissionId: roomSubmissionId,
    lengthMtr,
    widthMtr,
    heightMtr,
    areaSqMtr,
    shape,
    base1Mtr,
    base2Mtr,
    operation: offset.operation || OFFSET_OPERATIONS.SUBTRACT,
    isOffset: offset.operation === OFFSET_OPERATIONS.ADD,
  };
};

/**
 * Maps UI RoomData to API RoomSubmissionItem payload
 * Converts form data structure to API-expected format
 */
export const mapRoomDataToApi = (room: RoomData, propertyId: number = 0, propertyDetailsId: number = 0, isUtility?: boolean): RoomAPIResponse => {
  const params = (room.shapeParameters || room.shapeParams || {}) as Record<string, unknown>;

  const shape = room.shape || SHAPE_TYPES.RECTANGLE;
  const areaSqMtr = toApiNumber([room.areaSqMtr, room.area], 0);

  // Enterprise Mapping Logic
  let lengthMtr = 0;
  let widthMtr = 0;
  let base1Mtr = 0;
  let base2Mtr = 0;
  let heightMtr = 0;

  const normalizedShape = String(shape || '').toLowerCase().trim();

  switch (normalizedShape) {
    case 'rectangle':
    case 'rectangular':
      lengthMtr = toApiNumber([params.length, room.length], 0);
      widthMtr = toApiNumber([params.width, room.width], 0);
      base1Mtr = lengthMtr;
      base2Mtr = widthMtr;
      break;
    case 'square':
      const s = toApiNumber([params.side, (room as Record<string, unknown>).side, params.length, room.length, params.base1, room.base1Mtr], 0);
      lengthMtr = s;
      widthMtr = s;
      base1Mtr = s;
      break;
    case 'trapezoid':
      lengthMtr = 1;
      widthMtr = areaSqMtr;
      base1Mtr = toApiNumber([params.base1, room.base1], 0);
      base2Mtr = toApiNumber([params.base2, room.base2], 0);
      heightMtr = toApiNumber([params.height, room.height], 0);
      break;
    case 'triangle':
      lengthMtr = 1;
      widthMtr = areaSqMtr;
      base1Mtr = toApiNumber([params.base, room.base, params.base1], 0);
      heightMtr = toApiNumber([params.height, room.height], 0);
      break;
    case 'circle':
    case 'semi circle':
    case 'semicircle':
    case 'quarter circle':
    case 'quartercircle':
      lengthMtr = 1;
      widthMtr = areaSqMtr;
      base1Mtr = toApiNumber([params.radius, room.radius, params.base1], 0);
      break;
    default:
      lengthMtr = toApiNumber([params.length, room.length], 0);
      widthMtr = toApiNumber([params.width, room.width], 0);
      base1Mtr = lengthMtr;
      base2Mtr = widthMtr;
  }

  // Prioritize 'offsets' from UI state over 'roomWiseMinusData' from API to prevent lost updates
  const finalOffsets = room.offsets || room.roomWiseMinusData || [];

  const resolvedId = extractValidId(room.id, room.roomWiseSubmissionId);

  return {
    isActive: true,
    updatedBy: 0,
    id: resolvedId,
    propertyDetailsId: propertyDetailsId,
    propertyId: propertyId,
    lengthMtr,
    widthMtr,
    heightMtr,
    areaSqMtr,
    noOfRooms: isUtility ? 0 : Number(room.roomCount || room.noOfRooms || 1),
    totalAreaSqMtr: toApiNumber([room.totalAreaSqMtr, room.total, room.area], 0),
    roomNo: (room.roomNo as string) || '',
    roomType: (room.roomType || room.utilities as string) || 'Residential',
    roomTypeId: Number(room.roomTypeId || 0),
    shape,
    outerYesNo: room.outerYesNo === true || room.outer === 'Yes',
    minusYesNo: (finalOffsets as unknown[]).length > 0,
    submissionType: isUtility ? "utility" : "Room",
    base1Mtr,
    base2Mtr,
    roomWiseMinusData: (finalOffsets as OffsetData[]).map(o =>
      mapOffsetToApi(o, extractValidId(room.id, room.roomWiseSubmissionId))
    ),
  } as RoomAPIResponse;
};
