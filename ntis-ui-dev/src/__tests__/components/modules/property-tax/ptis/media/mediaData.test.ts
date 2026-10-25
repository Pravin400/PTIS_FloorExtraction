import { describe, it, expect, beforeEach, vi } from 'vitest';
import { formatWingCardLabel, mapSlotsToCategories } from '@/components/modules/property-tax/ptis/media/mediaData';

describe('mediaData - formatWingCardLabel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('formats simple wing letter dynamically inside wing label', () => {
    expect(formatWingCardLabel('Wing Photo', 'B')).toBe('Wing B Photo');
    expect(formatWingCardLabel('Wing Photo', 'A')).toBe('Wing A Photo');
    expect(formatWingCardLabel('Wing', 'B')).toBe('Wing B');
  });

  it('normalizes wing names that already include "Wing" prefix or suffix', () => {
    expect(formatWingCardLabel('Wing Photo', 'Wing B')).toBe('Wing B Photo');
    expect(formatWingCardLabel('Wing Photo', 'B Wing')).toBe('Wing B Photo');
    expect(formatWingCardLabel('Wing Photo', 'Gana')).toBe('Wing Gana Photo');
  });

  it('works with localized labels (Marathi and Hindi)', () => {
    expect(formatWingCardLabel('विंग फोटो', 'B')).toBe('विंग B फोटो');
    expect(formatWingCardLabel('विंग फोटो', 'Wing A')).toBe('विंग A फोटो');
    expect(formatWingCardLabel('विंग', 'B')).toBe('विंग B');
  });

  it('preserves named society wings (e.g. Ganga, Tulsi, Gana)', () => {
    expect(formatWingCardLabel('Wing Photo', 'Ganga')).toBe('Wing Ganga Photo');
    expect(formatWingCardLabel('Wing Photo', 'Ganga Wing')).toBe('Wing Ganga Photo');
    expect(formatWingCardLabel('Wing Photo', 'Gana')).toBe('Wing Gana Photo');
  });

  it('returns base label unchanged if wingName is empty or undefined', () => {
    expect(formatWingCardLabel('Wing Photo', '')).toBe('Wing Photo');
    expect(formatWingCardLabel('Wing Photo', undefined)).toBe('Wing Photo');
    expect(formatWingCardLabel('Wing Photo', null)).toBe('Wing Photo');
    expect(formatWingCardLabel('Wing Photo', '   ')).toBe('Wing Photo');
  });

  it('correctly injects wing name into specific wing slot labels without collapsing them', () => {
    expect(formatWingCardLabel('Wing Building Photo', 'Asha')).toBe('Wing Asha Building Photo');
    expect(formatWingCardLabel('Wing Place Photo', 'Asha')).toBe('Wing Asha Place Photo');
    expect(formatWingCardLabel('Wing Board Photo', 'Asha')).toBe('Wing Asha Board Photo');
    expect(formatWingCardLabel('Wing Sign Board Photo', 'Asha')).toBe('Wing Asha Sign Board Photo');

    expect(formatWingCardLabel('विंग इमारत फोटो', 'Asha')).toBe('विंग Asha इमारत फोटो');
    expect(formatWingCardLabel('विंग ठिकाणाचा फोटो', 'Asha')).toBe('विंग Asha ठिकाणाचा फोटो');
    expect(formatWingCardLabel('विंग पाटीचा फोटो', 'Asha')).toBe('विंग Asha पाटीचा फोटो');
    expect(formatWingCardLabel('विंग नामफलक फोटो', 'Asha')).toBe('विंग Asha नामफलक फोटो');
  });
});

