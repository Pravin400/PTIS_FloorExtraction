/**
 * Centralized route path helpers for the Municipal Asset module.
 *
 * All in-app navigation within the municipal asset feature must reference
 * these helpers rather than constructing route strings inline in components.
 * The locale prefix is NOT included here — it is added by `useLocaleRouter`.
 */

export const MUNICIPAL_ASSET_ROUTES = {
  /**
   * Asset register page filtered by a specific category.
   * @param categoryId - The category ID to show assets for
   */
  assetRegister: (categoryId: number) =>
    `/assets/municipal-Asset/asset-register/${categoryId}`,

  /**
   * Page for registering a brand-new asset.
   */
  addNewAsset: () => `/assets/municipal-Asset/new-add-new-asset`,
} as const;
