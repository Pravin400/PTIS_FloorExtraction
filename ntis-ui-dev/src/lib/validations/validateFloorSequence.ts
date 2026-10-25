/**
 * Utility for Floor Number vs Construction Year sequence validation across all floors of a Property ID.
 *
 * Core rule: Previous Floor Construction Year <= Current Floor Construction Year
 * (i.e. Current Floor Construction Year >= Previous Floor Construction Year)
 */

import { FloorData } from '@/types/room-details.types';

export interface FloorValidationRecord {
  propertyId?: number | string;
  floorId?: number | string;
  id?: number | string;
  floorSequenceNo?: number;
  floorCode?: string;
  floorDescription?: string;
  floor?: string;
  constructionYear?: number | string;
  conYr?: number | string;
}

export interface FloorConstructionYearMismatch {
  propertyId: string;
  floorId: string;
  floorCodeOrDescription: string;
  constructionYear: number;
  previousFloorId: string;
  previousFloorCodeOrDescription: string;
  previousConstructionYear: number;
  message: string;
}

export interface FloorSequenceValidationResult {
  isValid: boolean;
  mismatches: FloorConstructionYearMismatch[];
  invalidFloorIds: Set<string>;
}

export interface FloorNumberSequenceMismatch {
  propertyId: string;
  floorId: string;
  floorCodeOrDescription: string;
  expectedSequenceNo?: number;
  actualSequenceNo: number;
  type: 'DUPLICATE' | 'GAP_MISSING' | 'INVALID_START' | 'OUT_OF_ORDER';
  message: string;
}

export interface FloorNumberSequenceValidationResult {
  isValid: boolean;
  mismatches: FloorNumberSequenceMismatch[];
  invalidFloorIds: Set<string>;
}

export interface FloorCompleteSequenceValidationResult {
  isValid: boolean;
  numberMismatches: FloorNumberSequenceMismatch[];
  yearMismatches: FloorConstructionYearMismatch[];
  invalidFloorIds: Set<string>;
  firstErrorMessage?: string;
}

/**
 * Maps floor code/name/id to a numeric sequence for sorting.
 * Returns negative values for basements, 0 for Ground, positive for upper floors.
 */
export function parseFloorSequence(item: FloorValidationRecord): number {
  if (typeof item.floorSequenceNo === 'number' && !isNaN(item.floorSequenceNo)) {
    return item.floorSequenceNo;
  }

  const combinedText = `${item.floorDescription || ''} ${item.floor || ''} ${item.floorCode || ''}`.trim();
  const lower = combinedText.toLowerCase();

  // Ground floor checks
  if (
    lower === 'g' ||
    lower === '0' ||
    lower.includes('ground') ||
    lower.includes('ग्राऊंड') ||
    lower.includes('तळ') ||
    lower.includes('ग्राउंड')
  ) {
    return 0;
  }

  // Basement floor checks
  if (lower.includes('b') || lower.includes('basement') || lower.includes('बेसमेंट')) {
    const numMatch = lower.match(/\d+/);
    if (numMatch) {
      return -Math.abs(parseInt(numMatch[0], 10));
    }
    return -1;
  }

  // Marathi ordinal words check
  if (lower.includes('पहिला') || lower.includes('पहीला') || lower.includes('1st') || lower.includes('first')) return 1;
  if (lower.includes('दुसरा') || lower.includes('2nd') || lower.includes('second')) return 2;
  if (lower.includes('तिसरा') || lower.includes('3rd') || lower.includes('third')) return 3;
  if (lower.includes('चौथा') || lower.includes('4th') || lower.includes('fourth')) return 4;
  if (lower.includes('पांचवा') || lower.includes('पाचवा') || lower.includes('5th') || lower.includes('fifth')) return 5;
  if (lower.includes('सहावा') || lower.includes('6th') || lower.includes('sixth')) return 6;
  if (lower.includes('सातवा') || lower.includes('7th') || lower.includes('seventh')) return 7;
  if (lower.includes('आठवा') || lower.includes('8th') || lower.includes('eighth')) return 8;
  if (lower.includes('नववा') || lower.includes('9th') || lower.includes('ninth')) return 9;
  if (lower.includes('दहावा') || lower.includes('10th') || lower.includes('tenth')) return 10;

  // Devanagari numerals conversion
  const devanagariMap: Record<string, string> = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
  };
  const convertedStr = combinedText.replace(/[०-९]/g, (w) => devanagariMap[w] || w);

  // Extract explicit integer if present (e.g. "1st Floor", "1 - पहिला मजला", "2", "3 - तिसरा मजला")
  const numMatch = convertedStr.match(/^(-?\d+)/) || convertedStr.match(/(\d+)/);
  if (numMatch) {
    return parseInt(numMatch[1], 10);
  }

  return 0;
}

