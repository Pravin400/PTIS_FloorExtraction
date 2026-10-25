export type ActionAlignment = 'left' | 'middle' | 'right';

export interface FooterButtonStyle {
  iconName: string;
  variant: 'primary' | 'outline' | 'secondary' | 'ghost' | 'danger' | 'success' | 'blue';
  alignment: ActionAlignment;
  className?: string;
}

/**
 * Registry to map database ScreenCodes to frontend visual styles.
 * This keeps the database focused on permissions/logic while the frontend handles aesthetics.
 */
export const FOOTER_REGISTRY: Record<string, FooterButtonStyle> = {
  // Right Actions (Primary actions)
  'R_SAVE': { iconName: 'Save', variant: 'success', alignment: 'right' },
  'R_SUBMIT': { iconName: 'CheckCircle', variant: 'success', alignment: 'right' },
  'R_UPDATE': { iconName: 'Save', variant: 'success', alignment: 'right' },
  'R_RESET': { iconName: 'RotateCcw', variant: 'secondary', alignment: 'right' },
  'R_ADD': { iconName: 'Plus', variant: 'primary', alignment: 'right' },

  // Left Actions (Navigation/Back)
  'L_BACK': { iconName: 'ArrowLeft', variant: 'secondary', alignment: 'left' },
  'L_CLOSE': { iconName: 'X', variant: 'ghost', alignment: 'left' },
  'L_CANCEL': { iconName: 'X', variant: 'ghost', alignment: 'left' },

  // Middle Actions (Secondary utilities)
  'M_PRINT': { iconName: 'Printer', variant: 'outline', alignment: 'middle' },
  'M_REPORT': { iconName: 'FileText', variant: 'outline', alignment: 'middle' },
  'M_CALCULATE': { iconName: 'Calculator', variant: 'outline', alignment: 'middle' },
  'M_SEARCH': { iconName: 'Search', variant: 'outline', alignment: 'middle' },
  'M_DELETE': { iconName: 'Trash2', variant: 'danger', alignment: 'middle' },

  // PTIS Dynamic Commands from API
  'PTIS_QC': { iconName: 'CheckCircle2', variant: 'outline', alignment: 'left' },
  'PTIS_QC_REVERT': { iconName: 'Undo2', variant: 'outline', alignment: 'left' },
  'PTIS_COMBINE': { iconName: 'Merge', variant: 'blue', alignment: 'middle' },
  'PTIS_COMMON_UPDATE': { iconName: 'Database', variant: 'outline', alignment: 'middle' },
  'PTIS_PARTITION': { iconName: 'Split', variant: 'outline', alignment: 'middle' },
  'PTIS_TAP_WATER': { iconName: 'Droplet', variant: 'outline', alignment: 'middle' },
  'PTIS_PROPERTY_REPORT': { iconName: 'FileText', variant: 'outline', alignment: 'middle' },
  'PTIS_APPLICABLE_TAXES_INFO': { iconName: 'Info', variant: 'outline', alignment: 'middle' },
  'PTIS_SPLIT': { iconName: 'Split', variant: 'outline', alignment: 'middle' },
  'PTIS_TRANSFER': { iconName: 'User', variant: 'outline', alignment: 'middle' },
  'PTIS_AMALGAMATION': { iconName: 'Layers', variant: 'outline', alignment: 'middle' },
  'PTIS_OBJECTION': { iconName: 'AlertCircle', variant: 'outline', alignment: 'middle' },
  'PTIS_PREVIEW': { iconName: 'Eye', variant: 'outline', alignment: 'middle' },
  'PTIS_CALC': { iconName: 'Calculator', variant: 'outline', alignment: 'middle' },
  'PTIS_TAX_CALC': { iconName: 'Calculator', variant: 'outline', alignment: 'middle' },
  'PTIS_DISCOUNT': { iconName: 'Percent', variant: 'outline', alignment: 'middle' },
  'PTIS_DOC': { iconName: 'FileSpreadsheet', variant: 'outline', alignment: 'middle' },
  'PTIS_EDIT_ENTRY': { iconName: 'Pencil', variant: 'outline', alignment: 'middle' },
  'PTIS_REFRESH': { iconName: 'RefreshCw', variant: 'blue', alignment: 'middle' },
  'PTIS_VALUATION': { iconName: 'FileText', variant: 'outline', alignment: 'middle' },
  'PTIS_REPORT': { iconName: 'BarChart3', variant: 'outline', alignment: 'middle' },
  'PTIS_SAVE': { iconName: 'Save', variant: 'success', alignment: 'right' },
  'PTIS_SUBMIT': { iconName: 'Send', variant: 'success', alignment: 'right' },
  'PTIS_APPLY': { iconName: 'CheckCircle', variant: 'outline', alignment: 'left' },
  'PTIS_ADD': { iconName: 'Plus', variant: 'outline', alignment: 'middle' },
  'PTIS_NEW_PROPERTY': { iconName: 'Plus', variant: 'outline', alignment: 'right' },
  'PTIS_CANCEL': { iconName: 'X', variant: 'ghost', alignment: 'right' },
};

/**
 * Fallback style for unknown action commands
 */
export const DEFAULT_ACTION_STYLE: FooterButtonStyle = {
  iconName: 'FileText',
  variant: 'outline',
  alignment: 'middle'
};
