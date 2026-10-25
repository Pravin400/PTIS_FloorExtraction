/* eslint-disable @typescript-eslint/no-explicit-any */
export function partitionRoomsAndOpenSpaces(rooms: any[]) {
  const allRooms = Array.isArray(rooms) ? rooms : [];
  const roomsList = allRooms.filter(
    (r: any) => !(r.submissionType?.includes('Open Space') || r.roomType === 'Open Space')
  );
  const openSpacesList = allRooms.filter(
    (r: any) => r.submissionType?.includes('Open Space') || r.roomType === 'Open Space'
  );
  return { roomsList, openSpacesList };
}

// Carpet area in SqFt — from new shape-based rooms (netAreaSqFt), minus deductions
export function calculateSubUnitArea(
  roomsList: any[],
  openSpacesList: any[],
  carpetAreaSqFeet: any
): number {
  const roomsAreaSqFt = roomsList.reduce((acc, r) => {
    const netAreaSqFt =
      r.netAreaSqFt !== undefined
        ? Number(r.netAreaSqFt)
        : r.netAreaSqM !== undefined
          ? Number(r.netAreaSqM) * 10.7639
          : Number(r.areaSqFt || r.area || 0);
    const roomSqFt = netAreaSqFt * Number(r.count || 1);
    if (r.minus === 'Yes' || r.offset === 'Yes') return acc - roomSqFt;
    if (r.outer === 'Yes') return acc + roomSqFt * 0.8;
    return acc + roomSqFt;
  }, 0);

  const spacesAreaSqFt = openSpacesList.reduce((acc, os) => {
    const netAreaSqFt =
      os.netAreaSqFt !== undefined
        ? Number(os.netAreaSqFt)
        : os.netAreaSqM !== undefined
          ? Number(os.netAreaSqM) * 10.7639
          : Number(os.areaSqFt || os.area || 0);
    return acc + netAreaSqFt * Number(os.count || 1);
  }, 0);

  return roomsList.length > 0 || openSpacesList.length > 0
    ? parseFloat(Math.max(0, roomsAreaSqFt + spacesAreaSqFt).toFixed(2))
    : Number(carpetAreaSqFeet) || 0;
}

// ── Unit type detection — drives which fields are shown ───────────────────
export function resolveUnitTypeInfo(unit: any, formData: any, t: any) {
  const rawUnitType = (((unit.unitType || formData.unitType) as string) || 'Flat')
    .toLowerCase()
    .trim();
  const isShop = rawUnitType.includes('shop') || rawUnitType.includes('commercial');
  const isOffice = rawUnitType.includes('office') || rawUnitType.includes('corporate');
  const isRoom = rawUnitType.includes('room') || rawUnitType.includes('chamber');
  const isDepartment =
    rawUnitType.includes('department') ||
    rawUnitType.includes('dept') ||
    rawUnitType.includes('wing');
  // Flat is the default (residential)
  const sectionTitle = isShop
    ? t('subunit.sections.shopDetails')
    : isOffice
      ? t('subunit.sections.officeDetails')
      : isRoom
        ? t('subunit.sections.roomDetails')
        : isDepartment
          ? t('subunit.sections.departmentInfo')
          : t('subunit.sections.residentDetails');
  // Departments are internal allocations — no rent section needed
  const showRentSection = !isDepartment;
  // isRenter: derived from formData (supports both isRented and isRenter field names)
  const isRenter = !!(formData.isRenter || formData.isRented);

  return { isShop, isOffice, isRoom, isDepartment, sectionTitle, showRentSection, isRenter };
}

export function applyFieldChange(prev: any, name: string, value: string, type: string) {
  let val = value;
  if (typeof val === 'string') {
    if (val.startsWith(' ')) {
      val = val.trimStart();
    }
    // Allow alphanumeric, space, hyphen, and underscore. Exclude email, date, and number fields.
    if (type !== 'email' && type !== 'date' && type !== 'number' && name !== 'emailId') {
      val = val.replace(/[^a-zA-Z0-9\s\-_]/g, '');
    }
  }

  const lowerName = name.toLowerCase();

  if (lowerName.includes('mobileno')) {
    val = val.replace(/\D/g, '').slice(0, 10);
  } else if (
    lowerName.includes('rentamount') ||
    lowerName.includes('securitydeposit') ||
    lowerName.includes('carpetareasqfeet')
  ) {
    val = val.replace(/-/g, '');
  } else if (
    lowerName.includes('name') ||
    lowerName.includes('owner') ||
    lowerName.includes('person') ||
    lowerName.includes('contact')
  ) {
    val = val.replace(/[^a-zA-Z\s.]/g, '');
  } else if (lowerName.includes('email')) {
    val = val.replace(/\s/g, '');
  } else if (
    lowerName.includes('address') ||
    lowerName.includes('location') ||
    lowerName.includes('details')
  ) {
    val = val.replace(/[^a-zA-Z0-9\s,./#\-()]/g, '');
  } else if (lowerName.includes('lat') || lowerName.includes('lng')) {
    val = val.replace(/[^0-9.\-]/g, '');
  } else if (
    typeof val === 'string' &&
    !lowerName.includes('date') &&
    !lowerName.includes('type') &&
    !lowerName.includes('freq')
  ) {
    // Enforce user request: allow no special characters except - and _ (and space)
    val = val.replace(/[^a-zA-Z0-9\s\-_]/g, '');
  }

  const next = { ...prev, [name]: val };
  
  const isTitleCased = lowerName.includes('name') || lowerName.includes('owner') || lowerName.includes('person');
  if (isTitleCased && typeof val === 'string') {
    next[name] = val.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  if (name === 'unitNumber') {
    next.subAssetId = val;
    next.unitNo = val;
  } else if (name === 'unitNo') {
    next.unitNumber = val;
    next.subAssetId = val;
  }
  return next;
}