/**
 * Safely extracts construction year as a number or null if missing/invalid.
 */
export function extractConstructionYear(item: FloorValidationRecord): number | null {
  const rawYear = item.conYr !== undefined && item.conYr !== null && item.conYr !== ''
    ? item.conYr
    : item.constructionYear;

  if (rawYear === undefined || rawYear === null || rawYear === '') return null;
  const num = typeof rawYear === 'number' ? rawYear : parseInt(String(rawYear).trim(), 10);
  if (isNaN(num) || num <= 0) return null;
  return num;
}

/**
 * Extract a unique Property ID string from a floor record.
 */
export function extractPropertyId(item: FloorValidationRecord, defaultPropertyId?: string | number): string {
  if (item.propertyId !== undefined && item.propertyId !== null && String(item.propertyId).trim() !== '') {
    return String(item.propertyId).trim();
  }
  if (defaultPropertyId !== undefined && defaultPropertyId !== null && String(defaultPropertyId).trim() !== '') {
    return String(defaultPropertyId).trim();
  }
  return 'default_property';
}

/**
 * Extract a unique Floor ID string from a floor record (Property ID + Floor ID context).
 */
export function extractFloorId(item: FloorValidationRecord): string {
  const fid = item.floorId ?? item.id;
  if (fid !== undefined && fid !== null && String(fid).trim() !== '') {
    return String(fid).trim();
  }
  return String(item.floor || item.floorCode || 'unknown_floor');
}

/**
 * Formats a friendly label for the floor to present in error messages.
 */
export function formatFloorLabel(item: FloorValidationRecord): string {
  if (item.floorDescription && String(item.floorDescription).trim()) {
    return String(item.floorDescription).trim();
  }
  if (item.floor && String(item.floor).trim()) {
    return String(item.floor).trim();
  }
  if (item.floorCode && String(item.floorCode).trim()) {
    return String(item.floorCode).trim();
  }
  return `Floor ID ${extractFloorId(item)}`;
}

/**
 * Validates the floor construction year sequence for a single Property ID or all Property IDs in input.
 *
 * Rule:
 * Sort records by Floor Sequence Number / Floor Number ascending (e.g. Ground -> 1st -> 2nd).
 * Compare every floor's Construction Year with the immediately previous floor.
 * Current Floor Construction Year < Previous Floor Construction Year -> Mismatch ❌
 * Current Floor Construction Year >= Previous Floor Construction Year -> Valid ✅
 *
 * @param floors List of floor records to validate
 * @param defaultPropertyId Fallback Property ID if floor records don't contain propertyId
 */
