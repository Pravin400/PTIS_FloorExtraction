import type {
  DiscountData,
  BuildingPermissionData,
  BuildingPermissionItem,
  PropertySocialDetailItem,
} from '@/types/ptis.types';


import { getViewDocumentUrl } from '@/lib/utils/document-utils';

/** Runtime type guard — returns null if data is not a valid object */
function safeRecord(data: unknown): Record<string, unknown> | null {
  return data != null && typeof data === 'object' && !Array.isArray(data) ? data as Record<string, unknown> : null;
}

export const ptisSocialMapper = {
  mapDiscountDetails: (data: unknown): DiscountData => {
    const rawData = safeRecord(data);
    let rawItems: unknown[] = [];
    if (rawData) {
      if (rawData.items && typeof rawData.items === 'object' && !Array.isArray(rawData.items)) {
        const nestedItems = rawData.items as Record<string, unknown>;
        if (Array.isArray(nestedItems.discountAttributes)) {
          rawItems = nestedItems.discountAttributes;
        } else if (Array.isArray(nestedItems.items)) {
          rawItems = nestedItems.items;
        }
      }

      if (rawItems.length === 0) {
        if (Array.isArray(rawData.discountAttributes)) {
          rawItems = rawData.discountAttributes;
        } else if (Array.isArray(rawData.items)) {
          rawItems = rawData.items;
        }
      }
    }

    const activeItems = rawItems.filter(
      (item): item is Record<string, unknown> => !!item && typeof item === 'object'
    );

    return {
      items: activeItems.map((item) => ({
        propertyId: Number(item.propertyId || rawData?.propertyId || 0),
        socialAttributeId: Number(item.socialAttributeId ?? item.id),
        bitValue:
          typeof item.bitValue === 'boolean'
            ? item.bitValue
            : item.bitValue != null
              ? String(item.bitValue).trim().toLowerCase() === 'true' || String(item.bitValue).trim() === '1'
              : null,
        intValue: item.intValue != null ? Number(item.intValue) : null,
        decimalValue: item.decimalValue != null ? Number(item.decimalValue) : null,
        textValue: item.textValue != null ? String(item.textValue) : null,
        dateValue: item.dateValue != null ? String(item.dateValue) : null,
        documentBindingId: (item.documentBindingId ?? item.DocumentBindingId) != null ? Number(item.documentBindingId ?? item.DocumentBindingId) : null,
        remark: item.remark != null ? String(item.remark) : null,
        socialAttributeCode: String(item.socialAttributeCode || ''),
        socialAttributeName: String(item.socialAttributeName || ''),
        id:
          item.propertySocialDetailId != null && Number(item.propertySocialDetailId) > 0
            ? Number(item.propertySocialDetailId)
            : 0,
        isActive: item.isActive !== false,
        createdDate: String(item.createdDate || ''),
        updatedDate: item.updatedDate ? String(item.updatedDate) : null,
        isDiscountApplicable:
          typeof item.isDiscountApplicable === 'boolean'
            ? item.isDiscountApplicable
            : typeof item.isDiscount === 'boolean'
              ? item.isDiscount
              : false,
        documentGuid: (item.documentGuid ?? item.DocumentGuid ?? item.guid ?? item.Guid) ? String(item.documentGuid ?? item.DocumentGuid ?? item.guid ?? item.Guid) : null,
        percentage: item.percentage != null ? Number(item.percentage) : null,
        amount: item.amount != null ? Number(item.amount) : null,
        level: item.level
          ? String(item.level)
          : item.Level
            ? String(item.Level)
            : item.levelName
              ? String(item.levelName)
              : item.wingDetailId || item.WingDetailId
                ? 'Wing'
                : item.societyDetailId || item.SocietyDetailId
                  ? 'Apartment'
                  : undefined,
        wingDetailId: item.wingDetailId != null
          ? Number(item.wingDetailId)
          : item.WingDetailId != null
            ? Number(item.WingDetailId)
            : null,
        societyDetailId: item.societyDetailId != null
          ? Number(item.societyDetailId)
          : item.SocietyDetailId != null
            ? Number(item.SocietyDetailId)
            : null,
        wingName: item.wingName ? String(item.wingName) : item.WingName ? String(item.WingName) : null,
        unitNo: item.unitNo ? String(item.unitNo) : item.UnitNo ? String(item.UnitNo) : null,
        partitionNo: item.partitionNo ? String(item.partitionNo) : item.PartitionNo ? String(item.PartitionNo) : null,
        applicableToLabel: item.applicableToLabel ? String(item.applicableToLabel) : undefined,
      })),
    };
  },

  mapSocialDetails: (data: unknown): DiscountData => {
    interface RawSocialAttribute {
      id?: number | string;
      bitValue?: boolean | null;
      intValue?: number | string | null;
      decimalValue?: number | string | null;
      textValue?: string | null;
      dateValue?: string | null;
      documentBindingId?: number | string | null;
      remark?: string | null;
      socialAttributeCode?: string;
      socialAttributeName?: string;
      propertySocialDetailId?: number | string | null;
      isActive?: boolean;
      isDiscountApplicable?: boolean;
      documentGuid?: string | null;
      percentage?: number | string | null;
      amount?: number | string | null;
      children?: RawSocialAttribute[];
    }

    const rawData = data as Record<string, unknown> | null;
    const rawAttributes =
      rawData && Array.isArray(rawData.socialAttributes)
        ? (rawData.socialAttributes as RawSocialAttribute[])
        : rawData &&
            rawData.items &&
            typeof rawData.items === 'object' &&
            !Array.isArray(rawData.items) &&
            Array.isArray((rawData.items as Record<string, unknown>).socialAttributes)
          ? ((rawData.items as Record<string, unknown>).socialAttributes as RawSocialAttribute[])
          : [];

    const propertyId = Number(
      rawData?.propertyId ||
        (rawData?.items &&
          typeof rawData.items === 'object' &&
          !Array.isArray(rawData.items) &&
          (rawData.items as Record<string, unknown>).propertyId) ||
        0
    );
    const flatItems: PropertySocialDetailItem[] = [];

    const traverse = (attrs: RawSocialAttribute[]) => {
      for (const attr of attrs) {
        flatItems.push({
          propertyId,
          socialAttributeId: Number(attr.id),
          bitValue:
            typeof attr.bitValue === 'boolean'
              ? attr.bitValue
              : attr.bitValue != null
                ? String(attr.bitValue).trim().toLowerCase() === 'true' || String(attr.bitValue).trim() === '1'
                : null,
          intValue: attr.intValue != null ? Number(attr.intValue) : null,
          decimalValue: attr.decimalValue != null ? Number(attr.decimalValue) : null,
          textValue: attr.textValue != null ? String(attr.textValue) : null,
          dateValue: attr.dateValue != null ? String(attr.dateValue) : null,
          documentBindingId: (attr.documentBindingId ?? (attr as Record<string, unknown>).DocumentBindingId) != null ? Number(attr.documentBindingId ?? (attr as Record<string, unknown>).DocumentBindingId) : null,
          remark: attr.remark != null ? String(attr.remark) : null,
          socialAttributeCode: String(attr.socialAttributeCode || ''),
          socialAttributeName: String(attr.socialAttributeName || ''),
          id: attr.propertySocialDetailId != null ? Number(attr.propertySocialDetailId) : 0,
          isActive: attr.isActive !== false,
          createdDate: '',
          updatedDate: null,
          isDiscountApplicable: attr.isDiscountApplicable === true,
          documentGuid: (attr.documentGuid ?? (attr as Record<string, unknown>).DocumentGuid ?? (attr as Record<string, unknown>).guid ?? (attr as Record<string, unknown>).Guid) ? String(attr.documentGuid ?? (attr as Record<string, unknown>).DocumentGuid ?? (attr as Record<string, unknown>).guid ?? (attr as Record<string, unknown>).Guid) : null,
          percentage: attr.percentage != null ? Number(attr.percentage) : null,
          amount: attr.amount != null ? Number(attr.amount) : null,
          level: (attr as Record<string, unknown>).level
            ? String((attr as Record<string, unknown>).level)
            : (attr as Record<string, unknown>).wingDetailId
              ? 'Wing'
              : (attr as Record<string, unknown>).societyDetailId
                ? 'Apartment'
                : undefined,
          wingDetailId: (attr as Record<string, unknown>).wingDetailId != null
            ? Number((attr as Record<string, unknown>).wingDetailId)
            : null,
          societyDetailId: (attr as Record<string, unknown>).societyDetailId != null
            ? Number((attr as Record<string, unknown>).societyDetailId)
            : null,
          wingName: (attr as Record<string, unknown>).wingName ? String((attr as Record<string, unknown>).wingName) : null,
          unitNo: (attr as Record<string, unknown>).unitNo ? String((attr as Record<string, unknown>).unitNo) : null,
          partitionNo: (attr as Record<string, unknown>).partitionNo ? String((attr as Record<string, unknown>).partitionNo) : (attr as Record<string, unknown>).PartitionNo ? String((attr as Record<string, unknown>).PartitionNo) : null,
          applicableToLabel: (attr as Record<string, unknown>).applicableToLabel ? String((attr as Record<string, unknown>).applicableToLabel) : undefined,
        });
        if (Array.isArray(attr.children) && attr.children.length > 0) {
          traverse(attr.children);
        }
      }
    };

    traverse(rawAttributes);

    return {
      items: flatItems,
    };
  },

  mapBuildingPermissionDetails: (data: unknown): BuildingPermissionData => {
    const rawData = safeRecord(data);
    const itemsMap = new Map<string, BuildingPermissionItem>();

    const addCert = (rec: Record<string, unknown>, floorId: number | null = null, floorDesc: string | null = null) => {
      const typeId = Number(
        rec.certificateTypeId ?? rec.CertificateTypeId ?? rec.id ?? rec.Id ?? 0
      );
      if (!typeId) return;

      const certNo = (rec.certificateNo ?? rec.CertificateNo ?? rec.certificateNumber ?? rec.CertificateNumber ?? rec.number ?? rec.Number) != null
        ? String(rec.certificateNo ?? rec.CertificateNo ?? rec.certificateNumber ?? rec.CertificateNumber ?? rec.number ?? rec.Number).trim()
        : null;

      const issueDate = (rec.issueDate ?? rec.IssueDate ?? rec.certificateIssueDate ?? rec.CertificateIssueDate ?? rec.certificateDate ?? rec.CertificateDate ?? rec.date ?? rec.Date) != null
        ? String(rec.issueDate ?? rec.IssueDate ?? rec.certificateIssueDate ?? rec.CertificateIssueDate ?? rec.certificateDate ?? rec.CertificateDate ?? rec.date ?? rec.Date).trim()
        : null;

      const docGuid = (rec.documentGuid ?? rec.DocumentGuid ?? rec.guid ?? rec.Guid ?? rec.documentPath ?? rec.DocumentPath) != null
        ? String(rec.documentGuid ?? rec.DocumentGuid ?? rec.guid ?? rec.Guid ?? rec.documentPath ?? rec.DocumentPath).trim()
        : null;

      const hasCertVal = rec.hasCertificate ?? rec.HasCertificate;
      const isActiveVal = rec.isActive ?? rec.IsActive;

      const propCertId = (rec.propertyCertificateId ?? rec.PropertyCertificateId ?? rec.id ?? rec.Id) != null
        ? Number(rec.propertyCertificateId ?? rec.PropertyCertificateId ?? rec.id ?? rec.Id)
        : null;

      const hasAttachedData = Boolean(
        hasCertVal ||
        (propCertId && propCertId > 0) ||
        (certNo && certNo !== '') ||
        (issueDate && issueDate !== '') ||
        (docGuid && docGuid !== '')
      );

      const isActive = isActiveVal !== undefined ? Boolean(isActiveVal) : true;

      const certTypeName = String(
        rec.certificateTypeName ?? rec.CertificateTypeName ?? rec.name ?? rec.Name ?? ''
      );

      const fileName = (rec.fileName ?? rec.FileName ?? rec.documentName ?? rec.DocumentName) != null
        ? String(rec.fileName ?? rec.FileName ?? rec.documentName ?? rec.DocumentName).trim()
        : null;

      const resolvedFloorId = floorId ?? (
        (rec.propertyDetailsId ?? rec.PropertyDetailsId) != null
          ? Number(rec.propertyDetailsId ?? rec.PropertyDetailsId)
          : null
      );

      const resolvedFloorDesc = floorDesc ?? (
        (rec.floorDescription ?? rec.FloorDescription) != null
          ? String(rec.floorDescription ?? rec.FloorDescription)
          : null
      );

      const entityType = (rec.entityType ?? rec.EntityType) != null ? String(rec.entityType ?? rec.EntityType).trim() : null;
      const level = (rec.level ?? rec.Level) != null ? String(rec.level ?? rec.Level).trim() : null;
      const sourceLevel = (rec.sourceLevel ?? rec.SourceLevel) != null ? String(rec.sourceLevel ?? rec.SourceLevel).trim() : null;
      const wingDetailId = (rec.wingDetailId ?? rec.WingDetailId) != null ? Number(rec.wingDetailId ?? rec.WingDetailId) : null;
      const societyDetailId = (rec.societyDetailId ?? rec.SocietyDetailId) != null ? Number(rec.societyDetailId ?? rec.SocietyDetailId) : null;
      const wingName = (rec.wingName ?? rec.WingName) != null ? String(rec.wingName ?? rec.WingName).trim() : null;
      const partitionNo = (rec.partitionNo ?? rec.PartitionNo ?? rec.unitNo ?? rec.UnitNo) != null ? String(rec.partitionNo ?? rec.PartitionNo ?? rec.unitNo ?? rec.UnitNo).trim() : null;
      const inheritedFrom = (rec.inheritedFrom ?? rec.InheritedFrom) != null ? String(rec.inheritedFrom ?? rec.InheritedFrom).trim() : null;

      // Unique key: Prefer propertyCertificateId if present, else typeId + floorId + attached info
      const uniqueKey = propCertId
        ? `id-${propCertId}`
        : `type-${typeId}-floor-${resolvedFloorId ?? 'prop'}-${docGuid || certNo || issueDate || (hasAttachedData ? 'attached' : 'empty')}`;

      itemsMap.set(uniqueKey, {
        certificateTypeId: typeId,
        certificateTypeName: certTypeName,
        displayOrder: Number(rec.displayOrder ?? rec.DisplayOrder ?? 0),
        hasCertificate: hasAttachedData,
        propertyCertificateId: propCertId,
        isActive: isActive,
        certificateNo: certNo,
        issueDate: issueDate,
        documentGuid: docGuid,
        fileName: fileName,
        documentViewUrl: docGuid ? getViewDocumentUrl(docGuid) : null,
        propertyDetailsId: resolvedFloorId,
        floorDescription: resolvedFloorDesc,
        entityType,
        level,
        sourceLevel,
        wingDetailId,
        societyDetailId,
        wingName,
        partitionNo,
        inheritedFrom,
      });
    };

    // 1. Process property-level certificates (types-with-status) FIRST
    const propCertsRaw = rawData?.propertyCertificates ?? (Array.isArray(data) ? data : (rawData?.items ?? data));
    const propRecord = safeRecord(propCertsRaw);
    const rawItems = Array.isArray(propRecord?.items)
      ? propRecord.items
      : Array.isArray(propRecord?.data)
      ? propRecord.data
      : Array.isArray(propCertsRaw)
      ? propCertsRaw
      : [];

    for (const item of rawItems) {
      const rec = safeRecord(item);
      if (rec) {
        const propCertId = (rec.propertyCertificateId ?? rec.PropertyCertificateId ?? rec.id ?? rec.Id) != null
          ? Number(rec.propertyCertificateId ?? rec.PropertyCertificateId ?? rec.id ?? rec.Id)
          : null;
        const certNo = rec.certificateNo ?? rec.CertificateNo ?? rec.certificateNumber ?? rec.CertificateNumber;
        const issueDate = rec.issueDate ?? rec.IssueDate ?? rec.certificateIssueDate ?? rec.CertificateIssueDate;
        const docGuid = rec.documentGuid ?? rec.DocumentGuid ?? rec.guid ?? rec.Guid;
        const hasCert = rec.hasCertificate ?? rec.HasCertificate;
        const hasContent = Boolean(hasCert || (propCertId && propCertId > 0) || certNo || issueDate || docGuid);
        if (hasContent) {
          addCert(rec, null, null);
        }
      }
    }

    // 2. Process floor-level types-with-status SECOND
    if (Array.isArray(rawData?.floorCertificatesWithStatus)) {
      for (const floorGroup of rawData.floorCertificatesWithStatus) {
        const fg = safeRecord(floorGroup);
        if (fg) {
          const fId = (fg.propertyDetailsId ?? fg.PropertyDetailsId) != null ? Number(fg.propertyDetailsId ?? fg.PropertyDetailsId) : null;
          const fDesc = (fg.floorDescription ?? fg.FloorDescription) ? String(fg.floorDescription ?? fg.FloorDescription) : null;
          const certs = Array.isArray(fg.certificates ?? fg.Certificates) ? (fg.certificates ?? fg.Certificates) as unknown[] : [];

          for (const cert of certs) {
            const rec = safeRecord(cert);
            if (rec) {
              const propCertId = (rec.propertyCertificateId ?? rec.PropertyCertificateId ?? rec.id ?? rec.Id) != null
                ? Number(rec.propertyCertificateId ?? rec.PropertyCertificateId ?? rec.id ?? rec.Id)
                : null;
              const docGuid = rec.documentGuid ?? rec.DocumentGuid ?? rec.guid ?? rec.Guid;
              const certNo = rec.certificateNo ?? rec.CertificateNo ?? rec.certificateNumber ?? rec.CertificateNumber;
              const issueDate = rec.issueDate ?? rec.IssueDate ?? rec.certificateIssueDate ?? rec.CertificateIssueDate;
              const hasCert = rec.hasCertificate ?? rec.HasCertificate;
              // Only add floor card if there is an ACTUAL floor-specific certificate entity or attached document for this floor
              if (propCertId != null || docGuid != null || certNo != null || issueDate != null || hasCert) {
                addCert(rec, fId, fDesc);
              }
            }
          }
        }
      }
    }

    // 3. Process any propertyWiseCertificates nested in floorCertificates response
    const rawFloorObj = safeRecord(rawData?.floorCertificates);
    const propWiseCerts = Array.isArray(rawFloorObj?.propertyWiseCertificates ?? rawFloorObj?.PropertyWiseCertificates)
      ? (rawFloorObj?.propertyWiseCertificates ?? rawFloorObj?.PropertyWiseCertificates) as unknown[]
      : [];
    for (const item of propWiseCerts) {
      const rec = safeRecord(item);
      if (rec) {
        const propCertId = (rec.propertyCertificateId ?? rec.PropertyCertificateId ?? rec.id ?? rec.Id) != null
          ? Number(rec.propertyCertificateId ?? rec.PropertyCertificateId ?? rec.id ?? rec.Id)
          : null;
        const certNo = rec.certificateNo ?? rec.CertificateNo ?? rec.certificateNumber ?? rec.CertificateNumber;
        const issueDate = rec.issueDate ?? rec.IssueDate ?? rec.certificateIssueDate ?? rec.CertificateIssueDate;
        const docGuid = rec.documentGuid ?? rec.DocumentGuid ?? rec.guid ?? rec.Guid;
        const hasCert = rec.hasCertificate ?? rec.HasCertificate;
        if (hasCert || (propCertId && propCertId > 0) || certNo || issueDate || docGuid) {
          addCert(rec, null, null);
        }
      }
    }

    return { items: Array.from(itemsMap.values()) };
  },
};