describe('mediaData - mapSlotsToCategories with wingName', () => {
  const mockSlots = [
    {
      photoTypeId: 10,
      photoTypeCode: 'WING_BUILDING',
      photoTypeName: 'Wing Photo',
      displayOrder: 1,
      hasPhoto: false,
    },
    {
      photoTypeId: 1,
      photoTypeCode: 'SOCIETY_BUILDING',
      photoTypeName: 'Society Photo',
      displayOrder: 2,
      hasPhoto: false,
    },
  ];

  it('includes selected wing name in wing category photoTypeName as Wing [name] Photo', () => {
    const categories = mapSlotsToCategories(
      mockSlots,
      [],
      undefined,
      undefined,
      'B'
    );

    const wingCat = categories.find((c) => c.photoTypeCode === 'WING_BUILDING');
    expect(wingCat).toBeDefined();
    expect(wingCat?.photoTypeName).toBe('Wing B Photo');
  });

  it('formats wing name when passed as "Wing B"', () => {
    const categories = mapSlotsToCategories(
      mockSlots,
      [],
      undefined,
      undefined,
      'Wing B'
    );

    const wingCat = categories.find((c) => c.photoTypeCode === 'WING_BUILDING');
    expect(wingCat).toBeDefined();
    expect(wingCat?.photoTypeName).toBe('Wing B Photo');
  });

  it('preserves distinct photoTypeName for all wing scope slots in drawer without duplicate names', () => {
    const wingScopeSlots = [
      { photoTypeId: 8, photoTypeCode: 'WING_BUILDING', photoTypeName: 'Wing Building Photo', photoScope: 'WING', displayOrder: 1, hasPhoto: false },
      { photoTypeId: 9, photoTypeCode: 'WING_PLACE', photoTypeName: 'Wing Place Photo', photoScope: 'WING', displayOrder: 2, hasPhoto: false },
      { photoTypeId: 10, photoTypeCode: 'WING_BOARD', photoTypeName: 'Wing Board Photo', photoScope: 'WING', displayOrder: 3, hasPhoto: false },
      { photoTypeId: 11, photoTypeCode: 'WING_SIGN_BOARD', photoTypeName: 'Wing Sign Board Photo', photoScope: 'WING', displayOrder: 4, hasPhoto: false },
    ];

    const categories = mapSlotsToCategories(
      wingScopeSlots,
      [],
      undefined,
      undefined,
      'Asha',
      1530993,
      true, // isMainProperty
      4     // categoryId = 4 (Wing)
    );

    const wingBuilding = categories.find((c) => c.photoTypeCode === 'WING_BUILDING');
    const wingPlace = categories.find((c) => c.photoTypeCode === 'WING_PLACE');
    const wingBoard = categories.find((c) => c.photoTypeCode === 'WING_BOARD');
    const wingSignBoard = categories.find((c) => c.photoTypeCode === 'WING_SIGN_BOARD');

    expect(wingBuilding?.photoTypeName).toBe('Wing Asha Building Photo');
    expect(wingPlace?.photoTypeName).toBe('Wing Asha Place Photo');
    expect(wingBoard?.photoTypeName).toBe('Wing Asha Board Photo');
    expect(wingSignBoard?.photoTypeName).toBe('Wing Asha Sign Board Photo');

    // Ensure all 4 slots have unique, non-identical names
    const names = [wingBuilding?.photoTypeName, wingPlace?.photoTypeName, wingBoard?.photoTypeName, wingSignBoard?.photoTypeName];
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(4);
  });
});

