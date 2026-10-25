export interface OldDetailsColDef {
  key: string;
  label: string;
  minWidth: string;
  align: 'text-left' | 'text-center' | 'text-right';
}

export const OLD_DETAILS_COLUMNS: OldDetailsColDef[] = [
  // 1. Current Mapped Unit Details
  { key: 'index', label: '#', minWidth: 'min-w-[48px]', align: 'text-center' },
  { key: 'propFlat', label: 'PROP / FLAT NO', minWidth: 'min-w-[130px]', align: 'text-left' },
  { key: 'ownerName', label: 'OWNER NAME', minWidth: 'min-w-[150px]', align: 'text-left' },
  { key: 'occupierName', label: 'OCCUPIER NAME', minWidth: 'min-w-[150px]', align: 'text-left' },
  { key: 'address', label: 'ADDRESS', minWidth: 'min-w-[200px]', align: 'text-left' },
  { key: 'csnPlot', label: 'CSN / PLOT', minWidth: 'min-w-[100px]', align: 'text-left' },
  { key: 'contact', label: 'CONTACT', minWidth: 'min-w-[120px]', align: 'text-left' },
  { key: 'mappingCategory', label: 'MAPPING CATEGORY', minWidth: 'min-w-[130px]', align: 'text-left' },

  // 2. Old Historical Record Details
  { key: 'oldPropFlat', label: 'OLD PROP / FLAT', minWidth: 'min-w-[130px]', align: 'text-left' },
  { key: 'oldWardZone', label: 'OLD WARD / ZONE', minWidth: 'min-w-[120px]', align: 'text-left' },
  { key: 'oldWingFloor', label: 'OLD FLOOR', minWidth: 'min-w-[120px]', align: 'text-left' },
  { key: 'oldEgovNo', label: 'OLD E-GOV NO', minWidth: 'min-w-[120px]', align: 'text-left' },
  { key: 'oldCsnPlot', label: 'OLD CSN / PLOT', minWidth: 'min-w-[110px]', align: 'text-left' },
  { key: 'oldUseType', label: 'OLD USE TYPE', minWidth: 'min-w-[120px]', align: 'text-left' },
  { key: 'oldConstructionYear', label: 'CONST YEAR', minWidth: 'min-w-[95px]', align: 'text-center' },
  { key: 'oldAssessmentYear', label: 'ASMT YEAR', minWidth: 'min-w-[95px]', align: 'text-center' },
  { key: 'oldConstructionArea', label: 'CONST AREA', minWidth: 'min-w-[110px]', align: 'text-right' },
  { key: 'oldPlotArea', label: 'PLOT AREA', minWidth: 'min-w-[110px]', align: 'text-right' },
  { key: 'oldParking', label: 'PARKING (FT/M)', minWidth: 'min-w-[130px]', align: 'text-right' },
  { key: 'oldRoomsToilets', label: 'ROOMS / TOILETS', minWidth: 'min-w-[120px]', align: 'text-center' },
  { key: 'oldOwnerName', label: 'OLD OWNER', minWidth: 'min-w-[150px]', align: 'text-left' },
  { key: 'oldOccupierName', label: 'OLD OCCUPIER', minWidth: 'min-w-[150px]', align: 'text-left' },
  { key: 'oldAddress', label: 'OLD ADDRESS', minWidth: 'min-w-[200px]', align: 'text-left' },
  { key: 'oldSocietyName', label: 'OLD SOCIETY', minWidth: 'min-w-[150px]', align: 'text-left' },
  { key: 'oldALV', label: 'OLD ALV', minWidth: 'min-w-[105px]', align: 'text-right' },
  { key: 'oldRV', label: 'OLD RV', minWidth: 'min-w-[105px]', align: 'text-right' },
  { key: 'oldTax', label: 'TAX (GEN / TOTAL)', minWidth: 'min-w-[145px]', align: 'text-right' },
  { key: 'oldAssessmentDate', label: 'OLD ASMT DATE', minWidth: 'min-w-[120px]', align: 'text-center' },
  { key: 'oldContact', label: 'OLD CONTACT', minWidth: 'min-w-[130px]', align: 'text-left' },
];
