import { describe, it, expect } from "vitest";
import { createTranslator } from "next-intl";
import { mapAssetRoomApiError, getErrorMessage } from "@/hooks/asset-masters/assetroomtype/validation";
import assetRoomTypeEn from "@/i18n/locales/en/assetRoomType.json";
import commonEn from "@/i18n/locales/en/common.json";

const t = createTranslator({ locale: "en", messages: { assetRoomType: assetRoomTypeEn }, namespace: "assetRoomType" });
const tCommon = createTranslator({ locale: "en", messages: { common: commonEn }, namespace: "common" });

// The backend's reference-check messages (ReferenceValidationService, DisplayAs "Asset Room Type").
const DELETE_BLOCKED = "This Asset Room Type cannot be deleted because it is in use.";
const DEACTIVATE_BLOCKED = "This Asset Room Type cannot be deactivated because it is in use.";

describe("assetroomtype reference errors", () => {
  it.each([DELETE_BLOCKED, DEACTIVATE_BLOCKED])("getErrorMessage (delete toast) translates %s", (message) => {
    expect(getErrorMessage(message, 400, t as never, tCommon as never, "Asset Room Type")).toBe(message);
  });

  it.each([DELETE_BLOCKED, DEACTIVATE_BLOCKED])("mapAssetRoomApiError (form submit) translates %s", (message) => {
    expect(mapAssetRoomApiError({ message, statusCode: 400 }, t as never, tCommon as never)).toBe(message);
  });
});
