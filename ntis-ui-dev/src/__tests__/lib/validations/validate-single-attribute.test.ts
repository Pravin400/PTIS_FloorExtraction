import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validateSingleSocialAttribute } from '@/lib/validations/validate-single-attribute';
import { FlatSocialAttributeState } from '@/lib/utils/social-details';

describe('validateSingleSocialAttribute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createBaseAttr = (overrides: Partial<FlatSocialAttributeState> = {}): FlatSocialAttributeState => ({
    id: 1,
    socialAttributeId: 1,
    socialAttributeCode: 'SOLAR',
    socialAttributeName: 'Solar Panel',
    dataType: 'BIT',
    bitValue: true,
    intValue: null,
    decimalValue: null,
    textValue: null,
    dateValue: null,
    documentBindingId: null,
    photoBindingId: null,
    documentGuid: null,
    photoGuid: null,
    uploadedGuid: undefined,
    fileName: null,
    documentUrl: undefined,
    pendingFile: undefined,
    isUploading: false,
    parentAttributeId: null,
    isRequiredWhenParentTrue: false,
    isPhotoRequired: true,
    isDocumentRequired: false,
    remark: null,
    isOverridden: false,
    isInherited: false,
    ...overrides,
  });

  it('fails when photo is required and only a stale fileName is present', () => {
    const attr = createBaseAttr({
      isPhotoRequired: true,
      fileName: 'stale_photo.jpg',
      photoBindingId: null,
      documentBindingId: null,
      photoGuid: null,
      documentGuid: null,
      uploadedGuid: undefined,
      pendingFile: undefined,
      documentUrl: undefined,
    });
    const result = validateSingleSocialAttribute(attr, { 1: attr });
    expect(result).toBe('Photo is required.');
  });

  it('passes when photo is required and a valid positive photoBindingId is present', () => {
    const attr = createBaseAttr({
      isPhotoRequired: true,
      photoBindingId: 456,
      fileName: 'photo.jpg',
    });
    const result = validateSingleSocialAttribute(attr, { 1: attr });
    expect(result).toBeNull();
  });

  it('passes when photo is required and a valid photoGuid is present', () => {
    const attr = createBaseAttr({
      isPhotoRequired: true,
      photoGuid: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    });
    const result = validateSingleSocialAttribute(attr, { 1: attr });
    expect(result).toBeNull();
  });

  it('passes when document is required and a valid documentBindingId is present', () => {
    const attr = createBaseAttr({
      isPhotoRequired: false,
      isDocumentRequired: true,
      documentBindingId: 789,
    });
    const result = validateSingleSocialAttribute(attr, { 1: attr });
    expect(result).toBeNull();
  });

  it('fails when document is required and only stale fileName is present', () => {
    const attr = createBaseAttr({
      isPhotoRequired: false,
      isDocumentRequired: true,
      fileName: 'stale_doc.pdf',
      documentBindingId: null,
      documentGuid: null,
    });
    const result = validateSingleSocialAttribute(attr, { 1: attr });
    expect(result).toBe('Document is required.');
  });
});
