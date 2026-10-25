/* eslint-disable @typescript-eslint/no-explicit-any */
import { OffsetEntry } from "@/lib/utils/asset-utils/room-utils";
import { Amenity, computeAmenity } from '@/hooks/asset-hooks/useAmenityDrawer';
import { OpenSpace, computeOpenSpace } from '@/hooks/asset-hooks/useOpenSpaceDrawer';

function makeId() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `space-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

function mapIncomingOffsets(offsets: any): OffsetEntry[] {
  return Array.isArray(offsets)
    ? offsets.map((off: any) => ({
        id: off.id || makeId(),
        shape: off.shape || "Rectangle",
        length: Number(off.length || 0), width: Number(off.width || 0),
        height: Number(off.height || 0), base1: Number(off.base1 || 0),
        base2: Number(off.base2 || 0), radius: Number(off.radius || 0),
        areaSqM: Number(off.areaSqM || 0),
        op: (off.op as "Add" | "Subtract") || "Subtract",
      }))
    : [];
}

/** Normalizes floor-details `amenities` payloads (persisted or freshly-loaded) into the drawer's internal Amenity shape. */
export function mapIncomingAmenities(initialSpaces: any[]): Amenity[] {
  return initialSpaces.map((s: any) => {
    const rOffsets = mapIncomingOffsets(s.offsets);
    return computeAmenity({
      id: s.id || makeId(),
      name: s.roomNo || s.name || "Clubhouse",
      roomNo: s.roomNo || s.name || "Clubhouse",
      roomType: "Amenity",
      shape: s.shape || "Rectangle",
      length: Number(s.length || s.lengthMtr || 0),
      width: Number(s.width || s.widthMtr || 0),
      height: Number(s.height || s.heightMtr || 0),
      base1: Number(s.base1 || s.base1Mtr || 0),
      base2: Number(s.base2 || s.base2Mtr || 0),
      radius: Number(s.radius || s.radiusMtr || 0),
      areaSqM: Number(s.areaSqM || s.areaSqMtr || 0),
      areaSqFt: Number(s.areaSqFt || 0),
      hasOffset: rOffsets.length > 0 ? "Yes" : "No",
      offsets: rOffsets,
      offsetAreaSqM: 0,
      offsetOp: "Subtract",
      netAreaSqM: Number(s.netAreaSqM || s.totalAreaSqMtr || 0),
      netAreaSqFt: Number(s.netAreaSqFt || 0),
      count: Number(s.count || s.noOfRooms || 1),
      submissionType: "Amenity",
      outer: "No", minus: "No",
    });
  });
}

/** Normalizes floor-details `openSpaces` payloads (persisted or freshly-loaded) into the drawer's internal OpenSpace shape. */
export function mapIncomingOpenSpaces(initialSpaces: any[]): OpenSpace[] {
  return initialSpaces.map((s: any) => {
    const rOffsets = mapIncomingOffsets(s.offsets);
    return computeOpenSpace({
      id: s.id || makeId(),
      name: s.roomNo || s.name || "Balcony",
      roomNo: s.roomNo || s.name || "Balcony",
      roomType: "Open Space",
      shape: s.shape || "Rectangle",
      length: Number(s.length || s.lengthMtr || 0),
      width: Number(s.width || s.widthMtr || 0),
      height: Number(s.height || s.heightMtr || 0),
      base1: Number(s.base1 || s.base1Mtr || 0),
      base2: Number(s.base2 || s.base2Mtr || 0),
      radius: Number(s.radius || s.radiusMtr || 0),
      areaSqM: Number(s.areaSqM || s.areaSqMtr || 0),
      areaSqFt: Number(s.areaSqFt || 0),
      hasOffset: rOffsets.length > 0 ? "Yes" : "No",
      offsets: rOffsets,
      offsetAreaSqM: 0,
      offsetOp: "Subtract",
      netAreaSqM: Number(s.netAreaSqM || s.totalAreaSqMtr || 0),
      netAreaSqFt: Number(s.netAreaSqFt || 0),
      count: Number(s.count || s.noOfRooms || 1),
      submissionType: "Open Space",
      outer: "No", minus: "No",
    });
  });
}
