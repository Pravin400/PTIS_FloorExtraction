/**
 * Plug-and-Play Footer Action Feature Configuration
 *
 * Provides a centralized registry to easily toggle enabling/disabling
 * of specific footer buttons across the application (e.g. Refresh Taxes).
 */
export const FOOTER_ACTION_FEATURE_TOGGLES: Record<string, boolean> = {
  /** Plug & Play toggle for "Refresh Taxes" button */
  PTIS_REFRESH: true,
  /** Plug & Play toggle for "Combine Property" button */
  PTIS_COMBINE: true,
  /** Plug & Play toggle for "Update Common Details" button */
  PTIS_COMMON_UPDATE: true,
  /** Plug & Play toggle for "Edit Entry" button */
  PTIS_EDIT_ENTRY: true,
  /** Plug & Play toggle for "Apply Taxes" button */
  PTIS_APPLY: true,
  /** Plug & Play toggle for "QC" button */
  PTIS_QC: true,
  /** Plug & Play toggle for "QC Revert" button */
  PTIS_QC_REVERT: true,
};

/**
 * Check if an action command is globally enabled by configuration feature flag.
 */
export function isActionFeatureEnabled(actionCommand: string): boolean {
  if (actionCommand in FOOTER_ACTION_FEATURE_TOGGLES) {
    return FOOTER_ACTION_FEATURE_TOGGLES[actionCommand];
  }
  return true;
}
