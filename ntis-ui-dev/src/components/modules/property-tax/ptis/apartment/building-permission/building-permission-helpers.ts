import type { Option } from '@/components/common';
import type { BuildingPermissionRecord } from '@/types/property-tax/apartment/building-permission-records.types';

export function formatCertificateNumberDisplay(certNo?: string | null, maxChars = 25): string {
  if (!certNo) return '-';
  const trimmed = certNo.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return `${trimmed.slice(0, maxChars)}...`;
}

export function extractCertificateTypeOptions(
  rows: BuildingPermissionRecord[],
  effectiveMasterTypes: unknown[] | null,
  allLabel: string
): Option[] {
  const options: Option[] = [{ label: allLabel, value: 'ALL' }];
  const seen = new Set<string>();

  const map = new Map<string, { id?: number; code: string; name: string }>();
  for (const r of rows) {
    const code = r.certificateTypeCode?.trim() || '';
    const name = r.certificateTypeName?.trim() || code || 'Certificate';
    const key = code || name;
    if (!map.has(key)) {
      map.set(key, { id: r.certificateTypeId ?? undefined, code, name });
    }
  }

  for (const tf of map.values()) {
    const val = tf.code || tf.name || (tf.id ? String(tf.id) : '');
    if (!val || seen.has(val.toLowerCase())) continue;
    seen.add(val.toLowerCase());
    if (tf.code) seen.add(tf.code.toLowerCase());
    if (tf.name) seen.add(tf.name.toLowerCase());
    if (tf.id) seen.add(String(tf.id));
    const cleanName = tf.name.replace(/\s*\([^)]*\)\s*$/, '').trim();
    options.push({ label: cleanName || tf.name, value: val });
  }

  if (Array.isArray(effectiveMasterTypes)) {
    for (const mt of effectiveMasterTypes) {
      if (typeof mt !== 'object' || mt === null) continue;
      const m = mt as Record<string, unknown>;
      const code = String(m.certificateTypeCode ?? m.CertificateTypeCode ?? m.code ?? '').trim();
      const name = String(m.certificateTypeName ?? m.CertificateTypeName ?? m.name ?? code ?? '').trim();
      const id = Number(m.propertyCertificateTypeId ?? m.PropertyCertificateTypeId ?? m.id ?? m.Id ?? 0);
      const val = code || name || (id > 0 ? String(id) : '');
      if (!val) continue;
      const isSeen = (code && seen.has(code.toLowerCase())) || (name && seen.has(name.toLowerCase())) || (id > 0 && seen.has(String(id)));
      if (!isSeen) {
        seen.add(val.toLowerCase());
        if (code) seen.add(code.toLowerCase());
        if (name) seen.add(name.toLowerCase());
        if (id > 0) seen.add(String(id));
        const cleanMasterName = name.replace(/\s*\([^)]*\)\s*$/, '').trim();
        options.push({ label: cleanMasterName || name, value: val });
      }
    }
  }
  return options;
}

export function calculateLevelCounts(rows: BuildingPermissionRecord[]) {
  let apartment = 0; let wing = 0; let unit = 0; let floor = 0;
  for (const r of rows) {
    const lvl = (r.level || 'Apartment').toLowerCase();
    if (lvl.includes('apartment')) apartment++;
    else if (lvl.includes('wing')) wing++;
    else if (lvl.includes('unit')) unit++;
    else if (lvl.includes('floor')) floor++;
    else apartment++;
  }
  return { all: rows.length, apartment, wing, unit, floor };
}

export function filterBuildingRows(
  rows: BuildingPermissionRecord[],
  selectedLevel: string,
  selectedCertType: string
): BuildingPermissionRecord[] {
  let result = rows;
  if (selectedLevel !== 'ALL') {
    result = result.filter((r) => (r.level || 'Apartment').toLowerCase().includes(selectedLevel.toLowerCase()));
  }
  if (selectedCertType !== 'ALL') {
    const target = selectedCertType.toLowerCase().trim();
    result = result.filter((r) => {
      const code = (r.certificateTypeCode || '').toLowerCase().trim();
      const name = (r.certificateTypeName || '').toLowerCase().trim();
      const idStr = r.certificateTypeId ? String(r.certificateTypeId) : '';
      return code === target || name === target || idStr === target;
    });
  }
  return result;
}

