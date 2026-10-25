import { AssessmentUnit, UnitDifference, SurveyDetailDto, DifferenceDetailDto } from '@/types/property-tax/apartment';

export function extractArrayFromPayload(obj: unknown): unknown[] {
  if (!obj || typeof obj !== 'object') return [];
  if (Array.isArray(obj)) return obj;
  const record = obj as Record<string, unknown>;
  if (Array.isArray(record.items)) return record.items;
  if (Array.isArray(record.data)) return record.data;
  if (record.items && typeof record.items === 'object') {
    const itemsRecord = record.items as Record<string, unknown>;
    if (Array.isArray(itemsRecord.items)) return itemsRecord.items;
  }
  if (record.data && typeof record.data === 'object') {
    const dataObj = record.data as Record<string, unknown>;
    if (Array.isArray(dataObj.items)) return dataObj.items;
    if (dataObj.items && typeof dataObj.items === 'object' && Array.isArray((dataObj.items as Record<string, unknown>).items)) {
      return (dataObj.items as Record<string, unknown>).items as unknown[];
    }
    if (Array.isArray(dataObj.data)) return dataObj.data;
  }
  return [];
}

export function mapSurveyDetailToUnit(
  detail: SurveyDetailDto,
  fallbackId: string,
  variant?: 'survey' | 'existing'
): AssessmentUnit {
  const rawAny = (detail || {}) as Record<string, unknown>;
  const hasData =
    Boolean(detail) &&
    (Boolean(detail.id && detail.id > 0) ||
      Boolean(detail.propertyNo) ||
      Boolean(detail.oldPropertyNo) ||
      Boolean(detail.rateableValue != null) ||
      Boolean(detail.totalTax != null) ||
      Boolean(detail.oldTotalTax != null) ||
      Boolean(detail.newTaxTotal != null) ||
      Boolean(detail.carpetASqFt != null) ||
      Boolean(detail.carpetASqMtr != null) ||
      Boolean(detail.builtupASqFt != null) ||
      Boolean(detail.builtupASqMtr != null) ||
      Boolean(detail.constructionArea != null) ||
      Boolean(detail.csn) ||
      Boolean(rawAny.rateableValue != null) ||
      Boolean(rawAny.totalTax != null) ||
      Boolean(rawAny.oldTotalTax != null));

  if (!hasData) {
    return {
      id: fallbackId, prop: '-', wgFl: '-', type: '-', cty: '-', ayr: '-', cyr: '-', use: '-',
      cpt: 0, cptDisplay: '-', bua: 0, buaDisplay: '-', ocNo: '-', occdt: '-', rntr: '-',
      rentDisplay: '-', appliedOn: '-', rateDisplay: '-', rate: 0, yrv: '-', depr: '-',
      alv: '-', mr: '-', rv: 0, rvDisplay: '-', tax: 0, taxDisplay: '-',
      cv: 0, rttx: 0, pen: 0, rawSurvey: detail,
    };
  }

  const propNo = (
    detail.propertyNo ||
    detail.oldPropertyNo ||
    (rawAny.propertyNo as string | undefined) ||
    (rawAny.propNo as string | undefined) ||
    (rawAny.oldPropertyNo as string | undefined) ||
    ''
  ).toString().trim();
  const rawPartition = (
    detail.partitionNo ??
    detail.oldPartitionNo ??
    (rawAny.partitionNo as string | number | undefined) ??
    (rawAny.oldPartitionNo as string | number | undefined) ??
    (rawAny.partition as string | number | undefined) ??
    (rawAny.partNo as string | number | undefined) ??
    (rawAny.partitionNumber as string | number | undefined) ??
    ''
  ).toString().trim();
  const partitionNo = rawPartition !== '' && rawPartition !== '-' ? rawPartition : '';
  const flatNo = (
    detail.flatOrShopNo ??
    detail.flatOrShopNoEnglish ??
    detail.flatOrShopName ??
    detail.flatOrShopNameEnglish ??
    (rawAny.flatNo as string | number | undefined) ??
    (rawAny.shopNo as string | number | undefined) ??
    (rawAny.flatOrShopNo as string | number | undefined) ??
    (rawAny.flatOrShopName as string | number | undefined) ??
    ''
  ).toString().trim();

  const parts: string[] = [];
  if (propNo) parts.push(propNo);
  if (partitionNo && partitionNo !== propNo) parts.push(partitionNo);
  if (flatNo && flatNo !== '-' && flatNo !== partitionNo && flatNo !== propNo) parts.push(flatNo);
  const propFull = parts.length > 0 ? parts.join(' - ') : '-';
  // The survey table shows the partition (the wing, or the partition of a unit) as PROP NO and the flat in its own column: the main
  // property number is the same on every unit. The old assessment keeps its own old property number.
  const prop = variant !== 'existing' ? (partitionNo || propNo || '-') : propFull;

  const floorStr = (detail.floor || '').trim();
  // The table column shows only the short floor code (G, 1, 2 ...), no wing; the full description stays in `flr` for filters.
  const wgFl = (detail.floorCode || '').trim() || floorStr || '-';

  const aptType = (detail.apartmentType || '').trim();
  const propTypeName = (detail.propertyTypeName || '').trim();
  const fallbackType = (detail.type || detail.partType || '').trim();
  // Product decision: the TYPE column is PropertyMast.Type, the apartment / society type that plans are drawn and shown by.
  // The property type name (and its code) is only context for the tooltip.
  // An old survey row has no PropertyMast.Type: its old property type name is shown instead.
  const baseType = aptType || (detail.oldPropertyTypeName || '').trim();
  const type = baseType || '-';
  const typeFull = [aptType, propTypeName || (detail.oldPropertyTypeName || '').trim() || fallbackType].filter((v, i, a) => v && a.indexOf(v) === i).join(' / ') || type;
  const bhk = (detail.bhk || (rawAny.bhk as string | undefined) || (rawAny.oldBhk as string | undefined) || (rawAny.oldBHK as string | undefined) || '').trim();

  const cty = (detail.constructionCode || detail.constructionType || detail.oldConstructionType || '').trim() || '-';
  // The API can send a year as a number; a year is shown as text either way.
  const ayr = String(detail.assessmentYear || detail.oldAssessmentYear || '').trim() || '-';
  const cyr = String(detail.constructionYear || detail.oldConstructionYear || '').trim() || '-';
  const use = (detail.typeOfUseCode || detail.typeOfUse || detail.subTypeOfUse || detail.oldUseType || '').trim() || '-';

  const cptFt = detail.carpetASqFt ?? (detail.constructionArea ?? detail.oldConstructionArea ?? null);
  const cptMtr = detail.carpetASqMtr ?? null;
  const cpt = cptFt ?? (cptMtr ?? 0);
  let cptDisplay = '-';
  if (cptFt != null && cptMtr != null) cptDisplay = `${cptFt} / ${cptMtr}`;
  else if (cptFt != null) cptDisplay = String(cptFt);
  else if (cptMtr != null) cptDisplay = `${cptMtr} m²`;

  const buaFt = detail.builtupASqFt ?? null;
  const buaMtr = detail.builtupASqMtr ?? null;
  const bua = buaFt ?? (buaMtr ?? 0);
  let buaDisplay = '-';
  if (buaFt != null && buaMtr != null) buaDisplay = `${buaFt} / ${buaMtr}`;
  else if (buaFt != null) buaDisplay = String(buaFt);
  else if (buaMtr != null) buaDisplay = `${buaMtr} m²`;

  const ocNo = String(detail.ocNo ?? detail.csn ?? detail.oldCSN ?? rawAny.occupancyNumber ?? rawAny.ocNumber ?? '').trim() || '-';
  const rawOcDate = detail.ocDate || (rawAny.occupancyDate as string | undefined);
  const occdt = rawOcDate ? rawOcDate.split('T')[0] : '-';
  const rntr = (detail.renterName || detail.renterNameEnglish || '').trim() || '-';

  const rMonthly = detail.rentMonthly ?? null;
  const rYearly = detail.rentYearly ?? detail.yearlyRent ?? null;
  let rentDisplay = '-';
  if (rMonthly != null && rYearly != null) rentDisplay = `${rMonthly.toLocaleString()} / ${rYearly.toLocaleString()}`;
  else if (rMonthly != null) rentDisplay = `M: ${rMonthly.toLocaleString()}`;
  else if (rYearly != null) rentDisplay = `Y: ${rYearly.toLocaleString()}`;
  const rent = rMonthly ?? rYearly ?? null;

  const appliedOn = String(rawAny.appliedOn ?? '').trim() || '-';
  const mRate = detail.monthlyRate ?? null;
  const yRate = detail.yearlyRate ?? null;
  let rateDisplay = '-';
  if (mRate != null && yRate != null) rateDisplay = `${mRate} / ${yRate}`;
  else if (mRate != null) rateDisplay = String(mRate);
  else if (yRate != null) rateDisplay = String(yRate);
  const rate = mRate ?? yRate ?? 0;

  const yrvVal = detail.yearlyRent ?? (rawAny.yearlyRentalValue as number | undefined) ?? null;
  const yrv = yrvVal != null ? yrvVal.toLocaleString() : '-';
  const deprVal = detail.depreciation ?? null;
  const deprPer = (rawAny.depreciationPer as number | undefined) ?? null;
  let depr = '-';
  if (deprVal != null && deprPer != null) depr = `${deprVal.toLocaleString()} (${deprPer}%)`;
  else if (deprVal != null) depr = deprVal.toLocaleString();

  const alvVal =
    detail.alv ??
    detail.annualRentalValue ??
    (rawAny.alv as number | undefined) ??
    (rawAny.annualRentalValue as number | undefined) ??
    null;
  const alv = alvVal != null ? alvVal.toLocaleString() : '-';
  const mrVal = detail.maintenance ?? null;
  const mr = mrVal != null ? mrVal.toLocaleString() : '-';

  const rawRv =
    detail.rateableValue ??
    detail.oldRV ??
    (rawAny.rateableValue as number | undefined) ??
    (rawAny.oldRV as number | undefined) ??
    null;
  const rv = rawRv ?? 0;
  const rvDisplay = rawRv != null ? rawRv.toLocaleString() : '-';

  const rawTax =
    variant === 'existing'
      ? (detail.totalTax ??
          detail.oldTotalTax ??
          (rawAny.totalTax as number | undefined) ??
          (rawAny.oldTotalTax as number | undefined) ??
          detail.newTaxTotal ??
          null)
      : (detail.newTaxTotal ??
          detail.newTaxTotalRV ??
          detail.totalTax ??
          (rawAny.newTaxTotal as number | undefined) ??
          (rawAny.totalTax as number | undefined) ??
          detail.oldTotalTax ??
          null);
  const tax = rawTax ?? 0;
  const taxDisplay = rawTax != null ? `₹${rawTax.toLocaleString()}` : '-';

  const rawCv = detail.capitalValue ?? (rawAny.capitalValue as number | undefined) ?? (rawAny.oldCV as number | undefined) ?? detail.newTaxTotalCV ?? null;
  const cv = rawCv ?? 0;
  const cvDisplay = rawCv != null ? (typeof rawCv === 'number' ? `₹${rawCv.toLocaleString()}` : String(rawCv)) : '-';
  const rttx = detail.retroTaxTotal ?? 0;

  // Resolve the new-survey property ID (pdnId is the canonical ID returned by the API)
  const resolvedPropertyId = detail.pdnId ?? detail.id ?? null;
  // Resolve the old-property ID used by MappedOldPropertiesExpandedRow / MappedPropertiesExpandedRow
  const resolvedOldPropertyId =
    detail.oldTaxDetails?.find((t) => t.propertyMastOldId)?.propertyMastOldId ??
    (rawAny?.propertyMastOldId ? Number(rawAny.propertyMastOldId) : null) ??
    (rawAny?.oldPropertyId ? Number(rawAny.oldPropertyId) : null) ??
    null;

  return {
    id: fallbackId, prop, propFull, propertyNo: propNo || undefined, oldPropertyNo: detail.oldPropertyNo || undefined,
    partitionNo: partitionNo || undefined,
    flatNo: flatNo || undefined,
    propertyId: resolvedPropertyId ?? undefined,
    oldPropertyId: resolvedOldPropertyId ?? undefined,
    wgFl, type, typeFull, bhk: bhk || undefined, cty, ayr, cyr, use, cpt, cptMtr, cptDisplay,
    bua, buaMtr, buaDisplay, ocNo, occdt, rntr, rentDisplay, rent, appliedOn,
    rateDisplay, rate, yrv, depr, alv, mr, rv, rvDisplay, tax, taxDisplay, cv, cvDisplay, rttx, pen: 0,
    owner: detail.ownerName || detail.ownerNameEnglish || '-',
    ocpr: detail.occupierName || detail.occupierNameEnglish || '-',
    flr: floorStr || 0, rvVsCvm: '-', rawSurvey: detail,
  };
}

