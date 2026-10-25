import { FloorData } from "@/types/room-details.types";

/**
 * Generates an optimistic floor object for immediate UI updates
 */
export function createOptimisticFloor(
  formData: FloorData,
  isAddingNew: boolean,
  selectedFloorId?: string | number
): FloorData {
  return {
    ...formData,
    id: isAddingNew ? Date.now() : Number(selectedFloorId),
  };
}

/**
 * Returns a new list of floors with the optimistic floor inserted or updated
 */
export function getOptimisticFloorsList(
  currentFloors: FloorData[],
  optimisticFloor: FloorData,
  isAddingNew: boolean
): FloorData[] {
  if (isAddingNew) {
    return [optimisticFloor, ...currentFloors];
  }
  return currentFloors.map((f) =>
    String(f.id) === String(optimisticFloor.id) ? optimisticFloor : f
  );
}

/**
 * Parses and translates server-side validation errors
 */
export function parseServerError(
  error: unknown,
  t: (key: string) => string
): string {
  const rawError = typeof error === 'string' ? error : '';
  
  // Handle floor.errors.* format (new format)
  if (rawError.startsWith('floor.errors.')) {
    const translated = t(rawError);
    if (translated && translated !== rawError) {
      return translated;
    }
  }
  
  // Handle validation.* format (legacy fallback)
  if (rawError.startsWith('validation.')) {
    const translated = t(rawError);
    if (translated && translated !== rawError) {
      return translated;
    }
    
    // Fallback: try translating as floor.errors.X
    const errorKey = rawError.replace('validation.', 'floor.errors.');
    const fallbackTranslated = t(errorKey);
    if (fallbackTranslated && fallbackTranslated !== errorKey) {
      return fallbackTranslated;
    }
  }
  
  return rawError || t('floor.errors.saveFailed') || 'Failed to save data';
}