export function resolveSelectedCertTypeValue(
  selectedCertType: string,
  certificateTypeOptions: Option[],
  rows: BuildingPermissionRecord[]
): string {
  if (!selectedCertType || selectedCertType === 'ALL') return 'ALL';
  const found = certificateTypeOptions.find((opt) => opt.value.toLowerCase() === selectedCertType.toLowerCase());
  if (found) return found.value;
  for (const r of rows) {
    if (
      (r.certificateTypeId && String(r.certificateTypeId) === selectedCertType) ||
      (r.certificateTypeCode && r.certificateTypeCode.toLowerCase() === selectedCertType.toLowerCase()) ||
      (r.certificateTypeName && r.certificateTypeName.toLowerCase() === selectedCertType.toLowerCase())
    ) {
      const candidate = r.certificateTypeCode || r.certificateTypeName || String(r.certificateTypeId || '');
      const matched = certificateTypeOptions.find((opt) => opt.value.toLowerCase() === candidate.toLowerCase());
      if (matched) return matched.value;
    }
  }
  return selectedCertType;
}

export function buildBuildingEditUrl({
  targetPropId,
  wardNo,
  wardId,
  propertyNo,
  societyDetailId,
  wingName,
  wingDetailsId,
  record,
  selectedLevel,
  selectedCertType,
  rows,
  locale,
}: {
  targetPropId: string | number;
  wardNo?: string | null;
  wardId?: string | number | null;
  propertyNo?: string | null;
  societyDetailId?: number | null;
  wingName?: string | null;
  wingDetailsId?: number | null;
  record?: BuildingPermissionRecord;
  selectedLevel: string;
  selectedCertType: string;
  rows: BuildingPermissionRecord[];
  locale: string;
}): string {
  const q = new URLSearchParams();
  if (wardNo) q.set('wardNo', String(wardNo));
  if (wardId) q.set('wardId', String(wardId));
  if (propertyNo) q.set('propertyNo', String(propertyNo));
  if (societyDetailId) q.set('societyId', String(societyDetailId));
  if (wingName) q.set('wingName', wingName);

  const recLevel = record?.level?.toLowerCase();
  let targetLevel = 'Apartment';
  if (recLevel) {
    if (recLevel.includes('wing')) targetLevel = 'Wing';
    else if (recLevel.includes('unit')) targetLevel = 'Unit';
    else if (recLevel.includes('floor')) targetLevel = 'Floor';
  } else if (selectedLevel && selectedLevel !== 'ALL') {
    const sel = selectedLevel.toLowerCase();
    if (sel.includes('wing')) targetLevel = 'Wing';
    else if (sel.includes('unit')) targetLevel = 'Unit';
    else if (sel.includes('floor')) targetLevel = 'Floor';
  }
  q.set('level', targetLevel);
  q.set('activeScope', targetLevel === 'Floor' ? 'Floor' : 'Property');

  let targetCertTypeId = record?.certificateTypeId;
  let targetCertTypeCode = record?.certificateTypeCode;
  if (!targetCertTypeId && selectedCertType && selectedCertType !== 'ALL') {
    const found = rows.find((r) =>
      (r.certificateTypeId && String(r.certificateTypeId) === selectedCertType) ||
      (r.certificateTypeCode && r.certificateTypeCode.toLowerCase() === selectedCertType.toLowerCase()) ||
      (r.certificateTypeName && r.certificateTypeName.toLowerCase() === selectedCertType.toLowerCase())
    );
    if (found) {
      targetCertTypeId = found.certificateTypeId;
      targetCertTypeCode = found.certificateTypeCode;
    }
  }
  if (targetCertTypeId) q.set('certificateTypeId', String(targetCertTypeId));
  if (targetCertTypeCode) q.set('certificateTypeCode', targetCertTypeCode);
  if (record?.permitNo) q.set('certificateNumber', record.permitNo);
  if (record?.sanctionDate) q.set('certificateDate', record.sanctionDate);
  if (record?.documentGuid) q.set('documentGuid', record.documentGuid);
  if (record?.fileName) q.set('fileName', record.fileName);
  if (record?.propertyCertificateId) q.set('propertyCertificateId', String(record.propertyCertificateId));
  const resolvedWingDetailId = record?.wingDetailId || wingDetailsId;
  if (resolvedWingDetailId) q.set('wingDetailId', String(resolvedWingDetailId));
  if (targetLevel === 'Unit' && record?.applicableToLabel) q.set('unitNo', record.applicableToLabel);
  q.set('returnTab', 'apartment');
  q.set('from', 'apartment');

  return `/${locale}/property-tax/ptis/QuickDataEntry/${targetPropId}/Building?${q.toString()}`;
}