export function mapDifferenceDetailToDiff(diffDto: DifferenceDetailDto, id: string, oldSurveyObj?: SurveyDetailDto): UnitDifference {
  const carpetDiff = diffDto.carpetAreaSqFeetDiff ?? 0;
  const buaDiff = diffDto.builtupAreaSqFeetDiff ?? 0;
  const rvDiff = diffDto.rateableValueDiff ?? 0;
  const capitalValueDiff = diffDto.capitalValueDiff ?? 0;
  const taxDiff = diffDto.totalTaxDiff ?? 0;
  const rtTaxDiff = diffDto.retroTaxDiff ?? 0;

  let suggestion: UnitDifference['suggestion'] = null;
  if (!oldSurveyObj || !oldSurveyObj.id || oldSurveyObj.id === 0) {
    suggestion = 'Create New';
  } else if (Math.abs(carpetDiff) > 0 || Math.abs(buaDiff) > 0) {
    suggestion = 'Verify Area';
  } else if (Math.abs(rvDiff) > 0 || Math.abs(taxDiff) > 0) {
    suggestion = 'Verify';
  }

  return {
    unitId: id, carpetDiff, buaDiff, rvDiff, capitalValueDiff, taxDiff, rtTaxDiff, suggestion, rawDiff: diffDto,
  };
}