export function validateFloorConstructionYearSequence(
  floors: FloorValidationRecord[],
  defaultPropertyId?: string | number
): FloorSequenceValidationResult {
  const mismatches: FloorConstructionYearMismatch[] = [];
  const invalidFloorIds = new Set<string>();

  if (!floors || floors.length <= 1) {
    return { isValid: true, mismatches, invalidFloorIds };
  }

  // 1. Group records by Property ID so we do NOT compare across different properties
  const propertyGroups = new Map<string, FloorValidationRecord[]>();
  for (const floor of floors) {
    const propId = extractPropertyId(floor, defaultPropertyId);
    if (!propertyGroups.has(propId)) {
      propertyGroups.set(propId, []);
    }
    propertyGroups.get(propId)!.push(floor);
  }

  // 2. Validate each Property ID independently
  propertyGroups.forEach((propFloors, propertyId) => {
    // Exclude Open Plot / Open Space records from floor elevation sequence checking if marked as such
    const validElevationFloors = propFloors.filter((f) => {
      const fData = f as FloorData;
      if (
        fData.isOpenPlot === true ||
        String(fData.isOpenPlot) === 'true' ||
        String(fData.selectedFloorType).toLowerCase() === 'openplot' ||
        String(fData.floor || '').toLowerCase().includes('open plot') ||
        String(fData.floor || '').toLowerCase() === 'op' ||
        String(fData.conTyp || '').toLowerCase() === 'op' ||
        String(fData.conTyp || '').toLowerCase().includes('open plot')
      ) {
        return false;
      }
      return true;
    });

    if (validElevationFloors.length <= 1) return;

    // Group records by floor sequence level so same-floor entries (subfloors, rooms) are not compared against each other
    const floorLevelsMap = new Map<number, FloorValidationRecord[]>();
    for (const f of validElevationFloors) {
      const seq = parseFloorSequence(f);
      if (!floorLevelsMap.has(seq)) {
        floorLevelsMap.set(seq, []);
      }
      floorLevelsMap.get(seq)!.push(f);
    }

    const sortedLevelSeqs = Array.from(floorLevelsMap.keys()).sort((a, b) => a - b);

    let maxLowerFloorYear: number | null = null;
    let maxLowerFloorRecord: FloorValidationRecord | null = null;

    for (const levelSeq of sortedLevelSeqs) {
      const levelFloors = floorLevelsMap.get(levelSeq)!;

      // 1. Check entries on current floor level strictly against LOWER floor levels
      for (const current of levelFloors) {
        const currentYear = extractConstructionYear(current);
        if (currentYear === null) continue;

        if (maxLowerFloorYear !== null && maxLowerFloorRecord !== null && currentYear < maxLowerFloorYear) {
          const currentFloorId = extractFloorId(current);
          const previousFloorId = extractFloorId(maxLowerFloorRecord);
          const currentLabel = formatFloorLabel(current);
          const previousLabel = formatFloorLabel(maxLowerFloorRecord);

          invalidFloorIds.add(currentFloorId);

          mismatches.push({
            propertyId,
            floorId: currentFloorId,
            floorCodeOrDescription: currentLabel,
            constructionYear: currentYear,
            previousFloorId,
            previousFloorCodeOrDescription: previousLabel,
            previousConstructionYear: maxLowerFloorYear,
            message: `${currentLabel} Construction Year (${currentYear}) is earlier than previous floor's (${previousLabel}) Construction Year (${maxLowerFloorYear})`,
          });
        }
      }

      // 2. Update maxLowerFloorYear for subsequent HIGHER floor levels
      for (const current of levelFloors) {
        const currentYear = extractConstructionYear(current);
        if (currentYear !== null) {
          if (maxLowerFloorYear === null || currentYear > maxLowerFloorYear) {
            maxLowerFloorYear = currentYear;
            maxLowerFloorRecord = current;
          }
        }
      }
    }
  });

  return {
    isValid: mismatches.length === 0,
    mismatches,
    invalidFloorIds,
  };
}

/**
 * Validates that Floor Numbers follow a continuous and logical sequence:
 * Ground Floor (0) -> 1st Floor (1) -> 2nd Floor (2) -> 3rd Floor (3) ...
 *
 * Rules:
 * 1. No Duplicate Floor Numbers (e.g. two 1st floors).
 * 2. Sequence must start from Ground Floor (0) if positive floors exist.
 * 3. No gaps / missing floors in sequence (e.g. Ground -> 1st -> 3rd triggers gap error for 2nd floor).
 */
