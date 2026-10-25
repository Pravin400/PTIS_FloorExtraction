import { WardItem } from '@/types/wardMaster.types';

export const normalizeKey = (k: string) => k.toLowerCase().replace(/[\s\-_]/g, '');

export const splitPropertyNoPartitionNo = (value: string) => {
  const parts = value.split('-').map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) {
    return { propertyNo: '', partitionNo: undefined };
  }
  const [propertyNo, ...rest] = parts;
  return {
    propertyNo,
    partitionNo: rest.length > 0 ? rest.join('-') : undefined,
  };
};

export const getNormalizedHeaders = (dataRows: Record<string, unknown>[]) => {
  if (dataRows.length === 0) return [];
  return Object.keys(dataRows[0]).map(normalizeKey);
};

export const hasRequiredBuildingHeaders = (headers: string[]) => {
  const hasWardHeader = headers.includes('ward');
  const hasPropertyHeader = headers.includes('propertynopartitionno') || headers.includes('propertyno') || headers.includes('propertynumber');
  return hasWardHeader && hasPropertyHeader;
};

export const getRowValue = (row: Record<string, unknown>, keys: string[]) => {
  const entry = Object.entries(row).find(([key]) => keys.includes(normalizeKey(key)));
  return entry ? String(entry[1] ?? '').trim() : '';
};

export const isWardValueValid = (rawWard: string, fetchedWards: WardItem[]) => {
  const trimmed = rawWard.trim();
  if (!trimmed) return false;
  const lowerValue = trimmed.toLowerCase();
  if (/^\d+$/.test(lowerValue)) return true;

  const normalizedWard = lowerValue.replace(/[\s\-_]/g, '');
  return fetchedWards.some(w => {
    const descLower = (w.description || '').toLowerCase();
    const wardNoLower = (w.wardNo || '').toLowerCase();
    return descLower.includes(lowerValue)
      || wardNoLower === lowerValue
      || String(w.id) === lowerValue
      || wardNoLower.replace(/[\s\-_]/g, '') === normalizedWard
      || descLower.replace(/[\s\-_]/g, '').includes(normalizedWard);
  });
};

export const isPropertyValueValid = (rawValue: string) => {
  const { propertyNo } = splitPropertyNoPartitionNo(rawValue);
  return Boolean(propertyNo && propertyNo.trim());
};

export const autoDetectScopeType = (dataRows: Record<string, unknown>[]) => {
  if (dataRows.length === 0) return 'property';

  const sampleRow = dataRows[0];
  const headers = Object.keys(sampleRow).map(normalizeKey);

  const hasPropertyWise = headers.includes('upicid') || headers.includes('mobileno');
  const hasBuildingWise = headers.includes('zone') || headers.includes('ward') || headers.includes('propertyno') || headers.includes('propertynumber') || headers.includes('propertynopartitionno');

  if (hasPropertyWise && !hasBuildingWise) {
    return 'property';
  } else if (hasBuildingWise && !hasPropertyWise) {
    return 'building';
  }
  return 'property';
};