export function parseApartmentItemNodes(itemList: unknown[], defaultPropertyId?: number | null) {
  const newUnits: AssessmentUnit[] = [];
  const oldUnits: AssessmentUnit[] = [];
  const mappedDiffs: UnitDifference[] = [];
  const seenIds = new Set<string>();

  itemList.forEach((itemNode: unknown, idx: number) => {
    const item = (itemNode || {}) as Record<string, unknown>;
    const newSurveyObj = (item.newSurvey || item.newSurveyDetail || item) as SurveyDetailDto;
    const oldSurveyObj = (item.oldSurvey || item.oldSurveyDetail || item) as SurveyDetailDto;
    const diffDto = (item.difference || item.differenceDetail || {}) as DifferenceDetailDto;

    const rawId = newSurveyObj?.id ?? oldSurveyObj?.id ?? item?.id;
    let id = rawId ? String(rawId) : String(idx + 1);
    let counter = 1;
    while (seenIds.has(id)) {
      id = `${rawId || idx + 1}_${counter}`;
      counter++;
    }
    seenIds.add(id);

    const sUnit = mapSurveyDetailToUnit(newSurveyObj, id, 'survey');
    const pUnit = mapSurveyDetailToUnit(oldSurveyObj, id, 'existing');

    const rawOldAny = (oldSurveyObj || {}) as Record<string, unknown>;
    const rawNewAny = (newSurveyObj || {}) as Record<string, unknown>;
    const rawItemAny = (item || {}) as Record<string, unknown>;
    const taxDetailOldId =
      oldSurveyObj?.oldTaxDetails?.find((t) => t.propertyMastOldId)?.propertyMastOldId ??
      newSurveyObj?.oldTaxDetails?.find((t) => t.propertyMastOldId)?.propertyMastOldId;

    const resolvedOldPropId =
      (sUnit.oldPropertyId ? Number(sUnit.oldPropertyId) : null) ??
      (pUnit.oldPropertyId ? Number(pUnit.oldPropertyId) : null) ??
      (rawOldAny.propertyMastOldId ? Number(rawOldAny.propertyMastOldId) : null) ??
      (rawNewAny.propertyMastOldId ? Number(rawNewAny.propertyMastOldId) : null) ??
      (taxDetailOldId ? Number(taxDetailOldId) : null) ??
      (rawOldAny.oldPropertyId ? Number(rawOldAny.oldPropertyId) : null) ??
      (rawNewAny.oldPropertyId ? Number(rawNewAny.oldPropertyId) : null) ??
      (rawOldAny.oldPropId ? Number(rawOldAny.oldPropId) : null) ??
      (rawNewAny.oldPropId ? Number(rawNewAny.oldPropId) : null) ??
      (rawItemAny.propertyMastOldId ? Number(rawItemAny.propertyMastOldId) : null) ??
      (rawItemAny.oldPropertyId ? Number(rawItemAny.oldPropertyId) : null) ??
      (rawItemAny.oldPropId ? Number(rawItemAny.oldPropId) : null) ??
      (oldSurveyObj?.id && Number(oldSurveyObj.id) > 0 ? Number(oldSurveyObj.id) : null);

    if (resolvedOldPropId) {
      sUnit.oldPropertyId = resolvedOldPropId;
      pUnit.oldPropertyId = resolvedOldPropId;
    }

    const resolvedNewPropId =
      (rawNewAny.propertyId ? Number(rawNewAny.propertyId) : null) ??
      (newSurveyObj?.id ? Number(newSurveyObj.id) : null) ??
      (rawItemAny.propertyId ? Number(rawItemAny.propertyId) : null) ??
      (defaultPropertyId ? Number(defaultPropertyId) : null);
    if (resolvedNewPropId) {
      sUnit.propertyId = resolvedNewPropId;
      pUnit.propertyId = resolvedNewPropId;
    }

    newUnits.push(sUnit);
    oldUnits.push(pUnit);
    mappedDiffs.push(mapDifferenceDetailToDiff(diffDto, id, oldSurveyObj));
  });

  return { newUnits, oldUnits, mappedDiffs };
}

