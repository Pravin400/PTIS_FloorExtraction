import type { BuildingPermissionData } from '@/types/ptis.types';

export type BuildingPermissionRecordStatus = 'Sanctioned' | 'Revised' | 'Commenced' | 'Approved' | 'Pending' | 'Active' | string;

export interface BuildingPermissionRecord {
  id: string | number;
  permitNo: string;
  sanctionDate: string;
  approvedFloors?: string;
  sanctionedArea?: string;
  status?: BuildingPermissionRecordStatus;
  documentGuid?: string | null;
  fileName?: string | null;
  propertyCertificateId?: number | null;
  certificateTypeId?: number | null;
  certificateTypeCode?: string;
  certificateTypeName?: string;
  taxApplied?: boolean;
  propertyId?: string | number | null;
  wingDetailId?: number | null;
  wingName?: string | null;
  level?: string;
  applicableToLabel?: string;
  applicableToSubLabel?: string | null;
  unitsCoveredCount?: number | null;
  unitsTotalCount?: number | null;
  coveredUnitNumbers?: string[];
}

/**
 * Normalizes and maps API certificate data returned from
 * GET /api/ApartmentQC/certificate-grid or BuildingPermissionData.
 * Collects records across all scopes: Apartment, Wing, and Unit.
 * Deduplicates inherited copies so only true direct/overriding records display for wings and units.
 * Resolves certificate types dynamically from the API master data without hardcoded maps.
 * Returns empty array if no records exist (no static fake data).
 */