export const mapExcelDataToPayload = (
  dataRows: Record<string, unknown>[],
  scopeType: string,
  zoneOptions: { value: string; label: string }[],
  fetchedWards: WardItem[]
) => {
  const zoneIds: number[] = [];
  const wardIds: number[] = [];
  const building: string[] = [];
  const partitionNos: string[] = [];
  const upicIds: string[] = [];
  const mobileNumbers: string[] = [];
  const wardNames: string[] = [];
  const zoneNames: string[] = [];

  const addBuildingValue = (value: string, wardKey: string) => {
    const { propertyNo, partitionNo } = splitPropertyNoPartitionNo(value);
    if (propertyNo) {
      const combined = wardKey ? `${wardKey}:${propertyNo}` : propertyNo;
      if (partitionNo) {
        building.push(`${combined}-${partitionNo}`);
        partitionNos.push(partitionNo);
      } else {
        building.push(combined);
      }
    }
  };

  dataRows.forEach(row => {
    let rawZone = "";
    let rawWard = "";
    let rawPropNo = "";
    let rawPropNoPartitionNo = "";
    let rawUpicId = "";
    let rawMobile = "";

    Object.keys(row).forEach(k => {
      const norm = normalizeKey(k);
      if (norm === 'zone') rawZone = String(row[k]).trim();
      else if (norm === 'ward') rawWard = String(row[k]).trim();
      else if (norm === 'propertyno' || norm === 'propertynumber') rawPropNo = String(row[k]).trim();
      else if (norm === 'propertynopartitionno') rawPropNoPartitionNo = String(row[k]).trim();
      else if (norm === 'upicid' || norm === 'upic') rawUpicId = String(row[k]).trim();
      else if (norm === 'mobileno' || norm === 'mobile') rawMobile = String(row[k]).trim();
    });

    if (rawZone) {
      const matchedZone = zoneOptions.find(opt => {
        const labelLower = opt.label.toLowerCase();
        const valueLower = opt.value.toLowerCase();
        const valLower = rawZone.toLowerCase();
        return labelLower.includes(valLower) 
            || valueLower === valLower
            || labelLower.replace(/[\s\-_]/g, '').includes(valLower.replace(/[\s\-_]/g, ''));
      });
      if (matchedZone) {
        zoneIds.push(Number(matchedZone.value));
      } else if (/^\d+$/.test(rawZone)) {
        zoneIds.push(Number(rawZone));
      } else {
        zoneNames.push(rawZone);
      }
    }

    let matchedWardId = "";
    if (rawWard) {
      wardNames.push(rawWard);
      const matchedWard = fetchedWards.find(w => {
        const descLower = (w.description || "").toLowerCase();
        const wardNoLower = (w.wardNo || "").toLowerCase();
        const valLower = rawWard.toLowerCase();
        const valLowerNormalized = valLower.replace(/[\s\-_]/g, '');
        return descLower.includes(valLower) 
            || wardNoLower === valLower 
            || String(w.id) === valLower
            || wardNoLower.replace(/[\s\-_]/g, '') === valLowerNormalized
            || descLower.replace(/[\s\-_]/g, '').includes(valLowerNormalized);
      });
      if (matchedWard) {
        matchedWardId = String(matchedWard.id);
        wardIds.push(Number(matchedWard.id));
      } else if (/^\d+$/.test(rawWard)) {
        matchedWardId = rawWard;
        wardIds.push(Number(rawWard));
      } else {
        matchedWardId = rawWard;
      }
    }

    if (rawPropNo) {
      addBuildingValue(rawPropNo, matchedWardId);
    }

    if (rawPropNoPartitionNo) {
      addBuildingValue(rawPropNoPartitionNo, matchedWardId);
    }

    if (rawUpicId) upicIds.push(rawUpicId);
    if (rawMobile) mobileNumbers.push(rawMobile);
  });

  if (zoneIds.length === 0 && wardIds.length > 0) {
    wardIds.forEach(wId => {
      const w = fetchedWards.find(x => Number(x.id) === wId);
      if (w && w.zoneId) {
        zoneIds.push(Number(w.zoneId));
      }
    });
  }

  const uniqueZoneIds = Array.from(new Set(zoneIds)).filter(Boolean);
  const uniqueWardIds = Array.from(new Set(wardIds)).filter(Boolean);
  const uniqueBuilding = Array.from(new Set(building)).filter(Boolean);
  const uniquePartitionNos = Array.from(new Set(partitionNos)).filter(Boolean);
  const uniqueUpicIds = Array.from(new Set(upicIds)).filter(Boolean);
  const uniqueMobileNumbers = Array.from(new Set(mobileNumbers)).filter(Boolean);
  const uniqueWardNames = Array.from(new Set(wardNames)).filter(Boolean);
  const uniqueZoneNames = Array.from(new Set(zoneNames)).filter(Boolean);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Scope data format varies dynamically by scope type
  const scope: any = {};
  if (scopeType === 'building') {
    scope.zoneIds = uniqueZoneIds;
    scope.wardIds = uniqueWardIds;
    scope.building = uniqueBuilding;
    scope.wardNames = uniqueWardNames;
    scope.zoneNames = uniqueZoneNames;
    if (uniquePartitionNos.length > 0) {
      scope.partitionNos = uniquePartitionNos;
    }
  } else {
    scope.upicIds = uniqueUpicIds;
    scope.mobileNumbers = uniqueMobileNumbers;
  }

  return scope;
};