describe('mediaData - mapSlotsToCategories in QuickDataEntry mode', () => {
  const allSlots = [
    { photoTypeId: 1, photoTypeCode: 'PROPERTY_FRONT', photoTypeName: 'Property Front Photo', photoScope: 'PROPERTY', displayOrder: 1, hasPhoto: false, photoCount: 0 },
    { photoTypeId: 2, photoTypeCode: 'PROPERTY_SIDE', photoTypeName: 'Property Side Photo', photoScope: 'PROPERTY', displayOrder: 2, hasPhoto: false, photoCount: 0 },
    { photoTypeId: 3, photoTypeCode: 'PROPERTY_INSIDE', photoTypeName: 'Property Inside Photo', photoScope: 'PROPERTY', displayOrder: 3, hasPhoto: false, photoCount: 0 },
    { photoTypeId: 4, photoTypeCode: 'PROPERTY_BOARD', photoTypeName: 'Property Board Photo', photoScope: 'PROPERTY', displayOrder: 4, hasPhoto: false, photoCount: 0 },
    { photoTypeId: 5, photoTypeCode: 'WING_BUILDING', photoTypeName: 'Wing Photo', photoScope: 'WING', displayOrder: 5, hasPhoto: false, photoCount: 0 },
    { photoTypeId: 6, photoTypeCode: 'SOCIETY_PLACE', photoTypeName: 'Society Place Photo', photoScope: 'SOCIETY', displayOrder: 6, hasPhoto: false, photoCount: 0 },
    { photoTypeId: 7, photoTypeCode: 'GIS', photoTypeName: 'Satellite View', photoScope: 'PROPERTY', displayOrder: 7, hasPhoto: false, photoCount: 0 },
    { photoTypeId: 8, photoTypeCode: 'CHANGE_DETECTION', photoTypeName: 'Change Detection', photoScope: 'PROPERTY', displayOrder: 8, hasPhoto: false, photoCount: 0 },
  ];

  it('only loads property scope slots for inner property of society wings in QDE', () => {
    const categories = mapSlotsToCategories(
      allSlots,
      [],
      undefined,
      undefined,
      'B Wing',
      1530993,
      false, // isMainProperty = false (inner property)
      1,     // categoryId = 1 (Apartment)
      null,
      'P',
      false,
      undefined,
      undefined,
      true,  // isQuickDataEntry = true
      'B9'   // partitionNo = 'B9'
    );

    // Should include property-scoped slots and property plan
    expect(categories.some((c) => c.photoTypeCode === 'PROPERTY_FRONT')).toBe(true);
    expect(categories.some((c) => c.photoTypeCode === 'PROPERTY_SIDE')).toBe(true);
    expect(categories.some((c) => c.photoTypeCode === 'PROPERTY_INSIDE')).toBe(true);
    expect(categories.some((c) => c.photoTypeCode === 'PROPERTY_BOARD')).toBe(true);
    expect(categories.some((c) => c.photoTypeCode === 'PROPERTY_PLAN')).toBe(true);

    // Should NOT include society or wing slots
    expect(categories.some((c) => c.photoTypeCode?.startsWith('WING_'))).toBe(false);
    expect(categories.some((c) => c.photoTypeCode?.startsWith('SOCIETY_'))).toBe(false);

    // Should NOT include satellite view or change detection
    expect(categories.some((c) => c.photoTypeCode === 'GIS')).toBe(false);
    expect(categories.some((c) => c.photoTypeCode === 'CHANGE_DETECTION')).toBe(false);
  });

  it('only loads society scope slots for main society property in QDE', () => {
    const categories = mapSlotsToCategories(
      allSlots,
      [],
      undefined,
      undefined,
      'A Wing',
      1530423,
      true,  // isMainProperty = true (main society property)
      1,     // categoryId = 1 (Apartment)
      null,
      'S',
      false,
      undefined,
      undefined,
      true,  // isQuickDataEntry = true
      ''     // partitionNo = ''
    );

    // Should include society scope slots
    expect(categories.some((c) => c.photoTypeCode?.startsWith('SOCIETY_'))).toBe(true);

    // Should NOT include wing slots for main society property
    expect(categories.some((c) => c.photoTypeCode?.startsWith('WING_'))).toBe(false);

    // Should NOT include property scope slots or plan
    expect(categories.some((c) => c.photoTypeCode === 'PROPERTY_FRONT')).toBe(false);
    expect(categories.some((c) => c.photoTypeCode === 'PROPERTY_SIDE')).toBe(false);
    expect(categories.some((c) => c.photoTypeCode === 'PROPERTY_PLAN')).toBe(false);

    // Should NOT include satellite view or change detection
    expect(categories.some((c) => c.photoTypeCode === 'GIS')).toBe(false);
    expect(categories.some((c) => c.photoTypeCode === 'CHANGE_DETECTION')).toBe(false);
  });

  it('loads amenity, society slots, and property plan for amenity property in QDE', () => {
    const slotsWithAmenity = [
      ...allSlots,
      { photoTypeId: 14, photoTypeCode: 'AMENITY_PHOTO', photoTypeName: 'Amenity Photo', photoScope: 'PROPERTY', displayOrder: 9, hasPhoto: false, photoCount: 0 },
    ];

    const categories = mapSlotsToCategories(
      slotsWithAmenity,
      [],
      undefined,
      undefined,
      undefined,
      null,
      false,
      140,  // categoryId = 140 (Amenity)
      140,  // propertyTypeId = 140
      'A',  // entityType = 'A'
      true, // isAmenityProp = true
      undefined,
      undefined,
      true, // isQuickDataEntry = true
      'DAM11'
    );

    // Amenity photo and property plan should be present
    expect(categories.some((c) => c.photoTypeCode === 'AMENITY_PHOTO')).toBe(true);
    expect(categories.some((c) => c.photoTypeCode === 'PROPERTY_PLAN')).toBe(true);

    // Society slots should ALSO be present for amenity property
    expect(categories.some((c) => c.photoTypeCode?.startsWith('SOCIETY_'))).toBe(true);

    // Wing slots and regular property slots should NOT be present
    expect(categories.some((c) => c.photoTypeCode?.startsWith('WING_'))).toBe(false);
    expect(categories.some((c) => c.photoTypeCode === 'PROPERTY_FRONT')).toBe(false);
    expect(categories.some((c) => c.photoTypeCode === 'PROPERTY_SIDE')).toBe(false);

    // GIS and Change Detection should NOT be present in QDE
    expect(categories.some((c) => c.photoTypeCode === 'GIS')).toBe(false);
    expect(categories.some((c) => c.photoTypeCode === 'CHANGE_DETECTION')).toBe(false);
  });

  it('only attaches uploaded photo to the matching society slot without bleeding into other society slots', () => {
    const societySlots = [
      { photoTypeId: 5, photoTypeCode: 'SOCIETY_PLACE', photoTypeName: 'Society Place Photo', photoScope: 'SOCIETY', displayOrder: 1, hasPhoto: false },
      { photoTypeId: 6, photoTypeCode: 'SOCIETY_BOARD', photoTypeName: 'Society Board Photo', photoScope: 'SOCIETY', displayOrder: 2, hasPhoto: false },
      { photoTypeId: 7, photoTypeCode: 'SOCIETY_SIGN_BOARD', photoTypeName: 'Society Sign Board Photo', photoScope: 'SOCIETY', displayOrder: 3, hasPhoto: false },
    ];

    const uploadedSocietyPlacePhoto = [
      {
        propertyPhotoId: 12304,
        propertyId: 2078892,
        photoTypeId: 5,
        photoTypeCode: 'SOCIETY_PLACE',
        photoTypeName: 'Society Place Photo',
        displayOrder: 1,
        remarks: 'Society Place Photo',
        documentGuid: 'guid-soc-place-12304',
        viewUrl: '/api/documents/guid-soc-place-12304/view',
        societyDetailId: 1507857,
      },
    ];

    const categories = mapSlotsToCategories(
      societySlots,
      uploadedSocietyPlacePhoto,
      undefined,
      undefined,
      undefined,
      null,
      false,
      1,
      null,
      'S',
      false,
      undefined,
      undefined,
      false
    );

    const placeCat = categories.find((c) => c.photoTypeId === 5);
    const boardCat = categories.find((c) => c.photoTypeId === 6);
    const signBoardCat = categories.find((c) => c.photoTypeId === 7);

    // Place slot should have the photo
    expect(placeCat).toBeDefined();
    expect(placeCat?.hasPhoto).toBe(true);
    expect(placeCat?.images).toHaveLength(1);
    expect(placeCat?.images[0].documentGuid).toBe('guid-soc-place-12304');

    // Board and Sign Board slots MUST NOT have the photo
    expect(boardCat).toBeDefined();
    expect(boardCat?.hasPhoto).toBe(false);
    expect(boardCat?.images).toHaveLength(0);

    expect(signBoardCat).toBeDefined();
    expect(signBoardCat?.hasPhoto).toBe(false);
    expect(signBoardCat?.images).toHaveLength(0);
  });

  it('does not resurrect fallback photo when photo has been deleted (uploadedPhotos is empty and slot hasPhoto is false)', () => {
    const societySlots = [
      { photoTypeId: 5, photoTypeCode: 'SOCIETY_PLACE', photoTypeName: 'Society Place Photo', photoScope: 'SOCIETY', displayOrder: 1, hasPhoto: false, photoCount: 0 },
      { photoTypeId: 6, photoTypeCode: 'SOCIETY_BOARD', photoTypeName: 'Society Board Photo', photoScope: 'SOCIETY', displayOrder: 2, hasPhoto: false, photoCount: 0 },
    ];

    const categories = mapSlotsToCategories(
      societySlots,
      [], // uploadedPhotos is empty after deletion
      new Set([5, 6]), // fully loaded
      undefined,
      undefined,
      null,
      true, // isMainProperty
      1,
      null,
      'S',
      false,
      'old-deleted-guid-123', // societyPhotoFallbackGuid
      undefined,
      false
    );

    const placeCat = categories.find((c) => c.photoTypeId === 5);
    expect(placeCat).toBeDefined();
    expect(placeCat?.hasPhoto).toBe(false);
    expect(placeCat?.images).toHaveLength(0);
    expect(placeCat?.photoCount).toBe(0);
  });
});

