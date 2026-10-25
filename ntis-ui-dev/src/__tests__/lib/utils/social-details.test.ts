import { describe, it, expect } from 'vitest';
import { getLocalizedName } from '@/lib/utils/social-details';
import { getItemLevel, LEVEL_NAMES } from '@/lib/utils/ptis/social-details';

describe('getLocalizedName', () => {
  it('should return raw dynamic DB name from API response when provided', () => {
    const result = getLocalizedName('HAS_SOLAR', 'Solar Installed on high');
    expect(result).toBe('Solar Installed on high');
  });

  it('should return dynamic name from API response for any attribute', () => {
    const result = getLocalizedName('NO_OF_BOREWELL', 'Number of Borewells');
    expect(result).toBe('Number of Borewells');
  });

  it('should fallback to code if name is null or empty', () => {
    const result = getLocalizedName('HAS_SOLAR', null);
    expect(result).toBe('HAS_SOLAR');
  });
});

describe('getItemLevel', () => {
  it('should classify unit records with propertyId and wingDetailId as UNIT', () => {
    const item = {
      propertyId: 2078970,
      wingDetailId: 105,
      societyDetailId: 50,
    };
    expect(getItemLevel(item)).toBe(LEVEL_NAMES.UNIT);
  });

  it('should classify wing records with only wingDetailId as WING', () => {
    const item = {
      wingDetailId: 105,
      societyDetailId: 50,
      propertyId: null,
    };
    expect(getItemLevel(item)).toBe(LEVEL_NAMES.WING);
  });

  it('should classify apartment records with only societyDetailId as APARTMENT', () => {
    const item = {
      societyDetailId: 50,
      wingDetailId: null,
      propertyId: null,
    };
    expect(getItemLevel(item)).toBe(LEVEL_NAMES.APARTMENT);
  });

  it("should honor explicit entityType 'P', 'W', and 'S'", () => {
    expect(getItemLevel({ entityType: 'P', wingDetailId: 105 })).toBe(LEVEL_NAMES.UNIT);
    expect(getItemLevel({ entityType: 'W', wingDetailId: 105 })).toBe(LEVEL_NAMES.WING);
    expect(getItemLevel({ entityType: 'S', societyDetailId: 50 })).toBe(LEVEL_NAMES.APARTMENT);
  });
});
