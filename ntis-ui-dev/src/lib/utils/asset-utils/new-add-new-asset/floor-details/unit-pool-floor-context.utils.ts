/* eslint-disable @typescript-eslint/no-explicit-any */
/** Resolves a pool unit's floor identity (floorDetailsId / floor-level id /
 * sub-floor id) and construction-classification fields (conYear/conType/
 * useType/subUseType/floorLabel), cross-referencing whichever of the two ids
 * the raw sub-unit happens to carry against the already-loaded parent floors
 * and floor-level dropdown options. */
export function resolvePoolUnitFloorContext(u: any, parentFloors: any[], dropdownOptions: any) {
  let floorDetailsId = u.floorDetailsId ?? u.FloorDetailsId ?? null;
  let resolvedFloorLevelId = u.floorId ?? u.FloorId ?? u.selectedFloorId ?? null;
  const subFloorId = u.subFloorId ?? u.SubFloorId ?? null;
  const subFloorName = u.subFloorName || u.SubFloorName || '';

  // If we have floorDetailsId but not resolvedFloorLevelId, try to find it in parentFloors
  if (floorDetailsId && !resolvedFloorLevelId) {
    const floorDetail = parentFloors.find(
      (f: any) => Number(f.id ?? f.Id) === Number(floorDetailsId)
    );
    if (floorDetail) {
      resolvedFloorLevelId = (floorDetail.floorId ?? floorDetail.FloorId)
        ? Number(floorDetail.floorId ?? floorDetail.FloorId)
        : null;
    }
  }

  // If we have resolvedFloorLevelId but not floorDetailsId, try to find the matching floorDetail from parentFloors
  if (resolvedFloorLevelId && !floorDetailsId) {
    const floorDetail = parentFloors.find(
      (f: any) => Number(f.floorId ?? f.FloorId) === Number(resolvedFloorLevelId)
    );
    if (floorDetail) {
      floorDetailsId = Number(floorDetail.id ?? floorDetail.Id);
    }
  }

  let conYear = u.constructionYear || u.conYear || '';
  let conType = u.constructionTypeId ? String(u.constructionTypeId) : (u.conType || '');
  let useType = u.typeOfUseId ? String(u.typeOfUseId) : (u.useType || '');
  const subUseType = u.subTypeOfUseId ? String(u.subTypeOfUseId) : (u.subUseType || '');
  const subTypeOfUseName = u.subTypeOfUseName || u.SubTypeOfUseName || '';

  if (floorDetailsId) {
    const floorDetail = parentFloors.find(
      (f: any) => Number(f.id ?? f.Id) === Number(floorDetailsId)
    );
    if (floorDetail) {
      if (!conYear) conYear = floorDetail.constructionYear || floorDetail.conYear || '';
      if (!conType)
        conType = floorDetail.constructionTypeId
          ? String(floorDetail.constructionTypeId)
          : floorDetail.conType
            ? String(floorDetail.conType)
            : '';
      if (!useType)
        useType = floorDetail.typeOfUseId
          ? String(floorDetail.typeOfUseId)
          : floorDetail.useType
            ? String(floorDetail.useType)
            : '';
    }
  }

  let floorLabel = '';
  if (resolvedFloorLevelId && dropdownOptions?.floorLevels) {
    const match = dropdownOptions.floorLevels.find(
      (f: any) => String(f.value) === String(resolvedFloorLevelId)
    );
    floorLabel = match ? `${match.label}` : 'Selected';
  } else if (floorDetailsId && dropdownOptions?.floorLevels) {
    const match = dropdownOptions.floorLevels.find(
      (f: any) => String(f.value) === String(floorDetailsId)
    );
    floorLabel = match ? `${match.label}` : 'Selected';
  }

  return { floorDetailsId, resolvedFloorLevelId, subFloorId, subFloorName, conYear, conType, useType, subUseType, subTypeOfUseName, floorLabel };
}
