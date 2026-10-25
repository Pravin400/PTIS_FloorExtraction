/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from 'sonner';
import { resolveOpenSpaceFloorId } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/floor-registration-utils';

function buildRoomOffsets(offsets: any[], isDuplicateMode: boolean = false) {
  return Array.isArray(offsets)
    ? offsets.map((off: any) => ({
      id: isDuplicateMode ? undefined : (() => {
        const num = Number(off.id);
        return !isNaN(num) &&
          Number.isInteger(num) &&
          num > 0 &&
          !String(off.id).startsWith('0.') &&
          !String(off.id).includes('db_')
          ? num
          : undefined;
      })(),
      shape: off.shape || 'Rectangle',
      length: off.length ? Number(off.length) : null,
      width: off.width ? Number(off.width) : null,
      height: off.height ? Number(off.height) : null,
      base1: off.base1 ? Number(off.base1) : null,
      base2: off.base2 ? Number(off.base2) : null,
      areaSqM: off.areaSqM ? Number(off.areaSqM) : null,
      op: off.op || 'Subtract',
    }))
    : [];
}

function buildRoomDetails(combinedData: any[], isDuplicateMode: boolean = false) {
  if (combinedData.length === 0) return null;
  return combinedData.map((r: any) => {
    const areaSqM = r.areaSqM != null ? Number(r.areaSqM) : Number(r.area || 0) * 0.092903;
    return {
      id: isDuplicateMode ? undefined : (() => {
        const num = Number(r.id);
        return !isNaN(num) &&
          Number.isInteger(num) &&
          num > 0 &&
          !String(r.id).startsWith('0.') &&
          !String(r.id).includes('db_')
          ? num
          : undefined;
      })(),
      roomNo: r.roomNo,
      roomType: r.roomType,
      shape: r.shape || 'Rectangle',
      lengthMtr: r.length ? Number(r.length) : null,
      widthMtr: r.width ? Number(r.width) : null,
      heightMtr: r.height ? Number(r.height) : null,
      base1Mtr: r.base1 ? Number(r.base1) : null,
      base2Mtr: r.base2 ? Number(r.base2) : null,
      areaSqMtr: areaSqM,
      noOfRooms: Number(r.count || 1),
      totalAreaSqMtr:
        (r.roomType === 'Open Space' || r.roomType === 'Amenity'
          ? Number(r.netAreaSqM || 0)
          : Number(areaSqM)) * Number(r.count || 1),
      outerYesNo: r.outer === 'Yes',
      minusYesNo: r.minus === 'Yes' || r.hasOffset === 'Yes',
      submissionType: r.submissionType || 'Room',
      offsets: buildRoomOffsets(r.offsets, isDuplicateMode),
    };
  });
}

export function buildFloorPayload(
  formState: any,
  roomData: any[],
  openSpaceData: any[],
  amenityData: any[],
  dropdownOptions: any,
  t: any,
  isDuplicateMode: boolean = false
) {
  const combinedData = [
    ...roomData.map((r) => ({ ...r, submissionType: r.submissionType || 'Room' })),
    ...openSpaceData.map((os) => ({
      ...os,
      submissionType: 'Open Space',
      roomType: 'Open Space',
    })),
    ...amenityData.map((am) => ({ ...am, submissionType: 'Amenity', roomType: 'Amenity' })),
  ];

  const roomDetails = buildRoomDetails(combinedData, isDuplicateMode);

  let floorIdNum: number;
  if (formState.submissionType === 'Open Space') {
    const resolvedOpenSpaceFloorId = resolveOpenSpaceFloorId(dropdownOptions?.floorLevels);
    if (!resolvedOpenSpaceFloorId) {
      toast.error(
        t.has('floorDetails.openSpaceFloorMissingMsg')
          ? t('floorDetails.openSpaceFloorMissingMsg')
          : 'Could not find an active "OP - Open Plot" entry in Floor master. Please contact support.'
      );
      return null;
    }
    floorIdNum = resolvedOpenSpaceFloorId;
  } else {
    floorIdNum = Number(formState.floor);
  }
  const subFloorIdNum = formState.subFloor ? Number(formState.subFloor) : null;

  return { combinedData, roomDetails, floorIdNum, subFloorIdNum };
}
