/* eslint-disable @typescript-eslint/no-explicit-any */
export interface UnitNameConfig {
  nameLabel: string;
  localNameLabel: string;
  namePlaceholder: string;
  localNamePlaceholder: string;
}

/**
 * Returns dynamic field labels and placeholders for unit configuration name fields
 * based on whether the unit is a Shop, Flat, or Office.
 */
export function getUnitNameConfig(
  typeOrFlags: { isShop?: boolean; isOffice?: boolean; isFlat?: boolean } | string | undefined,
  t: (key: string, values?: any) => string
): UnitNameConfig {
  let isShop = false;
  let isOffice = false;

  if (typeof typeOrFlags === 'string') {
    const raw = typeOrFlags.toLowerCase().trim();
    isShop = raw.includes('shop') || raw.includes('commercial');
    isOffice = raw.includes('office') || raw.includes('corporate');
  } else if (typeOrFlags && typeof typeOrFlags === 'object') {
    isShop = !!typeOrFlags.isShop;
    isOffice = !!typeOrFlags.isOffice;
  }

  if (isShop) {
    return {
      nameLabel: t('subunit.fields.shopName') || 'Shop Name',
      localNameLabel: t('subunit.fields.shopNameLocal') || 'Shop Name (Local)',
      namePlaceholder: t('subunit.fields.enterShopName') || 'Enter Shop Name',
      localNamePlaceholder: t('subunit.fields.enterShopNameLocal') || 'Enter Shop Name (Local)',
    };
  }

  if (isOffice) {
    return {
      nameLabel: t('subunit.fields.officeName') || 'Office Name',
      localNameLabel: t('subunit.fields.officeNameLocal') || 'Office Name (Local)',
      namePlaceholder: t('subunit.fields.enterOfficeName') || 'Enter Office Name',
      localNamePlaceholder: t('subunit.fields.enterOfficeNameLocal') || 'Enter Office Name (Local)',
    };
  }

  // Flat (default residential)
  return {
    nameLabel: t('subunit.fields.apartmentName') || 'Apartment Name',
    localNameLabel: t('subunit.fields.apartmentNameLocal') || 'Apartment Name (Local)',
    namePlaceholder: t('subunit.fields.enterApartmentName') || 'Enter Apartment Name',
    localNamePlaceholder: t('subunit.fields.enterApartmentNameLocal') || 'Enter Apartment Name (Local)',
  };
}