describe('mediaData - Apartment Property Scope Filtering', () => {
  const allMixedSlots = [
    { photoTypeId: 1, photoTypeCode: 'PROPERTY_FRONT', photoTypeName: 'Property Front Photo', photoScope: 'PROPERTY', displayOrder: 1, hasPhoto: false, photoCount: 0 },
    { photoTypeId: 2, photoTypeCode: 'PROPERTY_SIDE', photoTypeName: 'Property Side Photo', photoScope: 'PROPERTY', displayOrder: 2, hasPhoto: false, photoCount: 0 },
    { photoTypeId: 3, photoTypeCode: 'PROPERTY_INSIDE', photoTypeName: 'Property Inside Photo', photoScope: 'PROPERTY', displayOrder: 3, hasPhoto: false, photoCount: 0 },
    { photoTypeId: 4, photoTypeCode: 'PROPERTY_BOARD', photoTypeName: 'Property Board Photo', photoScope: 'PROPERTY', displayOrder: 4, hasPhoto: false, photoCount: 0 },
    { photoTypeId: 5, photoTypeCode: 'SOCIETY_PLACE', photoTypeName: 'Society Place Photo', photoScope: 'SOCIETY', displayOrder: 10, hasPhoto: false, photoCount: 0 },
    { photoTypeId: 6, photoTypeCode: 'SOCIETY_BOARD', photoTypeName: 'Society Board Photo', photoScope: 'SOCIETY', displayOrder: 11, hasPhoto: false, photoCount: 0 },
    { photoTypeId: 7, photoTypeCode: 'SOCIETY_SIGN_BOARD', photoTypeName: 'Society Sign Board Photo', photoScope: 'SOCIETY', displayOrder: 12, hasPhoto: false, photoCount: 0 },
    { photoTypeId: 8, photoTypeCode: 'WING_BUILDING', photoTypeName: 'Wing Building Photo', photoScope: 'WING', displayOrder: 20, hasPhoto: false, photoCount: 0 },
    { photoTypeId: 9, photoTypeCode: 'WING_PLACE', photoTypeName: 'Wing Place Photo', photoScope: 'WING', displayOrder: 21, hasPhoto: false, photoCount: 0 },
    { photoTypeId: 10, photoTypeCode: 'WING_BOARD', photoTypeName: 'Wing Board Photo', photoScope: 'WING', displayOrder: 22, hasPhoto: false, photoCount: 0 },
    { photoTypeId: 11, photoTypeCode: 'WING_SIGN_BOARD', photoTypeName: 'Wing Sign Board Photo', photoScope: 'WING', displayOrder: 23, hasPhoto: false, photoCount: 0 },
    { photoTypeId: 13, photoTypeCode: 'PROPERTY_PLAN', photoTypeName: 'Property Plan', photoScope: 'PROPERTY', displayOrder: 13, hasPhoto: false, photoCount: 0 },
  ];

  it('renders ONLY society and wing scope slots for apartment property screen', () => {
    const categories = mapSlotsToCategories(
      allMixedSlots,
      [],
      undefined,
      undefined,
      'A Wing',
      1530423, // selectedWingDetailId = 1530423
      false,   // isMainProperty = false (unit level)
      1,       // categoryId = 1 (Apartment)
      null,
      'P',
      false,
      undefined,
      undefined,
      false,
      'A-101',
      true,
      5378     // societyDetailId = 5378
    );

    const codes = categories.map((c) => c.photoTypeCode);
    // Property scope slots MUST NOT be shown on Apartment screen
    expect(codes).not.toContain('PROPERTY_FRONT');
    expect(codes).not.toContain('PROPERTY_SIDE');
    expect(codes).not.toContain('PROPERTY_INSIDE');
    expect(codes).not.toContain('PROPERTY_BOARD');
    expect(codes).not.toContain('PROPERTY_PLAN');
    expect(codes).not.toContain('PHOTO_PLAN');

    // Society & Wing slots MUST be shown
    expect(codes).toContain('SOCIETY_PLACE');
    expect(codes).toContain('SOCIETY_BOARD');
    expect(codes).toContain('SOCIETY_SIGN_BOARD');
    expect(codes).toContain('WING_BUILDING');
    expect(codes).toContain('WING_PLACE');
    expect(codes).toContain('WING_BOARD');
    expect(codes).toContain('WING_SIGN_BOARD');
  });

  it('renders property scope slots and hides society/wing slots for individual property screen', () => {
    const categories = mapSlotsToCategories(
      allMixedSlots,
      [],
      undefined,
      undefined,
      undefined,
      null,    // selectedWingDetailId = null
      false,   // isMainProperty = false
      2,       // categoryId = 2 (Individual Property)
      null,
      'P',     // entityType = 'P'
      false,
      undefined,
      undefined,
      false,   // isQuickDataEntry = false
      '',
      false,
      null     // societyDetailId = null
    );

    const codes = categories.map((c) => c.photoTypeCode);
    // Property scope slots MUST be shown
    expect(codes).toContain('PROPERTY_FRONT');
    expect(codes).toContain('PROPERTY_SIDE');
    expect(codes).toContain('PROPERTY_INSIDE');
    expect(codes).toContain('PROPERTY_BOARD');

    // Society & Wing slots MUST NOT be shown
    expect(codes).not.toContain('SOCIETY_PLACE');
    expect(codes).not.toContain('SOCIETY_BOARD');
    expect(codes).not.toContain('SOCIETY_SIGN_BOARD');
    expect(codes).not.toContain('WING_BUILDING');
    expect(codes).not.toContain('WING_PLACE');
    expect(codes).not.toContain('WING_BOARD');
    expect(codes).not.toContain('WING_SIGN_BOARD');
  });
});



