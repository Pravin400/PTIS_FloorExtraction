import type { AssetDocumentItem, GroupedDocumentCategory } from '@/types/asset-gis.types';

export const DOC_DEF_NAMES: Record<number, string> = {
  1: '7/12 Extract / Record of Rights',
  2: 'Property Card',
  3: 'City Survey (CTS) Extract',
  4: 'Sanctioned Layout / Building Plan',
  5: 'DP / Master Plan Drawing',
  6: 'Land Map / Nuzul Sheet',
  7: 'Title Deed / Sale Deed',
  8: 'Possession Receipt / Allotment Letter',
  9: 'Lease Agreement / Rent Agreement',
  10: 'Gram Panchayat / Municipal Tax Receipt',
  11: 'Valuation Certificate',
  12: 'Drone / Aerial Survey Image',
};

export function groupDocumentsByCategory(
  documents: AssetDocumentItem[] = []
): GroupedDocumentCategory[] {
  const list = documents as (AssetDocumentItem & {
    customUrl?: string;
    photoTypeId?: number;
    photoTypeName?: string;
    documentDefinitionId?: number;
    documentDefinitionName?: string;
    category?: string;
  })[];

  const map = new Map<string, GroupedDocumentCategory>();

  list.forEach((doc) => {
    let groupKey: string;
    let groupTitle = '';
    const docRecord = doc as unknown as Record<string, unknown>;
    const bindingPurpose = docRecord.bindingPurpose || docRecord.BindingPurpose;
    const docDefName = docRecord.documentDefinitionName || docRecord.DocumentDefinitionName;
    const fName = (doc.fileName || doc.name || '').toLowerCase();
    const cat = (doc.category || '').toLowerCase();
    const url = (doc.customUrl || '').toLowerCase();
    const defId = Number(doc.documentDefinitionId || docRecord.DocumentDefinitionId || 0);

    if (bindingPurpose && String(bindingPurpose).trim() && !String(bindingPurpose).includes('#')) {
      groupTitle = String(bindingPurpose).trim();
      groupKey = `binding-${groupTitle}`;
    } else if (docDefName && String(docDefName).trim() && !String(docDefName).includes('#')) {
      groupTitle = String(docDefName).trim();
      groupKey = `docDef-${groupTitle}`;
    } else if (defId > 0 && DOC_DEF_NAMES[defId]) {
      groupTitle = DOC_DEF_NAMES[defId];
      groupKey = `docDef-${defId}`;
    } else if (fName.includes('712') || fName.includes('7_12') || fName.includes('record of rights') || fName.includes('satbara')) {
      groupTitle = '7/12 Extract / Record of Rights';
      groupKey = 'type-712';
    } else if (fName.includes('property') || fName.includes('card') || fName.includes('malmatta')) {
      groupTitle = 'Property Card';
      groupKey = 'type-propcard';
    } else if (fName.includes('cts') || fName.includes('city survey') || fName.includes('city_survey')) {
      groupTitle = 'City Survey (CTS) Extract';
      groupKey = 'type-cts';
    } else if (fName.includes('nuzul') || fName.includes('land map')) {
      groupTitle = 'Land Map / Nuzul Sheet';
      groupKey = 'type-nuzul';
    } else if (fName.includes('agreement') || fName.includes('lease') || fName.includes('rent')) {
      groupTitle = 'Lease Agreement';
      groupKey = 'type-agreement';
    } else if (fName.includes('drone')) {
      groupTitle = 'Drone / Aerial Image';
      groupKey = 'type-drone';
    } else if (
      fName.includes('plan') ||
      fName.includes('dp') ||
      cat.includes('plan') ||
      url.includes('plan') ||
      doc.photoTypeId === 2 ||
      doc.photoTypeName === 'plan'
    ) {
      groupTitle = 'Sanctioned Layout / Building Plan';
      groupKey = 'type-plan';
    } else if (fName.includes('tax') || fName.includes('receipt') || fName.includes('bill')) {
      groupTitle = 'Tax Receipt / Municipal Bill';
      groupKey = 'type-tax';
    } else if (fName.includes('valuation') || fName.includes('audit')) {
      groupTitle = 'Valuation Certificate';
      groupKey = 'type-valuation';
    } else if (fName.includes('possession') || fName.includes('allotment')) {
      groupTitle = 'Possession / Allotment Letter';
      groupKey = 'type-allotment';
    } else if (fName.includes('deed') || fName.includes('sale') || fName.includes('conveyance')) {
      groupTitle = 'Title / Sale Deed';
      groupKey = 'type-deed';
    } else {
      groupTitle = 'Legal & Administrative Documents';
      groupKey = 'type-general';
    }

    if (!map.has(groupKey)) {
      map.set(groupKey, { groupKey, groupTitle, items: [], seenItemKeys: new Set() });
    }

    const group = map.get(groupKey)!;
    const itemKey = `${doc.documentGuid || doc.id || doc.fileName || doc.name}`;
    if (!group.seenItemKeys.has(itemKey)) {
      group.seenItemKeys.add(itemKey);
      group.items.push(doc);
    }
  });

  return Array.from(map.values());
}