export function validateFloorNumberSequence(
  floors: FloorValidationRecord[],
  defaultPropertyId?: string | number
): FloorNumberSequenceValidationResult {
  const mismatches: FloorNumberSequenceMismatch[] = [];
  const invalidFloorIds = new Set<string>();

  if (!floors || floors.length === 0) {
    return { isValid: true, mismatches, invalidFloorIds };
  }

  // 1. Group records by Property ID
  const propertyGroups = new Map<string, FloorValidationRecord[]>();
  for (const floor of floors) {
    const propId = extractPropertyId(floor, defaultPropertyId);
    if (!propertyGroups.has(propId)) {
      propertyGroups.set(propId, []);
    }
    propertyGroups.get(propId)!.push(floor);
  }

  // 2. Validate each Property ID independently
  propertyGroups.forEach((propFloors, propertyId) => {
    // Exclude Open Plot / Open Space records
    const elevationFloors = propFloors.filter((f) => {
      const fData = f as FloorData;
      if (
        fData.isOpenPlot === true ||
        String(fData.isOpenPlot) === 'true' ||
        String(fData.selectedFloorType).toLowerCase() === 'openplot' ||
        String(fData.floor || '').toLowerCase().includes('open plot') ||
        String(fData.floor || '').toLowerCase() === 'op' ||
        String(fData.conTyp || '').toLowerCase() === 'op' ||
        String(fData.conTyp || '').toLowerCase().includes('open plot')
      ) {
        return false;
      }
      return true;
    });

    if (elevationFloors.length === 0) return;

    // Sort floors by sequence ascending
    const sortedFloors = [...elevationFloors].sort((a, b) => {
      return parseFloorSequence(a) - parseFloorSequence(b);
    });

    // Deduplicate floor sequence levels for gap/start checking (duplicate floor entries are allowed for multiple units/modes)
    const uniqueSeqFloorsMap = new Map<number, FloorValidationRecord>();
    sortedFloors.forEach((f) => {
      const seq = parseFloorSequence(f);
      if (!uniqueSeqFloorsMap.has(seq)) {
        uniqueSeqFloorsMap.set(seq, f);
      }
    });

    const nonBasementFloors = Array.from(uniqueSeqFloorsMap.values()).filter((f) => parseFloorSequence(f) >= 0);

    if (nonBasementFloors.length > 0) {
      // Must start at Ground Floor (0)
      const firstSeq = parseFloorSequence(nonBasementFloors[0]);
      if (firstSeq > 0) {
        const firstFloorId = extractFloorId(nonBasementFloors[0]);
        const firstLabel = formatFloorLabel(nonBasementFloors[0]);
        invalidFloorIds.add(firstFloorId);
        mismatches.push({
          propertyId,
          floorId: firstFloorId,
          floorCodeOrDescription: firstLabel,
          expectedSequenceNo: 0,
          actualSequenceNo: firstSeq,
          type: 'INVALID_START',
          message: `Floor sequence must start with Ground Floor (0). Missing Ground Floor before ${firstLabel}.`,
        });
      }

      // Check step continuity (0 -> 1 -> 2 -> 3...)
      for (let i = 1; i < nonBasementFloors.length; i++) {
        const prev = nonBasementFloors[i - 1];
        const curr = nonBasementFloors[i];

        const prevSeq = parseFloorSequence(prev);
        const currSeq = parseFloorSequence(curr);

        if (currSeq > prevSeq + 1) {
          const currFloorId = extractFloorId(curr);
          const currLabel = formatFloorLabel(curr);
          const prevLabel = formatFloorLabel(prev);

          invalidFloorIds.add(currFloorId);
          mismatches.push({
            propertyId,
            floorId: currFloorId,
            floorCodeOrDescription: currLabel,
            expectedSequenceNo: prevSeq + 1,
            actualSequenceNo: currSeq,
            type: 'GAP_MISSING',
            message: `Floor sequence gap detected: ${currLabel} is out of sequence. Missing floor number (${prevSeq + 1}) after ${prevLabel}.`,
          });
        }
      }
    }
  });

  return {
    isValid: mismatches.length === 0,
    mismatches,
    invalidFloorIds,
  };
}

/**
 * Combined Complete Sequence Validation (Floor Number Sequence + Construction Year Sequence)
 */
export function validateFloorCompleteSequence(
  floors: FloorValidationRecord[],
  defaultPropertyId?: string | number
): FloorCompleteSequenceValidationResult {
  const numberResult = validateFloorNumberSequence(floors, defaultPropertyId);
  const yearResult = validateFloorConstructionYearSequence(floors, defaultPropertyId);

  const invalidFloorIds = new Set<string>([
    ...Array.from(numberResult.invalidFloorIds),
    ...Array.from(yearResult.invalidFloorIds),
  ]);

  const isValid = numberResult.isValid && yearResult.isValid;
  const firstErrorMessage =
    numberResult.mismatches[0]?.message || yearResult.mismatches[0]?.message;

  return {
    isValid,
    numberMismatches: numberResult.mismatches,
    yearMismatches: yearResult.mismatches,
    invalidFloorIds,
    firstErrorMessage,
  };
}