export function mapToBuildingPermissionRecords(
  rawGridData?: unknown,
  buildingPermissionData?: BuildingPermissionData | null,
  _activeWingDetailId?: number | null,
  dynamicTypeMasterList?: unknown[] | null
): BuildingPermissionRecord[] {
  const records: BuildingPermissionRecord[] = [];

  // Build dynamic certificate type map from API master data
  const dynamicTypeMap = new Map<number, { code: string; name: string }>();
  if (Array.isArray(dynamicTypeMasterList)) {
    for (const entry of dynamicTypeMasterList) {
      if (entry && typeof entry === 'object') {
        const t = entry as Record<string, unknown>;
        const id = Number(t.id ?? t.Id ?? t.certificateTypeId ?? t.CertificateTypeId);
        const code = String(t.certificateTypeCode ?? t.CertificateTypeCode ?? t.code ?? t.Code ?? '').trim();
        const name = String(t.certificateTypeName ?? t.CertificateTypeName ?? t.name ?? t.Name ?? '').trim();
        if (id > 0) {
          dynamicTypeMap.set(id, { code, name });
        }
      }
    }
  }

  if (typeof rawGridData === 'object' && rawGridData !== null) {
    const rawObj = rawGridData as Record<string, unknown>;
    const rawItems = (rawObj.items ?? rawObj.Items ?? rawObj.data ?? rawObj) as Record<string, unknown>;
    const target = typeof rawItems === 'object' && rawItems !== null ? rawItems : rawObj;

    const societyList = (target.societyCertificates ?? target.SocietyCertificates) as unknown[];
    const wingList = (target.wingCertificates ?? target.WingCertificates) as unknown[];
    const unitList = (target.unitCertificates ?? target.UnitCertificates) as unknown[];
    const floorList = (target.floorCertificates ?? target.FloorCertificates) as unknown[];

    // Track society-level certificate signatures: `${certTypeId}_${permitNo.toLowerCase()}`
    // If a wing or unit row repeats this signature, it is an inherited copy and should not be duplicated in the UI.
    const societyCertSignatures = new Set<string>();
    if (Array.isArray(societyList)) {
      for (const row of societyList) {
        if (typeof row === 'object' && row !== null) {
          const sItem = row as Record<string, unknown>;
          const pNo = String(
            sItem.certificateNumber ??
            sItem.CertificateNumber ??
            sItem.certificateNo ??
            sItem.CertificateNo ??
            ''
          ).trim().toLowerCase();
          const tId = Number(sItem.certificateTypeId ?? sItem.CertificateTypeId ?? 0);
          if (pNo) {
            societyCertSignatures.add(`${tId}_${pNo}`);
          }
        }
      }
    }

    const candidates: Array<{ item: Record<string, unknown>; source: 'society' | 'wing' | 'unit' | 'floor' }> = [];

    // 1. Apartment / Society Level records
    if (Array.isArray(societyList)) {
      for (const row of societyList) {
        if (typeof row === 'object' && row !== null) {
          candidates.push({ item: row as Record<string, unknown>, source: 'society' });
        }
      }
    }

    // 2. Wing Level records (include direct wing-applied certificates, skip inherited duplicates)
    if (Array.isArray(wingList)) {
      for (const row of wingList) {
        if (typeof row === 'object' && row !== null) {
          const wItem = row as Record<string, unknown>;
          const pNo = String(
            wItem.certificateNumber ??
            wItem.CertificateNumber ??
            wItem.certificateNo ??
            wItem.CertificateNo ??
            ''
          ).trim().toLowerCase();
          const tId = Number(wItem.certificateTypeId ?? wItem.CertificateTypeId ?? 0);

          // If this wing row is an inherited copy of a society certificate, skip it
          if (pNo && societyCertSignatures.has(`${tId}_${pNo}`)) {
            continue;
          }

          candidates.push({ item: wItem, source: 'wing' });
        }
      }
    }

    // 3. Unit Level records (include direct unit-applied certificates, skip inherited duplicates)
    if (Array.isArray(unitList)) {
      for (const row of unitList) {
        if (typeof row === 'object' && row !== null) {
          const uItem = row as Record<string, unknown>;
          const pNo = String(
            uItem.certificateNumber ??
            uItem.CertificateNumber ??
            uItem.certificateNo ??
            uItem.CertificateNo ??
            ''
          ).trim().toLowerCase();
          const tId = Number(uItem.certificateTypeId ?? uItem.CertificateTypeId ?? 0);

          if (pNo && societyCertSignatures.has(`${tId}_${pNo}`)) {
            continue;
          }

          candidates.push({ item: uItem, source: 'unit' });
        }
      }
    }

    // 4. Floor Level records
    if (Array.isArray(floorList)) {
      for (const row of floorList) {
        if (typeof row === 'object' && row !== null) {
          const fItem = row as Record<string, unknown>;
          const pNo = String(
            fItem.certificateNumber ??
            fItem.CertificateNumber ??
            fItem.certificateNo ??
            fItem.CertificateNo ??
            ''
          ).trim().toLowerCase();
          const tId = Number(fItem.certificateTypeId ?? fItem.CertificateTypeId ?? 0);

          if (pNo && societyCertSignatures.has(`${tId}_${pNo}`)) {
            continue;
          }

          candidates.push({ item: fItem, source: 'floor' });
        }
      }
    }

    // 5. Flat records/items array fallback
    if (candidates.length === 0) {
      const rawArray = Array.isArray(target)
        ? target
        : Array.isArray(target.records)
          ? target.records
          : Array.isArray(target.items)
            ? target.items
            : null;
      if (Array.isArray(rawArray)) {
        for (const row of rawArray) {
          if (typeof row === 'object' && row !== null) {
            const r = row as Record<string, unknown>;
            const lvl = String(r.level ?? r.Level ?? '').toLowerCase();
            const src = lvl.includes('wing')
              ? 'wing'
              : lvl.includes('unit')
                ? 'unit'
                : lvl.includes('floor')
                  ? 'floor'
                  : 'society';
            candidates.push({ item: r, source: src });
          }
        }
      }
    }

    // Deduplication tracker:
    const seenRecords = new Set<string>();

    for (let index = 0; index < candidates.length; index++) {
      const { item, source } = candidates[index];

      const certTypeId = Number(item.certificateTypeId ?? item.CertificateTypeId ?? 0);
      const certId = Number(item.propertyCertificateId ?? item.PropertyCertificateId ?? item.id ?? item.Id);
      const docGuid = (item.documentGuid ?? item.DocumentGuid) as string | null | undefined;
      const wingId = Number(item.wingDetailId ?? item.WingDetailId ?? 0);
      const propId = Number(item.propertyId ?? item.PropertyId ?? 0);

      const rawPermitNo = String(
        item.certificateNumber ??
        item.CertificateNumber ??
        item.certificateNo ??
        item.CertificateNo ??
        ''
      ).trim();

      // Resolve certificate type details from API grid item or dynamic API master map
      const typeMaster = dynamicTypeMap.get(certTypeId);
      const certTypeCode = String(
        item.certificateTypeCode ??
        item.CertificateTypeCode ??
        typeMaster?.code ??
        ''
      ).trim();
      const certTypeName = String(
        item.certificateTypeName ??
        item.CertificateTypeName ??
        typeMaster?.name ??
        ''
      ).trim();

      const permitNo = rawPermitNo || certTypeCode || certTypeName || (certTypeId > 0 ? `Certificate #${certTypeId}` : (certId > 0 ? `Certificate #${certId}` : '—'));

      if (!permitNo && !certTypeId && !certId) continue;

      // Build deduplication key:
      const dedupeKey = certId > 0
        ? `${source}_cert_${certId}`
        : `${source}_${certTypeId}_${wingId}_${propId}_${permitNo.toLowerCase()}`;
      if (seenRecords.has(dedupeKey)) {
        continue;
      }
      seenRecords.add(dedupeKey);

      let dateStr = '—';
      const rawDate = item.certificateDate ?? item.CertificateDate ?? item.issueDate ?? item.IssueDate;
      if (rawDate) {
        try {
          const d = new Date(String(rawDate));
          if (!isNaN(d.getTime())) {
            dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
          } else {
            dateStr = String(rawDate);
          }
        } catch {
          dateStr = String(rawDate);
        }
      }

      // Contextual description for approved floors / scope details
      let floorStr = 'Ground + Floors';
      if (source === 'society') {
        floorStr = String(
          item.applicableToSubLabel ??
          item.ApplicableToSubLabel ??
          item.floorDescription ??
          item.FloorDescription ??
          'Entire Apartment'
        );
      } else if (source === 'wing') {
        const wingNameLabel = String(item.applicableToLabel ?? item.ApplicableToLabel ?? item.wingName ?? item.WingName ?? '').trim();
        const wingSub = String(item.applicableToSubLabel ?? item.ApplicableToSubLabel ?? '').trim();
        const formattedWing = wingNameLabel
          ? (wingNameLabel.toLowerCase().startsWith('wing') ? wingNameLabel : `Wing ${wingNameLabel}`)
          : 'Wing Level';
        floorStr = wingSub && !wingSub.toLowerCase().includes('wing') ? `${formattedWing} · ${wingSub}` : formattedWing;
      } else if (source === 'unit') {
        const coveredUnits = Array.isArray(item.coveredUnitNumbers ?? item.CoveredUnitNumbers)
          ? ((item.coveredUnitNumbers ?? item.CoveredUnitNumbers) as string[]).filter(Boolean)
          : [];
        const uLabel = String(item.applicableToLabel ?? item.ApplicableToLabel ?? '').trim();
        if (coveredUnits.length > 0) {
          floorStr = `Unit ${coveredUnits.join(', ')}`;
        } else if (uLabel) {
          floorStr = uLabel.toLowerCase().startsWith('unit') ? uLabel : `Unit ${uLabel}`;
        } else {
          const covered = item.unitsCoveredCount ?? item.UnitsCoveredCount;
          const total = item.unitsTotalCount ?? item.UnitsTotalCount;
          if (typeof covered === 'number') {
            floorStr = `${covered} of ${total || '?'} unit(s) covered`;
          } else {
            floorStr = 'Unit Level';
          }
        }
      } else if (source === 'floor') {
        floorStr = String(item.applicableToLabel ?? item.ApplicableToLabel ?? 'Floor Level');
      }

      const rawArea = item.sanctionedArea ?? item.SanctionedArea;
      let areaStr = '—';
      if (typeof rawArea === 'string' && rawArea.trim()) {
        areaStr = rawArea;
      } else if (typeof rawArea === 'number') {
        areaStr = `${rawArea.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sq.ft`;
      }

      const rawStatus = String(item.status ?? item.Status ?? 'Sanctioned');
      const propIdVal = item.propertyId ?? item.PropertyId;
      const taxApplied = Boolean(item.taxApplied ?? item.TaxApplied);

      const resolvedLevel = String(
        item.level ??
        item.Level ??
        (source === 'society'
          ? 'Apartment'
          : source === 'wing'
            ? 'Wing'
            : source === 'unit'
              ? 'Unit'
              : 'Floor')
      );

      // Guaranteed unique key for React rendering across all scopes
      const uniqueRowId = `${resolvedLevel.toLowerCase()}-${certId > 0 ? certId : `${certTypeId}_${wingId}_${propId}`}-${permitNo}-${index}`;

      records.push({
        id: uniqueRowId,
        permitNo,
        sanctionDate: dateStr,
        approvedFloors: floorStr,
        sanctionedArea: areaStr,
        status: rawStatus,
        documentGuid: typeof docGuid === 'string' && docGuid ? docGuid : null,
        fileName: typeof item.fileName === 'string' ? item.fileName : null,
        propertyCertificateId: !isNaN(certId) && certId > 0 ? certId : null,
        certificateTypeId: certTypeId > 0 ? certTypeId : null,
        certificateTypeCode: certTypeCode || undefined,
        certificateTypeName: certTypeName || undefined,
        taxApplied,
        propertyId: propIdVal ? String(propIdVal) : null,
        wingDetailId: wingId > 0 ? wingId : null,
        wingName:
          typeof item.wingName === 'string' && item.wingName.trim()
            ? item.wingName.trim()
            : typeof item.WingName === 'string' && (item.WingName as string).trim()
              ? (item.WingName as string).trim()
              : source === 'wing' && typeof item.applicableToLabel === 'string' && item.applicableToLabel.trim()
                ? item.applicableToLabel.trim()
                : undefined,
        level: resolvedLevel,
        applicableToLabel: typeof item.applicableToLabel === 'string' ? item.applicableToLabel : undefined,
        applicableToSubLabel: typeof item.applicableToSubLabel === 'string' ? item.applicableToSubLabel : undefined,
        unitsCoveredCount: typeof item.unitsCoveredCount === 'number' ? item.unitsCoveredCount : null,
        unitsTotalCount: typeof item.unitsTotalCount === 'number' ? item.unitsTotalCount : null,
        coveredUnitNumbers: Array.isArray(item.coveredUnitNumbers ?? item.CoveredUnitNumbers)
          ? ((item.coveredUnitNumbers ?? item.CoveredUnitNumbers) as string[]).filter(Boolean)
          : undefined,
      });
    }
  }

  // Fallback to buildingPermissionData if grid rows were empty
  if (records.length === 0 && buildingPermissionData?.items && buildingPermissionData.items.length > 0) {
    const seenFallbackCerts = new Set<string>();

    for (let i = 0; i < buildingPermissionData.items.length; i++) {
      const item = buildingPermissionData.items[i];
      const permitNo = item.certificateNo?.trim();
      if (permitNo || item.hasCertificate) {
        const certTypeId = item.certificateTypeId || 0;
        const certNo = permitNo || item.certificateTypeName || 'Permit';
        const dedupeKey = `${certTypeId}_${certNo.toLowerCase()}`;
        if (seenFallbackCerts.has(dedupeKey)) continue;
        seenFallbackCerts.add(dedupeKey);

        const typeMaster = dynamicTypeMap.get(certTypeId);
        const certTypeCode = typeMaster?.code;
        const certTypeName = item.certificateTypeName || typeMaster?.name;

        let dateStr = '—';
        if (item.issueDate) {
          try {
            const d = new Date(item.issueDate);
            if (!isNaN(d.getTime())) {
              dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            } else {
              dateStr = item.issueDate;
            }
          } catch {
            dateStr = item.issueDate;
          }
        }

        const uniqueRowId = `fallback-${item.propertyCertificateId || i + 1}-${certNo}-${i}`;

        records.push({
          id: uniqueRowId,
          permitNo: certNo,
          sanctionDate: dateStr,
          approvedFloors: item.floorDescription || 'Ground + Floors',
          sanctionedArea: '—',
          status: item.isActive ? 'Active' : 'Pending',
          documentGuid: item.documentGuid,
          fileName: item.fileName,
          propertyCertificateId: item.propertyCertificateId,
          certificateTypeId: certTypeId > 0 ? certTypeId : null,
          certificateTypeCode: certTypeCode || undefined,
          certificateTypeName: certTypeName || undefined,
          propertyId: (item as unknown as { propertyId?: unknown }).propertyId ? String((item as unknown as { propertyId?: unknown }).propertyId) : null,
          level: 'Apartment',
        });
      }
    }
  }

  return records;
}
