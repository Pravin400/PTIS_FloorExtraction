import { RateItem } from "@/types/rateSectionMaster.types";

export const getRateSectionDisplayLabel = (
  rateSectionId: string,
  rates: RateItem[]
): string => {
  const rate = rates.find(r => String(r.id) === rateSectionId);
  if (rate?.description) {
    return `${rate.id} - ${rate.description}`;
  }
  return rateSectionId;
};

export const getSelectedZoneName = (
  selectedZoneId: string | undefined,
  rates: RateItem[]
): string => {
  if (!selectedZoneId) return "";
  const rate = rates.find(r => String(r.id) === selectedZoneId);
  return rate?.description || selectedZoneId;
};

export const handleToggleAvailable = (
  wardNo: string,
  _wardAssignments: Record<string, { rateSectionNo: string; id: number; description?: string }>,
  _selectedZoneId: string | undefined,
  checkedAvailable: Set<string>,
  setCheckedAvailable: (set: Set<string>) => void,
  _rates: RateItem[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _t: any
) => {
  const set = new Set(checkedAvailable);
  if (set.has(wardNo)) {
    set.delete(wardNo);
  } else {
    set.add(wardNo);
  }
  setCheckedAvailable(set);
};

export const handleToggleSelected = (
  wardNo: string,
  checkedSelected: Set<string>,
  setCheckedSelected: (set: Set<string>) => void
) => {
  const set = new Set(checkedSelected);
  if (set.has(wardNo)) {
    set.delete(wardNo);
  } else {
    set.add(wardNo);
  }
  setCheckedSelected(set);
};
