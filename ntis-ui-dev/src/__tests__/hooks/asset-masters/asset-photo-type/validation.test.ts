import { describe, it, expect } from "vitest";
import { createTranslator } from "next-intl";
import { mapAssetPhotoApiError, getErrorMessage } from "@/hooks/asset-masters/assetphototype/validation";
import assetPhotoTypeEn from "@/i18n/locales/en/assetPhotoType.json";
import commonEn from "@/i18n/locales/en/common.json";

const t = createTranslator({ locale: "en", messages: { assetPhotoType: assetPhotoTypeEn }, namespace: "assetPhotoType" });
const tCommon = createTranslator({ locale: "en", messages: { common: commonEn }, namespace: "common" });

// The backend's reference-check messages (ReferenceValidationService, DisplayAs "Asset Photo Type").
const DELETE_BLOCKED = "This Asset Photo Type cannot be deleted because it is in use.";
const DEACTIVATE_BLOCKED = "This Asset Photo Type cannot be deactivated because it is in use.";

describe("assetphototype reference errors", () => {
  it.each([DELETE_BLOCKED, DEACTIVATE_BLOCKED])("getErrorMessage (delete toast) translates %s", (message) => {
    expect(getErrorMessage(message, 400, t as never, tCommon as never, "Asset Photo Type")).toBe(message);
  });

  it.each([DELETE_BLOCKED, DEACTIVATE_BLOCKED])("mapAssetPhotoApiError (form submit) translates %s", (message) => {
    expect(mapAssetPhotoApiError({ message, statusCode: 400 }, t as never, tCommon as never)).toBe(message);
  });
});
